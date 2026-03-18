import React, { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../socket';
import PlayerList from '../components/PlayerList';
import ChatPanel from '../components/ChatPanel';
import LivesDisplay from '../components/LivesDisplay';
import MovieBlanks from '../components/MovieBlanks';
import Keyboard from '../components/Keyboard';
import MovieSearchModal from '../components/MovieSearchModal';
import GameOverOverlay from '../components/GameOverOverlay';

export default function GamePage({ initialRoom, playerName, isHost, onLeave, showToast }) {
  const [room] = useState(initialRoom);
  const [game, setGame] = useState(initialRoom.game);
  const [players, setPlayers] = useState(initialRoom.players);
  const [showMovieSearch, setShowMovieSearch] = useState(isHost && !initialRoom.game);
  const [showGameOver, setShowGameOver] = useState(false);
  const [lastRevealed, setLastRevealed] = useState(new Set());
  const [lastGuessInfo, setLastGuessInfo] = useState(null);
  const [guessing, setGuessing] = useState(false);
  const guessInfoTimeout = useRef(null);

  const mySocketId = socket.id;
  const gameStatus = game?.status;
  const isPlaying = gameStatus === 'playing';

  useEffect(() => {
    socket.on('game_started', ({ game: g, players: ps }) => {
      setGame(g);
      setPlayers(ps);
      setShowGameOver(false);
      setShowMovieSearch(false);
      setLastRevealed(new Set());
      showToast('Game started! Guess the movie 🎬', 'success');
    });

    socket.on('guess_result', ({ letter, correct, positions, game: g, players: ps, guessedBy }) => {
      setGame(g);
      setPlayers(ps);
      setLastRevealed(new Set(positions || []));
      clearTimeout(guessInfoTimeout.current);
      setLastGuessInfo({ letter, correct, by: guessedBy });
      guessInfoTimeout.current = setTimeout(() => setLastGuessInfo(null), 2500);
    });

    socket.on('game_over', ({ game: g, players: ps }) => {
      setGame(g);
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
      socket.off('game_over');
      socket.off('player_joined');
      socket.off('player_left');
    };
  }, [showToast]);

  const handleGuess = useCallback((letter) => {
    if (!isPlaying || guessing) return;
    setGuessing(true);
    socket.emit('guess_letter', { letter }, ({ success, error }) => {
      setGuessing(false);
      if (!success && error && error !== 'Already guessed.') showToast(error, 'error');
    });
  }, [isPlaying, guessing, showToast]);

  function handleMovieSelected({ movieName, hint }) {
    socket.emit('start_game', { movieName, hint }, ({ success, error }) => {
      if (!success) showToast(error || 'Could not start game.', 'error');
    });
    setShowMovieSearch(false);
  }

  function handlePlayAgain() {
    setShowGameOver(false);
    setGame(null);
    setLastRevealed(new Set());
    setLastGuessInfo(null);
    if (isHost) setShowMovieSearch(true);
  }

  function copyRoomLink() {
    const link = `${window.location.origin}?room=${room.id}`;
    navigator.clipboard.writeText(link).then(
      () => showToast('Link copied! Share with friends 🎟', 'success'),
      () => showToast(`Room code: ${room.id}`, 'info')
    );
  }

  const totalLetters = game ? game.blanks.filter(c => c !== ' ').length : 0;
  const revealedLetters = game ? game.blanks.filter(c => c !== '_' && c !== ' ').length : 0;

  return (
    <div className="bg-cinema min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-ink-700 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎬</span>
          <span className="font-display font-bold text-gold-400 text-lg hidden sm:block">Bollywood Hangman</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyRoomLink}
            className="font-mono text-gold-500 bg-ink-700 border border-ink-600 rounded-lg px-3 py-1.5 text-xs tracking-widest hover:border-gold-700 transition-colors"
            title="Copy invite link"
          >
            📋 {room.id}
          </button>
          <button
            onClick={() => {
              if (window.confirm('Leave the party? If you are the host, the game will end for everyone.')) onLeave();
            }}
            className="btn-ghost text-xs px-3 py-1.5"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Players */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 p-4 border-r border-ink-700 overflow-y-auto">
          <PlayerList players={players} myId={mySocketId} hostId={room.hostId} roomName={room.name} roomId={room.id} />
        </aside>

        {/* Center: Board */}
        <main className="flex-1 flex flex-col items-center overflow-y-auto py-6 px-4 min-w-0">
          {/* Waiting state */}
          {!game && !isHost && (
            <div className="text-center mt-12 animate-fade-in">
              <div className="text-5xl mb-4 animate-flicker">🎞</div>
              <h2 className="font-display font-bold text-2xl text-gold-400 mb-2">Waiting for Host</h2>
              <p className="text-gold-700 text-sm font-body">The host is choosing a movie…</p>
              <div className="mt-4 flex justify-center gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className="w-2 h-2 rounded-full bg-gold-600 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* Active game */}
          {game && (
            <div className="w-full max-w-2xl flex flex-col gap-6 animate-fade-in">
              {/* Hint */}
              {game.hint && (
                <p className="text-center text-gold-700 text-sm font-body">
                  Hint: The letter{' '}
                  <span className="font-mono font-bold text-gold-400 text-base">{game.hint.toUpperCase()}</span>
                  {' '}has been pre-revealed.
                </p>
              )}

              {/* Word blanks */}
              <div className="py-4">
                <MovieBlanks blanks={game.blanks} lastRevealed={lastRevealed} />
              </div>

              {/* Last guess feedback */}
              {lastGuessInfo && (
                <div className={`text-center text-sm font-body animate-fade-in transition-all
                  ${lastGuessInfo.correct ? 'text-green-400' : 'text-red-400'}`}>
                  <span className="font-semibold">{lastGuessInfo.by}</span> guessed{' '}
                  <span className="font-mono font-bold">{lastGuessInfo.letter}</span>
                  {' — '}{lastGuessInfo.correct ? '✓ Correct!' : '✗ Wrong!'}
                </div>
              )}

              {/* Lives */}
              <div className="card-dark rounded-xl py-4 px-6">
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

              {/* Keyboard */}
              {!isHost ? (
                <div className="card-dark rounded-xl py-5 px-4">
                  <Keyboard
                    guessedLetters={game.guessedLetters}
                    wrongLetters={game.wrongLetters}
                    onGuess={handleGuess}
                    disabled={!isPlaying || guessing}
                  />
                </div>
              ) : (
                <div className="text-center text-gold-700 text-sm font-body italic py-4 card-dark rounded-xl">
                  You are the host — sit back and watch them sweat 🎬
                </div>
              )}
            </div>
          )}

          {/* Mobile players */}
          <div className="lg:hidden mt-8 w-full max-w-2xl">
            <PlayerList players={players} myId={mySocketId} hostId={room.hostId} roomName={room.name} roomId={room.id} />
          </div>
        </main>

        {/* Right: Chat */}
        <aside className="hidden md:flex flex-col w-72 xl:w-80 shrink-0 p-4 border-l border-ink-700">
          <ChatPanel myId={mySocketId} playerName={playerName} />
        </aside>
      </div>

      {/* Modals */}
      {showMovieSearch && isHost && (
        <MovieSearchModal onSelectMovie={handleMovieSelected} onClose={() => setShowMovieSearch(false)} />
      )}
      {showGameOver && (
        <GameOverOverlay game={game} players={players} isHost={isHost} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
}
