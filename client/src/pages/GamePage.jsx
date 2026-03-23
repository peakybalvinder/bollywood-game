import React, { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../socket';
import PlayerList    from '../components/PlayerList';
import ChatPanel     from '../components/ChatPanel';
import LivesDisplay  from '../components/LivesDisplay';
import MovieBlanks   from '../components/MovieBlanks';
import Keyboard      from '../components/Keyboard';
import MovieSearchModal from '../components/MovieSearchModal';
import GameOverOverlay  from '../components/GameOverOverlay';
import MobileNav     from '../components/MobileNav';
import Footer        from '../components/Footer';
import useAntiCheat  from '../hooks/useAntiCheat';

export default function GamePage({ initialRoom, playerName, isHostOverride, onLeave, showToast }) {
  const [room]    = useState(initialRoom);
  const [hostId, setHostId]     = useState(initialRoom.hostId);
  // isHostOverride comes from App.jsx and is updated on rejoin — prevents
  // the false-negative where socket.id changes after reconnect
  const isHost = isHostOverride !== undefined ? isHostOverride : (socket.id === hostId);

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
  const [unreadChat, setUnreadChat]       = useState(0);
  const [showShare, setShowShare]         = useState(false);

  // Mobile tab state: 'game' | 'players' | 'chat'
  const [mobileTab, setMobileTab] = useState('game');

  const guessInfoTimeout = useRef(null);
  // Ref for mobileTab — lets the chat handler read current value without
  // being in the socket useEffect's dependency array (which would re-register all sockets)
  const mobileTabRef = useRef(mobileTab);
  useEffect(() => { mobileTabRef.current = mobileTab; }, [mobileTab]);
  const mySocketId = socket.id;
  const isPlaying  = game?.status === 'playing';
  const nonHostPlayers = players.filter(p => !p.isHost);

  // Anti-cheat — only active for non-host players during a live game
  useAntiCheat(!isHost && isPlaying);

  // Track unread chat when user is not on chat tab (mobile)
  const handleMobileTab = (tab) => {
    setMobileTab(tab);
    if (tab === 'chat') setUnreadChat(0);
  };

  // ── Restore state after reconnect ───────────────────────────────────────────
  // When socket reconnects, App.jsx calls rejoin_room and updates initialRoom via setRoomData.
  // But GamePage was already mounted with old initialRoom — we need to sync.
  useEffect(() => {
    // Re-sync hostId whenever initialRoom.hostId changes (updated by rejoin)
    setHostId(initialRoom.hostId);
    // Re-sync gameConfig if server says there's an active game
    if (initialRoom.game && !gameConfig) {
      setGameConfig(initialRoom.game);
    }
    // Re-sync players
    if (initialRoom.players) {
      setPlayers(initialRoom.players);
    }
  }, [initialRoom.hostId, initialRoom.game, initialRoom.players]);

  // ── Socket events ─────────────────────────────────────────────────────────
  useEffect(() => {
    socket.on('game_started', ({ players: ps, playerGame: pg, gameConfig: gc }) => {
      setGameConfig(gc || { hint: null, movieName: null });
      if (pg) setGame(pg);
      setPlayers(ps);
      setShowGameOver(false);
      setShowMovieSearch(false);
      setLastRevealed(new Set());
      setLastGuessInfo(null);
      if (socket.id !== hostId) showToast('Game started! Guess the movie 🎬', 'success');
      // Switch mobile to game tab on start
      setMobileTab('game');
    });

    socket.on('guess_result', ({ letter, correct, positions, playerGame }) => {
      setGame(playerGame);
      setLastRevealed(new Set(positions || []));
      clearTimeout(guessInfoTimeout.current);
      setLastGuessInfo({ letter, correct });
      guessInfoTimeout.current = setTimeout(() => setLastGuessInfo(null), 2500);
    });

    socket.on('players_progress', ({ players: ps }) => setPlayers(ps));

    socket.on('your_game_over', ({ playerGame, players: ps }) => {
      setGame(playerGame);
      setPlayers(ps);
      setShowGameOver(true);
    });

    socket.on('player_joined', ({ players: ps }) => setPlayers(ps));

    socket.on('player_rejoined', ({ playerName: pn, players: ps }) => {
      setPlayers(ps);
      // Only show toast to OTHER players, not to the person who reconnected
      // (they already know they came back — no need to announce it to themselves)
      if (pn !== playerName) {
        showToast(`${pn} reconnected 📱`, 'info', 2000);
      }
    });

    socket.on('player_left', ({ players: ps }) => {
      setPlayers(ps);
      showToast('A player left the party.', 'info');
    });

    socket.on('host_transferred', ({ newHostId, hadActiveGame, players: ps }) => {
      setHostId(newHostId);
      setPlayers(ps);
      if (newHostId === socket.id) {
        showToast('You are now the host! 🎬', 'success');
        setGame(null);
        // If no active game (or game was ended by transfer), open movie picker
        if (!hadActiveGame) {
          setGameConfig(null);
          setShowMovieSearch(true);
        }
        // If hadActiveGame, round_ended will fire separately and reset state
      } else if (socket.id === hostId) {
        showToast('Host role transferred. You are now a player.', 'info');
      }
    });

    // Round ended by host transfer — new host gets movie picker automatically
    socket.on('round_ended', ({ movieName, reason, players: ps }) => {
      setGame(null);
      setGameConfig(null);
      setLastRevealed(new Set());
      setLastGuessInfo(null);
      setShowGameOver(false);
      setPlayers(ps);
      showToast('Round ended — new host can pick the next movie 🎬', 'info', 4000);
    });

    // Anti-cheat notifications (host only)
    socket.on('player_tab_hidden', ({ playerName: pn, count }) => {
      showToast(`⚠️ ${pn} switched tabs (×${count})`, 'error', 4000);
    });

    socket.on('player_focus_lost', ({ playerName: pn, count }) => {
      if (count === 1 || count % 3 === 0) {
        showToast(`👀 ${pn} left the window (×${count})`, 'info', 3000);
      }
    });

    // Session taken over in another tab
    socket.on('session_takeover', ({ message }) => {
      showToast(message, 'error', 6000);
      onLeave();
    });

    // Track unread chat on mobile using ref — avoids stale closure without re-registering
    function onChatUnread() {
      if (mobileTabRef.current !== 'chat') setUnreadChat(n => n + 1);
    }
    socket.on('chat_message', onChatUnread);

    return () => {
      socket.off('game_started');
      socket.off('guess_result');
      socket.off('players_progress');
      socket.off('your_game_over');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('player_rejoined');
      socket.off('host_transferred');
      socket.off('round_ended');
      socket.off('player_tab_hidden');
      socket.off('player_focus_lost');
      socket.off('session_takeover');
      socket.off('chat_message', onChatUnread);
    };
  }, [showToast, hostId, onLeave]); // mobileTab intentionally excluded — handled via ref

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

  const roomLink = `${window.location.origin}?room=${room.id}`;

  async function handleShare() {
    // Use native Web Share API on iOS/Android — gives proper share sheet
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my FilmiPaheli game!',
          text: `Join my Bollywood movie guessing game! Room code: ${room.id}`,
          url: roomLink,
        });
        return;
      } catch (e) {
        // User dismissed share sheet — no action needed
        if (e.name === 'AbortError') return;
      }
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(roomLink);
      showToast('Link copied to clipboard! 🎟', 'success');
    } catch {
      setShowShare(true); // Show manual copy modal as last resort
    }
  }

  function copyRoomCode() {
    navigator.clipboard.writeText(room.id).then(
      () => showToast('Room code copied! 🎟', 'success'),
      () => {}
    );
  }

  const totalLetters    = game ? game.blanks.filter(c => c !== ' ').length : 0;
  const revealedLetters = game ? game.blanks.filter(c => c !== '_' && c !== ' ').length : 0;

  const playerListProps = {
    players, myId: mySocketId, hostId, roomName: room.name, roomId: room.id,
    isHost, onTransferHost: handleTransferHost, gameActive: !!gameConfig,
  };

  return (
    <div className="bg-cinema h-screen overflow-hidden flex flex-col">

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-3 md:px-6 py-2.5 border-b border-ink-700 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎬</span>
          <span className="font-display font-bold text-gold-400 text-base hidden sm:block">FilmiPaheli</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Room code chip — tap to open share options */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 font-mono text-gold-500 bg-ink-700 border border-ink-600 rounded-lg px-2.5 py-1.5 text-xs tracking-widest hover:border-gold-700 active:scale-95 transition-all"
            title="Share room"
          >
            <span>📤</span>
            <span>{room.id}</span>
          </button>
          <button
            onClick={() => { if (window.confirm('Leave? Host leaving ends the game for everyone.')) onLeave(); }}
            className="btn-ghost text-xs px-2.5 py-1.5"
          >
            Leave
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* Left sidebar — desktop only */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 border-r border-ink-700 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            <PlayerList {...playerListProps} />
          </div>
        </aside>

        {/* Center — game board */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Desktop: always visible. Mobile: only when mobileTab === 'game' */}
          <div className={`flex-1 min-h-0 overflow-y-auto ${mobileTab !== 'game' ? 'hidden md:block' : ''}`}>
            <div className="flex flex-col items-center px-4 pt-5 pb-24 md:pb-6 gap-4 w-full max-w-2xl mx-auto">

              {/* Waiting — non-host */}
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

              {/* Waiting — host */}
              {isHost && !gameConfig && (
                <div className="text-center mt-12 animate-fade-in">
                  <div className="text-5xl mb-4">🎬</div>
                  <h2 className="font-display font-bold text-2xl text-gold-400 mb-2">
                    {nonHostPlayers.length === 0 ? 'Waiting for players…' : 'Ready to start!'}
                  </h2>
                  <p className="text-gold-700 text-sm font-body mb-6">
                    {nonHostPlayers.length === 0
                      ? 'Share the room code with friends.'
                      : `${nonHostPlayers.length} player${nonHostPlayers.length > 1 ? 's' : ''} joined. Pick a movie!`}
                  </p>
                  {nonHostPlayers.length > 0 && (
                    <button onClick={() => setShowMovieSearch(true)} className="btn-gold px-8 py-3">
                      🎞 Pick a Movie
                    </button>
                  )}
                </div>
              )}

              {/* Host spectator */}
              {isHost && gameConfig && (
                <div className="w-full animate-fade-in space-y-4">
                  <div className="card-dark rounded-xl py-5 px-5 flex items-start gap-4">
                    <span className="text-3xl shrink-0">🎬</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-xl text-gold-400 truncate">
                        {gameConfig.movieName}
                      </p>
                      <p className="text-gold-700 text-sm font-body mt-1">
                        {nonHostPlayers.filter(p => p.gameStatus === 'playing' || !p.gameStatus).length} playing ·{' '}
                        {nonHostPlayers.filter(p => p.gameStatus === 'won').length} guessed ·{' '}
                        {nonHostPlayers.filter(p => p.gameStatus === 'lost').length} out
                      </p>
                    </div>
                    {gameConfig.hint && (
                      <div className="shrink-0 text-right">
                        <p className="text-gold-700 text-xs mb-1">Hints</p>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {gameConfig.hint.toUpperCase().split('').map((l, i) => (
                            <span key={i} className="font-mono font-bold text-gold-400 bg-ink-800 border border-gold-800 rounded px-1.5 py-0.5 text-xs">{l}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Player cards */}
                  {nonHostPlayers.length === 0 ? (
                    <div className="card-dark rounded-xl p-6 text-center">
                      <p className="text-gold-800 text-sm font-body italic">No players yet…</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {nonHostPlayers.map((p) => {
                        const lives  = p.livesLeft !== null ? p.livesLeft : 9;
                        const pct    = (lives / 9) * 100;
                        const status = p.gameStatus || 'waiting';
                        return (
                          <div key={p.id} className={`card-dark rounded-xl p-4 border transition-all duration-300 ${
                            status === 'won' ? 'border-green-600' : status === 'lost' ? 'border-crimson-700' :
                            p.tabHidden ? 'border-amber-600' : p.lastLetter ? 'border-gold-700' : 'border-ink-600'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{status === 'won' ? '🏆' : status === 'lost' ? '💔' : p.tabHidden ? '👁️' : '🎯'}</span>
                                <div>
                                  <p className="font-body font-semibold text-sm text-gold-300">{p.name}</p>
                                  <p className="text-xs text-gold-700">
                                    {status === 'won' && '✓ Guessed!'}
                                    {status === 'lost' && '✗ Out of lives'}
                                    {status === 'playing' && `${lives}/9 lives`}
                                    {status === 'waiting' && 'Just started'}
                                    {p.tabHidden && <span className="text-amber-400 ml-1">⚠ Tab hidden ({p.tabHiddenCount}×)</span>}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-mono font-bold text-gold-400 text-base">{p.score}</p>
                                <p className="text-gold-800 text-xs">pts</p>
                              </div>
                            </div>

                            {/* Blanks */}
                            {p.blanks && (
                              <div className="bg-ink-900 rounded-lg px-3 py-2 mb-2 flex flex-wrap gap-0.5 justify-center">
                                {p.blanks.map((ch, i) => (
                                  ch === ' ' ? <span key={i} className="w-3" /> :
                                  <span key={i} className={`font-display font-bold text-sm w-6 text-center border-b-2 transition-all duration-300 ${ch !== '_' ? 'text-gold-400 border-gold-500' : 'text-transparent border-gold-800'}`}>
                                    {ch !== '_' ? ch : ''}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {p.lastLetter ? (
                                  <div className={`flex items-center gap-1 rounded-lg px-2 py-1 border text-xs ${p.lastLetterCorrect ? 'bg-green-950 border-green-700' : 'bg-crimson-950 border-crimson-800'}`}>
                                    <span className="font-mono font-bold text-gold-200">{p.lastLetter}</span>
                                    <span className={p.lastLetterCorrect ? 'text-green-400' : 'text-crimson-400'}>{p.lastLetterCorrect ? '✓' : '✗'}</span>
                                  </div>
                                ) : <span className="text-gold-800 text-xs italic">No guesses</span>}
                                {p.wrongLetters?.length > 0 && (
                                  <div className="flex gap-0.5 flex-wrap">
                                    {p.wrongLetters.map((l, i) => <span key={i} className="font-mono text-[10px] text-crimson-600 line-through">{l}</span>)}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-0.5">
                                {'BOLLYWOOD'.split('').map((ch, i) => (
                                  <span key={i} className={`font-mono text-[10px] font-bold ${i < lives ? 'text-crimson-400' : 'text-ink-600 line-through'}`}>{ch}</span>
                                ))}
                              </div>
                            </div>

                            <div className="mt-2 w-full bg-ink-800 rounded-full h-1">
                              <div className={`h-1 rounded-full transition-all duration-500 ${status === 'won' ? 'bg-green-500' : status === 'lost' ? 'bg-crimson-600' : 'bg-gold-600'}`}
                                style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* All done */}
                  {nonHostPlayers.length > 0 && nonHostPlayers.every(p => p.gameStatus === 'won' || p.gameStatus === 'lost') && (
                    <div className="card-dark rounded-xl p-5 text-center space-y-3 border border-gold-800">
                      <p className="font-display font-bold text-xl text-gold-400">Round Over! 🎉</p>
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
                      <button onClick={() => { setShowMovieSearch(true); setGameConfig(null); }} className="btn-gold w-full py-3">
                        🎬 Pick Next Movie
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Player game board */}
              {!isHost && game && (
                <div className="w-full flex flex-col gap-4 animate-fade-in">
                  {game.hint && (
                    <div className="text-center text-gold-700 text-sm font-body">
                      Hint:{' '}
                      {game.hint.toUpperCase().split('').map((l, i) => (
                        <span key={i} className="font-mono font-bold text-gold-400 bg-ink-700 border border-gold-800 rounded px-1.5 py-0.5 text-sm mx-0.5">{l}</span>
                      ))}
                      {' '}pre-revealed.
                    </div>
                  )}

                  <div className="py-1"><MovieBlanks blanks={game.blanks} lastRevealed={lastRevealed} /></div>

                  {lastGuessInfo && (
                    <div className={`text-center text-sm font-body animate-fade-in ${lastGuessInfo.correct ? 'text-green-400' : 'text-crimson-400'}`}>
                      <span className="font-mono font-bold">{lastGuessInfo.letter}</span>
                      {lastGuessInfo.correct ? ' ✓ — Correct!' : ' ✗ — Wrong!'}
                    </div>
                  )}

                  <div className="card-dark rounded-xl py-3 px-4">
                    <LivesDisplay livesLeft={game.livesLeft} wrongLetters={game.wrongLetters} />
                  </div>

                  <div className="space-y-1">
                    <div className="w-full bg-ink-700 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-crimson-600 to-gold-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${totalLetters ? (revealedLetters / totalLetters) * 100 : 0}%` }} />
                    </div>
                    <p className="text-center text-gold-800 text-xs font-body">{revealedLetters} / {totalLetters} letters revealed</p>
                  </div>

                  {/* Other players mini progress */}
                  {nonHostPlayers.filter(p => p.id !== mySocketId).length > 0 && (
                    <div className="card-dark rounded-xl p-3">
                      <p className="text-gold-700 text-xs uppercase tracking-widest mb-2">Other Players</p>
                      <div className="space-y-1.5">
                        {nonHostPlayers.filter(p => p.id !== mySocketId).map((p) => {
                          const lives = p.livesLeft !== null ? p.livesLeft : 9;
                          const status = p.gameStatus || 'waiting';
                          return (
                            <div key={p.id} className="flex items-center gap-2">
                              <span className="text-xs w-4">{status === 'won' ? '🏆' : status === 'lost' ? '💔' : '🎯'}</span>
                              <span className="font-body text-xs text-gold-400 flex-1 truncate">{p.name}</span>
                              <div className="flex gap-0.5">
                                {'BOLLYWOOD'.split('').map((ch, i) => (
                                  <span key={i} className={`font-mono text-[8px] font-bold ${i < lives ? 'text-crimson-400' : 'text-ink-600 line-through'}`}>{ch}</span>
                                ))}
                              </div>
                              <span className="font-mono text-[10px] text-gold-600 shrink-0">{p.score}pts</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Desktop keyboard */}
                  <div className="hidden md:block card-dark rounded-xl py-4 px-4">
                    <Keyboard guessedLetters={game.guessedLetters} wrongLetters={game.wrongLetters} onGuess={handleGuess} disabled={!isPlaying || guessing} />
                  </div>
                </div>
              )}

              {/* Mobile: players panel */}
              <div className="lg:hidden w-full mt-2">
                <PlayerList {...playerListProps} />
              </div>
            </div>
          </div>

          {/* Mobile: players tab */}
          {mobileTab === 'players' && (
            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:hidden">
              <PlayerList {...playerListProps} />
            </div>
          )}

          {/* Mobile: chat tab */}
          {mobileTab === 'chat' && (
            <div className="flex-1 min-h-0 overflow-hidden md:hidden">
              <ChatPanel myId={mySocketId} playerName={playerName} />
            </div>
          )}

          {/* Mobile sticky keyboard — only on game tab */}
          {!isHost && game && mobileTab === 'game' && (
            <div className="md:hidden shrink-0 bg-ink-900 border-t border-ink-700 px-2 py-2 shadow-2xl">
              <Keyboard guessedLetters={game.guessedLetters} wrongLetters={game.wrongLetters} onGuess={handleGuess} disabled={!isPlaying || guessing} compact />
            </div>
          )}

          {/* Mobile nav bottom spacer */}
          <div className="md:hidden h-16 shrink-0" />
        </main>

        {/* Right: Chat — desktop only */}
        <aside className="hidden md:flex flex-col w-72 xl:w-80 shrink-0 border-l border-ink-700 overflow-hidden">
          <ChatPanel myId={mySocketId} playerName={playerName} />
        </aside>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav activeTab={mobileTab} onTabChange={handleMobileTab} unreadChat={unreadChat} />

      {/* Footer — desktop only to save mobile space */}
      <div className="hidden md:block shrink-0">
        <Footer />
      </div>

      {/* Modals */}
      {showMovieSearch && isHost && (
        <MovieSearchModal onSelectMovie={handleMovieSelected} onClose={() => setShowMovieSearch(false)} />
      )}
      {showGameOver && (
        <GameOverOverlay game={game} players={players} isHost={isHost} onPlayAgain={handlePlayAgain} />
      )}

      {/* ── Share modal (fallback when Web Share API unavailable) ── */}
      {showShare && (
        <div className="modal-backdrop" onClick={() => setShowShare(false)}>
          <div className="card-dark rounded-2xl p-6 w-full max-w-sm animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-xl text-gold-400 mb-4 text-center">
              📤 Invite Friends
            </h3>

            {/* Room code — big and tappable */}
            <div className="bg-ink-900 rounded-xl p-4 text-center mb-4 border border-ink-700">
              <p className="text-gold-700 text-xs uppercase tracking-widest mb-2">Room Code</p>
              <button
                onClick={copyRoomCode}
                className="font-mono font-black text-4xl text-gold-400 tracking-[0.2em] hover:text-gold-300 active:scale-95 transition-all"
              >
                {room.id}
              </button>
              <p className="text-gold-800 text-xs mt-2">Tap to copy code</p>
            </div>

            {/* Link copy */}
            <div className="bg-ink-900 rounded-xl p-3 mb-4 border border-ink-700 flex items-center gap-2">
              <p className="text-gold-700 text-xs font-mono flex-1 truncate">{roomLink}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(roomLink).then(() => {
                    showToast('Link copied! 🎟', 'success');
                    setShowShare(false);
                  });
                }}
                className="btn-gold text-xs px-3 py-1.5 shrink-0"
              >
                Copy
              </button>
            </div>

            {/* WhatsApp direct share */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Join my FilmiPaheli game! 🎬
Room code: ${room.id}
${roomLink}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-green-800 hover:bg-green-700 border border-green-600 text-green-200 rounded-xl py-3 font-body font-semibold text-sm transition-colors mb-3"
              onClick={() => setShowShare(false)}
            >
              <span className="text-xl">💬</span>
              Share via WhatsApp
            </a>

            <button onClick={() => setShowShare(false)} className="btn-ghost w-full py-2.5 text-sm">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
