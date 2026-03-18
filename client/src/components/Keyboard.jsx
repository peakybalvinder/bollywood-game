import React, { useEffect } from 'react';
import clsx from 'clsx';

const ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
];

export default function Keyboard({ guessedLetters = [], wrongLetters = [], onGuess, disabled = false }) {
  // Physical keyboard support
  useEffect(() => {
    function onKeyDown(e) {
      if (disabled) return;
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key) && !guessedLetters.includes(key.toLowerCase())) {
        onGuess(key);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [disabled, guessedLetters, onGuess]);

  function getKeyState(letter) {
    const l = letter.toLowerCase();
    if (wrongLetters.map(w => w.toLowerCase()).includes(l)) return 'wrong';
    if (guessedLetters.includes(l)) return 'correct';
    return 'idle';
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1.5">
          {row.map((letter) => {
            const state = getKeyState(letter);
            const isUsed = state !== 'idle';
            return (
              <button
                key={letter}
                onClick={() => !isUsed && !disabled && onGuess(letter)}
                disabled={isUsed || disabled}
                className={clsx(
                  'w-9 h-11 rounded-lg font-mono font-bold text-sm transition-all duration-200 select-none border active:scale-95',
                  state === 'wrong' && 'bg-ink-800 border-crimson-900 text-crimson-900 cursor-not-allowed line-through opacity-40',
                  state === 'correct' && 'bg-green-900 border-green-700 text-green-400 cursor-not-allowed opacity-70',
                  state === 'idle' && !disabled && 'bg-ink-700 border-ink-500 text-gold-300 hover:bg-ink-600 hover:border-gold-700 hover:text-gold-200 cursor-pointer shadow-sm',
                  state === 'idle' && disabled && 'bg-ink-800 border-ink-700 text-gold-800 cursor-not-allowed opacity-50'
                )}
              >
                {letter}
              </button>
            );
          })}
        </div>
      ))}
      <p className="text-gold-800 text-xs mt-1 font-body">
        {disabled ? 'Waiting for game to start…' : 'Click a letter or press your keyboard'}
      </p>
    </div>
  );
}
