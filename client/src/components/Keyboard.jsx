import React, { useEffect } from 'react';
import clsx from 'clsx';

const LETTER_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
];

const NUMBER_ROW = ['1','2','3','4','5','6','7','8','9','0'];

/**
 * On-screen keyboard with letters (A–Z) and digits (0–9).
 * Numbers are shown as a separate row below the letters.
 * `compact` = true on mobile sticky bar: smaller keys.
 */
export default function Keyboard({
  guessedLetters = [],
  wrongLetters   = [],
  onGuess,
  disabled = false,
  compact  = false,
}) {
  // Physical keyboard support — letters AND digits
  useEffect(() => {
    function onKeyDown(e) {
      if (disabled) return;
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const key = e.key.toUpperCase();
      // Accept A–Z and 0–9
      if (/^[A-Z0-9]$/.test(key) && !guessedLetters.includes(key.toLowerCase())) {
        onGuess(key);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [disabled, guessedLetters, onGuess]);

  function getKeyState(key) {
    const k = key.toLowerCase();
    if (wrongLetters.map(w => w.toLowerCase()).includes(k)) return 'wrong';
    if (guessedLetters.includes(k)) return 'correct';
    return 'idle';
  }

  const keyW   = compact ? 'w-[8vw] max-w-[34px] min-w-[26px]' : 'w-9';
  const numW   = compact ? 'w-[8vw] max-w-[32px] min-w-[24px]' : 'w-8';
  const keyH   = compact ? 'h-9' : 'h-11';
  const numH   = compact ? 'h-8' : 'h-9';
  const gap    = compact ? 'gap-0.5' : 'gap-1.5';
  const rowGap = compact ? 'gap-1' : 'gap-2';

  function renderKey(key, w, h) {
    const state  = getKeyState(key);
    const isUsed = state !== 'idle';
    return (
      <button
        key={key}
        onClick={() => !isUsed && !disabled && onGuess(key)}
        disabled={isUsed || disabled}
        className={clsx(
          w, h,
          'rounded font-mono font-bold text-xs transition-all duration-150',
          'select-none border active:scale-95',
          state === 'wrong'   && 'bg-ink-800 border-crimson-900 text-crimson-900 cursor-not-allowed line-through opacity-40',
          state === 'correct' && 'bg-green-900 border-green-700 text-green-400 cursor-not-allowed opacity-60',
          state === 'idle' && !disabled && 'bg-ink-700 border-ink-500 text-gold-300 hover:bg-ink-600 hover:border-gold-700 hover:text-gold-200 cursor-pointer shadow-sm',
          state === 'idle' &&  disabled && 'bg-ink-800 border-ink-700 text-gold-800 cursor-not-allowed opacity-50',
        )}
      >
        {key}
      </button>
    );
  }

  return (
    <div className={clsx('flex flex-col items-center', rowGap)}>
      {/* Letter rows */}
      {LETTER_ROWS.map((row, ri) => (
        <div key={ri} className={clsx('flex', gap)}>
          {row.map(l => renderKey(l, keyW, keyH))}
        </div>
      ))}

      {/* Divider */}
      <div className="w-full border-t border-ink-700 opacity-40 my-0.5" />

      {/* Number row */}
      <div className={clsx('flex', gap)}>
        {NUMBER_ROW.map(n => renderKey(n, numW, numH))}
      </div>

      {!compact && (
        <p className="text-gold-800 text-xs mt-0.5 font-body">
          {disabled ? 'Waiting for game to start…' : 'Tap a letter/number or use your keyboard'}
        </p>
      )}
    </div>
  );
}
