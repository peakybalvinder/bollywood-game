/**
 * Bollywood Movie Guessing Game — Backend Server
 * Express + Socket.IO | In-memory room management
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

// ─── Constants ──────────────────────────────────────────────────────────────
const MAX_PLAYERS = 5;
const LIVES_WORD = 'BOLLYWOOD';
const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes
const INACTIVITY_CHECK_MS = 30_000;   // check every 30s

// ─── In-memory store ────────────────────────────────────────────────────────
// Map<roomId, Room>
const rooms = new Map();

// ─── Factory helpers ────────────────────────────────────────────────────────
function mkPlayer(socketId, name, isHost = false) {
  return {
    id: socketId,
    name,
    isHost,
    score: 0,
    guessedCorrectly: false,
    lastActivity: Date.now(),
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
    status: 'waiting', // 'waiting' | 'playing' | 'ended'
  };
}

/**
 * Build game state from a movie name and optional hint character.
 * Spaces are kept as spaces; hint character is pre-revealed.
 */
function mkGame(movieName, hint) {
  const name = movieName.trim();
  const blanks = name.split('').map((ch) => {
    if (ch === ' ') return ' ';
    if (hint && hint.toLowerCase() === ch.toLowerCase()) return ch;
    return '_';
  });
  return {
    movieName: name,
    blanks,
    hint: hint || null,
    livesLeft: LIVES_WORD.length,
    wrongLetters: [],   // incorrect uppercase letters
    guessedLetters: [], // all guessed lowercase letters
    status: 'playing',  // 'playing' | 'won' | 'lost'
  };
}

// ─── Game logic ─────────────────────────────────────────────────────────────
/**
 * Process a single-letter guess against the current game.
 * Mutates game in place.
 * Returns { alreadyGuessed?, correct, positions? }
 */
function processGuess(game, letter) {
  const l = letter.toLowerCase();

  if (game.guessedLetters.includes(l)) {
    return { alreadyGuessed: true };
  }

  game.guessedLetters.push(l);
  const movieLower = game.movieName.toLowerCase();
  const positions = [];

  for (let i = 0; i < movieLower.length; i++) {
    if (movieLower[i] === l) {
      positions.push(i);
      game.blanks[i] = game.movieName[i]; // preserve original casing
    }
  }

  if (positions.length > 0) {
    return { correct: true, positions };
  }

  game.wrongLetters.push(l.toUpperCase());
  game.livesLeft -= 1;
  return { correct: false };
}

function isWon(game) {
  return !game.blanks.includes('_');
}

// ─── Serialisation (never leak movieName while playing) ─────────────────────
function publicGame(game) {
  const g = {
    blanks: game.blanks,
    hint: game.hint,
    livesLeft: game.livesLeft,
    livesWord: LIVES_WORD,
    wrongLetters: game.wrongLetters,
    guessedLetters: game.guessedLetters,
    status: game.status,
  };
  if (game.status !== 'playing') g.movieName = game.movieName;
  return g;
}

