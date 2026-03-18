/**
 * Bollywood Movie Guessing Game — Backend Server
 *
 * Per-player independent game state.
 * Scores accumulate across games within a session.
 * Host can transfer host role to any other player.
 */

const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors   = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_PLAYERS         = 5;
const LIVES_WORD          = 'BOLLYWOOD';
const INACTIVITY_MS       = 5 * 60 * 1000;
const INACTIVITY_CHECK_MS = 30_000;
const TMDB_API_KEY        = process.env.TMDB_API_KEY || '';

// ─── In-memory store ─────────────────────────────────────────────────────────
const rooms = new Map();

// ─── Factories ───────────────────────────────────────────────────────────────
function mkPlayer(socketId, name, isHost = false) {
  return {
    id: socketId,
    name,
    isHost,
    score: 0,              // cumulative across all games in the session
    guessedCorrectly: false,
    lastActivity: Date.now(),
    playerGame: null,
  };
}

function mkRoom(roomId, roomName, maxPlayers, hostSocketId) {
  return {
    id: roomId,
    name: roomName,
    maxPlayers: Math.min(maxPlayers, MAX_PLAYERS),
    hostId: hostSocketId,
    players: [],
    game: null,   // shared config: { movieName, hint } — set when game starts
    chat: [],
    status: 'waiting',
  };
}

// Per-player independent game state
function mkPlayerGame(movieName, hint) {
  const hintLetters = hint
    ? [...new Set(hint.toLowerCase().replace(/[^a-z]/g, '').split(''))]
    : [];
  const blanks = movieName.split('').map((ch) => {
    if (ch === ' ') return ' ';
    if (hintLetters.includes(ch.toLowerCase())) return ch;
    return '_';
  });
  return {
    blanks,
    guessedLetters: [],
    wrongLetters: [],
    livesLeft: LIVES_WORD.length,
    status: 'playing',
    lastLetter: null,        // most recent guess letter (uppercase)
    lastLetterCorrect: null, // true/false/null
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
    if (lower[i] === l) {
      positions.push(i);
      pg.blanks[i] = pg._movieName[i];
    }
  }

  if (positions.length > 0) return { correct: true, positions };

  pg.wrongLetters.push(l.toUpperCase());
  pg.livesLeft -= 1;
  return { correct: false };
}

function isWon(pg) {
  return !pg.blanks.includes('_');
}

// ─── Serialisers ─────────────────────────────────────────────────────────────
function publicPlayerGame(pg, movieName) {
  const g = {
    blanks:         pg.blanks,
    guessedLetters: pg.guessedLetters,
    wrongLetters:   pg.wrongLetters,
    livesLeft:      pg.livesLeft,
    livesWord:      LIVES_WORD,
    status:         pg.status,
  };
  if (pg.status !== 'playing') g.movieName = movieName;
  return g;
}

function publicPlayerRow(p) {
  return {
    id:               p.id,
    name:             p.name,
    isHost:           p.isHost,
    score:            p.score,
    guessedCorrectly: p.guessedCorrectly,
    livesLeft:        p.playerGame ? p.playerGame.livesLeft              : null,
    gameStatus:       p.playerGame ? p.playerGame.status                 : null,
    guessedCount:     p.playerGame ? p.playerGame.guessedLetters.length  : 0,
    blanks:           p.playerGame ? p.playerGame.blanks                 : null,
    lastLetter:       p.playerGame ? p.playerGame.lastLetter             : null,
    lastLetterCorrect: p.playerGame ? p.playerGame.lastLetterCorrect     : null,
    wrongLetters:     p.playerGame ? p.playerGame.wrongLetters           : [],
  };
}

