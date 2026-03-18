import React, { useState } from 'react';
import socket from '../socket';

export default function CreatePartyModal({ onClose, onRoomReady, showToast }) {
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [loading, setLoading] = useState(false);

  function handleCreate() {
    if (!playerName.trim()) return showToast('Enter your name first!', 'error');
    if (!roomName.trim()) return showToast('Give your party a name!', 'error');

    setLoading(true);
    socket.emit(
      'create_room',
      { roomName: roomName.trim(), maxPlayers, playerName: playerName.trim() },
      ({ success, roomId, room, error }) => {
        setLoading(false);
        if (!success) return showToast(error || 'Could not create room.', 'error');
        showToast(`Party created! Code: ${roomId}`, 'success');
        onRoomReady({ room, playerName: playerName.trim(), isHost: true });
      }
    );
  }

  return (
    <div className="modal-backdrop animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card-dark rounded-2xl p-8 w-full max-w-md animate-slide-up relative">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gold-700 hover:text-gold-400 text-xl transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🎬</div>
          <h2 className="font-display font-bold text-2xl gold-text">Create a Party</h2>
          <p className="text-gold-700 text-sm mt-1">Set up your Bollywood night</p>
        </div>

        <div className="space-y-5">
          {/* Your name */}
          <div>
            <label className="block text-gold-600 text-xs uppercase tracking-widest mb-2">Your Name</label>
            <input
              className="input-dark"
              placeholder="Shah Rukh Khan"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={24}
              autoFocus
            />
          </div>

          {/* Room name */}
          <div>
            <label className="block text-gold-600 text-xs uppercase tracking-widest mb-2">Party Name</label>
            <input
              className="input-dark"
              placeholder="Friday Night Filmy"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={40}
            />
          </div>

          {/* Max players */}
          <div>
            <label className="block text-gold-600 text-xs uppercase tracking-widest mb-3">
              Max Players &nbsp;
              <span className="text-gold-500 normal-case">{maxPlayers} players</span>
            </label>
            <div className="flex gap-3">
              {[2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setMaxPlayers(n)}
                  className={`flex-1 py-2 rounded-lg font-body font-semibold text-sm border transition-all duration-150
                    ${maxPlayers === n
                      ? 'bg-gold-700 border-gold-500 text-ink-950 shadow-lg'
                      : 'bg-ink-700 border-ink-600 text-gold-600 hover:border-gold-700'
                    }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-7 border-t border-ink-600" />

        <button
          onClick={handleCreate}
          disabled={loading}
          className="btn-gold w-full text-base py-4"
        >
          {loading ? 'Creating…' : '🎬 Create Party'}
        </button>
      </div>
    </div>
  );
}
