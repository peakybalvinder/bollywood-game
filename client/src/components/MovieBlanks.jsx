import React from 'react';
import clsx from 'clsx';

/**
 * Renders movie blanks as responsive letter tiles.
 * Words wrap naturally and tiles shrink on small screens.
 */
export default function MovieBlanks({ blanks = [], lastRevealed = new Set() }) {
  // Group chars into words separated by spaces
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
    <div className="w-full px-2">
      {/* Words wrap to new lines, each word stays together */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-3">
        {words.map((word, wi) => (
          <div key={wi} className="flex gap-0.5">
            {word.map(({ ch, i }) => {
              const revealed = ch !== '_';
              const justRevealed = lastRevealed.has(i);
              return (
                <span
                  key={i}
                  className={clsx(
                    // Responsive sizing: smaller on mobile, bigger on larger screens
                    'inline-flex items-center justify-center',
                    'w-7 h-9 sm:w-9 sm:h-11 md:w-10 md:h-12',
                    'font-display font-bold',
                    'text-base sm:text-lg md:text-xl',
                    'border-b-2 uppercase tracking-widest',
                    'transition-all duration-300',
                    revealed
                      ? 'border-gold-500 text-gold-400'
                      : 'border-gold-700 text-transparent',
                    justRevealed && 'animate-bounce-in',
                  )}
                  style={revealed ? { textShadow: '0 0 12px rgba(255,215,0,0.4)' } : {}}
                >
                  {revealed ? ch : ''}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
