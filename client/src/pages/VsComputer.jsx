import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BOLLYWOOD_MOVIES } from '../data/bollywoodMovies';
import useSoloGame  from '../hooks/useSoloGame';
import MovieBlanks  from '../components/MovieBlanks';
import LivesDisplay from '../components/LivesDisplay';
import Keyboard     from '../components/Keyboard';
import Footer       from '../components/Footer';
import AdBanner     from '../components/AdBanner';

// ── Computer AI ───────────────────────────────────────────────────────────────
const ALL_LETTERS  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const FREQ_ORDER   = 'AIROSNHKLDEUPMTBCGWYFVZXQJ'.split(''); // common in Bollywood titles

/**
 * difficulty:
 *   easy   — picks a random letter from ALL remaining (genuinely random, slow)
 *   medium — picks from frequency list but with 40% chance of a random bad pick
 *   hard   — analyses THIS movie's blanks, picks the letter revealing the most
 */
function getComputerMove(movieName, guessedLetters, difficulty) {
  const lower     = movieName.toLowerCase();
  const guessedL  = guessedLetters.map(l => l.toLowerCase());
  const available = ALL_LETTERS.filter(l => !guessedL.includes(l.toLowerCase()));
  if (!available.length) return null;

  if (difficulty === 'easy') {
    // True random — computer has no strategy at all
    return available[Math.floor(Math.random() * available.length)];
  }

  if (difficulty === 'medium') {
    // Frequency-based but makes mistakes 40% of the time
    const freqAvail = FREQ_ORDER.filter(l => !guessedL.includes(l.toLowerCase()));
    if (Math.random() < 0.40 || freqAvail.length === 0) {
      // 40% random mistake
      return available[Math.floor(Math.random() * available.length)];
    }
    return freqAvail[0];
  }

  // Hard — pick letter that reveals the most blanks in THIS specific movie
  const blanksChars = [...lower].filter(ch => /[a-z]/.test(ch) && !guessedL.includes(ch));
  const freq = {};
  blanksChars.forEach(ch => { freq[ch.toUpperCase()] = (freq[ch.toUpperCase()] || 0) + 1; });

  // Sort available letters by frequency in the movie
  return [...available].sort((a, b) => (freq[b] || 0) - (freq[a] || 0))[0];
}

const DIFFICULTY_CONFIG = {
  easy:   { label: 'Easy',   emoji: '😊', color: 'text-green-400',   delay: 4500, desc: 'Random guesses — you have a clear advantage' },
  medium: { label: 'Medium', emoji: '🤔', color: 'text-gold-400',    delay: 2500, desc: 'Makes smart guesses but stumbles sometimes' },
  hard:   { label: 'Hard',   emoji: '😤', color: 'text-crimson-400', delay: 1200, desc: 'Analyses the movie — a real challenge' },
};

function pickRandomMovie() {
  return BOLLYWOOD_MOVIES[Math.floor(Math.random() * BOLLYWOOD_MOVIES.length)];
}

// Process one computer guess against the movie — pure function, returns new state
function processComputerGuess(letter, movie, blanks, wrongCount) {
  const lower     = movie.toLowerCase();
  const newBlanks = [...blanks];
  let   correct   = false;

  for (let i = 0; i < lower.length; i++) {
    if (lower[i] === letter.toLowerCase()) {
      newBlanks[i] = movie[i];
      correct = true;
    }
  }

  const newWrongCount = correct ? wrongCount : wrongCount + 1;
  const won  = !newBlanks.includes('_');
  const lost = newWrongCount >= 9;

  return { newBlanks, correct, newWrongCount, won, lost };
}

