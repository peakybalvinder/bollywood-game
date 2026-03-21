/**
 * FilmiPaheli — Multiplayer Bollywood Movie Guessing Game
 * filmipaheli.com
 */

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const { v4: uuidv4 } = require('uuid');
const rateLimit  = require('express-rate-limit');
const helmet     = require('helmet');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // managed by frontend
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://www.filmipaheli.com',
  'https://filmipaheli.com',
  'http://localhost:5173',
  'http://localhost:4173',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];

function corsOrigin(origin, cb) {
  if (!origin) return cb(null, true);
  if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
  if (origin.endsWith('.railway.app')) return cb(null, true);
  if (origin.endsWith('.vercel.app'))  return cb(null, true);
  return cb(new Error('CORS blocked: ' + origin), false);
}

app.use(cors({ origin: corsOrigin, methods: ['GET', 'POST', 'OPTIONS'], credentials: false }));
app.use(express.json({ limit: '10kb' })); // prevent large payload attacks

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Global: 200 requests per 15 minutes per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.path === '/health', // don't rate-limit health checks
}));

// Search endpoint: 60 requests per minute per IP (generous but prevents abuse)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many search requests.' },
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST'], credentials: false },
  transports: ['polling', 'websocket'],
  allowUpgrades: true,
  pingInterval: 25000,
  pingTimeout: 20000,
  connectTimeout: 45000,
  maxHttpBufferSize: 1e6,
  allowEIO3: true,
});

// ── Socket connection rate limiting ───────────────────────────────────────────
// Track connections per IP — max 5 simultaneous sockets per IP
const ipConnections = new Map();
const MAX_SOCKETS_PER_IP = 5;

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_PLAYERS         = 5;
const LIVES_WORD          = 'BOLLYWOOD';
const INACTIVITY_MS       = 5 * 60 * 1000;
const INACTIVITY_CHECK_MS = 30_000;
const TMDB_API_KEY        = process.env.TMDB_API_KEY || '';

// ─── In-memory store ─────────────────────────────────────────────────────────
const rooms = new Map();

// ── Single-session enforcement ────────────────────────────────────────────────
// Maps playerName+roomId → socketId so we can kick duplicate sessions
const activeSessions = new Map(); // key: `${roomId}:${playerName}` → socketId

// ─── Input sanitisation ───────────────────────────────────────────────────────
function sanitize(str, maxLen = 50) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen).replace(/[<>]/g, '');
}

// ─── Factories ───────────────────────────────────────────────────────────────
function mkPlayer(socketId, name, isHost = false) {
  return {
    id: socketId,
    name,
    isHost,
    score: 0,
    guessedCorrectly: false,
    lastActivity: Date.now(),
    playerGame: null,
    // Anti-cheat tracking
    tabHidden: false,
    tabHiddenCount: 0,
    focusLostCount: 0,
  };
}

function mkRoom(roomId, roomName, maxPlayers, hostSocketId) {
  return {
    id: roomId,
    name: roomName,
    maxPlayers: Math.min(maxPlayers, MAX_PLAYERS),
    hostId: hostSocketId,
    players: [],
    game: null,
    chat: [],
    status: 'waiting',
  };
}

function mkPlayerGame(movieName, hint) {
  const hintLetters = hint
    ? [...new Set(hint.toLowerCase().replace(/[^a-z]/g, '').split(''))]
    : [];
  const blanks = movieName.split('').map((ch) => {
    // Spaces and special characters (: - . ' ! , etc.) are auto-revealed — only letters are blanks
    if (!/[a-zA-Z]/.test(ch)) return ch;
    if (hintLetters.includes(ch.toLowerCase())) return ch;
    return '_';
  });
  return {
    blanks,
    guessedLetters: [],
    wrongLetters: [],
    livesLeft: LIVES_WORD.length,
    status: 'playing',
    lastLetter: null,
    lastLetterCorrect: null,
    _movieName: movieName,
  };
}

