import React, { useState, useCallback, useRef } from 'react';

// Replace with your OMDB API key — free at https://www.omdbapi.com/apikey.aspx
// Falls back to a curated Bollywood list for demo purposes.
const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY || 'DEMO';

// ── Demo fallback movies ─────────────────────────────────────────────────────
const DEMO_MOVIES = [
  'Dhurandhar', 'Dilwale Dulhania Le Jayenge', 'Sholay', 'Mughal-E-Azam', 'Devdas',
  'Kabhi Khushi Kabhie Gham', 'Rang De Basanti', 'Lagaan', 'Taare Zameen Par',
  'Queen', 'Dangal', 'PK', '3 Idiots', 'Bajrangi Bhaijaan', 'Gangs of Wasseypur',
  'Zindagi Na Milegi Dobara', 'Dil Chahta Hai', 'Rockstar', 'Barfi', 'Kapoor and Sons',
  'Andhadhun', 'Gully Boy', 'Article 15', 'Tumbbad', 'Stree', 'Bard of Blood',
];

function fuzzyMatch(query, list) {
  const q = query.toLowerCase();
  return list.filter((m) => m.toLowerCase().includes(q)).slice(0, 8);
}

export default function MovieSearchModal({ onSelectMovie, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [hint, setHint] = useState('');
  const debounceRef = useRef(null);

  // ── Search ─────────────────────────────────────────────────────────────
  const searchMovies = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); return; }

    setLoading(true);
    try {
      if (OMDB_API_KEY === 'DEMO') {
        // Demo mode: fuzzy match local list
        setTimeout(() => {
          setResults(fuzzyMatch(q, DEMO_MOVIES).map((t) => ({ title: t, year: '' })));
          setLoading(false);
        }, 200);
        return;
      }

      const url = `https://www.omdbapi.com/?s=${encodeURIComponent(q)}&type=movie&apikey=${OMDB_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.Search) {
        setResults(data.Search.map((m) => ({ title: m.Title, year: m.Year })));
      } else {
        setResults([]);
      }
    } catch {
      setResults(fuzzyMatch(q, DEMO_MOVIES).map((t) => ({ title: t, year: '' })));
    } finally {
      setLoading(false);
    }
  }, []);

  function handleQueryChange(e) {
    const q = e.target.value;
    setQuery(q);
    setSelected(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchMovies(q), 350);
  }

  function handleSelect(movie) {
    setSelected(movie);
    setQuery(movie.title);
    setResults([]);
  }

  // ── Validate hint character ──────────────────────────────────────────
  function getHintError() {
    if (!hint) return null;
    if (hint.length > 1) return 'Only a single character allowed.';
    if (!/[a-zA-Z]/.test(hint)) return 'Hint must be a letter.';
    if (selected && !selected.title.toLowerCase().includes(hint.toLowerCase())) {
      return `"${hint.toUpperCase()}" doesn't appear in the movie name.`;
    }
    return null;
  }

  const hintError = getHintError();
  const canStart = selected && !hintError;

  // ── Blanks preview ───────────────────────────────────────────────────
  const blanksPreview = selected
    ? selected.title.split('').map((ch, i) => {
        if (ch === ' ') return <span key={i} className="letter-tile space" />;
        const revealed = hint && hint.toLowerCase() === ch.toLowerCase();
        return (
          <span key={i} className={`letter-tile ${revealed ? 'revealed' : ''}`}>
            {revealed ? ch : ''}
          </span>
        );
      })
    : null;

  return (
    <div className="modal-backdrop animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card-dark rounded-2xl p-8 w-full max-w-lg animate-slide-up relative max-h-[90vh] overflow-y-auto">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gold-700 hover:text-gold-400 text-xl transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🎞</div>
          <h2 className="font-display font-bold text-2xl gold-text">Choose the Movie</h2>
          <p className="text-gold-700 text-sm mt-1">Only you can see this — others will guess it!</p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <label className="block text-gold-600 text-xs uppercase tracking-widest mb-2">Search Movie</label>
          <input
            className="input-dark pr-10"
            placeholder="Type a Bollywood movie name…"
            value={query}
            onChange={handleQueryChange}
            autoFocus
          />
          {loading && (
            <span className="absolute right-3 top-[38px] text-gold-600 animate-pulse">⟳</span>
          )}

          {/* Dropdown results */}
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-ink-800 border border-ink-600 rounded-xl overflow-hidden shadow-2xl">
              {results.map((m, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(m)}
                  className="w-full text-left px-4 py-3 hover:bg-ink-700 text-gold-300 text-sm font-body border-b border-ink-700 last:border-0 transition-colors flex justify-between items-center"
                >
                  <span>{m.title}</span>
                  {m.year && <span className="text-gold-700 text-xs">{m.year}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Blanks preview */}
        {selected && (
          <div className="bg-ink-900 rounded-xl p-5 mb-5 text-center">
            <p className="text-gold-700 text-xs uppercase tracking-widest mb-4">How others will see it</p>
            <div className="flex flex-wrap justify-center gap-1">
              {blanksPreview}
            </div>
          </div>
        )}

        {/* Hint */}
        <div className="mb-6">
          <label className="block text-gold-600 text-xs uppercase tracking-widest mb-2">
            Hint Letter &nbsp;
            <span className="text-gold-800 normal-case">(optional — pre-reveal one character)</span>
          </label>
          <input
            className={`input-dark uppercase text-center font-mono text-2xl tracking-widest w-20 ${hintError ? 'border-red-600 focus:ring-red-600' : ''}`}
            placeholder="A"
            value={hint}
            onChange={(e) => setHint(e.target.value.slice(0, 1).toUpperCase())}
            maxLength={1}
            disabled={!selected}
          />
          {hintError && <p className="text-red-400 text-xs mt-1">{hintError}</p>}
        </div>

        <button
          onClick={() => canStart && onSelectMovie({ movieName: selected.title, hint: hint || null })}
          disabled={!canStart}
          className={`w-full py-4 rounded-lg font-body font-semibold text-base transition-all duration-150
            ${canStart ? 'btn-gold' : 'bg-ink-700 text-gold-800 cursor-not-allowed border border-ink-600'}`}
        >
          🎬 Start the Game
        </button>
      </div>
    </div>
  );
}
