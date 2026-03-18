import React from 'react';
import clsx from 'clsx';

const MEDAL     = ['🥇', '🥈', '🥉'];
const LIVES_WORD = 'BOLLYWOOD';

export default function PlayerList({
  players = [],
  myId,
  hostId,
  roomName,
  roomId,
  isHost,
  onTransferHost,
  gameActive = false,
}) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  function copyCode() {
    navigator.clipboard.writeText(roomId).catch(() => {});
  }

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Room header */}
      <div className="card-dark rounded-xl p-4 shrink-0">
        <p className="text-gold-700 text-xs uppercase tracking-widest mb-1">Party</p>
        <h2 className="font-display font-bold text-lg text-gold-300 truncate">{roomName}</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="font-mono text-gold-500 bg-ink-700 border border-ink-600 rounded px-2 py-0.5 text-xs tracking-widest">
            {roomId}
          </span>
          <button onClick={copyCode} className="text-gold-700 hover:text-gold-400 text-xs transition-colors" title="Copy code">
            📋
          </button>
        </div>
      </div>

      {/* Players list */}
      <div className="card-dark rounded-xl p-4 flex-1 min-h-0 overflow-y-auto">
        <p className="text-gold-700 text-xs uppercase tracking-widest mb-4">
          Players <span className="text-gold-600 normal-case">{players.length} / 5 max</span>
        </p>

        <div className="space-y-2">
          {sorted.map((player, idx) => {
            const isMe       = player.id === myId;
            const isHostRow  = player.id === hostId;
            const lives      = player.livesLeft !== null ? player.livesLeft : LIVES_WORD.length;
            const gameStatus = player.gameStatus;

            // Show lives bar to ALL players (not just host) when game is active
            const showLivesBar = gameActive && !player.isHost && player.livesLeft !== null;

            return (
              <div
                key={player.id}
                className={clsx(
                  'rounded-lg p-3 border transition-all duration-300',
                  isMe           ? 'bg-gold-900 border-gold-700'    : 'bg-ink-700 border-ink-600',
                  gameStatus === 'won'  && 'border-green-700',
                  gameStatus === 'lost' && 'border-crimson-800',
                )}
              >
                <div className="flex items-center gap-2">
                  {/* Icon */}
                  <span className="text-base w-6 text-center shrink-0">
                    {player.isHost ? '🎬'
                      : gameStatus === 'won'  ? '🏆'
                      : gameStatus === 'lost' ? '💔'
                      : (player.score > 0 && idx < 3 ? MEDAL[idx] : '🎭')}
                  </span>

                  {/* Name + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={clsx(
                        'font-body font-semibold text-sm truncate',
                        isMe ? 'text-gold-300' : 'text-gold-400',
                      )}>
                        {player.name}
                      </span>
                      {isHostRow && (
                        <span className="text-xs bg-crimson-800 text-crimson-300 border border-crimson-700 rounded px-1.5 py-0.5 leading-none">HOST</span>
                      )}
                      {isMe && !isHostRow && (
                        <span className="text-xs bg-gold-900 text-gold-500 border border-gold-800 rounded px-1.5 py-0.5 leading-none">YOU</span>
                      )}
                      {gameStatus === 'won'  && <span className="text-xs text-green-400">✓ Guessed!</span>}
                      {gameStatus === 'lost' && <span className="text-xs text-crimson-400">Out of lives</span>}
                    </div>

                    {/* BOLLYWOOD lives bar — visible to ALL players when game is active */}
                    {showLivesBar && (
                      <div className="mt-1 flex gap-0.5">
                        {LIVES_WORD.split('').map((ch, i) => (
                          <span
                            key={i}
                            className={clsx(
                              'font-mono text-[9px] font-bold transition-all duration-300',
                              i < lives ? 'text-crimson-400' : 'text-ink-500 line-through',
                            )}
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-sm text-gold-500">{player.score}</span>
                    <span className="text-gold-800 text-xs ml-0.5">pts</span>
                  </div>
                </div>

                {/* Make Host button — only current host sees this */}
                {isHost && !player.isHost && onTransferHost && (
                  <div className="mt-2 pt-2 border-t border-ink-600">
                    <button
                      onClick={() => {
                        if (window.confirm(`Make ${player.name} the new host?`)) {
                          onTransferHost(player.id);
                        }
                      }}
                      className="w-full text-xs text-gold-700 hover:text-gold-400 border border-ink-600 hover:border-gold-700 rounded px-2 py-1 transition-colors font-body"
                    >
                      👑 Make Host
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-gold-800 text-xs font-body px-2 shrink-0">
        Score = lives left × 10 + 20 · Accumulates across rounds
      </p>
    </div>
  );
}
