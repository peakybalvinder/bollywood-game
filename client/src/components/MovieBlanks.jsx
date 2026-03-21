import React from 'react';
import clsx from 'clsx';

/**
 * Renders movie blanks correctly:
 *
 *   Letters (a-z)        → blank tile (_) or revealed letter
 *   Numbers (0-9)        → blank tile or revealed digit
 *   Spaces               → word gap between groups
 *   Special chars (: - .) → shown as-is inline, styled in gold, never a blank
 *
 * The server already sends special chars as their actual value (auto-revealed).
 * This component just displays them correctly.
 */
export default function MovieBlanks({ blanks = [], lastRevealed = new Set() }) {
  // Build display groups
  const groups  = [];
  let   word    = [];

  function flushWord() {
    if (word.length) { groups.push({ type: 'word', cells: [...word] }); word = []; }
  }

  blanks.forEach((ch, i) => {
    if (ch === ' ') {
      flushWord();
      groups.push({ type: 'space' });
    } else if (/[a-zA-Z0-9_]/.test(ch)) {
      // Letter, digit, or unrevealed blank — part of a word tile group
      word.push({ ch, i });
    } else {
      // Special character — flush current word, add as inline symbol
      flushWord();
      groups.push({ type: 'special', ch });
    }
  });
  flushWord();

  return (
    <div className="w-full px-2">
      <div className="flex flex-wrap justify-center items-end gap-y-3" style={{ columnGap: '10px' }}>
        {groups.map((group, gi) => {

          if (group.type === 'space') {
            return <div key={`sp-${gi}`} className="w-4 shrink-0" />;
          }

          if (group.type === 'special') {
            return (
              <span
                key={`sc-${gi}`}
                className="font-display font-bold text-gold-500 text-xl md:text-2xl pb-0.5 select-none"
              >
                {group.ch}
              </span>
            );
          }

          // Word tile group
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
