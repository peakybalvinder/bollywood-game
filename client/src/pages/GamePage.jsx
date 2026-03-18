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

  const [hostId, setHostId]     = useState(initialRoom.hostId);
  const isHost = socket.id === hostId;

  const [gameConfig, setGameConfig]   = useState(initialRoom.game || null);
  const [game, setGame]               = useState(initialRoom.playerGame || null);
  const [players, setPlayers]         = useState(initialRoom.players);
  const [showMovieSearch, setShowMovieSearch] = useState(
    initialRoom.hostId === socket.id && !initialRoom.game
  );
  const [showGameOver, setShowGameOver]   = useState(false);
  const [lastRevealed, setLastRevealed]   = useState(new Set());
  const [lastGuessInfo, setLastGuessInfo] = useState(null);
  const [guessing, setGuessing]           = useState(false);
  const guessInfoTimeout = useRef(null);

  const mySocketId = socket.id;
  const isPlaying  = game?.status === 'playing';
  const nonHostPlayers = players.filter(p => !p.isHost);

  // ── Socket events ─────────────────────────────────────────────────────
  useEffect(() => {
    socket.on('game_started', ({ players: ps, playerGame: pg, gameConfig: gc }) => {
      setGameConfig(gc || { hint: null });
      if (pg) setGame(pg);
      setPlayers(ps);
      setShowGameOver(false);
      setShowMovieSearch(false);
      setLastRevealed(new Set());
      setLastGuessInfo(null);
      if (socket.id !== hostId) showToast('Game started! Guess the movie 🎬', 'success');
    });

    socket.on('guess_result', ({ letter, correct, positions, playerGame }) => {
      setGame(playerGame);
      setLastRevealed(new Set(positions || []));
      clearTimeout(guessInfoTimeout.current);
      setLastGuessInfo({ letter, correct });
      guessInfoTimeout.current = setTimeout(() => setLastGuessInfo(null), 2500);
    });

    // Broadcast — updates leaderboard for EVERYONE including other players
    socket.on('players_progress', ({ players: ps }) => {
      setPlayers(ps);
    });

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

    socket.on('host_transferred', ({ newHostId, players: ps }) => {
      setHostId(newHostId);
      setPlayers(ps);
      if (newHostId === socket.id) {
        showToast('You are now the host! 🎬', 'success');
        setGame(null);
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
  }, [showToast, hostId]);

  // ── Guess ─────────────────────────────────────────────────────────────
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
    setGameConfig(null);
    setLastRevealed(new Set());
    setLastGuessInfo(null);
    if (isHost) setShowMovieSearch(true);
  }

  function handleTransferHost(newHostId) {
    socket.emit('transfer_host', { newHostId }, ({ success, error }) => {
      if (!success) showToast(error || 'Could not transfer host.', 'error');
    });
  }

  function copyRoomLink() {
    const link = `${window.location.origin}?room=${room.id}`;
    navigator.clipboard.writeText(link).then(
      () => showToast('Link copied! Share with friends 🎟', 'success'),
      () => showToast(`Room code: ${room.id}`, 'info')
    );
  }

  const totalLetters    = game ? game.blanks.filter(c => c !== ' ').length : 0;
  const revealedLetters = game ? game.blanks.filter(c => c !== '_' && c !== ' ').length : 0;

  return (
    /*
      KEY LAYOUT FIX:
      h-screen + overflow-hidden on the root div locks the entire page to
      exactly the viewport height. Nothing outside this box can cause page scroll.
      Each inner section manages its own scroll independently.
    */
    <div className="bg-cinema h-screen overflow-hidden flex flex-col">

      {/* ── Top bar — fixed height ── */}
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

      {/* ── Body — fills remaining height, no overflow ── */}
      {/*
        flex-1 + min-h-0 is critical: flex-1 fills the space,
        min-h-0 overrides the flex default that prevents shrinking below content size.
        Each column scrolls independently inside this container.
      */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* ── Left: Players — scrolls internally ── */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 border-r border-ink-700 overflow-hidden">
          {/* The padding is inside so the scrollable content fills the full height */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            <PlayerList
              players={players}
              myId={mySocketId}
              hostId={hostId}
              roomName={room.name}
              roomId={room.id}
              isHost={isHost}
              onTransferHost={handleTransferHost}
              gameActive={!!gameConfig}
            />
          </div>
        </aside>

        {/* ── Center: Game board — scrolls independently ── */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Scrollable game content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="flex flex-col items-center px-4 pt-6 pb-4 gap-5 w-full max-w-2xl mx-auto">

              {/* Non-host waiting */}
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

              {/* Host pre-game */}
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

              {/* ── Host spectator view ── */}
              {isHost && gameConfig && (
                <div className="w-full animate-fade-in space-y-4">
                  <div className="card-dark rounded-xl py-5 px-6 flex items-center gap-4">
                    <span className="text-4xl">🎬</span>
                    <div className="flex-1">
                      <p className="font-display font-bold text-xl text-gold-400">Spectating</p>
                      <p className="text-gold-700 text-sm font-body">
                        {nonHostPlayers.length === 0
                          ? 'No players yet — share the room code!'
                          : `Watching ${nonHostPlayers.length} player${nonHostPlayers.length > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    {gameConfig.hint && (
                      <div className="text-right">
                        <p className="text-gold-700 text-xs mb-1">Hint given</p>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {gameConfig.hint.toUpperCase().split('').map((l, i) => (
                            <span key={i} className="font-mono font-bold text-gold-400 bg-ink-800 border border-gold-800 rounded px-2 py-0.5 text-sm">
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Live player cards */}
                  <div className="card-dark rounded-xl p-4">
                    <p className="text-gold-700 text-xs uppercase tracking-widest mb-3">Live Progress</p>
                    {nonHostPlayers.length === 0 ? (
                      <p className="text-gold-800 text-sm text-center py-4 font-body italic">
                        Waiting for players to join…
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {nonHostPlayers.map((p) => {
                          const lives  = p.livesLeft !== null ? p.livesLeft : 9;
                          const pct    = (lives / 9) * 100;
                          const status = p.gameStatus || 'waiting';
                          return (
                            <div key={p.id} className={`rounded-lg p-4 border transition-all duration-300 ${
                              status === 'won'  ? 'bg-green-950 border-green-700' :
                              status === 'lost' ? 'bg-crimson-950 border-crimson-800' :
                              'bg-ink-700 border-ink-600'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">
                                    {status === 'won' ? '🏆' : status === 'lost' ? '💔' : status === 'playing' ? '🎯' : '⏳'}
                                  </span>
                                  <span className="font-body font-semibold text-sm text-gold-300">{p.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {status === 'won'     && <span className="text-green-400 text-xs font-semibold">Guessed!</span>}
                                  {status === 'lost'    && <span className="text-crimson-400 text-xs font-semibold">Out of lives</span>}
                                  {status === 'playing' && <span className="text-gold-700 text-xs">{lives}/9 lives</span>}
                                  <span className="font-mono font-bold text-gold-500 text-sm">{p.score} pts</span>
                                </div>
                              </div>
                              <div className="flex gap-0.5 mb-2">
                                {'BOLLYWOOD'.split('').map((ch, i) => (
                                  <span key={i} className={`font-mono text-xs font-bold transition-all duration-300 ${
                                    i < lives ? 'text-crimson-400' : 'text-ink-500 line-through'
                                  }`}>{ch}</span>
                                ))}
                              </div>
                              <div className="w-full bg-ink-800 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full transition-all duration-500 ${
                                  status === 'won' ? 'bg-green-500' : status === 'lost' ? 'bg-crimson-600' : 'bg-gold-600'
                                }`} style={{ width: `${pct}%` }} />
                              </div>
                              {p.guessedCount > 0 && (
                                <p className="text-gold-800 text-xs mt-1">{p.guessedCount} letter{p.guessedCount > 1 ? 's' : ''} guessed</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* All done — pick next movie */}
                  {nonHostPlayers.length > 0 &&
                    nonHostPlayers.every(p => p.gameStatus === 'won' || p.gameStatus === 'lost') && (
                    <button
                      onClick={() => { setShowMovieSearch(true); setGameConfig(null); }}
                      className="btn-gold w-full py-3"
                    >
                      🎬 Pick Next Movie
                    </button>
                  )}
                </div>
              )}

              {/* ── Player game board ── */}
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
                    <div className={`text-center text-sm font-body animate-fade-in ${lastGuessInfo.correct ? 'text-green-400' : 'text-crimson-400'}`}>
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

                  {/* Other players' live progress — visible to everyone */}
                  {nonHostPlayers.filter(p => p.id !== mySocketId).length > 0 && (
                    <div className="card-dark rounded-xl p-4">
                      <p className="text-gold-700 text-xs uppercase tracking-widest mb-3">Other Players</p>
                      <div className="space-y-2">
                        {nonHostPlayers.filter(p => p.id !== mySocketId).map((p) => {
                          const lives  = p.livesLeft !== null ? p.livesLeft : 9;
                          const status = p.gameStatus || 'waiting';
                          return (
                            <div key={p.id} className="flex items-center gap-3">
                              <span className="text-sm w-5">
                                {status === 'won' ? '🏆' : status === 'lost' ? '💔' : '🎯'}
                              </span>
                              <span className="font-body text-sm text-gold-400 flex-1 truncate">{p.name}</span>
                              <div className="flex gap-0.5">
                                {'BOLLYWOOD'.split('').map((ch, i) => (
                                  <span key={i} className={`font-mono text-[9px] font-bold ${
                                    i < lives ? 'text-crimson-400' : 'text-ink-600 line-through'
                                  }`}>{ch}</span>
                                ))}
                              </div>
                              <span className="font-mono text-xs text-gold-600 shrink-0">{p.score}pts</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

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
                  gameActive={!!gameConfig}
                />
              </div>
            </div>
          </div>

          {/* Mobile sticky keyboard */}
          {!isHost && game && (
            <div className="md:hidden shrink-0 bg-ink-900 border-t border-ink-700 px-3 py-3 shadow-2xl">
              <Keyboard
                guessedLetters={game.guessedLetters}
                wrongLetters={game.wrongLetters}
                onGuess={handleGuess}
                disabled={!isPlaying || guessing}
                compact
              />
            </div>
          )}

          {/* Footer inside center column */}
          <div className="shrink-0">
            <Footer />
          </div>
        </main>

        {/* ── Right: Chat — ONLY the message list scrolls, not the page ── */}
        <aside className="hidden md:flex flex-col w-72 xl:w-80 shrink-0 border-l border-ink-700 overflow-hidden">
          {/*
            p-4 on the outer aside then h-full on ChatPanel doesn't work because
            padding breaks the height calculation. Instead: no padding on aside,
            ChatPanel fills 100% and handles its own internal padding.
          */}
          <ChatPanel myId={mySocketId} playerName={playerName} />
        </aside>
      </div>

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
