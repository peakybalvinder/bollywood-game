import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BOLLYWOOD_MOVIES } from '../data/bollywoodMovies';
import useSoloGame   from '../hooks/useSoloGame';
import MovieBlanks   from '../components/MovieBlanks';
import LivesDisplay  from '../components/LivesDisplay';
import Keyboard      from '../components/Keyboard';
import Footer        from '../components/Footer';
import AdBanner      from '../components/AdBanner';

/* ── Computer AI ──────────────────────────────────────────────────────────── */
// Letter frequency in Bollywood movie titles (empirically weighted)
const FREQ_ORDER = 'AIROSNHKLDEUPMTBCGWYFVZXQJ'.split('');

function getComputerMove(movieName, guessedLetters, difficulty) {
  const lower     = movieName.toLowerCase();
  const available = FREQ_ORDER.filter(l => !guessedLetters.includes(l.toLowerCase()));
  if (!available.length) return null;

  if (difficulty === 'easy') {
    // Random from remaining letters
    return available[Math.floor(Math.random() * available.length)];
  }

  if (difficulty === 'medium') {
    // Pick most common letter from frequency list
    return available[0];
  }

  // Hard: analyse the movie — pick letter that reveals the most blanks
  const blanksLeft = [...lower].filter((ch, i) =>
    /[a-z]/.test(ch) && !guessedLetters.includes(ch)
  );
  const freq = {};
  blanksLeft.forEach(ch => { freq[ch.toUpperCase()] = (freq[ch.toUpperCase()] || 0) + 1; });

  // Sort available by frequency in this specific movie
  const sorted = available.sort((a, b) => (freq[b] || 0) - (freq[a] || 0));
  return sorted[0];
}

const DIFFICULTY_CONFIG = {
  easy:   { label: 'Easy',   emoji: '😊', color: 'text-green-400',  delay: 3500, desc: 'Random letters — you have the advantage' },
  medium: { label: 'Medium', emoji: '🤔', color: 'text-gold-400',   delay: 2000, desc: 'Common Bollywood letters — fair fight' },
  hard:   { label: 'Hard',   emoji: '😤', color: 'text-crimson-400', delay: 1200, desc: 'Analyses the movie — a real challenge' },
};

function pickRandomMovie() {
  return BOLLYWOOD_MOVIES[Math.floor(Math.random() * BOLLYWOOD_MOVIES.length)];
}

