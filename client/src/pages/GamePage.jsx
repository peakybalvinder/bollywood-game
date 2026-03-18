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

export default function GamePage({ initialRoom, playerName, onLeave, showToast }) {
  const [room]    = useState(initialRoom);

  // ── Reactive host tracking (changes on transfer_host) ──────────────────
  const [hostId, setHostId]   = useState(initialRoom.hostId);
  const isHost = socket.id === hostId;

  // ── Game state ──────────────────────────────────────────────────────────
  // gameConfig: { hint } — set when game starts, null before/between games
  // Fixes the "host stuck on waiting screen" bug — we track this separately
  // from `room` (which never updates) so the host can switch to spectator view
  const [gameConfig, setGameConfig] = useState(initialRoom.game || null);

  // This player's own board — null for host, null before game starts
  const [game, setGame]             = useState(initialRoom.playerGame || null);
  const [players, setPlayers]       = useState(initialRoom.players);
  const [showMovieSearch, setShowMovieSearch] = useState(
    initialRoom.hostId === socket.id && !initialRoom.game
  );
  const [showGameOver, setShowGameOver] = useState(false);
  const [lastRevealed, setLastRevealed] = useState(new Set());
  const [lastGuessInfo, setLastGuessInfo] = useState(null);
  const [guessing, setGuessing]     = useState(false);
  const guessInfoTimeout = useRef(null);

  const mySocketId = socket.id;
  const isPlaying  = game?.status === 'playing';

  // ── Socket events ─────────────────────────────────────────────────────
  useEffect(() => {
    // Game started — host gets gameConfig, players get their own board
    socket.on('game_started', ({ players: ps, playerGame: pg, gameConfig: gc }) => {
      setGameConfig(gc || { hint: null }); // ← this is what fixes host spectator view
      if (pg) setGame(pg);
      setPlayers(ps);
      setShowGameOver(false);
      setShowMovieSearch(false);
      setLastRevealed(new Set());
      setLastGuessInfo(null);
      if (socket.id !== hostId) showToast('Game started! Guess the movie 🎬', 'success');
    });

    // Private — guesser's board update
    socket.on('guess_result', ({ letter, correct, positions, playerGame }) => {
      setGame(playerGame);
      setLastRevealed(new Set(positions || []));
      clearTimeout(guessInfoTimeout.current);
      setLastGuessInfo({ letter, correct });
      guessInfoTimeout.current = setTimeout(() => setLastGuessInfo(null), 2500);
    });

    // Broadcast — leaderboard update for everyone including host
    socket.on('players_progress', ({ players: ps }) => {
      setPlayers(ps);
    });

    // Private — this player won or lost
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

    // Host role transferred
    socket.on('host_transferred', ({ newHostId, players: ps }) => {
      setHostId(newHostId);
      setPlayers(ps);
      if (newHostId === socket.id) {
        showToast('You are now the host! 🎬', 'success');
        // New host: close any game board, open movie picker if game is running
        setGame(null);
        if (gameConfig) setShowMovieSearch(false); // wait for next round
      } else if (socket.id === hostId) {
        showToast('Host role transferred.', 'info');
      }
    });

    return () => {
      socket.off('game_started');
      socket.off('guess_result');
      socket.off('players_progress');
      socket.off('your_game_over');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('host_transferred');
    };
  }, [showToast, hostId, gameConfig]);

  // ── Guess ─────────────────────────────────────────────────────────────
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

  // ── Play Again ────────────────────────────────────────────────────────
  function handlePlayAgain() {
    setShowGameOver(false);
    setGame(null);
    setGameConfig(null);
    setLastRevealed(new Set());
    setLastGuessInfo(null);
    if (isHost) setShowMovieSearch(true);
  }

  // ── Transfer host ─────────────────────────────────────────────────────
  function handleTransferHost(newHostId) {
    socket.emit('transfer_host', { newHostId }, ({ success, error }) => {
      if (!success) showToast(error || 'Could not transfer host.', 'error');
    });
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
  const nonHostPlayers  = players.filter(p => !p.isHost);

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
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Left: Players (desktop) */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 p-4 border-r border-ink-700 overflow-y-auto">
          <PlayerList
            players={players}
            myId={mySocketId}
            hostId={hostId}
            roomName={room.name}
            roomId={room.id}
            isHost={isHost}
            onTransferHost={handleTransferHost}
          />
        </aside>

        {/* Center: Game board */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="flex-1 flex flex-col items-center px-4 pt-6 gap-5 w-full max-w-2xl mx-auto pb-4">

            {/* ── Non-host: waiting for game to start ── */}
            {!game && !isHost && !gameConfig && (
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

            {/* ── Host: pre-game waiting screen ── */}
            {isHost && !gameConfig && (
              <div className="text-center mt-12 animate-fade-in">
                <div className="text-5xl mb-4">🎬</div>
                <h2 className="font-display font-bold text-2xl text-gold-400 mb-2">
                  {nonHostPlayers.length === 0 ? 'Waiting for players to join…' : 'Ready to start!'}
                </h2>
                <p className="text-gold-700 text-sm font-body mb-6">
                  {nonHostPlayers.length === 0
                    ? 'Share the room code with your friends.'
                    : `${nonHostPlayers.length} player${nonHostPlayers.length > 1 ? 's' : ''} joined. Pick a movie to begin.`}
                </p>
                {nonHostPlayers.length > 0 && (
                  <button onClick={() => setShowMovieSearch(true)} className="btn-gold px-8 py-3">
                    🎞 Pick a Movie
                  </button>
                )}
              </div>
            )}

            {/* ── Host: spectator view during active game ── */}
            {isHost && gameConfig && (
              <div className="w-full animate-fade-in">
                <div className="text-center card-dark rounded-xl py-6 px-4 mb-4">
                  <div className="text-4xl mb-3">🎬</div>
                  <p className="font-display font-bold text-xl text-gold-400 mb-1">Spectating</p>
                  <p className="text-gold-700 text-sm font-body">Watch your players' progress in the panel →</p>
                  {gameConfig.hint && (
                    <p className="text-gold-700 text-xs mt-3">
                      Hint given:{' '}
                      {gameConfig.hint.toUpperCase().split('').map((l, i) => (
                        <span key={i} className="font-mono font-bold text-gold-400 bg-ink-800 border border-gold-800 rounded px-1.5 py-0.5 text-sm mx-0.5">
                          {l}
                        </span>
                      ))}
                    </p>
                  )}
                </div>

                {/* Full leaderboard visible to host during game */}
                <div className="card-dark rounded-xl p-4">
                  <p className="text-gold-700 text-xs uppercase tracking-widest mb-3">Live Progress</p>
                  <div className="space-y-2">
                    {nonHostPlayers.map((p) => {
                      const pct = p.livesLeft !== null ? (p.livesLeft / 9) * 100 : 100;
                      return (
                        <div key={p.id} className="bg-ink-700 rounded-lg p-3 border border-ink-600">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-body font-semibold text-sm text-gold-300">{p.name}</span>
                            <div className="flex items-center gap-2">
                              {p.gameStatus === 'won'  && <span className="text-green-400 text-xs">🏆 Guessed!</span>}
                              {p.gameStatus === 'lost' && <span className="text-crimson-400 text-xs">💔 Out</span>}
                              {p.gameStatus === 'playing' && (
                                <span className="text-gold-700 text-xs">{p.livesLeft} lives left</span>
                              )}
                              <span className="font-mono text-gold-500 text-sm font-bold">{p.score} pts</span>
                            </div>
                          </div>
                          {/* Lives bar */}
                          <div className="w-full bg-ink-800 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full transition-all duration-500 ${
                                p.gameStatus === 'won' ? 'bg-green-500' :
                                p.gameStatus === 'lost' ? 'bg-crimson-600' : 'bg-gold-600'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Player: active game board ── */}
            {!isHost && game && (
              <div className="w-full flex flex-col gap-5 animate-fade-in">

                {/* Hint */}
                {game.hint && (
                  <div className="text-center text-gold-700 text-sm font-body">
                    Hint:{' '}
                    {game.hint.toUpperCase().split('').map((l, i) => (
                      <span key={i} className="font-mono font-bold text-gold-400 bg-ink-700 border border-gold-800 rounded px-1.5 py-0.5 text-sm mx-0.5">
                        {l}
                      </span>
                    ))}
                    {' '}pre-revealed.
                  </div>
                )}

                {/* Blanks */}
                <div className="py-2">
                  <MovieBlanks blanks={game.blanks} lastRevealed={lastRevealed} />
                </div>

                {/* Guess feedback */}
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

                {/* Desktop keyboard */}
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

            {/* Mobile player list */}
            <div className="lg:hidden w-full mt-2">
              <PlayerList
                players={players}
                myId={mySocketId}
                hostId={hostId}
                roomName={room.name}
                roomId={room.id}
                isHost={isHost}
                onTransferHost={handleTransferHost}
              />
            </div>
          </div>

          {/* Mobile sticky keyboard */}
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

        {/* Right: Chat */}
        <aside className="hidden md:flex flex-col w-72 xl:w-80 shrink-0 p-4 border-l border-ink-700">
          <ChatPanel myId={mySocketId} playerName={playerName} />
        </aside>
      </div>

      <Footer />

      {/* Modals */}
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
