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

                  {/* Movie + hint header */}
                  <div className="card-dark rounded-xl py-5 px-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-gold-700 text-xs uppercase tracking-widest mb-1">🎬 Spectating</p>
                        <p className="font-display font-bold text-2xl text-gold-300">
                          {gameConfig.movieName || '—'}
                        </p>
                        <p className="text-gold-700 text-sm font-body mt-1">
                          {nonHostPlayers.length === 0
                            ? 'No players yet'
                            : `${nonHostPlayers.filter(p => p.gameStatus === 'playing' || p.gameStatus === 'waiting').length} still playing · ${nonHostPlayers.filter(p => p.gameStatus === 'won').length} guessed · ${nonHostPlayers.filter(p => p.gameStatus === 'lost').length} out`}
                        </p>
                      </div>
                      {gameConfig.hint && (
                        <div className="text-right shrink-0">
                          <p className="text-gold-700 text-xs mb-1">Hints given</p>
                          <div className="flex gap-1 flex-wrap justify-end">
                            {gameConfig.hint.toUpperCase().split('').map((l, i) => (
                              <span key={i} className="font-mono font-bold text-gold-400 bg-ink-800 border border-gold-800 rounded px-2 py-0.5 text-sm">{l}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Answer blanks — host sees the full word */}
                    {gameConfig.movieName && (
                      <div className="bg-ink-900 rounded-lg px-4 py-3 flex flex-wrap gap-1 justify-center">
                        {gameConfig.movieName.split('').map((ch, i) => (
                          ch === ' '
                            ? <span key={i} className="w-4" />
                            : <span key={i} className="font-display font-bold text-gold-400 text-lg w-8 text-center border-b-2 border-gold-600">{ch}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Live player cards */}
                  {nonHostPlayers.length === 0 ? (
                    <div className="card-dark rounded-xl p-6 text-center">
                      <p className="text-gold-800 text-sm font-body italic">Waiting for players to join…</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {nonHostPlayers.map((p) => {
                        const lives  = p.livesLeft !== null ? p.livesLeft : 9;
                        const pct    = (lives / 9) * 100;
                        const status = p.gameStatus || 'waiting';

                        return (
                          <div key={p.id} className={`card-dark rounded-xl p-4 border transition-all duration-300 ${
                            status === 'won'  ? 'border-green-600'   :
                            status === 'lost' ? 'border-crimson-700' :
                            p.lastLetter      ? 'border-gold-700'    : 'border-ink-600'
                          }`}>
                            {/* Row 1: name + status + score */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">
                                  {status === 'won' ? '🏆' : status === 'lost' ? '💔' : status === 'playing' ? '🎯' : '⏳'}
                                </span>
                                <div>
                                  <p className="font-body font-semibold text-sm text-gold-300">{p.name}</p>
                                  <p className="text-gold-700 text-xs">
                                    {status === 'won'     && '✓ Guessed the movie!'}
                                    {status === 'lost'    && '✗ Ran out of lives'}
                                    {status === 'playing' && `${lives} / 9 lives remaining`}
                                    {status === 'waiting' && 'Game just started…'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-mono font-bold text-gold-400 text-lg">{p.score}</p>
                                <p className="text-gold-800 text-xs">pts</p>
                              </div>
                            </div>

                            {/* Row 2: player's current blanks (partial word) */}
                            {p.blanks && (
                              <div className="bg-ink-900 rounded-lg px-3 py-2 mb-3 flex flex-wrap gap-0.5 justify-center">
                                {p.blanks.map((ch, i) => (
                                  ch === ' '
                                    ? <span key={i} className="w-3" />
                                    : <span key={i} className={`font-display font-bold text-sm w-6 text-center border-b-2 transition-all duration-300
                                        ${ch !== '_'
                                          ? 'text-gold-400 border-gold-500'
                                          : 'text-transparent border-gold-800'}`}>
                                        {ch !== '_' ? ch : ''}
                                      </span>
                                ))}
                              </div>
                            )}

                            {/* Row 3: last guessed letter + BOLLYWOOD lives */}
                            <div className="flex items-center justify-between">
                              {/* Last guess indicator */}
                              <div className="flex items-center gap-2">
                                {p.lastLetter ? (
                                  <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 border ${
                                    p.lastLetterCorrect
                                      ? 'bg-green-950 border-green-700'
                                      : 'bg-crimson-950 border-crimson-800'
                                  }`}>
                                    <span className="font-mono font-bold text-lg text-gold-200">
                                      {p.lastLetter}
                                    </span>
                                    <span className={`text-sm font-bold ${p.lastLetterCorrect ? 'text-green-400' : 'text-crimson-400'}`}>
                                      {p.lastLetterCorrect ? '✓' : '✗'}
                                    </span>
                                    <span className={`text-xs ${p.lastLetterCorrect ? 'text-green-500' : 'text-crimson-500'}`}>
                                      {p.lastLetterCorrect ? 'correct' : 'wrong'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gold-800 text-xs italic">No guesses yet</span>
                                )}

                                {/* Wrong letters */}
                                {p.wrongLetters && p.wrongLetters.length > 0 && (
                                  <div className="flex gap-1 flex-wrap">
                                    {p.wrongLetters.map((l, i) => (
                                      <span key={i} className="font-mono text-xs text-crimson-600 line-through">{l}</span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* BOLLYWOOD lives */}
                              <div className="flex gap-0.5">
                                {'BOLLYWOOD'.split('').map((ch, i) => (
                                  <span key={i} className={`font-mono text-[10px] font-bold transition-all duration-300 ${
                                    i < lives ? 'text-crimson-400' : 'text-ink-600 line-through'
                                  }`}>{ch}</span>
                                ))}
                              </div>
                            </div>

                            {/* Row 4: progress bar */}
                            <div className="mt-3 w-full bg-ink-800 rounded-full h-1">
                              <div className={`h-1 rounded-full transition-all duration-500 ${
                                status === 'won' ? 'bg-green-500' : status === 'lost' ? 'bg-crimson-600' : 'bg-gold-600'
                              }`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* All players done — host can start next round */}
                  {nonHostPlayers.length > 0 &&
                    nonHostPlayers.every(p => p.gameStatus === 'won' || p.gameStatus === 'lost') && (
                    <div className="card-dark rounded-xl p-5 text-center space-y-3 border border-gold-800">
                      <p className="font-display font-bold text-xl text-gold-400">Round over! 🎉</p>
                      <div className="space-y-1">
                        {[...nonHostPlayers].sort((a,b) => b.score - a.score).map((p, i) => (
                          <div key={p.id} className="flex items-center justify-between px-3 py-1.5 bg-ink-700 rounded-lg">
                            <span className="text-sm">{['🥇','🥈','🥉'][i] || '  '}</span>
                            <span className="font-body text-gold-300 text-sm flex-1 text-left ml-2">{p.name}</span>
                            <span className={`text-xs mr-3 ${p.gameStatus === 'won' ? 'text-green-400' : 'text-crimson-500'}`}>
                              {p.gameStatus === 'won' ? 'Guessed!' : 'Did not guess'}
                            </span>
                            <span className="font-mono font-bold text-gold-500 text-sm">{p.score} pts</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => { setShowMovieSearch(true); setGameConfig(null); }}
                        className="btn-gold w-full py-3 mt-2"
                      >
                        🎬 Pick Next Movie
                      </button>
                    </div>
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
