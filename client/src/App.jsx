import React, { useState, useEffect, useCallback, useRef } from 'react';
import socket from './socket';
import { navigate, getPath, setPageMeta } from './router';
import Dashboard         from './components/Dashboard';
import CreatePartyModal  from './components/CreatePartyModal';
import JoinPartyModal    from './components/JoinPartyModal';
import GamePage          from './pages/GamePage';
import Toast             from './components/Toast';
import useSingleSession, { reclaimTab } from './hooks/useSingleSession';
import FAQ               from './pages/FAQ';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy     from './pages/PrivacyPolicy';
import Disclaimer        from './pages/Disclaimer';
import HowToPlay         from './pages/HowToPlay';
import DailyChallenge    from './pages/DailyChallenge';
import VsComputer        from './pages/VsComputer';
import Blog              from './pages/Blog';
import BlogPost          from './pages/BlogPost';

// ── Path → component mapping ──────────────────────────────────────────────────
function resolvePage(path) {
  if (path === '/faq')          return 'faq';
  if (path === '/how-to-play')  return 'howtoplay';
  if (path === '/terms')        return 'terms';
  if (path === '/privacy')      return 'privacy';
  if (path === '/disclaimer')   return 'disclaimer';
  if (path === '/daily')        return 'daily';
  if (path === '/vs-computer')  return 'vscomputer';
  if (path === '/blog')         return 'blog';
  if (path.startsWith('/blog/')) return 'blogpost';
  return null; // dashboard
}