export default function VsComputer({ onBack }) {
  const [difficulty, setDifficulty] = useState(null);
  const [movie, setMovie]           = useState('');
  const [started, setStarted]       = useState(false);
  const [computerGuesses, setComputerGuesses] = useState([]);
  const [computerLog, setComputerLog]         = useState([]);
  const [computerStatus, setComputerStatus]   = useState('playing'); // playing|won|lost
  const [computerLives, setComputerLives]     = useState(9);
  const [thinking, setThinking]               = useState(false);
  const [roundOver, setRoundOver]             = useState(false);
  const [scores, setScores]                   = useState({ player: 0, computer: 0, draws: 0 });
  const computerTimerRef = useRef(null);

  // Player's game
  const player = useSoloGame(started ? movie : '');

  // Computer's game — separate state tracking
  const computerBlanksRef = useRef([]);
  const computerGuessedRef = useRef([]);

  function startGame(diff, customMovie) {
    const m = customMovie || pickRandomMovie();
    setMovie(m);
    setDifficulty(diff);
    setStarted(true);
    setComputerGuesses([]);
    setComputerLog([]);
    setComputerStatus('playing');
    setComputerLives(9);
    setThinking(false);
    setRoundOver(false);
    computerBlanksRef.current = m.split('').map(ch => /[a-zA-Z0-9]/.test(ch) ? '_' : ch);
    computerGuessedRef.current = [];
  }

  // Computer's turn — fires after player guesses
  const computerTurn = useCallback(() => {
    if (computerStatus !== 'playing' || !movie) return;
    const config = DIFFICULTY_CONFIG[difficulty];
    setThinking(true);

    computerTimerRef.current = setTimeout(() => {
      const letter = getComputerMove(movie, computerGuessedRef.current, difficulty);
      if (!letter) return;

      computerGuessedRef.current = [...computerGuessedRef.current, letter.toLowerCase()];
      setComputerGuesses([...computerGuessedRef.current]);

      // Process computer guess
      const lower    = movie.toLowerCase();
      const newBlanks = [...computerBlanksRef.current];
      let   correct  = false;

      for (let i = 0; i < lower.length; i++) {
        if (lower[i] === letter.toLowerCase()) {
          newBlanks[i] = movie[i];
          correct = true;
        }
      }
      computerBlanksRef.current = newBlanks;

      const won  = !newBlanks.includes('_');
      const lost = !correct && computerGuessedRef.current.filter(l =>
        !movie.toLowerCase().includes(l)
      ).length >= 9;

      setComputerLog(prev => [...prev, { letter, correct, won, lost }]);
      setThinking(false);

      if (won) {
        setComputerStatus('won');
      } else if (lost) {
        setComputerStatus('lost');
        setComputerLives(0);
      } else if (!correct) {
        setComputerLives(prev => prev - 1);
      }
    }, config.delay);
  }, [computerStatus, movie, difficulty]);

  // After player guesses, trigger computer's turn
  useEffect(() => {
    if (!started || player.status !== 'playing' || computerStatus !== 'playing') return;
    if (player.lastLetter) computerTurn();
  }, [player.lastLetter, started, player.status, computerStatus, computerTurn]);

  // Detect round over
  useEffect(() => {
    if (!started || roundOver) return;
    const pDone = player.status !== 'playing';
    const cDone = computerStatus !== 'playing';
    if (pDone || cDone) {
      clearTimeout(computerTimerRef.current);
      setRoundOver(true);
      setThinking(false);

      if (player.status === 'won' && computerStatus !== 'won') {
        setScores(s => ({ ...s, player: s.player + 1 }));
      } else if (computerStatus === 'won' && player.status !== 'won') {
        setScores(s => ({ ...s, computer: s.computer + 1 }));
      } else if (player.status === 'won' && computerStatus === 'won') {
        setScores(s => ({ ...s, draws: s.draws + 1 }));
      } else {
        setScores(s => ({ ...s, draws: s.draws + 1 }));
      }
    }
  }, [player.status, computerStatus, started, roundOver]);

  // Computer wrong letters (letters that don't appear in movie)
  const computerWrong = computerGuesses
    .filter(l => !movie.toLowerCase().includes(l))
    .map(l => l.toUpperCase());

  /* ── Render: difficulty picker ── */
  if (!started) {
    return (
      <div className="bg-cinema min-h-screen flex flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b border-ink-700 bg-ink-950 bg-opacity-95 backdrop-blur shrink-0">
          <button onClick={onBack} className="btn-ghost text-sm px-3 py-1.5">← Back</button>
          <span className="font-display font-bold text-gold-400 text-base flex-1 text-center">🤖 vs Computer</span>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 gap-8">
          <div className="text-center">
            <div className="text-5xl mb-4">🤖</div>
            <h1 className="font-display font-black text-3xl gold-text mb-2">Play vs Computer</h1>
            <p className="text-gold-700 text-sm font-body">You and the computer guess the same movie simultaneously. Who wins?</p>
          </div>

          <div className="w-full max-w-md space-y-3">
            <p className="text-gold-600 text-xs uppercase tracking-widest font-body text-center mb-4">Choose Difficulty</p>
            {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => startGame(key)}
                className="w-full card-dark rounded-xl p-5 flex items-center gap-4 hover:border-gold-600 transition-all duration-200 text-left group"
              >
                <span className="text-3xl">{cfg.emoji}</span>
                <div className="flex-1">
                  <p className={`font-display font-bold text-lg ${cfg.color}`}>{cfg.label}</p>
                  <p className="text-gold-700 text-sm font-body">{cfg.desc}</p>
                </div>
                <span className="text-gold-700 group-hover:text-gold-400 transition-colors text-xl">→</span>
              </button>
            ))}
          </div>

          <p className="text-gold-800 text-xs font-body text-center max-w-sm">
            A random Bollywood movie is picked each round. Both you and the computer guess simultaneously — the computer goes after each of your guesses.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Render: active game ── */
  const config   = DIFFICULTY_CONFIG[difficulty];
  const playerWon = player.status === 'won';
  const compWon   = computerStatus === 'won';

  return (
    <div className="bg-cinema min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b border-ink-700 bg-ink-950 bg-opacity-95 backdrop-blur shrink-0">
        <button onClick={onBack} className="btn-ghost text-sm px-3 py-1.5 shrink-0">← Back</button>
        <div className="flex-1 text-center">
          <span className="font-display font-bold text-gold-400 text-sm">🤖 vs Computer</span>
          <span className={`ml-2 text-xs font-body ${config.color}`}>{config.emoji} {config.label}</span>
        </div>
        {/* Score */}
        <div className="flex gap-3 text-xs shrink-0">
          <div className="text-center"><p className="font-bold text-gold-400">{scores.player}</p><p className="text-gold-800">You</p></div>
          <div className="text-center"><p className="font-bold text-gold-600">{scores.draws}</p><p className="text-gold-800">Draw</p></div>
          <div className="text-center"><p className="font-bold text-crimson-400">{scores.computer}</p><p className="text-gold-800">CPU</p></div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 pt-5 pb-24 md:pb-6 space-y-4">

          {/* Two columns: Player | Computer */}
          <div className="grid md:grid-cols-2 gap-4">

            {/* Player board */}
            <div className={`card-dark rounded-xl p-4 border-2 transition-all ${playerWon ? 'border-green-600' : player.status === 'lost' ? 'border-crimson-700' : 'border-gold-700'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-body font-bold text-sm text-gold-300 flex items-center gap-2">
                  🧑 You
                  {thinking && player.status === 'playing' && <span className="text-gold-600 text-xs">(your turn)</span>}
                </span>
                <span className={`text-xs font-body font-semibold ${playerWon ? 'text-green-400' : player.status === 'lost' ? 'text-crimson-400' : 'text-gold-600'}`}>
                  {playerWon ? '🏆 Won!' : player.status === 'lost' ? '💔 Lost' : `${player.livesLeft} lives`}
                </span>
              </div>
              <MovieBlanks blanks={player.blanks} lastRevealed={player.lastRevealed} />
              <div className="mt-3">
                <LivesDisplay livesLeft={player.livesLeft} wrongLetters={player.wrongLetters} />
              </div>
            </div>

            {/* Computer board */}
            <div className={`card-dark rounded-xl p-4 border-2 transition-all ${compWon ? 'border-crimson-600' : computerStatus === 'lost' ? 'border-green-700' : 'border-ink-600'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-body font-bold text-sm text-gold-300 flex items-center gap-2">
                  🤖 Computer
                  {thinking && <span className="text-gold-600 text-xs animate-pulse">thinking…</span>}
                </span>
                <span className={`text-xs font-body font-semibold ${compWon ? 'text-crimson-400' : computerStatus === 'lost' ? 'text-green-400' : 'text-gold-600'}`}>
                  {compWon ? '🤖 Won!' : computerStatus === 'lost' ? '✓ Defeated!' : `${computerLives} lives`}
                </span>
              </div>
              <MovieBlanks blanks={computerBlanksRef.current} lastRevealed={new Set()} />
              <div className="mt-3">
                <LivesDisplay livesLeft={computerLives} wrongLetters={computerWrong} />
              </div>

              {/* Computer's move log */}
              {computerLog.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {computerLog.slice(-8).map((entry, i) => (
                    <span key={i} className={`font-mono text-xs rounded px-1.5 py-0.5 ${entry.correct ? 'bg-green-900 text-green-400' : 'bg-crimson-900 text-crimson-400 line-through'}`}>
                      {entry.letter}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Player keyboard — desktop */}
          {!roundOver && (
            <div className="hidden md:block card-dark rounded-xl py-5 px-4">
              <Keyboard guessedLetters={player.guessedLetters} wrongLetters={player.wrongLetters} onGuess={player.guess} disabled={player.status !== 'playing'} />
            </div>
          )}

          {/* Round over result */}
          {roundOver && (
            <div className={`card-dark rounded-2xl p-6 text-center border animate-bounce-in ${
              playerWon && !compWon ? 'border-green-600' :
              compWon && !playerWon ? 'border-crimson-600' : 'border-gold-700'
            }`}>
              <div className="text-5xl mb-3">
                {playerWon && !compWon ? '🏆' : compWon && !playerWon ? '😤' : '🤝'}
              </div>
              <h2 className={`font-display font-black text-3xl mb-2 ${
                playerWon && !compWon ? 'text-green-400' :
                compWon && !playerWon ? 'text-crimson-400' : 'gold-text'
              }`}>
                {playerWon && !compWon ? 'You Win!' :
                 compWon && !playerWon ? 'Computer Wins!' :
                 playerWon && compWon ? "It's a Draw!" : 'Neither Won!'}
              </h2>
              <p className="text-gold-700 text-sm font-body mb-1">The movie was</p>
              <p className="font-display font-bold text-2xl text-gold-300 mb-5">{movie}</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={() => startGame(difficulty)} className="btn-gold px-6 py-3">🎬 Next Movie</button>
                <button onClick={() => { setStarted(false); setScores({player:0,computer:0,draws:0}); }} className="btn-ghost px-6 py-3">Change Difficulty</button>
              </div>
            </div>
          )}

          <AdBanner slot="SLOT_ID_1" format="auto" className="w-full max-w-xl mx-auto" />
        </div>
      </main>

      {/* Mobile keyboard */}
      {!roundOver && player.status === 'playing' && (
        <div className="md:hidden sticky bottom-0 z-20 bg-ink-900 border-t border-ink-700 px-3 py-3 shadow-2xl">
          <Keyboard guessedLetters={player.guessedLetters} wrongLetters={player.wrongLetters} onGuess={player.guess} disabled={false} compact />
        </div>
      )}

      <Footer />
    </div>
  );
}