export default function VsComputer({ onBack }) {
  const [difficulty, setDifficulty] = useState(null);
  const [movie, setMovie]           = useState('');
  const [started, setStarted]       = useState(false);

  // Computer state — all in refs to avoid stale closures in setTimeout chains
  const compBlanksRef   = useRef([]);
  const compGuessedRef  = useRef([]);
  const compWrongRef    = useRef(0);

  // React state for rendering
  const [compBlanks, setCompBlanks]   = useState([]);
  const [compGuessed, setCompGuessed] = useState([]);
  const [compWrong, setCompWrong]     = useState(0);
  const [compStatus, setCompStatus]   = useState('idle'); // idle|playing|won|lost
  const [compLog, setCompLog]         = useState([]);
  const [thinking, setThinking]       = useState(false);

  const [roundOver, setRoundOver] = useState(false);
  const [scores, setScores]       = useState({ player: 0, computer: 0, draws: 0 });
  const timerRef = useRef(null);

  // Player game hook — only active when started
  const player = useSoloGame(started ? movie : '');

  // ── Start a new round ─────────────────────────────────────────────────────
  function startGame(diff) {
    clearTimeout(timerRef.current);
    const m = pickRandomMovie();
    const initBlanks = m.split('').map(ch => /[a-zA-Z0-9]/.test(ch) ? '_' : ch);

    compBlanksRef.current  = initBlanks;
    compGuessedRef.current = [];
    compWrongRef.current   = 0;

    setMovie(m);
    setDifficulty(diff);
    setCompBlanks(initBlanks);
    setCompGuessed([]);
    setCompWrong(0);
    setCompStatus('playing');
    setCompLog([]);
    setThinking(false);
    setRoundOver(false);
    setStarted(true);
  }

  // ── Single computer guess execution ──────────────────────────────────────
  const executeComputerGuess = useCallback(() => {
    if (!movie || !difficulty) return;

    const letter = getComputerMove(movie, compGuessedRef.current, difficulty);
    if (!letter) {
      // No moves left — computer loses
      setCompStatus('lost');
      return;
    }

    compGuessedRef.current = [...compGuessedRef.current, letter.toLowerCase()];
    const { newBlanks, correct, newWrongCount, won, lost } =
      processComputerGuess(letter, movie, compBlanksRef.current, compWrongRef.current);

    compBlanksRef.current = newBlanks;
    compWrongRef.current  = newWrongCount;

    setCompBlanks([...newBlanks]);
    setCompGuessed([...compGuessedRef.current]);
    setCompWrong(newWrongCount);
    setCompLog(prev => [...prev, { letter, correct }]);
    setThinking(false);

    if (won)  setCompStatus('won');
    else if (lost) setCompStatus('lost');
  }, [movie, difficulty]);

  // ── Trigger computer turn after player guesses ────────────────────────────
  // Only fires when player makes a guess AND computer is still playing
  const prevLastLetter = useRef(null);
  useEffect(() => {
    if (!started || compStatus !== 'playing') return;
    // Detect a new player guess (lastLetter changed to a non-null value)
    if (!player.lastLetter || player.lastLetter === prevLastLetter.current) return;
    prevLastLetter.current = player.lastLetter;

    setThinking(true);
    timerRef.current = setTimeout(executeComputerGuess, DIFFICULTY_CONFIG[difficulty].delay);
  }, [player.lastLetter, started, compStatus, difficulty, executeComputerGuess]);

  // ── When PLAYER finishes (won or lost), let computer keep playing alone ───
  // This fixes Bug 3: computer doesn't get a chance when player runs out of lives
  const playerFinishedRef = useRef(false);
  useEffect(() => {
    if (!started || compStatus !== 'playing') return;
    if (player.status !== 'won' && player.status !== 'lost') return;
    if (playerFinishedRef.current) return; // only trigger once
    playerFinishedRef.current = true;

    if (player.status === 'won') return; // player won — round will end via roundOver effect

    // Player lost — computer plays autonomously until it wins or loses
    function autoPlay() {
      if (compStatus !== 'playing') return;
      setThinking(true);
      timerRef.current = setTimeout(() => {
        if (compBlanksRef.current.includes('_') && compWrongRef.current < 9) {
          executeComputerGuess();
          // Schedule next auto guess if computer is still playing
          timerRef.current = setTimeout(autoPlay, DIFFICULTY_CONFIG[difficulty].delay);
        }
      }, DIFFICULTY_CONFIG[difficulty].delay);
    }
    autoPlay();
  }, [player.status, started, compStatus, difficulty, executeComputerGuess]);

  // ── Detect round over ─────────────────────────────────────────────────────
  // Fix: use 'won'|'lost' explicitly — never check for 'idle' or '!playing'
  useEffect(() => {
    if (!started || roundOver) return;

    const pWon  = player.status === 'won';
    const pLost = player.status === 'lost';
    const cWon  = compStatus === 'won';
    const cLost = compStatus === 'lost';

    // Round ends when: either wins, OR both have lost
    const shouldEnd = pWon || cWon || (pLost && cLost);
    if (!shouldEnd) return;

    clearTimeout(timerRef.current);
    setThinking(false);
    setRoundOver(true);
    playerFinishedRef.current = false;

    // Score update
    if (pWon && !cWon) {
      setScores(s => ({ ...s, player: s.player + 1 }));
    } else if (cWon && !pWon) {
      setScores(s => ({ ...s, computer: s.computer + 1 }));
    } else {
      // Both won simultaneously or both lost
      setScores(s => ({ ...s, draws: s.draws + 1 }));
    }
  }, [player.status, compStatus, started, roundOver]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Derived: computer wrong letters for LivesDisplay
  const compWrongLetters = compGuessed
    .filter(l => !movie.toLowerCase().includes(l))
    .map(l => l.toUpperCase());

  // ── Difficulty picker screen ──────────────────────────────────────────────
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
            <p className="text-gold-700 text-sm font-body max-w-xs">
              You and the computer guess the same movie. Computer goes after each of your guesses — but keeps playing if you lose!
            </p>
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
        </main>
        <Footer />
      </div>
    );
  }

  // ── Active game ──────────────────────────────────────────────────────────
  const cfg       = DIFFICULTY_CONFIG[difficulty];
  const playerWon = player.status === 'won';
  const compWon   = compStatus === 'won';
  const playerLost = player.status === 'lost';
  const compLost   = compStatus === 'lost';

  return (
    <div className="bg-cinema min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b border-ink-700 bg-ink-950 bg-opacity-95 backdrop-blur shrink-0">
        <button onClick={onBack} className="btn-ghost text-sm px-3 py-1.5 shrink-0">← Back</button>
        <div className="flex-1 text-center">
          <span className="font-display font-bold text-gold-400 text-sm">🤖 vs Computer</span>
          <span className={`ml-2 text-xs font-body ${cfg.color}`}>{cfg.emoji} {cfg.label}</span>
        </div>
        <div className="flex gap-3 text-xs shrink-0">
          <div className="text-center"><p className="font-bold text-gold-400">{scores.player}</p><p className="text-gold-800">You</p></div>
          <div className="text-center"><p className="font-bold text-gold-600">{scores.draws}</p><p className="text-gold-800">Draw</p></div>
          <div className="text-center"><p className="font-bold text-crimson-400">{scores.computer}</p><p className="text-gold-800">CPU</p></div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 pt-5 pb-24 md:pb-6 space-y-4">

          {/* Two board columns — min-w-0 + overflow-hidden prevents tile overflow */}
          <div className="grid md:grid-cols-2 gap-4">

            {/* ── Player board ── */}
            <div className={`card-dark rounded-xl p-4 border-2 transition-all min-w-0 overflow-hidden ${
              playerWon ? 'border-green-600' : playerLost ? 'border-crimson-700' : 'border-gold-700'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-body font-bold text-sm text-gold-300">🧑 You</span>
                <span className={`text-xs font-body font-semibold ${playerWon ? 'text-green-400' : playerLost ? 'text-crimson-400' : 'text-gold-600'}`}>
                  {playerWon ? '🏆 Won!' : playerLost ? '💔 Lost' : `${player.livesLeft} lives`}
                </span>
              </div>
              {/* overflow-hidden on a wrapper clips tiles to card width */}
              <div className="overflow-hidden">
                <MovieBlanks blanks={player.blanks} lastRevealed={player.lastRevealed} />
              </div>
              <div className="mt-3">
                <LivesDisplay livesLeft={player.livesLeft} wrongLetters={player.wrongLetters} />
              </div>
              {player.lastLetter && (
                <p className={`text-center text-xs mt-2 font-body ${player.lastCorrect ? 'text-green-400' : 'text-crimson-400'}`}>
                  <span className="font-mono font-bold">{player.lastLetter}</span>
                  {player.lastCorrect ? ' ✓' : ' ✗'}
                </p>
              )}
            </div>

            {/* ── Computer board ── */}
            <div className={`card-dark rounded-xl p-4 border-2 transition-all min-w-0 overflow-hidden ${
              compWon ? 'border-crimson-600' : compLost ? 'border-green-700' : 'border-ink-600'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-body font-bold text-sm text-gold-300 flex items-center gap-2">
                  🤖 Computer
                  {thinking && !roundOver && (
                    <span className="text-gold-600 text-xs animate-pulse">thinking…</span>
                  )}
                </span>
                <span className={`text-xs font-body font-semibold ${compWon ? 'text-crimson-400' : compLost ? 'text-green-400' : 'text-gold-600'}`}>
                  {compWon ? '🤖 Won!' : compLost ? '✓ Defeated!' : `${9 - compWrong} lives`}
                </span>
              </div>
              <div className="overflow-hidden">
                <MovieBlanks blanks={compBlanks} lastRevealed={new Set()} />
              </div>
              <div className="mt-3">
                <LivesDisplay livesLeft={Math.max(0, 9 - compWrong)} wrongLetters={compWrongLetters} />
              </div>
              {compLog.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {compLog.slice(-10).map((e, i) => (
                    <span key={i} className={`font-mono text-xs rounded px-1.5 py-0.5 ${e.correct ? 'bg-green-900 text-green-400' : 'bg-crimson-900 text-crimson-400 line-through'}`}>
                      {e.letter}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop keyboard */}
          {!roundOver && (
            <div className="hidden md:block card-dark rounded-xl py-5 px-4">
              <Keyboard
                guessedLetters={player.guessedLetters}
                wrongLetters={player.wrongLetters}
                onGuess={player.guess}
                disabled={player.status !== 'playing'}
              />
            </div>
          )}

          {/* Round over card */}
          {roundOver && (
            <div className={`card-dark rounded-2xl p-6 text-center border animate-bounce-in ${
              playerWon && !compWon ? 'border-green-600' :
              compWon && !playerWon ? 'border-crimson-600' : 'border-gold-700'
            }`}>
              <div className="text-5xl mb-3">
                {playerWon && !compWon ? '🏆' :
                 compWon && !playerWon ? '😤' :
                 playerWon && compWon  ? '🤝' : '💀'}
              </div>
              <h2 className={`font-display font-black text-3xl mb-2 ${
                playerWon && !compWon ? 'text-green-400' :
                compWon && !playerWon ? 'text-crimson-400' : 'gold-text'
              }`}>
                {playerWon && !compWon ? 'You Win!' :
                 compWon && !playerWon ? 'Computer Wins!' :
                 playerWon && compWon  ? "It's a Draw!" :
                 'Both Lost!'}
              </h2>
              <p className="text-gold-700 text-sm font-body mb-1">The movie was</p>
              <p className="font-display font-bold text-2xl text-gold-300 mb-5">{movie}</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={() => startGame(difficulty)} className="btn-gold px-6 py-3">🎬 Next Movie</button>
                <button
                  onClick={() => { setStarted(false); setScores({ player: 0, computer: 0, draws: 0 }); }}
                  className="btn-ghost px-6 py-3"
                >
                  Change Difficulty
                </button>
              </div>
            </div>
          )}

          <AdBanner slot="SLOT_ID_1" format="auto" className="w-full max-w-xl mx-auto" />
        </div>
      </main>

      {/* Mobile keyboard */}
      {!roundOver && player.status === 'playing' && (
        <div className="md:hidden sticky bottom-0 z-20 bg-ink-900 border-t border-ink-700 px-3 py-3 shadow-2xl">
          <Keyboard
            guessedLetters={player.guessedLetters}
            wrongLetters={player.wrongLetters}
            onGuess={player.guess}
            disabled={false}
            compact
          />
        </div>
      )}

      <Footer />
    </div>
  );
}
