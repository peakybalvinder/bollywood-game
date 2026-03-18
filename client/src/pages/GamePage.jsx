import React, { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../socket';
import PlayerList from '../components/PlayerList';
import ChatPanel from '../components/ChatPanel';
import LivesDisplay from '../components/LivesDisplay';
import MovieBlanks from '../components/MovieBlanks';
import Keyboard from '../components/Keyboard';
import MovieSearchModal from '../components/MovieSearchModal';
import GameOverOverlay from '../components/GameOverOverlay';
import Footer from '../components/Footer';

/**
 * GamePage
 *
 * Key architecture:
 *   - `game`    = THIS player's own independent game state (blanks, lives, guesses)
 *                 null for host (host never guesses)
 *   - `players` = leaderboard rows — updated by `players_progress` from server
 *
 * Server events:
 *   game_started     → { players, playerGame (null for host), hint }
 *   guess_result     → { letter, correct, positions, playerGame } — PRIVATE to guesser only
 *   players_progress → { players }  — broadcast to all for leaderboard
 *   your_game_over   → { playerGame, players } — PRIVATE to player who finished
 *   player_joined / player_left — broadcast
 */
export default function GamePage({ initialRoom, playerName, isHost, onLeave, showToast }) {
  const [room]            = useState(initialRoom);
  // Own game state (null for host, null before game starts)
  const [game, setGame]   = useState(initialRoom.playerGame || null);
  const [players, setPlayers] = useState(initialRoom.players);
  const [showMovieSearch, setShowMovieSearch] = useState(isHost && !initialRoom.game);
  const [showGameOver, setShowGameOver]       = useState(false);
  const [lastRevealed, setLastRevealed]       = useState(new Set());
  const [lastGuessInfo, setLastGuessInfo]     = useState(null);
  const [guessing, setGuessing]               = useState(false);
  const guessInfoTimeout = useRef(null);

  const mySocketId = socket.id;
  const isPlaying  = game?.status === 'playing';

  // ── Socket events ─────────────────────────────────────────────────────
  useEffect(() => {
    // Host starts the game → each player receives their own playerGame
    socket.on('game_started', ({ players: ps, playerGame: pg }) => {
      if (pg) setGame(pg);          // null for host — host has no game board
      setPlayers(ps);
      setShowGameOver(false);
      setShowMovieSearch(false);
      setLastRevealed(new Set());
      setLastGuessInfo(null);
      if (!isHost) showToast('Game started! Guess the movie 🎬', 'success');
    });

    // Private: only the guesser receives this — updates THEIR board only
    socket.on('guess_result', ({ letter, correct, positions, playerGame }) => {
      setGame(playerGame);
      setLastRevealed(new Set(positions || []));
      clearTimeout(guessInfoTimeout.current);
      setLastGuessInfo({ letter, correct, by: 'You' });
      guessInfoTimeout.current = setTimeout(() => setLastGuessInfo(null), 2500);
    });

    // Broadcast: all players get updated leaderboard rows (no game state leaked)
    socket.on('players_progress', ({ players: ps }) => {
      setPlayers(ps);
    });

    // Private: this player's game just ended (won or lost)
    socket.on('your_game_over', ({ playerGame, players: ps }) => {
      setGame(playerGame);
      setPlayers(ps);
      setShowGameOver(true);
    });

    socket.on('player_joined', ({ players: ps }) => setPlayers(ps));
    socket.on('player_left', ({ players: ps }) => {
      setPlayers(ps);
      showToast('A player left the party.', 'info');
    });

    return () => {
      socket.off('game_started');
      socket.off('guess_result');
      socket.off('players_progress');
      socket.off('your_game_over');
      socket.off('player_joined');
      socket.off('player_left');
    };
  }, [showToast, isHost]);

  // ── Guess handler ─────────────────────────────────────────────────────
  const handleGuess = useCallback((letter) => {
    if (!isPlaying || guessing) return;
    setGuessing(true);
    socket.emit('guess_letter', { letter }, ({ success, error }) => {
      setGuessing(false);
      if (!success && error && error !== 'Already guessed.') showToast(error, 'error');
    });
  }, [isPlaying, guessing, showToast]);

  // ── Host: pick movie ──────────────────────────────────────────────────
  function handleMovieSelected({ movieName, hint }) {
    socket.emit('start_game', { movieName, hint }, ({ success, error }) => {
      if (!success) showToast(error || 'Could not start game.', 'error');
    });
    setShowMovieSearch(false);
  }

  // ── Play again (host re-opens movie picker) ───────────────────────────
  function handlePlayAgain() {
    setShowGameOver(false);
    setGame(null);
    setLastRevealed(new Set());
    setLastGuessInfo(null);
    if (isHost) setShowMovieSearch(true);
  }

  // ── Copy invite link ──────────────────────────────────────────────────
  function copyRoomLink() {
    const link = `${window.location.origin}?room=${room.id}`;
    navigator.clipboard.writeText(link).then(
      () => showToast('Link copied! Share with friends 🎟', 'success'),
      () => showToast(`Room code: ${room.id}`, 'info')
    );
  }

  const totalLetters    = game ? game.blanks.filter(c => c !== ' ').length : 0;
  const revealedLetters = game ? game.blanks.filter(c => c !== '_' && c !== ' ').length : 0;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="bg-cinema min-h-screen flex flex-col">

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-ink-700 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎬</span>
          <span className="font-display font-bold text-gold-400 text-lg hidden sm:block">Bollywood Hangman</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyRoomLink}
            className="font-mono text-gold-500 bg-ink-700 border border-ink-600 rounded-lg px-3 py-1.5 text-xs tracking-widest hover:border-gold-700 transition-colors"
          >
            📋 {room.id}
          </button>
          <button
            onClick={() => {
              if (window.confirm('Leave? If you are the host, the game will end for everyone.')) onLeave();
            }}
            className="btn-ghost text-xs px-3 py-1.5"
          >
            Leave
          </button>
        </div>
      </header>

      {/* ── Main layout ── */}
      {/*
        Mobile layout:  single column, keyboard sticks to bottom
        Tablet/desktop: 3-column (players | board | chat)
      */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Left: Players (desktop only) */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 p-4 border-r border-ink-700 overflow-y-auto">
          <PlayerList
            players={players}
            myId={mySocketId}
            hostId={room.hostId}
            roomName={room.name}
            roomId={room.id}
            isHost={isHost}
          />
        </aside>

        {/* Center: Game board */}
        <main className={`flex-1 flex flex-col min-w-0 overflow-y-auto
          ${!isHost ? 'pb-0 md:pb-6' : 'pb-6'}`}>

          {/* Scrollable content area */}
          <div className="flex-1 flex flex-col items-center px-4 pt-6 gap-5 w-full max-w-2xl mx-auto
            /* on mobile leave space for sticky keyboard */
            pb-4 md:pb-0">

            {/* Waiting state (non-host, before game starts) */}
            {!game && !isHost && (
              <div className="text-center mt-12 animate-fade-in">
                <div className="text-5xl mb-4 animate-flicker">🎞</div>
                <h2 className="font-display font-bold text-2xl text-gold-400 mb-2">Waiting for Host</h2>
                <p className="text-gold-700 text-sm font-body">The host is choosing a movie…</p>
                <div className="mt-4 flex justify-center gap-1">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-2 h-2 rounded-full bg-gold-600 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Host waiting state */}
            {!room.game && isHost && (
              <div className="text-center mt-12 animate-fade-in">
                <div className="text-5xl mb-4">🎬</div>
                <h2 className="font-display font-bold text-2xl text-gold-400 mb-2">
                  {players.filter(p => !p.isHost).length === 0
                    ? 'Waiting for players to join…'
                    : 'Ready to start!'}
                </h2>
                <p className="text-gold-700 text-sm font-body mb-6">
                  {players.filter(p => !p.isHost).length === 0
                    ? 'Share the room code with your friends.'
                    : `${players.filter(p => !p.isHost).length} player${players.filter(p => !p.isHost).length > 1 ? 's' : ''} joined. Pick a movie to begin.`}
                </p>
                {players.filter(p => !p.isHost).length > 0 && (
                  <button onClick={() => setShowMovieSearch(true)} className="btn-gold px-8 py-3">
                    🎞 Pick a Movie
                  </button>
                )}
              </div>
            )}

            {/* Active game board */}
            {game && (
              <div className="w-full flex flex-col gap-5 animate-fade-in">

                {/* Hint letters */}
                {game.hint && (
                  <div className="text-center text-gold-700 text-sm font-body">
                    <span>Hint: </span>
                    <span className="inline-flex gap-1 flex-wrap justify-center mx-1">
                      {game.hint.toUpperCase().split('').map((l, i) => (
                        <span key={i} className="font-mono font-bold text-gold-400 bg-ink-700 border border-gold-800 rounded px-1.5 py-0.5 text-sm">
                          {l}
                        </span>
                      ))}
                    </span>
                    <span> pre-revealed.</span>
                  </div>
                )}

                {/* Word blanks */}
                <div className="py-2">
                  <MovieBlanks blanks={game.blanks} lastRevealed={lastRevealed} />
                </div>

                {/* Last guess feedback — only shown to the guesser */}
                {lastGuessInfo && (
                  <div className={`text-center text-sm font-body animate-fade-in
                    ${lastGuessInfo.correct ? 'text-green-400' : 'text-crimson-400'}`}>
                    <span className="font-mono font-bold">{lastGuessInfo.letter}</span>
                    {lastGuessInfo.correct ? ' ✓ — Correct!' : ' ✗ — Wrong guess!'}
                  </div>
                )}

                {/* Lives */}
                <div className="card-dark rounded-xl py-4 px-4">
                  <LivesDisplay livesLeft={game.livesLeft} wrongLetters={game.wrongLetters} />
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full bg-ink-700 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-crimson-600 to-gold-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${totalLetters ? (revealedLetters / totalLetters) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-center text-gold-800 text-xs font-body">
                    {revealedLetters} / {totalLetters} letters revealed
                  </p>
                </div>

                {/* Keyboard — desktop inline, hidden on mobile (shown sticky below) */}
                <div className="hidden md:block card-dark rounded-xl py-5 px-4">
                  <Keyboard
                    guessedLetters={game.guessedLetters}
                    wrongLetters={game.wrongLetters}
                    onGuess={handleGuess}
                    disabled={!isPlaying || guessing}
                  />
                </div>
              </div>
            )}

            {/* Host spectator message */}
            {isHost && room.game && (
              <div className="text-center text-gold-700 text-sm font-body italic py-2 card-dark rounded-xl w-full px-4">
                You are the host — watch their progress in the player list 🎬
              </div>
            )}

            {/* Mobile player list */}
            <div className="lg:hidden w-full mt-2">
              <PlayerList
                players={players}
                myId={mySocketId}
                hostId={room.hostId}
                roomName={room.name}
                roomId={room.id}
                isHost={isHost}
              />
            </div>
          </div>

          {/* ── Mobile keyboard — sticky at the bottom, only for non-host players ── */}
          {!isHost && game && (
            <div className="md:hidden sticky bottom-0 z-20 bg-ink-900 border-t border-ink-700 px-3 py-3 shadow-2xl">
              <Keyboard
                guessedLetters={game.guessedLetters}
                wrongLetters={game.wrongLetters}
                onGuess={handleGuess}
                disabled={!isPlaying || guessing}
                compact
              />
            </div>
          )}
        </main>

        {/* Right: Chat (tablet+) */}
        <aside className="hidden md:flex flex-col w-72 xl:w-80 shrink-0 p-4 border-l border-ink-700">
          <ChatPanel myId={mySocketId} playerName={playerName} />
        </aside>
      </div>

      {/* ── Footer ── */}
      <Footer />

      {/* ── Modals ── */}
      {showMovieSearch && isHost && (
        <MovieSearchModal
          onSelectMovie={handleMovieSelected}
          onClose={() => setShowMovieSearch(false)}
        />
      )}
      {showGameOver && (
        <GameOverOverlay
          game={game}
          players={players}
          isHost={isHost}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}