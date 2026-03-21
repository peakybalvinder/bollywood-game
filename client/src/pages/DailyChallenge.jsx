import React, { useState, useEffect, useCallback } from 'react';
import { getDailyMovie, getDayNumber, getTodayKey } from '../data/bollywoodMovies';
import useSoloGame from '../hooks/useSoloGame';
import MovieBlanks   from '../components/MovieBlanks';
import LivesDisplay  from '../components/LivesDisplay';
import Keyboard      from '../components/Keyboard';
import Footer        from '../components/Footer';
import AdBanner      from '../components/AdBanner';

const MOVIE     = getDailyMovie();
const DAY_NUM   = getDayNumber();
const TODAY_KEY = getTodayKey();
const LS_KEY    = `filmipaheli_daily_${TODAY_KEY}`;
const STREAK_KEY = 'filmipaheli_streak';

function loadSavedState() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { return null; }
}
function loadStreak() {
  try { return JSON.parse(localStorage.getItem(STREAK_KEY) || '{"current":0,"best":0,"lastWon":""}'); }
  catch { return { current: 0, best: 0, lastWon: '' }; }
}

function buildShareText(status, wrongCount, totalGuesses) {
  const score = status === 'won' ? `${totalGuesses} guess${totalGuesses !== 1 ? 'es' : ''}` : 'X';
  const lives = 9 - wrongCount;
  const hearts = '🟥'.repeat(wrongCount) + '🟩'.repeat(lives);
  return `FilmiPaheli Daily #${DAY_NUM}\n${score} — ${lives}/9 lives left\n${hearts}\n\nhttps://www.filmipaheli.com`;
}

