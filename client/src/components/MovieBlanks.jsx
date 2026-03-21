import React from 'react';
import clsx from 'clsx';

/**
 * Renders movie blanks as responsive letter tiles.
 *
 * Special characters (: - . ' ! , & etc.) are shown as-is in a smaller
 * style between word groups — they are never blank tiles.
 * Only alphabetic characters get blank underscore tiles.
 * Spaces are word separators (gap between groups).
 */
export default function MovieBlanks({ blanks = [], lastRevealed = new Set() }) {
  // Build groups: each group is either a 'word' (array of letter cells)
  // or a 'special' character to display inline
  const groups = [];
  let currentWord = [];

  function flushWord() {
    if (currentWord.length) {
      groups.push({ type: 'word', cells: currentWord });
      currentWord = [];
    }
  }

  blanks.forEach((ch, i) => {
    if (ch === ' ') {
      flushWord();
      groups.push({ type: 'space' });
    } else if (/[a-zA-Z_]/.test(ch)) {
      // Letter or unrevealed blank — part of a word group
      currentWord.push({ ch, i });
    } else {
      // Special character (: - . ' ! etc.) — flush current word,
      // show the special char as its own inline element, then continue
      flushWord();
      groups.push({ type: 'special', ch, i });
    }
  });
  flushWord();

  return (
    <div className="w-full px-2">
      <div className="flex flex-wrap justify-center items-end gap-y-3" style={{ columnGap: '12px' }}>
        {groups.map((group, gi) => {
          if (group.type === 'space') {
            return <div key={`sp-${gi}`} className="w-4" />;
          }

          if (group.type === 'special') {
            return (
              <span
                key={`sc-${gi}`}
                className="font-display font-bold text-gold-500 text-xl md:text-2xl pb-1 select-none"
                aria-hidden="true"
              >
                {group.ch}
              </span>
            );
          }

          // Word group — letter tiles
          return (
            <div key={`w-${gi}`} className="flex gap-0.5">
              {group.cells.map(({ ch, i }) => {
                const revealed     = ch !== '_';
                const justRevealed = lastRevealed.has(i);
                return (
                  <span
                    key={i}
                    className={clsx(
                      'inline-flex items-center justify-center',
                      'w-7 h-9 sm:w-9 sm:h-11 md:w-10 md:h-12',
                      'font-display font-bold uppercase tracking-widest',
                      'text-base sm:text-lg md:text-xl',
                      'border-b-2 transition-all duration-300',
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
          );
        })}
      </div>
    </div>
  );
}
