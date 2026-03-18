import React, { useState, useCallback, useRef } from 'react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function MovieSearchModal({ onSelectMovie, onClose }) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(null);  // { title, year } or null
  const [hints, setHints]       = useState('');
  const [noKey, setNoKey]       = useState(false);  // OMDB key not configured
  const debounceRef             = useRef(null);

  // ── Search via backend OMDB proxy ────────────────────────────────────
  const searchMovies = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${SERVER_URL}/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.noKey) setNoKey(true);
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleQueryChange(e) {
    const q = e.target.value;
    setQuery(q);
    // If user edits away from a selection, clear it
    if (selected && q !== selected.title) setSelected(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchMovies(q), 350);
  }

  function handleSelect(movie) {
    setSelected(movie);
    setQuery(movie.title);
    setResults([]);
  }

  // ── Hint validation ───────────────────────────────────────────────────
  const movieTitle   = selected ? selected.title : query.trim();
  const hintLetters  = [...new Set(hints.toLowerCase().replace(/[^a-z]/g, '').split(''))].filter(Boolean);

  function getHintError() {
    if (!hintLetters.length || !movieTitle) return null;
    const lower   = movieTitle.toLowerCase();
    const missing = hintLetters.filter((l) => !lower.includes(l));
    if (missing.length > 0) {
      return `"${missing.map(l => l.toUpperCase()).join(', ')}" ${missing.length === 1 ? "doesn't" : "don't"} appear in the movie title.`;
    }
    return null;
  }

  const hintError = getHintError();
  const canStart  = movieTitle.length > 0 && !hintError;

  // ── Blanks preview ────────────────────────────────────────────────────
  const blanksPreview = movieTitle
    ? movieTitle.split('').map((ch, i) => {
        if (ch === ' ') return <span key={i} className="w-4 inline-block" />;
        const revealed = hintLetters.includes(ch.toLowerCase());
        return (
          <span
            key={i}
            className={`inline-flex items-end justify-center w-7 h-9 border-b-2 font-display font-bold text-sm mx-0.5
              ${revealed ? 'border-gold-500 text-gold-400' : 'border-gold-700 text-transparent'}`}
          >
            {revealed ? ch : ''}
          </span>
        );
      })
    : null;

  function handleStart() {
    if (!canStart) return;
    onSelectMovie({ movieName: movieTitle, hint: hintLetters.join('') || null });
  }

  return (
    <div className="modal-backdrop animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card-dark rounded-2xl p-8 w-full max-w-lg animate-slide-up relative max-h-[90vh] overflow-y-auto">

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gold-700 hover:text-gold-400 text-xl transition-colors">✕</button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🎞</div>
          <h2 className="font-display font-bold text-2xl gold-text">Choose the Movie</h2>
          <p className="text-gold-700 text-sm mt-1">Only you can see this — others will guess it!</p>
        </div>

        {/* Movie input */}
        <div className="relative mb-2">
          <label className="block text-gold-600 text-xs uppercase tracking-widest mb-2">
            Movie Title
          </label>
          <input
            className="input-dark pr-10"
            placeholder="Type any Bollywood movie name…"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={(e) => e.key === 'Enter' && results.length === 0 && handleStart()}
            autoFocus
          />
          {loading && (
            <span className="absolute right-3 top-[38px] text-gold-600 animate-pulse text-lg">⟳</span>
          )}

          {/* OMDB dropdown */}
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-ink-800 border border-ink-600 rounded-xl overflow-hidden shadow-2xl max-h-56 overflow-y-auto">
              {results.map((m, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(m)}
                  className="w-full text-left px-4 py-3 hover:bg-ink-700 text-gold-300 text-sm font-body border-b border-ink-700 last:border-0 transition-colors flex justify-between items-center gap-2"
                >
                  <span className="truncate">{m.title}</span>
                  {m.year && <span className="text-gold-700 text-xs shrink-0">{m.year}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info text */}
        {noKey ? (
          <p className="text-gold-800 text-xs mb-5">
            💡 OMDB key not configured — type the movie name directly and press Start.
          </p>
        ) : (
          <p className="text-gold-800 text-xs mb-5">
            Results load from OMDB as you type. You can also type any title directly without selecting.
          </p>
        )}

        {/* Blanks preview */}
        {movieTitle && (
          <div className="bg-ink-900 rounded-xl p-5 mb-5 text-center">
            <p className="text-gold-700 text-xs uppercase tracking-widest mb-4">How others will see it</p>
            <div className="flex flex-wrap justify-center">{blanksPreview}</div>
          </div>
        )}

        {/* Hint letters */}
        <div className="mb-6">
          <label className="block text-gold-600 text-xs uppercase tracking-widest mb-1">Hint Letters</label>
          <p className="text-gold-800 text-xs mb-2">
            Type any letters to pre-reveal them. e.g. <span className="font-mono text-gold-600">AK</span> reveals all A's and K's.
          </p>
          <input
            className={`input-dark uppercase font-mono text-xl tracking-widest ${hintError ? 'border-red-600' : ''}`}
            placeholder="optional…"
            value={hints}
            onChange={(e) => setHints(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
            disabled={!movieTitle}
            maxLength={10}
          />
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
          onClick={handleStart}
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