function publicRoom(room) {
  return {
    id: room.id,
    name: room.name,
    maxPlayers: room.maxPlayers,
    hostId: room.hostId,
    players: room.players.map(({ id, name, isHost, score, guessedCorrectly }) => ({
      id, name, isHost, score, guessedCorrectly,
    })),
    game: room.game ? publicGame(room.game) : null,
    status: room.status,
    chatHistory: room.chat.slice(-50), // last 50 msgs on join
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

// ─── Socket.IO ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} connected`);

  // ── Create room ─────────────────────────────────────────────────
  socket.on('create_room', ({ roomName, maxPlayers, playerName }, cb) => {
    const roomId = uuidv4().slice(0, 6).toUpperCase();
    const room = mkRoom(roomId, roomName || 'Bollywood Night', maxPlayers || 2, socket.id);
    const player = mkPlayer(socket.id, playerName || 'Host', true);
    room.players.push(player);
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.data.roomId = roomId;

    console.log(`[ROOM] ${roomId} created by ${playerName}`);
    cb({ success: true, roomId, room: publicRoom(room) });
  });

  // ── Join room ───────────────────────────────────────────────────
  socket.on('join_room', ({ roomId, playerName }, cb) => {
    const id = (roomId || '').toUpperCase().trim();
    const room = rooms.get(id);

    if (!room) return cb({ success: false, error: 'Room not found. Check the code and try again.' });
    if (room.status === 'ended') return cb({ success: false, error: 'This game has already ended.' });
    if (room.players.length >= room.maxPlayers) return cb({ success: false, error: `Room is full (${room.maxPlayers} players max).` });

    const player = mkPlayer(socket.id, playerName || 'Guest');
    room.players.push(player);
    socket.join(id);
    socket.data.roomId = id;

    // Notify others
    io.to(id).emit('player_joined', {
      player: { id: player.id, name: player.name, isHost: false, score: 0, guessedCorrectly: false },
      players: room.players.map(({ id, name, isHost, score, guessedCorrectly }) => ({ id, name, isHost, score, guessedCorrectly })),
    });

    console.log(`[JOIN] ${playerName} joined ${id}`);
    cb({ success: true, room: publicRoom(room) });
  });

  // ── Start game (host sets movie) ────────────────────────────────
  socket.on('start_game', ({ movieName, hint }, cb) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return cb({ success: false, error: 'Room not found.' });
    if (room.hostId !== socket.id) return cb({ success: false, error: 'Only the host can start the game.' });
    if (!movieName || movieName.trim().length < 1) return cb({ success: false, error: 'Please provide a movie name.' });

    room.game = mkGame(movieName, hint);
    room.status = 'playing';
    // Reset per-game player state
    room.players.forEach((p) => { p.score = 0; p.guessedCorrectly = false; });

    io.to(socket.data.roomId).emit('game_started', {
      game: publicGame(room.game),
      players: room.players.map(({ id, name, isHost, score, guessedCorrectly }) => ({ id, name, isHost, score, guessedCorrectly })),
    });

    console.log(`[GAME] Started in room ${socket.data.roomId}: "${movieName}"`);
    cb({ success: true });
  });

  // ── Guess a letter ──────────────────────────────────────────────
  socket.on('guess_letter', ({ letter }, cb) => {
    const room = rooms.get(socket.data.roomId);
    if (!room || !room.game) return cb({ success: false, error: 'No active game.' });
    if (room.game.status !== 'playing') return cb({ success: false, error: 'Game is over.' });
    if (!letter || letter.length !== 1 || !/[a-zA-Z]/.test(letter)) {
      return cb({ success: false, error: 'Invalid letter.' });
    }

    // Update activity
    const player = room.players.find((p) => p.id === socket.id);
    if (player) player.lastActivity = Date.now();

    const result = processGuess(room.game, letter);
    if (result.alreadyGuessed) return cb({ success: false, error: 'Already guessed.' });

    // Check end conditions
    let gameOver = false;
    if (isWon(room.game)) {
      room.game.status = 'won';
      gameOver = true;
      if (player) {
        // Score = lives remaining × 10 + 20 base
        player.score += room.game.livesLeft * 10 + 20;
        player.guessedCorrectly = true;
      }
    } else if (room.game.livesLeft <= 0) {
      room.game.status = 'lost';
      gameOver = true;
    }

    const payload = {
      letter: letter.toUpperCase(),
      correct: result.correct,
      positions: result.positions || [],
      game: publicGame(room.game),
      players: room.players.map(({ id, name, isHost, score, guessedCorrectly }) => ({ id, name, isHost, score, guessedCorrectly })),
      guessedBy: player ? player.name : 'Unknown',
    };

    io.to(socket.data.roomId).emit('guess_result', payload);
    if (gameOver) io.to(socket.data.roomId).emit('game_over', { game: publicGame(room.game), players: payload.players });

    cb({ success: true });
  });

  // ── Chat ────────────────────────────────────────────────────────
  socket.on('chat_message', ({ message }) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    player.lastActivity = Date.now();

    if (!message || message.trim().length === 0) return;
    const msg = {
      id: uuidv4().slice(0, 8),
      playerId: socket.id,
      playerName: player.name,
      message: message.trim().slice(0, 300),
      timestamp: Date.now(),
    };
    room.chat.push(msg);
    io.to(socket.data.roomId).emit('chat_message', msg);
  });

  // ── Activity ping (client sends every 60s) ──────────────────────
  socket.on('activity_ping', () => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    const player = room.players.find((p) => p.id === socket.id);
    if (player) player.lastActivity = Date.now();
  });

  // ── Get room state ──────────────────────────────────────────────
  socket.on('get_room', (cb) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return cb({ success: false });
    cb({ success: true, room: publicRoom(room) });
  });

  // ── Disconnect ──────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id} disconnected`);
    const room = rooms.get(socket.data.roomId);
    if (!room) return;

    if (socket.id === room.hostId) {
      // Host left → terminate game for everyone
      io.to(socket.data.roomId).emit('host_left', {
        message: 'The host has left the game. The party is over! 🎬',
      });
      rooms.delete(socket.data.roomId);
    } else {
      room.players = room.players.filter((p) => p.id !== socket.id);
      io.to(socket.data.roomId).emit('player_left', {
        playerId: socket.id,
        players: room.players.map(({ id, name, isHost, score, guessedCorrectly }) => ({ id, name, isHost, score, guessedCorrectly })),
      });
    }
  });
});

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', rooms: rooms.size }));

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎬 Bollywood Game Server running on http://localhost:${PORT}`);
});