// ─── Game logic ───────────────────────────────────────────────────────────────
function processGuess(pg, letter) {
  const l = letter.toLowerCase();
  if (pg.guessedLetters.includes(l)) return { alreadyGuessed: true };
  pg.guessedLetters.push(l);
  const lower = pg._movieName.toLowerCase();
  const positions = [];
  for (let i = 0; i < lower.length; i++) {
    if (lower[i] === l) { positions.push(i); pg.blanks[i] = pg._movieName[i]; }
  }
  if (positions.length > 0) return { correct: true, positions };
  pg.wrongLetters.push(l.toUpperCase());
  pg.livesLeft -= 1;
  return { correct: false };
}

function isWon(pg) {
  // Win only when all letter blanks are revealed (special chars are always revealed)
  return !pg.blanks.includes('_');
}

// ─── Serialisers ─────────────────────────────────────────────────────────────
function publicPlayerGame(pg, movieName) {
  const g = {
    blanks: pg.blanks, guessedLetters: pg.guessedLetters, wrongLetters: pg.wrongLetters,
    livesLeft: pg.livesLeft, livesWord: LIVES_WORD, status: pg.status,
    hint: pg.hint || null,
  };
  if (pg.status !== 'playing') g.movieName = movieName;
  return g;
}

function publicPlayerRow(p) {
  return {
    id: p.id, name: p.name, isHost: p.isHost, score: p.score,
    guessedCorrectly: p.guessedCorrectly,
    livesLeft:    p.playerGame ? p.playerGame.livesLeft             : null,
    gameStatus:   p.playerGame ? p.playerGame.status                : null,
    guessedCount: p.playerGame ? p.playerGame.guessedLetters.length : 0,
    blanks:       p.playerGame ? p.playerGame.blanks                : null,
    lastLetter:   p.playerGame ? p.playerGame.lastLetter            : null,
    lastLetterCorrect: p.playerGame ? p.playerGame.lastLetterCorrect : null,
    wrongLetters: p.playerGame ? p.playerGame.wrongLetters          : [],
    // Anti-cheat info visible to host
    tabHidden:      p.tabHidden,
    tabHiddenCount: p.tabHiddenCount,
    focusLostCount: p.focusLostCount,
  };
}

function publicRoom(room, forPlayerId) {
  const me = room.players.find((p) => p.id === forPlayerId);
  return {
    id: room.id, name: room.name, maxPlayers: room.maxPlayers, hostId: room.hostId,
    players: room.players.map(publicPlayerRow),
    game: room.game ? { hint: room.game.hint } : null,
    playerGame: (me && me.playerGame) ? publicPlayerGame(me.playerGame, room.game?.movieName) : null,
    status: room.status,
    chatHistory: room.chat.slice(-50),
  };
}

// ─── Inactivity watchdog ─────────────────────────────────────────────────────
setInterval(() => {
  const now = Date.now();
  for (const [, room] of rooms) {
    for (const player of [...room.players]) {
      if (now - player.lastActivity > INACTIVITY_MS) {
        const sock = io.sockets.sockets.get(player.id);
        if (sock) {
          sock.emit('inactivity_kick', { message: 'You were removed due to 5 minutes of inactivity.' });
          sock.disconnect(true);
        }
      }
    }
  }
}, INACTIVITY_CHECK_MS);

// ─── TMDB / iTunes search ─────────────────────────────────────────────────────
function isBearerToken(key) { return key && key.length > 50; }

async function searchTMDB(q) {
  const key = TMDB_API_KEY;
  let url, headers = { accept: 'application/json' };
  if (isBearerToken(key)) {
    url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`;
    headers['Authorization'] = `Bearer ${key}`;
  } else {
    url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`;
  }
  const response = await fetch(url, { headers });
  const data = await response.json();
  if (data.status_message) { console.error('[TMDB]', data.status_message); return null; }
  return (data.results || []).slice(0, 10).map((m) => ({ title: m.title, year: m.release_date ? m.release_date.slice(0, 4) : '' }));
}

app.get('/api/search-status', async (req, res) => {
  if (!TMDB_API_KEY) return res.json({ configured: false, source: 'itunes-fallback' });
  try {
    const results = await searchTMDB('Sholay');
    if (!results) return res.json({ configured: true, working: false, message: 'Key error' });
    return res.json({ configured: true, working: true, source: 'tmdb', testResults: results.slice(0, 3) });
  } catch (err) {
    return res.json({ configured: true, working: false, error: err.message });
  }
});

