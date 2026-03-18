import React from 'react';

const LIVES_WORD = 'BOLLYWOOD';

export default function BollywoodLives({ livesLeft = 9 }) {
  const deadCount = LIVES_WORD.length - livesLeft;

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-gold-700 text-xs uppercase tracking-widest">Lives Remaining</p>

      {/* The BOLLYWOOD word with struck letters */}
      <div className="flex gap-1 md:gap-2 items-end">
        {LIVES_WORD.split('').map((letter, i) => {
          const isDead = i >= livesLeft;
          return (
            <span
              key={i}
              className={`life-letter ${isDead ? 'dead' : 'alive'}`}
              style={{
                transition: `color 0.5s ease ${i * 0.05}s, text-shadow 0.5s ease ${i * 0.05}s`,
              }}
            >
              {letter}
            </span>
          );
        })}
      </div>

      {/* Visual bar */}
      <div className="w-full max-w-xs h-1.5 bg-ink-600 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-600 to-crimson-500 rounded-full transition-all duration-700"
          style={{ width: `${(livesLeft / LIVES_WORD.length) * 100}%` }}
        />
      </div>

      <p className="text-gold-600 text-xs font-body">
        {livesLeft} / {LIVES_WORD.length} lives left
      </p>
    </div>
  );
}
