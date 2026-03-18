# 🎬 Bollywood Hangman

A real-time multiplayer movie guessing game. One player picks a Bollywood film, others guess it letter by letter — with BOLLYWOOD as their 9-life meter.

---

## Quick Start

### 1 — Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2 — Start both servers (two terminals)
```bash
# Terminal 1
cd server && npm run dev       # http://localhost:3001

# Terminal 2
cd client && npm run dev       # http://localhost:5173
```

### 3 — (Optional) OMDB movie search
Get a free key at https://www.omdbapi.com/apikey.aspx and add to client/.env:
```
VITE_OMDB_API_KEY=your_key_here
```
Without a key the game uses a curated list of ~25 Bollywood titles.

---

## How to Play

| Role   | Action |
|--------|--------|
| Host   | Create a Party → name room → pick movie + hint → Start |
| Guest  | Join a Party → enter 6-char code → enter name → guess! |

- One letter per guess. Wrong guess = one BOLLYWOOD letter struck.
- Score = lives remaining × 10 + 20 base.
- Host disconnect = game over for all.
- 5 min inactivity = auto-removed.

---

## Project Structure

```
bollywood-game/
├── server/server.js          # Express + Socket.IO — all game logic
└── client/src/
    ├── App.jsx               # Top-level router
    ├── socket.js             # Socket.IO singleton
    ├── components/
    │   ├── Dashboard.jsx
    │   ├── CreatePartyModal.jsx
    │   ├── JoinPartyModal.jsx
    │   ├── MovieSearchModal.jsx
    │   ├── MovieBlanks.jsx
    │   ├── LivesDisplay.jsx
    │   ├── Keyboard.jsx
    │   ├── PlayerList.jsx
    │   ├── ChatPanel.jsx
    │   ├── GameOverOverlay.jsx
    │   └── Toast.jsx
    └── pages/GamePage.jsx
```

## Tech Stack
- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Node.js + Express + Socket.IO
- Movie Search: OMDB API (optional, falls back to demo list)
