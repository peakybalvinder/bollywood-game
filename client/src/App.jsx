import React, { useState, useEffect, useCallback } from 'react';
import socket, { SOCKET_URL } from './socket';
import Dashboard from './components/Dashboard';
import CreatePartyModal from './components/CreatePartyModal';
import JoinPartyModal from './components/JoinPartyModal';
import GamePage from './pages/GamePage';
import Toast from './components/Toast';
import useSingleSession from './hooks/useSingleSession';
import FAQ                from './pages/FAQ';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy      from './pages/PrivacyPolicy';
import Disclaimer         from './pages/Disclaimer';

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

  // ── Hash-based routing for legal pages ───────────────────────────────────
  const [legalPage, setLegalPage] = useState(() => {
    const h = window.location.hash;
    if (h === '#faq')        return 'faq';
    if (h === '#terms')      return 'terms';
    if (h === '#privacy')    return 'privacy';
    if (h === '#disclaimer') return 'disclaimer';
    return null;
  });

  useEffect(() => {
    function onHashChange() {
      const h = window.location.hash;
      if (h === '#faq')        setLegalPage('faq');
      else if (h === '#terms')      setLegalPage('terms');
      else if (h === '#privacy')    setLegalPage('privacy');
      else if (h === '#disclaimer') setLegalPage('disclaimer');
      else setLegalPage(null);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  function goBack() {
    window.location.hash = '';
    setLegalPage(null);
  }

  // Single session guard — if user opens another tab, warn them
  useSingleSession(useCallback(() => {
    showToast('FilmiPaheli opened in another tab. Please use only one tab.', 'error', 8000);
  }, []));

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    setToast({ message, type });
    const t = setTimeout(() => setToast(null), duration);
    return () => clearTimeout(t);
  }, []);

  // Auto-join from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code && code.length === 6) {
      setAutoJoinCode(code.toUpperCase());
      setShowJoin(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Socket lifecycle
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('[FilmiPaheli] ✅ Connected! ID:', socket.id, '| URL:', SOCKET_URL);
      setConnected(true);
      setConnError(false);
      setConnAttempts(0);
    });

    socket.on('disconnect', (reason) => {
      console.log('[FilmiPaheli] Disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[FilmiPaheli] ❌ Connection error:', err.message, '| URL:', SOCKET_URL);
      setConnError(true);
      setConnected(false);
      setConnAttempts(n => n + 1);
    });

    socket.on('reconnect', (attempt) => {
      console.log('[FilmiPaheli] ✅ Reconnected after', attempt, 'attempts');
      setConnected(true);
      setConnError(false);
      showToast('Reconnected!', 'success', 2000);
    });

    socket.on('host_left', ({ message }) => {
      showToast(message, 'error', 5000);
      setView('dashboard');
      setRoomData(null);
    });

    socket.on('inactivity_kick', ({ message }) => {
      showToast(message || 'Removed due to inactivity.', 'error', 5000);
      setView('dashboard');
      setRoomData(null);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('reconnect');
      socket.off('host_left');
      socket.off('inactivity_kick');
      socket.disconnect();
    };
  }, [showToast]);

  useEffect(() => {
    if (view !== 'game') return;
    const id = setInterval(() => socket.emit('activity_ping'), 60_000);
    return () => clearInterval(id);
  }, [view]);

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

  function handleCloseJoin() {
    setShowJoin(false);
    setAutoJoinCode(null);
  }

  // ── Connection error screen ──────────────────────────────────────────────
  if (connError && !connected && connAttempts >= 3) {
    return (
      <div className="bg-cinema min-h-screen flex items-center justify-center px-4">
        {toast && <Toast type={toast.type} message={toast.message} />}
        <div className="card-dark rounded-2xl p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-4">🔌</div>
          <h2 className="font-display font-bold text-2xl text-crimson-400 mb-3">
            Cannot reach server
          </h2>
          <p className="text-gold-700 text-sm font-body mb-5">
            FilmiPaheli cannot connect to the game server.
          </p>

          <div className="bg-ink-900 rounded-lg px-4 py-3 mb-4 text-left">
            <p className="text-gold-700 text-xs uppercase tracking-widest mb-1">Server URL being used</p>
            <p className="font-mono text-gold-400 text-xs break-all">{SOCKET_URL}</p>
          </div>

          <div className="bg-ink-900 rounded-lg px-4 py-3 mb-6 text-left text-xs text-gold-700 font-body space-y-1">
            <p className="font-semibold text-gold-500 mb-2">Common causes:</p>
            <p>1. Server is sleeping (Railway free tier) — wait 30s and retry</p>
            <p>2. <span className="font-mono text-gold-400">VITE_SERVER_URL</span> in Railway client variables is pointing to the wrong/disabled server URL</p>
            <p>3. Client was not redeployed after changing <span className="font-mono text-gold-400">VITE_SERVER_URL</span></p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setConnError(false);
                setConnAttempts(0);
                socket.connect();
              }}
              className="btn-gold flex-1 py-3"
            >
              🔄 Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-ghost flex-1 py-3"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render legal pages ────────────────────────────────────────────────────
  if (legalPage === 'faq')        return <FAQ onBack={goBack} />;
  if (legalPage === 'terms')      return <TermsAndConditions onBack={goBack} />;
  if (legalPage === 'privacy')    return <PrivacyPolicy onBack={goBack} />;
  if (legalPage === 'disclaimer') return <Disclaimer onBack={goBack} />;

  return (
    <div className="bg-cinema min-h-screen">
      {toast && <Toast type={toast.type} message={toast.message} />}

      {/* Thin connecting banner — disappears once connected */}
      {!connected && !connError && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-ink-700 border-b border-gold-800 text-gold-400 text-xs text-center py-1.5 font-body flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse inline-block" />
          Connecting to server…
        </div>
      )}

      {view === 'dashboard' && (
        <>
          <Dashboard
            onCreateParty={() => setShowCreate(true)}
            onJoinParty={() => setShowJoin(true)}
          />
          {showCreate && (
            <CreatePartyModal
              onClose={() => setShowCreate(false)}
              onRoomReady={handleRoomReady}
              showToast={showToast}
              isConnected={connected}
            />
          )}
          {showJoin && (
            <JoinPartyModal
              onClose={handleCloseJoin}
              onRoomReady={handleRoomReady}
              showToast={showToast}
              initialCode={autoJoinCode}
              isConnected={connected}
            />
          )}
        </>
      )}

      {view === 'game' && roomData && (
        <GamePage
          initialRoom={roomData.room}
          playerName={roomData.playerName}
          isHost={roomData.isHost}
          onLeave={handleLeaveGame}
          showToast={showToast}
        />
      )}
    </div>
  );
}
