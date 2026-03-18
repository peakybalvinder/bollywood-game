import React, { useEffect } from 'react';
import clsx from 'clsx';

const ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
];

/**
 * On-screen keyboard.
 * `compact` = true on mobile sticky bar: smaller keys, no hint text.
 */
export default function Keyboard({
  guessedLetters = [],
  wrongLetters = [],
  onGuess,
  disabled = false,
  compact = false,
}) {
  // Physical keyboard support
  useEffect(() => {
    function onKeyDown(e) {
      if (disabled) return;
      // Ignore if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
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

  // Compact mode: smaller keys that fit on phone width
  const keyW = compact ? 'w-[8vw] max-w-[34px] min-w-[26px]' : 'w-9';
  const keyH = compact ? 'h-9' : 'h-11';
  const gap  = compact ? 'gap-0.5' : 'gap-1.5';
  const rowGap = compact ? 'gap-1' : 'gap-2';

  return (
    <div className={clsx('flex flex-col items-center', rowGap)}>
      {ROWS.map((row, ri) => (
        <div key={ri} className={clsx('flex', gap)}>
          {row.map((letter) => {
            const state  = getKeyState(letter);
            const isUsed = state !== 'idle';
            return (
              <button
                key={letter}
                onClick={() => !isUsed && !disabled && onGuess(letter)}
                disabled={isUsed || disabled}
                className={clsx(
                  keyW, keyH,
                  'rounded font-mono font-bold text-xs sm:text-sm transition-all duration-150',
                  'select-none border active:scale-95',
                  state === 'wrong'  && 'bg-ink-800 border-crimson-900 text-crimson-900 cursor-not-allowed line-through opacity-40',
                  state === 'correct' && 'bg-green-900 border-green-700 text-green-400 cursor-not-allowed opacity-60',
                  state === 'idle' && !disabled && 'bg-ink-700 border-ink-500 text-gold-300 hover:bg-ink-600 hover:border-gold-700 hover:text-gold-200 cursor-pointer shadow-sm',
                  state === 'idle' && disabled  && 'bg-ink-800 border-ink-700 text-gold-800 cursor-not-allowed opacity-50',
                )}
              >
                {letter}
              </button>
            );
          })}
        </div>
      ))}
      {!compact && (
        <p className="text-gold-800 text-xs mt-0.5 font-body">
          {disabled ? 'Waiting for game to start…' : 'Tap a letter or use your keyboard'}
        </p>
      )}
    </div>
  );
}