app.get('/api/search', searchLimiter, async (req, res) => {
  const q = sanitize(req.query.q || '', 100);
  if (!q || q.length < 2) return res.json({ results: [] });

  if (TMDB_API_KEY) {
    try {
      const results = await searchTMDB(q);
      if (results && results.length > 0) return res.json({ results, source: 'tmdb' });
    } catch (err) { console.error('[TMDB]', err.message); }
  }

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=movie&limit=15&entity=movie`;
    const response = await fetch(url);
    const data = await response.json();
    const results = (data.results || [])
      .map((m) => ({ title: m.trackName || m.collectionName, year: m.releaseDate ? m.releaseDate.slice(0, 4) : '' }))
      .filter((m) => m.title).slice(0, 10);
    return res.json({ results, source: 'itunes' });
  } catch (err) {
    console.error('[iTunes]', err.message);
    return res.status(500).json({ results: [] });
  }
});

// ─── Socket.IO ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  // ── Per-IP connection limit ───────────────────────────────────────────────
  const ip = socket.handshake.headers['x-forwarded-for']?.split(',')[0].trim()
           || socket.handshake.address;
  const ipCount = (ipConnections.get(ip) || 0) + 1;
  ipConnections.set(ip, ipCount);
  if (ipCount > MAX_SOCKETS_PER_IP) {
    socket.emit('error_msg', { message: 'Too many connections from your device.' });
    socket.disconnect(true);
    return;
  }
  socket.data.ip = ip;
  console.log(`[+] ${socket.id} | IP: ${ip} | Connections from IP: ${ipCount}`);

  socket.on('disconnect', () => {
    const count = Math.max(0, (ipConnections.get(socket.data.ip) || 1) - 1);
    if (count === 0) ipConnections.delete(socket.data.ip);
    else ipConnections.set(socket.data.ip, count);

    console.log(`[-] ${socket.id}`);
    const room = rooms.get(socket.data.roomId);
    if (!room) return;

    // Clean up session
    for (const [key, id] of activeSessions) {
      if (id === socket.id) { activeSessions.delete(key); break; }
    }

    if (socket.id === room.hostId) {
      io.to(socket.data.roomId).emit('host_left', { message: 'The host has left. The party is over! 🎬' });
      rooms.delete(socket.data.roomId);
    } else {
      room.players = room.players.filter((p) => p.id !== socket.id);
      io.to(socket.data.roomId).emit('player_left', {
        playerId: socket.id,
        players: room.players.map(publicPlayerRow),
      });
    }
  });

  // ── Create room ───────────────────────────────────────────────────────────
  socket.on('create_room', ({ roomName, maxPlayers, playerName }, cb) => {
    const name   = sanitize(playerName, 24) || 'Host';
    const rName  = sanitize(roomName, 40) || 'FilmiPaheli Night';
    const roomId = uuidv4().slice(0, 6).toUpperCase();
    const room   = mkRoom(roomId, rName, maxPlayers || 2, socket.id);
    const player = mkPlayer(socket.id, name, true);
    room.players.push(player);
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerName = name;
    console.log(`[ROOM] ${roomId} created by ${name}`);
    cb({ success: true, roomId, room: publicRoom(room, socket.id) });
  });

  // ── Join room ─────────────────────────────────────────────────────────────
  socket.on('join_room', ({ roomId, playerName }, cb) => {
    const id   = sanitize(roomId, 6).toUpperCase();
    const name = sanitize(playerName, 24) || 'Guest';
    const room = rooms.get(id);

    if (!room) return cb({ success: false, error: 'Room not found. Check the code and try again.' });
    if (room.status === 'ended') return cb({ success: false, error: 'This game has already ended.' });
    if (room.players.length >= room.maxPlayers) return cb({ success: false, error: `Room is full (${room.maxPlayers} players max).` });

    // ── Single session enforcement ──────────────────────────────────────────
    const sessionKey = `${id}:${name.toLowerCase()}`;
    const existingSocketId = activeSessions.get(sessionKey);
    if (existingSocketId) {
      const existingSock = io.sockets.sockets.get(existingSocketId);
      if (existingSock) {
        existingSock.emit('session_takeover', { message: 'You joined from another tab. This tab has been disconnected.' });
        existingSock.disconnect(true);
      }
      room.players = room.players.filter(p => p.id !== existingSocketId);
    }
    activeSessions.set(sessionKey, socket.id);
    socket.data.sessionKey = sessionKey;

    const player = mkPlayer(socket.id, name);
    if (room.game && room.status === 'playing') {
      player.playerGame = mkPlayerGame(room.game.movieName, room.game.hint);
    }
    room.players.push(player);
    socket.join(id);
    socket.data.roomId = id;
    socket.data.playerName = name;

    io.to(id).emit('player_joined', { player: publicPlayerRow(player), players: room.players.map(publicPlayerRow) });
    console.log(`[JOIN] ${name} joined ${id}`);
    cb({ success: true, room: publicRoom(room, socket.id) });
  });

  // ── Start game ────────────────────────────────────────────────────────────
  socket.on('start_game', ({ movieName, hint }, cb) => {
    const room = rooms.get(socket.data.roomId);
    if (!room)                     return cb({ success: false, error: 'Room not found.' });
    if (room.hostId !== socket.id) return cb({ success: false, error: 'Only the host can start.' });
    const name = sanitize(movieName, 200);
    if (!name) return cb({ success: false, error: 'Please provide a movie name.' });

    room.game = { movieName: name, hint: hint || null };
    room.status = 'playing';

    room.players.forEach((p) => {
      p.guessedCorrectly = false;
      p.tabHidden = false; p.tabHiddenCount = 0; p.focusLostCount = 0;
      if (!p.isHost) p.playerGame = mkPlayerGame(name, hint);
    });

    const publicPlayers = room.players.map(publicPlayerRow);
    room.players.forEach((p) => {
      const sock = io.sockets.sockets.get(p.id);
      if (!sock) return;
      sock.emit('game_started', {
        players: publicPlayers,
        playerGame: p.isHost ? null : publicPlayerGame(p.playerGame, name),
        hint: room.game.hint,
        gameConfig: { hint: room.game.hint, movieName: name },
      });
    });

    console.log(`[GAME] Started in ${socket.data.roomId}: "${name}"`);
    cb({ success: true });
  });

  // ── Guess a letter ────────────────────────────────────────────────────────
  socket.on('guess_letter', ({ letter }, cb) => {
    const room   = rooms.get(socket.data.roomId);
    const player = room?.players.find((p) => p.id === socket.id);

    if (!room || !room.game)                    return cb({ success: false, error: 'No active game.' });
    if (!player || !player.playerGame)          return cb({ success: false, error: 'Not a player.' });
    if (player.playerGame.status !== 'playing') return cb({ success: false, error: 'Your game is over.' });
    if (!letter || letter.length !== 1 || !/[a-zA-Z]/.test(letter)) return cb({ success: false, error: 'Invalid letter.' });

    player.lastActivity = Date.now();
    const result = processGuess(player.playerGame, letter);
    if (result.alreadyGuessed) return cb({ success: false, error: 'Already guessed.' });

    player.playerGame.lastLetter = letter.toUpperCase();
    player.playerGame.lastLetterCorrect = result.correct === true;

    let gameOver = false;
    if (isWon(player.playerGame)) {
      player.playerGame.status = 'won';
      player.score += player.playerGame.livesLeft * 10 + 20;
      player.guessedCorrectly = true;
      gameOver = true;
    } else if (player.playerGame.livesLeft <= 0) {
      player.playerGame.status = 'lost';
      gameOver = true;
    }

    const updatedPG     = publicPlayerGame(player.playerGame, room.game.movieName);
    const publicPlayers = room.players.map(publicPlayerRow);

    socket.emit('guess_result', { letter: letter.toUpperCase(), correct: result.correct, positions: result.positions || [], playerGame: updatedPG });
    io.to(socket.data.roomId).emit('players_progress', { players: publicPlayers });
    if (gameOver) socket.emit('your_game_over', { playerGame: updatedPG, players: publicPlayers });

    cb({ success: true });
  });

  // ── Anti-cheat: tab visibility ────────────────────────────────────────────
  socket.on('tab_hidden', () => {
    const room   = rooms.get(socket.data.roomId);
    const player = room?.players.find((p) => p.id === socket.id);
    if (!player || player.isHost) return;

    player.tabHidden = true;
    player.tabHiddenCount += 1;
    player.lastActivity = Date.now();

    // Notify host privately
    const hostSock = io.sockets.sockets.get(room.hostId);
    if (hostSock) {
      hostSock.emit('player_tab_hidden', {
        playerId: socket.id,
        playerName: player.name,
        count: player.tabHiddenCount,
        players: room.players.map(publicPlayerRow),
      });
    }
    // Also broadcast updated player rows so everyone's UI can update
    io.to(socket.data.roomId).emit('players_progress', { players: room.players.map(publicPlayerRow) });
  });

  socket.on('tab_visible', () => {
    const room   = rooms.get(socket.data.roomId);
    const player = room?.players.find((p) => p.id === socket.id);
    if (!player || player.isHost) return;
    player.tabHidden = false;
    player.lastActivity = Date.now();
    io.to(socket.data.roomId).emit('players_progress', { players: room.players.map(publicPlayerRow) });
  });

  socket.on('focus_lost', () => {
    const room   = rooms.get(socket.data.roomId);
    const player = room?.players.find((p) => p.id === socket.id);
    if (!player || player.isHost) return;
    player.focusLostCount += 1;
    player.lastActivity = Date.now();
    const hostSock = io.sockets.sockets.get(room.hostId);
    if (hostSock) {
      hostSock.emit('player_focus_lost', {
        playerId: socket.id,
        playerName: player.name,
        count: player.focusLostCount,
        players: room.players.map(publicPlayerRow),
      });
    }
  });

  // ── Transfer host ─────────────────────────────────────────────────────────
  socket.on('transfer_host', ({ newHostId }, cb) => {
    const room = rooms.get(socket.data.roomId);
    if (!room || room.hostId !== socket.id) return cb({ success: false, error: 'Only the host can transfer.' });
    const newHost = room.players.find((p) => p.id === newHostId);
    const oldHost = room.players.find((p) => p.id === socket.id);
    if (!newHost || newHost.id === socket.id) return cb({ success: false, error: 'Invalid player.' });

    room.hostId    = newHostId;
    oldHost.isHost = false;
    newHost.isHost = true;

    // Clear the new host's playerGame — they become spectator
    newHost.playerGame = null;

    // If a game is in progress, end it cleanly so the new host can start fresh
    const hadActiveGame = room.game !== null;
    if (hadActiveGame) {
      // Reveal movie name to everyone and reset round
      const movieName = room.game.movieName;
      room.game   = null;
      room.status = 'waiting';
      // Emit round_ended so all clients reset their game state
      io.to(socket.data.roomId).emit('round_ended', {
        movieName,
        reason:  'Host role transferred — current round ended.',
        players: room.players.map(publicPlayerRow),
      });
    }

    io.to(socket.data.roomId).emit('host_transferred', {
      newHostId,
      oldHostId:      socket.id,
      players:        room.players.map(publicPlayerRow),
      hadActiveGame,
    });
    cb({ success: true });
  });

  // ── Chat ──────────────────────────────────────────────────────────────────
  socket.on('chat_message', ({ message }) => {
    const room   = rooms.get(socket.data.roomId);
    const player = room?.players.find((p) => p.id === socket.id);
    if (!room || !player) return;
    const text = sanitize(message, 300);
    if (!text) return;
    player.lastActivity = Date.now();
    const msg = { id: uuidv4().slice(0, 8), playerId: socket.id, playerName: player.name, message: text, timestamp: Date.now() };
    room.chat.push(msg);
    io.to(socket.data.roomId).emit('chat_message', msg);
  });

  // ── Activity ping ─────────────────────────────────────────────────────────
  socket.on('activity_ping', () => {
    const room   = rooms.get(socket.data.roomId);
    const player = room?.players.find((p) => p.id === socket.id);
    if (player) player.lastActivity = Date.now();
  });
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', rooms: rooms.size, uptime: Math.floor(process.uptime()) }));

// ─── 404 catch-all ───────────────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ error: 'Not found' }));

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎬 FilmiPaheli Server on http://localhost:${PORT}`);
  console.log(TMDB_API_KEY ? '🔍 TMDB enabled' : '⚠️  No TMDB key — iTunes fallback active');
});
