import React, { useState, useEffect, useCallback } from 'react';
import socket from './socket';
import Dashboard from './components/Dashboard';
import CreatePartyModal from './components/CreatePartyModal';
import JoinPartyModal from './components/JoinPartyModal';
import GamePage from './pages/GamePage';
import Toast from './components/Toast';

/**
 * Top-level view states:
 *   'dashboard'  → landing page
 *   'game'       → in a room / playing
 */
export default function App() {
  const [view, setView] = useState('dashboard');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [roomData, setRoomData] = useState(null);   // { room, playerName, isHost }
  const [toast, setToast] = useState(null);          // { type, message }

  // ── Toast helper ──────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    setToast({ message, type });
    const t = setTimeout(() => setToast(null), duration);
    return () => clearTimeout(t);
  }, []);

  // ── Socket: global lifecycle events ──────────────────────────────────
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => console.log('[socket] connected:', socket.id));
    socket.on('disconnect', (reason) => console.log('[socket] disconnected:', reason));

    // Host left → return to dashboard
    socket.on('host_left', ({ message }) => {
      showToast(message, 'error', 5000);
      setView('dashboard');
      setRoomData(null);
    });

    // Inactivity kick
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

  // ── Activity ping every 60s to prevent inactivity kick ───────────────
  useEffect(() => {
    if (view !== 'game') return;
    const id = setInterval(() => socket.emit('activity_ping'), 60_000);
    return () => clearInterval(id);
  }, [view]);

  // ── Handlers ──────────────────────────────────────────────────────────
  function handleRoomReady(data) {
    setRoomData(data);
    setView('game');
    setShowCreate(false);
    setShowJoin(false);
  }

  function handleLeaveGame() {
    socket.disconnect();
    socket.connect();
    setView('dashboard');
    setRoomData(null);
  }

  // ── Render ────────────────────────────────────────────────────────────
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
              onClose={() => setShowJoin(false)}
              onRoomReady={handleRoomReady}
              showToast={showToast}
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
