import React, { useState, useEffect, useCallback } from 'react';
import socket from './socket';
import Dashboard from './components/Dashboard';
import CreatePartyModal from './components/CreatePartyModal';
import JoinPartyModal from './components/JoinPartyModal';
import GamePage from './pages/GamePage';
import Toast from './components/Toast';

export default function App() {
  const [view, setView]             = useState('dashboard');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin]     = useState(false);
  const [autoJoinCode, setAutoJoinCode] = useState(null);
  const [roomData, setRoomData]     = useState(null);
  const [toast, setToast]           = useState(null);
  const [connected, setConnected]   = useState(false);
  const [connecting, setConnecting] = useState(true);

  // ── Toast ─────────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    setToast({ message, type });
    const t = setTimeout(() => setToast(null), duration);
    return () => clearTimeout(t);
  }, []);

  // ── Auto-join from URL ?room=XXXXXX ───────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code && code.length === 6) {
      setAutoJoinCode(code.toUpperCase());
      setShowJoin(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // ── Socket lifecycle ──────────────────────────────────────────────────
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setConnected(true);
      setConnecting(false);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', () => {
      setConnecting(false);
      setConnected(false);
    });

    // Reconnecting — show subtle status
    socket.on('reconnecting', () => {
      setConnecting(true);
    });

    socket.on('reconnect', () => {
      setConnected(true);
      setConnecting(false);
      showToast('Reconnected!', 'success', 2000);
    });

    socket.on('reconnect_failed', () => {
      setConnecting(false);
      showToast('Connection failed. Please refresh the page.', 'error', 0);
    });

    socket.on('host_left', ({ message }) => {
      showToast(message, 'error', 5000);
      setView('dashboard');
      setRoomData(null);
    });

    socket.on('inactivity_kick', ({ message }) => {
      showToast(message || 'You were removed due to inactivity.', 'error', 5000);
      setView('dashboard');
      setRoomData(null);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('reconnecting');
      socket.off('reconnect');
      socket.off('reconnect_failed');
      socket.off('host_left');
      socket.off('inactivity_kick');
      socket.disconnect();
    };
  }, [showToast]);

  // ── Activity ping ─────────────────────────────────────────────────────
  useEffect(() => {
    if (view !== 'game') return;
    const id = setInterval(() => socket.emit('activity_ping'), 60_000);
    return () => clearInterval(id);
  }, [view]);

  // ── Handlers ─────────────────────────────────────────────────────────
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

  return (
    <div className="bg-cinema min-h-screen">
      {toast && <Toast type={toast.type} message={toast.message} />}

      {/* Connection status bar — shows only when reconnecting */}
      {!connected && !connecting && view !== 'dashboard' && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-crimson-800 border-b border-crimson-600 text-red-200 text-xs text-center py-1.5 font-body">
          ⚠️ Disconnected — trying to reconnect…
        </div>
      )}
      {connecting && !connected && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-ink-700 border-b border-gold-800 text-gold-400 text-xs text-center py-1.5 font-body">
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