export default function App() {
  const [view, setView]               = useState('dashboard');
  const [showCreate, setShowCreate]   = useState(false);
  const [showJoin, setShowJoin]       = useState(false);
  const [autoJoinCode, setAutoJoinCode] = useState(null);
  const [roomData, setRoomData]       = useState(null);
  const [toast, setToast]             = useState(null);
  const [connected, setConnected]     = useState(false);
  const [connError, setConnError]     = useState(false);
  const [connAttempts, setConnAttempts] = useState(0);
  const [tabBlocked, setTabBlocked]   = useState(false);
  const roomDataRef = useRef(null);
  useEffect(() => { roomDataRef.current = roomData; }, [roomData]);

  // ── Path-based routing ────────────────────────────────────────────────────
  const [currentPath, setCurrentPath] = useState(getPath);

  useEffect(() => {
    function onPop() { setCurrentPath(getPath()); }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const page = resolvePage(currentPath);

  function goHome() {
    navigate('/');
    setCurrentPath('/');
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    setToast({ message, type });
    const t = setTimeout(() => setToast(null), duration);
    return () => clearTimeout(t);
  }, []);

  // ── Single tab enforcement ────────────────────────────────────────────────
  useSingleSession(useCallback(() => { setTabBlocked(true); }, []));

  // ── URL auto-join ─────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code && code.length === 6) {
      setAutoJoinCode(code.toUpperCase());
      setShowJoin(true);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // ── Socket lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('[FilmiPaheli] Connected:', socket.id);
      setConnected(true);
      setConnError(false);
      setConnAttempts(0);
    });

    socket.on('disconnect', (reason) => {
      console.log('[FilmiPaheli] Disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[FilmiPaheli] Connection error:', err.message);
      setConnError(true);
      setConnected(false);
      setConnAttempts(n => n + 1);
    });

    socket.io.on('reconnect', () => {
      setConnected(true);
      setConnError(false);
      const rd = roomDataRef.current;
      if (rd?.room?.id && rd?.playerName) {
        const sessionKey = `${rd.room.id}:${rd.playerName.toLowerCase()}`;
        socket.emit('rejoin_room',
          { roomId: rd.room.id, playerName: rd.playerName, sessionKey },
          ({ success, room: updatedRoom }) => {
            if (success && updatedRoom) {
              setRoomData(prev => prev ? {
                ...prev,
                room: updatedRoom,
                isHost: updatedRoom.hostId === socket.id,
              } : prev);
            } else {
              showToast('Reconnected, but the party ended while you were away.', 'info', 4000);
              setView('dashboard');
              setRoomData(null);
            }
          }
        );
      } else {
        showToast('Reconnected! 🎬', 'success', 2000);
      }
    });

    socket.on('host_left', ({ message }) => {
      showToast(message, 'error', 5000);
      setView('dashboard');
      setRoomData(null);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.io.off('reconnect');
      socket.off('host_left');
      socket.disconnect();
    };
  }, [showToast]);

  function handleRoomReady(data) {
    setRoomData(data);
    setView('game');
    setShowCreate(false);
    setShowJoin(false);
    setAutoJoinCode(null);
  }

  function handleLeaveGame() {
    socket.disconnect();
    socket.connect();
    setView('dashboard');
    setRoomData(null);
  }

  // ── Tab blocked screen ────────────────────────────────────────────────────
  if (tabBlocked) {
    return (
      <div className="bg-cinema min-h-screen flex items-center justify-center px-4">
        <div className="card-dark rounded-2xl p-8 w-full max-w-sm text-center space-y-4">
          <div className="text-5xl">🎬</div>
          <h2 className="font-display font-bold text-2xl text-gold-400">FilmiPaheli is open in another tab</h2>
          <p className="text-gold-700 text-sm font-body leading-relaxed">
            Only one tab can run FilmiPaheli at a time. Please close this tab and use the other one.
          </p>
          <div className="pt-2 space-y-2">
            <button onClick={() => window.close()} className="btn-gold w-full py-3">Close This Tab</button>
            <button onClick={() => { reclaimTab(); setTabBlocked(false); }} className="btn-ghost w-full py-2 text-xs">
              Use This Tab Instead
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Connection error screen ───────────────────────────────────────────────
  if (connError && !connected && connAttempts >= 3) {
    return (
      <div className="bg-cinema min-h-screen flex items-center justify-center px-4">
        {toast && <Toast type={toast.type} message={toast.message} />}
        <div className="card-dark rounded-2xl p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-4">🔌</div>
          <h2 className="font-display font-bold text-2xl text-crimson-400 mb-3">Unable to Connect</h2>
          <p className="text-gold-700 text-sm font-body mb-6 leading-relaxed">
            FilmiPaheli is having trouble reaching the game server. This is usually temporary. Please check your internet connection and try again.
          </p>
          <div className="flex gap-3">
            <button onClick={() => { setConnError(false); setConnAttempts(0); socket.connect(); }} className="btn-gold flex-1 py-3">🔄 Try Again</button>
            <button onClick={() => window.location.reload()} className="btn-ghost flex-1 py-3">Reload Page</button>
          </div>
          <p className="text-gold-800 text-xs mt-4 font-body">If the problem persists, the server may be restarting. Please wait a moment and try again.</p>
        </div>
      </div>
    );
  }

  // ── Path-routed pages (no socket needed) ─────────────────────────────────
  if (page === 'faq')        return <FAQ onBack={goHome} />;
  if (page === 'howtoplay')  return <HowToPlay onBack={goHome} />;
  if (page === 'terms')      return <TermsAndConditions onBack={goHome} />;
  if (page === 'privacy')    return <PrivacyPolicy onBack={goHome} />;
  if (page === 'disclaimer') return <Disclaimer onBack={goHome} />;
  if (page === 'daily')      return <DailyChallenge onBack={goHome} />;
  if (page === 'vscomputer') return <VsComputer onBack={goHome} />;
  if (page === 'blog')       return <Blog onBack={goHome} />;
  if (page === 'blogpost') {
    const slug = currentPath.replace('/blog/', '');
    return <BlogPost slug={slug} onBack={goHome} />;
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  return (
    <div className="bg-cinema min-h-screen">
      {toast && <Toast type={toast.type} message={toast.message} />}

      {!connected && !connError && connAttempts > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-ink-700 border-b border-gold-800 text-gold-400 text-xs text-center py-1.5 font-body flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse inline-block" />
          Reconnecting…
        </div>
      )}

      {view === 'dashboard' && (
        <>
          <Dashboard
            onCreateParty={() => setShowCreate(true)}
            onJoinParty={() => setShowJoin(true)}
            onDailyChallenge={() => navigate('/daily')}
            onVsComputer={() => navigate('/vs-computer')}
            onBlog={() => navigate('/blog')}
          />
          {showCreate && (
            <CreatePartyModal onClose={() => setShowCreate(false)} onRoomReady={handleRoomReady} showToast={showToast} isConnected={connected} />
          )}
          {showJoin && (
            <JoinPartyModal onClose={() => { setShowJoin(false); setAutoJoinCode(null); }} onRoomReady={handleRoomReady} showToast={showToast} initialCode={autoJoinCode} isConnected={connected} />
          )}
        </>
      )}

      {view === 'game' && roomData && (
        <GamePage
          initialRoom={roomData.room}
          playerName={roomData.playerName}
          isHostOverride={roomData.isHost}
          onLeave={handleLeaveGame}
          showToast={showToast}
        />
      )}
    </div>
  );
}
