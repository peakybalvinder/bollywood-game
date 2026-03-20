import React, { useState, useCallback, useRef, useEffect } from 'react';

// ── Resolve the backend API URL ───────────────────────────────────────────────
// VITE_SERVER_URL is baked at build time. We must NEVER fall back to
// window.location.origin for API calls — the frontend doesn't serve /api/*.
// If the env var isn't set, we have no valid server URL for search.
const BAKED_URL = import.meta.env.VITE_SERVER_URL || '';
const SERVER_URL = BAKED_URL.replace(/\/$/, ''); // strip trailing slash

export default function MovieSearchModal({ onSelectMovie, onClose }) {
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState(null);
  const [hints, setHints]         = useState('');
  const [searchSource, setSearchSource] = useState('');
  const [searchError, setSearchError]   = useState('');
  const debounceRef               = useRef(null);
  const inputRef                  = useRef(null);

  // ── Search ────────────────────────────────────────────────────────────
  const searchMovies = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); setSearchError(''); return; }

    if (!SERVER_URL) {
      setSearchError('VITE_SERVER_URL not set — search unavailable. Type movie name directly.');
      setResults([]);
      return;
    }

    setLoading(true);
    setSearchError('');

    try {
      const url = `${SERVER_URL}/api/search?q=${encodeURIComponent(q)}`;
      console.log('[Search] Fetching:', url);

      const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      console.log('[Search] Results:', data.results?.length, 'source:', data.source);

      setResults(data.results || []);
      setSearchSource(data.source || '');

      if ((data.results || []).length === 0) {
        setSearchError('No results found. Try a different spelling or type the name directly.');
      }
    } catch (err) {
      console.error('[Search] Error:', err.message, '| URL was:', SERVER_URL);
      setResults([]);

      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        setSearchError('Search timed out. Type the movie name directly and press Start.');
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setSearchError(`Cannot reach server. Type the movie name directly and press Start.`);
      } else {
        setSearchError(`Search error: ${err.message}. Type the name directly below.`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function handleQueryChange(e) {
    const q = e.target.value;
    setQuery(q);
    setSearchError('');
    if (selected && q !== selected.title) setSelected(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchMovies(q), 400);
  }

  function handleSelect(movie) {
    setSelected(movie);
    setQuery(movie.title);
    setResults([]);
    setSearchError('');
    inputRef.current?.focus();
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onDown(e) {
      if (!e.target.closest('[data-search-container]')) setResults([]);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────
  const movieTitle  = selected ? selected.title : query.trim();
  const hintLetters = [...new Set(hints.toLowerCase().replace(/[^a-z]/g, '').split(''))].filter(Boolean);

  function getHintError() {
    if (!hintLetters.length || !movieTitle) return null;
    const missing = hintLetters.filter((l) => !movieTitle.toLowerCase().includes(l));
    if (missing.length > 0) {
      return `"${missing.map(l => l.toUpperCase()).join(', ')}" ${missing.length === 1 ? "doesn't" : "don't"} appear in the title.`;
    }
    return null;
  }

  const hintError = getHintError();

  const allLettersRevealed = movieTitle.length > 0 && (() => {
    const uniqueLetters = [...new Set(movieTitle.toLowerCase().replace(/[^a-z]/g, '').split(''))];
    return uniqueLetters.length > 0 && uniqueLetters.every(l => hintLetters.includes(l));
  })();

  const canStart = movieTitle.length > 0 && !hintError && !allLettersRevealed;

  const blanksPreview = movieTitle
    ? movieTitle.split('').map((ch, i) => {
        if (ch === ' ') return <span key={i} className="w-4 inline-block" />;
        const revealed = hintLetters.includes(ch.toLowerCase());
        return (
          <span key={i} className={`inline-flex items-end justify-center w-7 h-9 border-b-2 font-display font-bold text-sm mx-0.5
            ${revealed ? 'border-gold-500 text-gold-400' : 'border-gold-700 text-transparent'}`}>
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
      <div className="card-dark rounded-2xl w-full max-w-lg animate-slide-up relative flex flex-col"
           style={{ maxHeight: '90vh' }}>

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 text-gold-700 hover:text-gold-400 text-xl transition-colors z-10">
          ✕
        </button>

        {/* ── Fixed top: header + search ── */}
        <div className="px-8 pt-8 pb-0 shrink-0">
          <div className="text-center mb-6">
            <div className="text-3xl mb-2">🎞</div>
            <h2 className="font-display font-bold text-2xl gold-text">Choose the Movie</h2>
            <p className="text-gold-700 text-sm mt-1">Only you can see this — others will guess it!</p>
          </div>

          {/* Search box */}
          <div className="relative mb-2" data-search-container>
            <label className="block text-gold-600 text-xs uppercase tracking-widest mb-2">
              Movie Title
              {searchSource && (
                <span className="ml-2 normal-case text-gold-800">
                  via {searchSource === 'tmdb' ? '🎬 TMDb' : '🎵 iTunes'}
                </span>
              )}
            </label>
            <input
              ref={inputRef}
              className="input-dark pr-10"
              placeholder="Type any Bollywood movie name…"
              value={query}
              onChange={handleQueryChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results.length === 0) handleStart();
                if (e.key === 'Escape') setResults([]);
              }}
              autoFocus
            />
            {loading && (
              <span className="absolute right-3 top-[38px] text-gold-600 animate-pulse text-lg">⟳</span>
            )}

            {/* Dropdown */}
            {results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-[100] bg-ink-800 border border-gold-800 rounded-xl shadow-2xl"
                   style={{ maxHeight: '220px', overflowY: 'auto' }}>
                {results.map((m, i) => (
                  <button
                    key={i}
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(m); }}
                    className="w-full text-left px-4 py-3 hover:bg-ink-700 text-gold-300 text-sm font-body border-b border-ink-700 last:border-0 transition-colors flex justify-between items-center gap-2"
                  >
                    <span className="truncate">{m.title}</span>
                    {m.year && <span className="text-gold-700 text-xs shrink-0">{m.year}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search status */}
          {searchError ? (
            <p className="text-amber-400 text-xs mb-4">⚠️ {searchError}</p>
          ) : (
            <p className="text-gold-800 text-xs mb-4">
              {SERVER_URL
                ? 'Results load as you type. You can also type any title directly.'
                : '⚠️ Type any movie name directly — search unavailable until VITE_SERVER_URL is set.'}
            </p>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-8 space-y-5">

          {/* Blanks preview */}
          {movieTitle && (
            <div className="bg-ink-900 rounded-xl p-5 text-center">
              <p className="text-gold-700 text-xs uppercase tracking-widest mb-4">How others will see it</p>
              <div className="flex flex-wrap justify-center">{blanksPreview}</div>
            </div>
          )}

          {/* Hint letters */}
          <div>
            <label className="block text-gold-600 text-xs uppercase tracking-widest mb-1">
              Hint Letters <span className="normal-case text-gold-800">(optional)</span>
            </label>
            <p className="text-gold-800 text-xs mb-2">
              Type letters to pre-reveal them. e.g. <span className="font-mono text-gold-600">AK</span> reveals all A's and K's.
            </p>
            <input
              className={`input-dark uppercase font-mono text-xl tracking-widest ${hintError ? 'border-red-600' : ''}`}
              placeholder="optional…"
              value={hints}
              onChange={(e) => setHints(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
              disabled={!movieTitle}
              maxLength={10}
            />
            {hintLetters.length > 0 && !hintError && !allLettersRevealed && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {hintLetters.map((l) => (
                  <span key={l} className="font-mono text-xs bg-gold-900 border border-gold-700 text-gold-400 rounded px-2 py-0.5">
                    {l.toUpperCase()}
                  </span>
                ))}
              </div>
            )}
            {hintError && <p className="text-red-400 text-xs mt-1">{hintError}</p>}
            {allLettersRevealed && !hintError && (
              <p className="text-red-400 text-xs mt-1">
                ⚠️ Hints reveal the entire movie — remove some letters so players have something to guess!
              </p>
            )}
          </div>

          {/* Start button */}
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
    </div>
  );
}
