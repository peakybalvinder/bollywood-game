import React, { useState, useEffect } from 'react';
import socket from '../socket';

export default function JoinPartyModal({
  onClose, onRoomReady, showToast, initialCode = null, isConnected = true
}) {
  const [step, setStep]           = useState(initialCode ? 'name' : 'code');
  const [roomCode, setRoomCode]   = useState(initialCode || '');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (initialCode) {
      setRoomCode(initialCode);
      setStep('name');
    }
  }, [initialCode]);

  function handleVerifyCode() {
    const code = roomCode.trim().toUpperCase();
    if (code.length !== 6) return showToast('Room code must be 6 characters.', 'error');
    setStep('name');
  }

  function handleJoin() {
    if (!playerName.trim()) return showToast('Enter your name!', 'error');

    // ── Safari fix: ensure socket is connected before emitting ─────────
    // On Safari, the socket may not have connected yet when the user
    // clicks Join. We wait up to 8s for the connection, then retry.
    if (!socket.connected) {
      setLoading(true);
      showToast('Connecting to server…', 'info', 2000);
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (socket.connected) {
          clearInterval(interval);
          emitJoin();
        } else if (attempts >= 16) { // 8s max (16 × 500ms)
          clearInterval(interval);
          setLoading(false);
          showToast('Could not connect. Check your internet and try again.', 'error');
        }
      }, 500);
      return;
    }

    emitJoin();
  }

  function emitJoin() {
    setLoading(true);
    socket.emit(
      'join_room',
      { roomId: roomCode.trim().toUpperCase(), playerName: playerName.trim() },
      ({ success, room, error }) => {
        setLoading(false);
        if (!success) return showToast(error || 'Could not join room.', 'error');
        showToast(`Joined ${room.name}!`, 'success');
        onRoomReady({ room, playerName: playerName.trim(), isHost: false });
      }
    );
  }

  return (
    <div className="modal-backdrop animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card-dark rounded-2xl p-8 w-full max-w-md animate-slide-up relative">

        <button onClick={onClose} className="absolute top-4 right-4 text-gold-700 hover:text-gold-400 text-xl transition-colors">✕</button>

        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🎟</div>
          <h2 className="font-display font-bold text-2xl gold-text">Join a Party</h2>
          <p className="text-gold-700 text-sm mt-1">
            {step === 'code' ? 'Enter the room code to continue' : 'Almost there — what do we call you?'}
          </p>
        </div>

        {/* Connection warning */}
        {!isConnected && (
          <div className="mb-4 bg-crimson-900 border border-crimson-700 rounded-lg px-4 py-2 text-xs text-red-300 text-center">
            ⚠️ Connecting to server… please wait before joining.
          </div>
        )}

        {step === 'code' && (
          <>
            <div>
              <label className="block text-gold-600 text-xs uppercase tracking-widest mb-2">Room Code</label>
              <input
                className="input-dark uppercase text-center font-mono text-2xl tracking-[0.5em] py-4"
                placeholder="ABC123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                autoFocus
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
              />
              <p className="text-gold-800 text-xs mt-2 text-center">
                Ask your host for the 6-character code, or use their shared link.
              </p>
            </div>
            <div className="mt-8">
              <button onClick={handleVerifyCode} className="btn-gold w-full py-4">Continue →</button>
            </div>
          </>
        )}

        {step === 'name' && (
          <>
            <div className="text-center mb-5">
              <p className="text-gold-700 text-xs mb-2">Joining room</p>
              <span className="font-mono text-gold-500 bg-ink-700 border border-ink-600 rounded-lg px-4 py-1.5 text-sm tracking-widest">
                {roomCode}
              </span>
            </div>
            <div>
              <label className="block text-gold-600 text-xs uppercase tracking-widest mb-2">Your Name</label>
              <input
                className="input-dark"
                placeholder="Amitabh Bachchan"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={24}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <div className="mt-8 flex gap-3">
              {!initialCode && (
                <button onClick={() => setStep('code')} className="btn-ghost flex-1 py-4">← Back</button>
              )}
              <button
                onClick={handleJoin}
                disabled={loading}
                className={`btn-gold py-4 ${initialCode ? 'w-full' : 'flex-1'}`}
              >
                {loading ? 'Connecting…' : '🎬 Join Game'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
