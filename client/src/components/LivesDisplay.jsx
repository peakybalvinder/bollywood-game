import React from 'react';
import clsx from 'clsx';

const LIVES_WORD = 'BOLLYWOOD';

export default function LivesDisplay({ livesLeft = 9, wrongLetters = [] }) {
  const totalLives = LIVES_WORD.length;
  const deadCount = totalLives - livesLeft;

  return (
    <div className="text-center">
      {/* BOLLYWOOD letters */}
      <div className="flex justify-center gap-1 mb-3">
        {LIVES_WORD.split('').map((ch, i) => {
          const isDead = i >= livesLeft;
          return (
            <span
              key={i}
              className={clsx('life-letter', isDead ? 'dead' : 'alive')}
              style={{
                transition: `all 0.5s ease ${i * 0.05}s`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>

      {/* Lives remaining label */}
      <p className="text-gold-700 text-xs uppercase tracking-widest">
        {livesLeft === 0 ? (
          <span className="text-red-400 font-semibold">No lives left!</span>
        ) : (
          <>
            <span className="text-crimson-400 font-bold">{livesLeft}</span>
            {' '}
            {livesLeft === 1 ? 'life' : 'lives'} remaining
          </>
        )}
      </p>

      {/* Wrong letters */}
      {wrongLetters.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {wrongLetters.map((l) => (
            <span
              key={l}
              className="font-mono font-bold text-sm bg-ink-700 border border-crimson-800
                         text-red-400 rounded px-2 py-0.5 animate-bounce-in line-through"
            >
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