export default function DailyChallenge({ onBack }) {
  const saved = loadSavedState();

  const game = useSoloGame(MOVIE);
  const [finished, setFinished]       = useState(false);
  const [showResult, setShowResult]   = useState(false);
  const [copied, setCopied]           = useState(false);
  const [streak, setStreak]           = useState(loadStreak);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);

  // Restore saved state (played today already)
  useEffect(() => {
    if (saved && saved.status !== 'playing') {
      setAlreadyPlayed(true);
      setShowResult(true);
    }
  }, []);

  // Detect game over
  useEffect(() => {
    if ((game.status === 'won' || game.status === 'lost') && !finished) {
      setFinished(true);
      setShowResult(true);

      // Save to localStorage
      const state = {
        status: game.status,
        wrongCount: game.wrongLetters.length,
        totalGuesses: game.guessedLetters.length,
        date: TODAY_KEY,
      };
      localStorage.setItem(LS_KEY, JSON.stringify(state));

      // Update streak
      const s = loadStreak();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;

      if (game.status === 'won') {
        const newCurrent = s.lastWon === yKey ? s.current + 1 : 1;
        const newBest    = Math.max(newCurrent, s.best);
        const newStreak  = { current: newCurrent, best: newBest, lastWon: TODAY_KEY };
        setStreak(newStreak);
        localStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
      } else {
        // Lost — reset streak
        const newStreak = { current: 0, best: s.best, lastWon: s.lastWon };
        setStreak(newStreak);
        localStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
      }
    }
  }, [game.status, finished, game.wrongLetters.length, game.guessedLetters.length]);

  function handleShare() {
    const s   = saved || { status: game.status, wrongCount: game.wrongLetters.length, totalGuesses: game.guessedLetters.length };
    const txt = buildShareText(s.status, s.wrongCount, s.totalGuesses);
    navigator.clipboard.writeText(txt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const displaySaved = alreadyPlayed && saved;

  return (
    <div className="bg-cinema min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 md:px-8 py-3 border-b border-ink-700 bg-ink-950 bg-opacity-95 backdrop-blur shrink-0">
        <button onClick={onBack} className="btn-ghost text-sm px-3 py-1.5 shrink-0">← Back</button>
        <div className="flex-1 text-center">
          <span className="font-display font-bold text-gold-400 text-base">🎯 Daily Challenge</span>
          <span className="text-gold-700 text-xs ml-2 font-body">#{DAY_NUM}</span>
        </div>
        <div className="flex gap-3 text-xs font-body shrink-0">
          <div className="text-center">
            <p className="font-bold text-gold-400">{streak.current}</p>
            <p className="text-gold-800">Streak</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-gold-400">{streak.best}</p>
            <p className="text-gold-800">Best</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 pt-6 pb-6 gap-5 max-w-2xl mx-auto w-full">

        {/* Today's date */}
        <p className="text-gold-700 text-sm font-body">
          {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </p>

        {/* Already played today — show result */}
        {displaySaved ? (
          <div className="w-full space-y-5 animate-fade-in">
            <div className={`card-dark rounded-2xl p-6 text-center border ${saved.status === 'won' ? 'border-green-600' : 'border-crimson-700'}`}>
              <div className="text-5xl mb-3">{saved.status === 'won' ? '🏆' : '💔'}</div>
              <h2 className={`font-display font-black text-3xl mb-2 ${saved.status === 'won' ? 'gold-text' : 'text-crimson-400'}`}>
                {saved.status === 'won' ? 'Sahi Jawab!' : 'Better Luck Tomorrow!'}
              </h2>
              <p className="text-gold-700 font-body text-sm mb-1">Today's movie was</p>
              <p className="font-display font-bold text-2xl text-gold-300 mb-4">{MOVIE}</p>
              {saved.status === 'won' && (
                <p className="text-green-400 text-sm font-body mb-4">
                  Guessed in {saved.totalGuesses} tries with {9 - saved.wrongCount} lives remaining!
                </p>
              )}
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={handleShare} className="btn-gold px-6 py-2.5">
                  {copied ? '✓ Copied!' : '📤 Share Result'}
                </button>
                <div className="text-center">
                  <p className="text-gold-700 text-xs mb-1">Come back tomorrow for</p>
                  <p className="text-gold-400 text-sm font-body">Daily Challenge #{DAY_NUM + 1}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: '🔥', value: streak.current, label: 'Current Streak' },
                { icon: '🏆', value: streak.best,    label: 'Best Streak'    },
                { icon: '🎯', value: `#${DAY_NUM}`,  label: 'Challenge'      },
              ].map(s => (
                <div key={s.label} className="card-dark rounded-xl p-4 text-center">
                  <p className="text-2xl mb-1">{s.icon}</p>
                  <p className="font-display font-bold text-xl text-gold-400">{s.value}</p>
                  <p className="text-gold-700 text-xs font-body">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Active game */
          <div className="w-full space-y-4 animate-fade-in">
            {/* Blanks */}
            <div className="py-2">
              <MovieBlanks blanks={game.blanks} lastRevealed={game.lastRevealed} />
            </div>

            {/* Guess feedback */}
            {game.lastLetter && (
              <p className={`text-center text-sm font-body animate-fade-in ${game.lastCorrect ? 'text-green-400' : 'text-crimson-400'}`}>
                <span className="font-mono font-bold">{game.lastLetter}</span>
                {game.lastCorrect ? ' ✓ — Correct!' : ' ✗ — Wrong!'}
              </p>
            )}

            {/* Lives */}
            <div className="card-dark rounded-xl py-4 px-4">
              <LivesDisplay livesLeft={game.livesLeft} wrongLetters={game.wrongLetters} />
            </div>

            {/* Progress */}
            <div className="space-y-1">
              <div className="w-full bg-ink-700 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-crimson-600 to-gold-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${game.blanks.filter(c => c !== ' ' && c !== '_' && !/[a-zA-Z0-9]/.test(c) || (c !== '_' && c !== ' ')).length / Math.max(1, game.blanks.filter(c => c !== ' ').length) * 100}%` }} />
              </div>
              <p className="text-center text-gold-800 text-xs font-body">
                {game.guessedLetters.length} guesses · {game.wrongLetters.length} wrong
              </p>
            </div>

            {/* Desktop keyboard */}
            <div className="hidden md:block card-dark rounded-xl py-5 px-4">
              <Keyboard guessedLetters={game.guessedLetters} wrongLetters={game.wrongLetters} onGuess={game.guess} disabled={game.status !== 'playing'} />
            </div>
          </div>
        )}

        {/* Game over overlay (first time) */}
        {showResult && !alreadyPlayed && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{background:'rgba(5,2,2,0.88)',backdropFilter:'blur(6px)'}}>
            <div className="card-dark rounded-2xl p-8 w-full max-w-md text-center animate-bounce-in">
              <div className="text-6xl mb-4">{game.status === 'won' ? '🎉' : '💔'}</div>
              <h2 className={`font-display font-black text-4xl mb-2 ${game.status === 'won' ? 'gold-text' : 'text-crimson-400'}`}>
                {game.status === 'won' ? 'Sahi Jawab!' : 'Game Over!'}
              </h2>
              <p className="text-gold-700 text-sm font-body mb-1">Today's movie was</p>
              <p className="font-display font-bold text-2xl text-gold-300 mb-4">{MOVIE}</p>
              {game.status === 'won' && (
                <p className="text-green-400 text-sm font-body mb-4">
                  Guessed in {game.guessedLetters.length} tries · {game.livesLeft} lives left · Streak: {streak.current} 🔥
                </p>
              )}
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={handleShare} className="btn-gold px-6 py-3">
                  {copied ? '✓ Copied!' : '📤 Share Result'}
                </button>
                <button onClick={() => setShowResult(false)} className="btn-ghost px-6 py-3">View Board</button>
              </div>
            </div>
          </div>
        )}

        <AdBanner slot="SLOT_ID_1" format="auto" className="w-full max-w-xl" />
      </main>

      {/* Mobile keyboard */}
      {!displaySaved && game.status === 'playing' && (
        <div className="md:hidden sticky bottom-0 z-20 bg-ink-900 border-t border-ink-700 px-3 py-3 shadow-2xl">
          <Keyboard guessedLetters={game.guessedLetters} wrongLetters={game.wrongLetters} onGuess={game.guess} disabled={false} compact />
        </div>
      )}

      <Footer />
    </div>
  );
}
