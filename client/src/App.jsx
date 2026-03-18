import React, { useState, useEffect, useCallback } from 'react';
import socket from './socket';
import Dashboard from './components/Dashboard';
import CreatePartyModal from './components/CreatePartyModal';
import JoinPartyModal from './components/JoinPartyModal';
import GamePage from './pages/GamePage';
import Toast from './components/Toast';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [autoJoinCode, setAutoJoinCode] = useState(null); // room code from URL
  const [roomData, setRoomData] = useState(null);
  const [toast, setToast] = useState(null);

  // ── Toast helper ──────────────────────────────────────────────────────
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
      // Clean the URL so it doesn't re-trigger on refresh confusion
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // ── Socket lifecycle ──────────────────────────────────────────────────
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => console.log('[socket] connected:', socket.id));
    socket.on('disconnect', (reason) => console.log('[socket] disconnected:', reason));

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
      socket.off('host_left');
      socket.off('inactivity_kick');
      socket.disconnect();
    };
  }, [showToast]);

  // ── Activity ping every 60s ───────────────────────────────────────────
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
            />
          )}
          {showJoin && (
            <JoinPartyModal
              onClose={handleCloseJoin}
              onRoomReady={handleRoomReady}
              showToast={showToast}
              initialCode={autoJoinCode}
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