function publicRoom(room, forPlayerId) {
  const me = room.players.find((p) => p.id === forPlayerId);
  return {
    id:         room.id,
    name:       room.name,
    maxPlayers: room.maxPlayers,
    hostId:     room.hostId,
    players:    room.players.map(publicPlayerRow),
    // Send game config (hint only, never movieName) so host spectator screen works
    game:       room.game ? { hint: room.game.hint } : null,
    playerGame: (me && me.playerGame)
      ? publicPlayerGame(me.playerGame, room.game?.movieName)
      : null,
    status:      room.status,
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

// ─── Movie search proxy ──────────────────────────────────────────────────────
// TMDB supports two key formats:
//   Short key  (~32 chars) → use as ?api_key= query param
//   Long token (~200 chars, starts with eyJ) → use as Bearer token
// Falls back to iTunes (free, no key needed) if TMDB is not configured.

function isBearerToken(key) {
  return key && key.length > 50; // Bearer tokens are ~200 chars
}

async function searchTMDB(q) {
  const key = TMDB_API_KEY;
  let url, headers = { accept: 'application/json' };

  if (isBearerToken(key)) {
    // Long token → Bearer auth
    url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`;
    headers['Authorization'] = `Bearer ${key}`;
  } else {
    // Short API key → query param auth
    url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`;
  }

  const response = await fetch(url, { headers });
  const data = await response.json();

  if (data.status_message) {
    // TMDB returned an error (e.g. invalid key)
    console.error('[TMDB] API error:', data.status_message);
    return null;
  }

  return (data.results || [])
    .slice(0, 10)
    .map((m) => ({ title: m.title, year: m.release_date ? m.release_date.slice(0, 4) : '' }));
}

// Debug endpoint — visit /api/search-status to verify your TMDB key is working
app.get('/api/search-status', async (req, res) => {
  if (!TMDB_API_KEY) {
    return res.json({ configured: false, source: 'itunes-fallback', message: 'No TMDB_API_KEY set. Using iTunes fallback.' });
  }
  try {
    const results = await searchTMDB('Sholay');
    if (results === null) {
      return res.json({ configured: true, working: false, message: 'TMDB key is set but returned an error. Check the key value in Railway.' });
    }
    return res.json({ configured: true, working: true, source: 'tmdb', testResults: results.slice(0, 3), message: 'TMDB is working correctly.' });
  } catch (err) {
    return res.json({ configured: true, working: false, error: err.message });
  }
});

app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json({ results: [] });

  // ── TMDB ──────────────────────────────────────────────────────────────────
  if (TMDB_API_KEY) {
    try {
      const results = await searchTMDB(q);
      if (results !== null && results.length > 0) {
        return res.json({ results, source: 'tmdb' });
      }
      // Key set but no results — fall through to iTunes
    } catch (err) {
      console.error('[TMDB]', err.message);
    }
  }

  // ── iTunes fallback (free, zero config) ───────────────────────────────────
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=movie&limit=15&entity=movie`;
    const response = await fetch(url);
    const data = await response.json();
    const results = (data.results || [])
      .map((m) => ({ title: m.trackName || m.collectionName, year: m.releaseDate ? m.releaseDate.slice(0, 4) : '' }))
      .filter((m) => m.title)
      .slice(0, 10);
    return res.json({ results, source: 'itunes' });
  } catch (err) {
    console.error('[iTunes]', err.message);
    return res.status(500).json({ results: [] });
  }
});

// ─── Socket.IO ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} connected`);

  // ── Create room ───────────────────────────────────────────────────────
  socket.on('create_room', ({ roomName, maxPlayers, playerName }, cb) => {
    const roomId = uuidv4().slice(0, 6).toUpperCase();
    const room   = mkRoom(roomId, roomName || 'Bollywood Night', maxPlayers || 2, socket.id);
    const player = mkPlayer(socket.id, playerName || 'Host', true);
    room.players.push(player);
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.data.roomId = roomId;
    console.log(`[ROOM] ${roomId} created by ${playerName}`);
    cb({ success: true, roomId, room: publicRoom(room, socket.id) });
  });

  // ── Join room ─────────────────────────────────────────────────────────
  socket.on('join_room', ({ roomId, playerName }, cb) => {
    const id   = (roomId || '').toUpperCase().trim();
    const room = rooms.get(id);

    if (!room) return cb({ success: false, error: 'Room not found. Check the code and try again.' });
    if (room.status === 'ended') return cb({ success: false, error: 'This game has already ended.' });
    if (room.players.length >= room.maxPlayers) return cb({ success: false, error: `Room is full (${room.maxPlayers} players max).` });

    const player = mkPlayer(socket.id, playerName || 'Guest');

    // Late join — give them a fresh game if one is already running
    if (room.game && room.status === 'playing') {
      player.playerGame = mkPlayerGame(room.game.movieName, room.game.hint);
    }

    room.players.push(player);
    socket.join(id);
    socket.data.roomId = id;

    io.to(id).emit('player_joined', {
      player:  publicPlayerRow(player),
      players: room.players.map(publicPlayerRow),
    });

    console.log(`[JOIN] ${playerName} joined ${id}`);
    cb({ success: true, room: publicRoom(room, socket.id) });
  });

  // ── Start game ────────────────────────────────────────────────────────
  socket.on('start_game', ({ movieName, hint }, cb) => {
    const room = rooms.get(socket.data.roomId);
    if (!room)                     return cb({ success: false, error: 'Room not found.' });
    if (room.hostId !== socket.id) return cb({ success: false, error: 'Only the host can start the game.' });
    if (!movieName?.trim())        return cb({ success: false, error: 'Please provide a movie name.' });

    const name = movieName.trim();
    room.game   = { movieName: name, hint: hint || null };
    room.status = 'playing';

    // Reset per-round state — scores are NOT reset (they accumulate)
    room.players.forEach((p) => {
      p.guessedCorrectly = false;
      if (!p.isHost) {
        p.playerGame = mkPlayerGame(name, hint);
      }
    });

    const publicPlayers = room.players.map(publicPlayerRow);

    // Send each player their own game state privately
    room.players.forEach((p) => {
      const sock = io.sockets.sockets.get(p.id);
      if (!sock) return;
      sock.emit('game_started', {
        players:    publicPlayers,
        playerGame: p.isHost ? null : publicPlayerGame(p.playerGame, name),
        hint:       room.game.hint,
        // Send game config to host so it can switch to spectator view
        gameConfig: { hint: room.game.hint, movieName: name },
      });
    });

    console.log(`[GAME] Started in ${socket.data.roomId}: "${name}"`);
    cb({ success: true });
  });

  // ── Guess a letter ────────────────────────────────────────────────────
  socket.on('guess_letter', ({ letter }, cb) => {
    const room   = rooms.get(socket.data.roomId);
    const player = room?.players.find((p) => p.id === socket.id);

    if (!room || !room.game)                      return cb({ success: false, error: 'No active game.' });
    if (!player || !player.playerGame)            return cb({ success: false, error: 'You are not a player in this game.' });
    if (player.playerGame.status !== 'playing')   return cb({ success: false, error: 'Your game is already over.' });
    if (!letter || letter.length !== 1 || !/[a-zA-Z]/.test(letter)) return cb({ success: false, error: 'Invalid letter.' });

    player.lastActivity = Date.now();

    const result = processGuess(player.playerGame, letter);
    if (result.alreadyGuessed) return cb({ success: false, error: 'Already guessed.' });

    // Track the last guess so the host spectator view can show it
    player.playerGame.lastLetter        = letter.toUpperCase();
    player.playerGame.lastLetterCorrect = result.correct === true;

    let gameOver = false;
    if (isWon(player.playerGame)) {
      player.playerGame.status = 'won';
      player.score            += player.playerGame.livesLeft * 10 + 20; // += accumulate
      player.guessedCorrectly  = true;
      gameOver = true;
    } else if (player.playerGame.livesLeft <= 0) {
      player.playerGame.status = 'lost';
      gameOver = true;
    }

    const updatedPG     = publicPlayerGame(player.playerGame, room.game.movieName);
    const publicPlayers = room.players.map(publicPlayerRow);

    // 1. Private to guesser — their board update
    socket.emit('guess_result', {
      letter:     letter.toUpperCase(),
      correct:    result.correct,
      positions:  result.positions || [],
      playerGame: updatedPG,
    });

    // 2. Broadcast to all — leaderboard update (no game state leaked)
    io.to(socket.data.roomId).emit('players_progress', { players: publicPlayers });

    // 3. Private to guesser — game over notification
    if (gameOver) {
      socket.emit('your_game_over', {
        playerGame: updatedPG,
        players:    publicPlayers,
      });
    }

    cb({ success: true });
  });

  // ── Transfer host ─────────────────────────────────────────────────────
  socket.on('transfer_host', ({ newHostId }, cb) => {
    const room = rooms.get(socket.data.roomId);
    if (!room)                     return cb({ success: false, error: 'Room not found.' });
    if (room.hostId !== socket.id) return cb({ success: false, error: 'Only the current host can transfer the role.' });

    const newHost = room.players.find((p) => p.id === newHostId);
    const oldHost = room.players.find((p) => p.id === socket.id);

    if (!newHost) return cb({ success: false, error: 'Player not found.' });
    if (newHost.id === socket.id) return cb({ success: false, error: 'You are already the host.' });

    // Transfer
    room.hostId   = newHostId;
    oldHost.isHost = false;
    newHost.isHost = true;

    // New host can no longer have a playerGame (they become spectator/host)
    newHost.playerGame = null;

    const publicPlayers = room.players.map(publicPlayerRow);

    io.to(socket.data.roomId).emit('host_transferred', {
      newHostId,
      oldHostId: socket.id,
      players:   publicPlayers,
    });

    console.log(`[HOST] ${newHost.name} is now the host of ${socket.data.roomId}`);
    cb({ success: true });
  });

  // ── Chat ──────────────────────────────────────────────────────────────
  socket.on('chat_message', ({ message }) => {
    const room   = rooms.get(socket.data.roomId);
    const player = room?.players.find((p) => p.id === socket.id);
    if (!room || !player || !message?.trim()) return;

    player.lastActivity = Date.now();
    const msg = {
      id:         uuidv4().slice(0, 8),
      playerId:   socket.id,
      playerName: player.name,
      message:    message.trim().slice(0, 300),
      timestamp:  Date.now(),
    };
    room.chat.push(msg);
    io.to(socket.data.roomId).emit('chat_message', msg);
  });

  // ── Activity ping ─────────────────────────────────────────────────────
  socket.on('activity_ping', () => {
    const room   = rooms.get(socket.data.roomId);
    const player = room?.players.find((p) => p.id === socket.id);
    if (player) player.lastActivity = Date.now();
  });

  // ── Disconnect ────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id} disconnected`);
    const room = rooms.get(socket.data.roomId);
    if (!room) return;

    if (socket.id === room.hostId) {
      io.to(socket.data.roomId).emit('host_left', {
        message: 'The host has left the game. The party is over! 🎬',
      });
      rooms.delete(socket.data.roomId);
    } else {
      room.players = room.players.filter((p) => p.id !== socket.id);
      io.to(socket.data.roomId).emit('player_left', {
        playerId: socket.id,
        players:  room.players.map(publicPlayerRow),
      });
    }
  });
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', rooms: rooms.size }));

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎬 Bollywood Game Server on http://localhost:${PORT}`);
  console.log(TMDB_API_KEY ? '🔍 TMDB search enabled' : '⚠️  TMDB_API_KEY not set — using iTunes fallback (free, no key needed)');
});
