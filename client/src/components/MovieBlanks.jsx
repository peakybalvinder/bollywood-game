import React from 'react';
import clsx from 'clsx';

/**
 * Renders the word blanks as letter tiles.
 * blanks: array of chars — '_' unrevealed, ' ' space, letter = revealed.
 * lastRevealed: Set of indices just revealed (triggers bounce animation).
 */
export default function MovieBlanks({ blanks = [], lastRevealed = new Set() }) {
  // Group into words split by spaces
  const words = [];
  let currentWord = [];

  blanks.forEach((ch, i) => {
    if (ch === ' ') {
      if (currentWord.length) words.push(currentWord);
      currentWord = [];
    } else {
      currentWord.push({ ch, i });
    }
  });
  if (currentWord.length) words.push(currentWord);

  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 px-4">
      {words.map((word, wi) => (
        <div key={wi} className="flex gap-1">
          {word.map(({ ch, i }) => {
            const revealed = ch !== '_';
            const justRevealed = lastRevealed.has(i);
            return (
              <span
                key={i}
                className={clsx(
                  'letter-tile',
                  revealed && 'revealed',
                  justRevealed && 'animate-bounce-in'
                )}
              >
                {revealed ? ch : ''}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
