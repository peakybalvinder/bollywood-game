import React from 'react';
import clsx from 'clsx';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function PlayerList({ players = [], myId, hostId, roomName, roomId }) {
  // Sort by score desc for leaderboard display
  const sorted = [...players].sort((a, b) => b.score - a.score);

  function copyCode() {
    navigator.clipboard.writeText(roomId).catch(() => {});
  }

  return (
    <div className="flex flex-col h-full gap-4">

      {/* Room header */}
      <div className="card-dark rounded-xl p-4">
        <p className="text-gold-700 text-xs uppercase tracking-widest mb-1">Party</p>
        <h2 className="font-display font-bold text-lg text-gold-300 truncate">{roomName}</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="font-mono text-gold-500 bg-ink-700 border border-ink-600 rounded px-2 py-0.5 text-xs tracking-widest">
            {roomId}
          </span>
          <button
            onClick={copyCode}
            className="text-gold-700 hover:text-gold-400 text-xs transition-colors"
            title="Copy room code"
          >
            📋
          </button>
        </div>
      </div>

      {/* Players */}
      <div className="card-dark rounded-xl p-4 flex-1 overflow-y-auto">
        <p className="text-gold-700 text-xs uppercase tracking-widest mb-4">
          Players &nbsp;
          <span className="text-gold-600">{players.length}/{players.length + 1 > 5 ? 5 : '5 max'}</span>
        </p>

        <div className="space-y-2">
          {sorted.map((player, idx) => {
            const isMe = player.id === myId;
            const isHost = player.id === hostId;
            return (
              <div
                key={player.id}
                className={clsx(
                  'flex items-center gap-3 rounded-lg p-3 transition-all duration-300',
                  isMe ? 'bg-gold-900 border border-gold-700' : 'bg-ink-700 border border-ink-600',
                  player.guessedCorrectly && 'border-green-700'
                )}
              >
                {/* Rank / medal */}
                <span className="text-base w-6 text-center shrink-0">
                  {player.score > 0 && idx < 3 ? MEDAL[idx] : '🎭'}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={clsx(
                      'font-body font-semibold text-sm truncate',
                      isMe ? 'text-gold-300' : 'text-gold-400'
                    )}>
                      {player.name}
                    </span>
                    {isHost && (
                      <span className="text-xs bg-crimson-800 text-crimson-300 border border-crimson-700 rounded px-1.5 py-0.5 font-body leading-none">
                        HOST
                      </span>
                    )}
                    {isMe && (
                      <span className="text-xs bg-gold-900 text-gold-500 border border-gold-800 rounded px-1.5 py-0.5 font-body leading-none">
                        YOU
                      </span>
                    )}
                  </div>
                  {/* Guessed status */}
                  {player.guessedCorrectly && (
                    <p className="text-green-400 text-xs mt-0.5">✓ Guessed it!</p>
                  )}
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-sm text-gold-500">{player.score}</span>
                  <span className="text-gold-800 text-xs ml-0.5">pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard legend */}
      <div className="text-center text-gold-800 text-xs font-body px-2">
        Score = lives remaining × 10 + 20 base
      </div>
    </div>
  );
}
