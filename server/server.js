/**
 * Bollywood Movie Guessing Game — Backend Server
 *
 * Architecture: each non-host player has their OWN independent game state.
 * Guesses from Player 2 never affect Player 1's blanks / lives.
 * The host is a spectator who sees all players' progress.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_PLAYERS  = 5;
const LIVES_WORD   = 'BOLLYWOOD';
const INACTIVITY_MS      = 5 * 60 * 1000;
const INACTIVITY_CHECK_MS = 30_000;
const OMDB_API_KEY = process.env.OMDB_API_KEY || '';

// ─── In-memory store ─────────────────────────────────────────────────────────
const rooms = new Map();

// ─── Factories ───────────────────────────────────────────────────────────────
function mkPlayer(socketId, name, isHost = false) {
  return {
    id: socketId,
    name,
    isHost,
    score: 0,
    guessedCorrectly: false,
    lastActivity: Date.now(),
    playerGame: null, // filled when game starts; null for host
  };
}

function mkRoom(roomId, roomName, maxPlayers, hostSocketId) {
  return {
    id: roomId,
    name: roomName,
    maxPlayers: Math.min(maxPlayers, MAX_PLAYERS),
    hostId: hostSocketId,
    players: [],
    game: null,   // shared config: { movieName, hint }
    chat: [],
    status: 'waiting',
  };
}

/**
 * Per-player game state — mutable, independent for every player.
 */
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
  };
}

// ─── Game logic ───────────────────────────────────────────────────────────────
function processGuess(playerGame, letter) {
  const l = letter.toLowerCase();
  if (playerGame.guessedLetters.includes(l)) return { alreadyGuessed: true };

  playerGame.guessedLetters.push(l);
  const movieLower = playerGame._movieName.toLowerCase(); // attached temporarily
  const positions = [];

  for (let i = 0; i < movieLower.length; i++) {
    if (movieLower[i] === l) {
      positions.push(i);
      playerGame.blanks[i] = playerGame._movieName[i];
    }
  }

  if (positions.length > 0) return { correct: true, positions };

  playerGame.wrongLetters.push(l.toUpperCase());
  playerGame.livesLeft -= 1;
  return { correct: false };
}

function isWon(playerGame) {
  return !playerGame.blanks.includes('_');
}

// ─── Serialisers ─────────────────────────────────────────────────────────────
/** What a player sees of their own game (movieName only after it ends). */
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

/**
 * Public player row — includes progress so host can track everyone.
 * Other players only see name/score/guessedCorrectly; livesLeft/gameStatus
 * are also included here (client-side the host decides what to display).
 */
function publicPlayerRow(p) {
  return {
    id:              p.id,
    name:            p.name,
    isHost:          p.isHost,
    score:           p.score,
    guessedCorrectly: p.guessedCorrectly,
    livesLeft:       p.playerGame ? p.playerGame.livesLeft  : null,
    gameStatus:      p.playerGame ? p.playerGame.status     : null,
    guessedCount:    p.playerGame ? p.playerGame.guessedLetters.length : 0,
  };
}

