import React, { useState, useCallback, useRef } from 'react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// ── Fallback local list (used when OMDB key not configured on server) ─────────
const DEMO_MOVIES = [
  'Dhurandhar', 'Dilwale Dulhania Le Jayenge', 'Sholay', 'Mughal-E-Azam', 'Devdas',
  'Kabhi Khushi Kabhie Gham', 'Rang De Basanti', 'Lagaan', 'Taare Zameen Par',
  'Queen', 'Dangal', 'PK', '3 Idiots', 'Bajrangi Bhaijaan', 'Gangs of Wasseypur',
  'Zindagi Na Milegi Dobara', 'Dil Chahta Hai', 'Rockstar', 'Barfi', 'Kapoor and Sons',
  'Andhadhun', 'Gully Boy', 'Article 15', 'Tumbbad', 'Stree', 'Bard of Blood',
  'Padmaavat', 'Kabir Singh', 'War', 'KGF Chapter 2', 'RRR', 'Pathaan', 'Jawan',
  'Animal', 'Fighter', 'Pushpa', 'Bhool Bhulaiyaa 2', 'Brahmastra', 'Adipurush',
  'Tiger Zinda Hai', 'Sultan', 'Bajirao Mastani', 'Ram-Leela', 'Goliyon Ki Rasleela',
  'Dil Dhadakne Do', 'Tamasha', 'Highway', 'Raazi', 'URI The Surgical Strike',
  'Bard of Blood', 'Sacred Games', 'Mirzapur', 'Scam 1992',
];

function fuzzyMatch(query, list) {
  const q = query.toLowerCase();
  return list.filter((m) => m.toLowerCase().includes(q)).slice(0, 10);
}

export default function MovieSearchModal({ onSelectMovie, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [hints, setHints] = useState('');       // e.g. "AK" — multiple hint letters
  const debounceRef = useRef(null);

  // ── Search via backend proxy (OMDB) → fallback to local list ─────────
  const searchMovies = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        setResults(data.results);
      } else {
        // Fall back to local list
        setResults(fuzzyMatch(q, DEMO_MOVIES).map((t) => ({ title: t, year: '' })));
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

  // ── Hint validation ────────────────────────────────────────────────────
  // hints is a string like "AKD" — each char is a separate hint letter
  const hintLetters = [...new Set(hints.toLowerCase().replace(/[^a-z]/g, '').split(''))].filter(Boolean);

  function getHintError() {
    if (hintLetters.length === 0) return null;
    if (!selected) return null;
    const movieLower = selected.title.toLowerCase();
    const missing = hintLetters.filter((l) => !movieLower.includes(l));
    if (missing.length > 0) {
      return `"${missing.join(', ').toUpperCase()}" ${missing.length === 1 ? "doesn't" : "don't"} appear in the movie name.`;
    }
    return null;
  }

  const hintError = getHintError();
  const canStart = selected && !hintError;

  // ── Blanks preview with all hint letters revealed ──────────────────────
  const blanksPreview = selected
    ? selected.title.split('').map((ch, i) => {
        if (ch === ' ') return <span key={i} className="letter-tile space" />;
        const revealed = hintLetters.includes(ch.toLowerCase());
        return (
          <span key={i} className={`letter-tile text-sm ${revealed ? 'revealed' : ''}`}>
            {revealed ? ch : ''}
          </span>
        );
      })
    : null;

  return (
    <div className="modal-backdrop animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card-dark rounded-2xl p-8 w-full max-w-lg animate-slide-up relative max-h-[90vh] overflow-y-auto">

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gold-700 hover:text-gold-400 text-xl transition-colors">
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
            <span className="absolute right-3 top-[38px] text-gold-600 animate-pulse text-lg">⟳</span>
          )}

          {/* Dropdown */}
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-ink-800 border border-ink-600 rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto">
              {results.map((m, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(m)}
                  className="w-full text-left px-4 py-3 hover:bg-ink-700 text-gold-300 text-sm font-body border-b border-ink-700 last:border-0 transition-colors flex justify-between items-center"
                >
                  <span>{m.title}</span>
                  {m.year && <span className="text-gold-700 text-xs ml-2 shrink-0">{m.year}</span>}
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

        {/* Hint letters — multiple allowed */}
        <div className="mb-6">
          <label className="block text-gold-600 text-xs uppercase tracking-widest mb-1">
            Hint Letters
            <span className="text-gold-800 normal-case ml-2">(optional — type any letters to pre-reveal)</span>
          </label>
          <p className="text-gold-800 text-xs mb-2">
            Each letter you type here will be shown to the guessers from the start. e.g. type <span className="font-mono text-gold-600">AK</span> to reveal all A's and K's.
          </p>
          <input
            className={`input-dark uppercase font-mono text-xl tracking-widest ${hintError ? 'border-red-600 focus:ring-red-600' : ''}`}
            placeholder="A K D …"
            value={hints}
            onChange={(e) => setHints(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
            disabled={!selected}
            maxLength={10}
          />
          {/* Show which unique letters are active */}
          {hintLetters.length > 0 && !hintError && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {hintLetters.map((l) => (
                <span key={l} className="font-mono text-xs bg-gold-900 border border-gold-700 text-gold-400 rounded px-2 py-0.5">
                  {l.toUpperCase()}
                </span>
              ))}
            </div>
          )}
          {hintError && <p className="text-red-400 text-xs mt-1">{hintError}</p>}
        </div>

        <button
          onClick={() => canStart && onSelectMovie({ movieName: selected.title, hint: hintLetters.join('') || null })}
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
