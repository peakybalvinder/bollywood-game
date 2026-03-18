import React from 'react';

export default function WaitingRoom({ room, isHost, onStartSetup, myId }) {
  const shareUrl = `${window.location.origin}?room=${room.id}`;

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
  }
  function copyCode() {
    navigator.clipboard.writeText(room.id).catch(() => {});
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4 animate-fade-in">

      {/* Title */}
      <div className="text-center">
        <div className="text-4xl mb-3">🎬</div>
        <h2 className="font-display font-bold text-3xl gold-text mb-2">{room.name}</h2>
        <p className="text-gold-700 font-body">
          {isHost
            ? 'Waiting for players to join, then start the game!'
            : 'Waiting for the host to start the game…'}
        </p>
      </div>

      {/* Room code card */}
      <div className="card-dark rounded-2xl p-6 w-full max-w-sm text-center">
        <p className="text-gold-700 text-xs uppercase tracking-widest mb-2">Room Code</p>
        <div className="font-mono text-4xl font-bold text-gold-400 tracking-[0.4em] mb-4">
          {room.id}
        </div>
        <div className="flex gap-3">
          <button onClick={copyCode} className="btn-ghost flex-1 text-sm py-2.5">
            📋 Copy Code
          </button>
          <button onClick={copyLink} className="btn-ghost flex-1 text-sm py-2.5">
            🔗 Copy Link
          </button>
        </div>
      </div>

      {/* Player list */}
      <div className="card-dark rounded-xl p-5 w-full max-w-sm">
        <p className="text-gold-700 text-xs uppercase tracking-widest mb-4">
          Players ({room.players.length}/{room.maxPlayers})
        </p>
        <div className="space-y-2">
          {room.players.map((p) => (
            <div key={p.id} className="flex items-center gap-3 bg-ink-700 border border-ink-600 rounded-lg px-4 py-2.5">
              <span className="text-base">🎭</span>
              <span className="flex-1 font-body text-sm text-gold-300 font-medium">{p.name}</span>
              {p.isHost && (
                <span className="text-xs bg-crimson-800 text-crimson-300 border border-crimson-700 rounded px-1.5 py-0.5">
                  HOST
                </span>
              )}
              {p.id === myId && (
                <span className="text-xs bg-gold-900 text-gold-500 border border-gold-800 rounded px-1.5 py-0.5">
                  YOU
                </span>
              )}
            </div>
          ))}
          {/* Empty slots */}
          {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center gap-3 bg-ink-900 border border-ink-700 rounded-lg px-4 py-2.5 opacity-40">
              <span className="text-base">⬜</span>
              <span className="font-body text-sm text-gold-800 italic">Waiting for player…</span>
            </div>
          ))}
        </div>
      </div>

      {/* Host start button */}
      {isHost && (
        <button
          onClick={onStartSetup}
          className="btn-gold px-12 py-4 text-base animate-pulse-gold"
        >
          🎬 Choose Movie & Start
        </button>
      )}
    </div>
  );
}