/** Room snapshot for the join callback — includes this player's own game. */
function publicRoom(room, forPlayerId) {
  const me = room.players.find((p) => p.id === forPlayerId);
  return {
    id:          room.id,
    name:        room.name,
    maxPlayers:  room.maxPlayers,
    hostId:      room.hostId,
    players:     room.players.map(publicPlayerRow),
    game:        room.game ? { hint: room.game.hint } : null,
    playerGame:  (me && me.playerGame) ? publicPlayerGame(me.playerGame, room.game?.movieName) : null,
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

// ─── OMDB proxy ──────────────────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json({ results: [] });
  if (!OMDB_API_KEY) return res.json({ results: [], noKey: true });

  try {
    const url = `https://www.omdbapi.com/?s=${encodeURIComponent(q)}&type=movie&apikey=${OMDB_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    const results = data.Search
      ? data.Search.map((m) => ({ title: m.Title, year: m.Year }))
      : [];
    return res.json({ results });
  } catch (err) {
    console.error('[OMDB]', err.message);
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

    // If game is already running, give the new player their own fresh game state
    if (room.game && room.status === 'playing') {
      player.playerGame = mkPlayerGame(room.game.movieName, room.game.hint);
      player.playerGame._movieName = room.game.movieName; // temp ref for guess processing
    }

    room.players.push(player);
    socket.join(id);
    socket.data.roomId = id;

    // Notify others
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
    if (!room)                         return cb({ success: false, error: 'Room not found.' });
    if (room.hostId !== socket.id)     return cb({ success: false, error: 'Only the host can start the game.' });
    if (!movieName?.trim())            return cb({ success: false, error: 'Please provide a movie name.' });

    const name = movieName.trim();

    // Shared config (never mutated)
    room.game = { movieName: name, hint: hint || null };
    room.status = 'playing';

    // Give every non-host player a fresh independent game state
    room.players.forEach((p) => {
      p.score           = 0;
      p.guessedCorrectly = false;
      if (!p.isHost) {
        p.playerGame           = mkPlayerGame(name, hint);
        p.playerGame._movieName = name; // temp ref for guess logic
      }
    });

    const publicPlayers = room.players.map(publicPlayerRow);

    // Emit individually so each player gets their own game state
    room.players.forEach((p) => {
      const sock = io.sockets.sockets.get(p.id);
      if (!sock) return;
      sock.emit('game_started', {
        players:    publicPlayers,
        playerGame: p.isHost ? null : publicPlayerGame(p.playerGame, name),
        hint:       room.game.hint,
      });
    });

    console.log(`[GAME] Started in ${socket.data.roomId}: "${name}"`);
    cb({ success: true });
  });

  // ── Guess a letter ────────────────────────────────────────────────────
  socket.on('guess_letter', ({ letter }, cb) => {
    const room   = rooms.get(socket.data.roomId);
    const player = room?.players.find((p) => p.id === socket.id);

    if (!room || !room.game)             return cb({ success: false, error: 'No active game.' });
    if (!player || !player.playerGame)   return cb({ success: false, error: 'You are not a player in this game.' });
    if (player.playerGame.status !== 'playing') return cb({ success: false, error: 'Your game is already over.' });
    if (!letter || letter.length !== 1 || !/[a-zA-Z]/.test(letter)) return cb({ success: false, error: 'Invalid letter.' });

    player.lastActivity = Date.now();

    const result = processGuess(player.playerGame, letter);
    if (result.alreadyGuessed) return cb({ success: false, error: 'Already guessed.' });

    // Check end conditions for THIS player
    let gameOver = false;
    if (isWon(player.playerGame)) {
      player.playerGame.status = 'won';
      player.score             = player.playerGame.livesLeft * 10 + 20;
      player.guessedCorrectly  = true;
      gameOver                 = true;
    } else if (player.playerGame.livesLeft <= 0) {
      player.playerGame.status = 'lost';
      gameOver                 = true;
    }

    const updatedPlayerGame = publicPlayerGame(player.playerGame, room.game.movieName);
    const publicPlayers     = room.players.map(publicPlayerRow);

    // 1. Tell the guesser about their updated board
    socket.emit('guess_result', {
      letter:     letter.toUpperCase(),
      correct:    result.correct,
      positions:  result.positions || [],
      playerGame: updatedPlayerGame,
    });

    // 2. Broadcast updated progress to everyone (for leaderboard)
    io.to(socket.data.roomId).emit('players_progress', { players: publicPlayers });

    // 3. If this player's game is over, tell them privately
    if (gameOver) {
      socket.emit('your_game_over', {
        playerGame: updatedPlayerGame,
        players:    publicPlayers,
      });
    }

    cb({ success: true });
  });

  // ── Chat ──────────────────────────────────────────────────────────────
  socket.on('chat_message', ({ message }) => {
    const room   = rooms.get(socket.data.roomId);
    const player = room?.players.find((p) => p.id === socket.id);
    if (!room || !player) return;

    player.lastActivity = Date.now();
    if (!message?.trim()) return;

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
  console.log(OMDB_API_KEY ? '🔍 OMDB search enabled' : '⚠️  OMDB_API_KEY not set — using fallback list');
});
