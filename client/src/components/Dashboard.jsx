import React from 'react';
import Footer   from './Footer';
import AdBanner from './AdBanner';
import { getDayNumber, getDailyMovie, getTodayKey } from '../data/bollywoodMovies';

function FilmReel({ size = 64, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="32" cy="32" r="30" stroke="#A07500" strokeWidth="2" strokeDasharray="4 2" />
      <circle cx="32" cy="32" r="20" stroke="#A07500" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="6" fill="#A07500" />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x = 32 + 26 * Math.cos(rad);
        const y = 32 + 26 * Math.sin(rad);
        return <circle key={deg} cx={x} cy={y} r="4" fill="#3D1515" stroke="#A07500" strokeWidth="1" />;
      })}
    </svg>
  );
}

function todayPlayed() {
  try {
    const s = JSON.parse(localStorage.getItem(`filmipaheli_daily_${getTodayKey()}`) || 'null');
    return s && s.status !== 'playing';
  } catch { return false; }
}

export default function Dashboard({ onCreateParty, onJoinParty, onDailyChallenge, onVsComputer }) {
  const played = todayPlayed();

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden animate-fade-in">

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-crimson-900 rounded-full opacity-10 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-gold-900 opacity-8 rounded-full blur-[100px]" />
        <FilmReel size={180} className="absolute top-8 right-8 opacity-5 animate-flicker hidden lg:block" />
        <FilmReel size={120} className="absolute bottom-24 left-6 opacity-5 animate-flicker hidden lg:block" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="film-strip w-full relative z-10" />

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center justify-center px-4 py-8 text-center">

        <div className="flex items-center justify-center gap-4 mb-5">
          <FilmReel size={44} className="opacity-50 hidden sm:block" />
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-gold-600 opacity-20 rounded-full scale-150" />
            <span className="relative text-5xl sm:text-6xl">🎬</span>
          </div>
          <FilmReel size={44} className="opacity-50 scale-x-[-1] hidden sm:block" />
        </div>

        <p className="font-display text-xs tracking-[0.4em] uppercase text-gold-700 mb-1">Welcome to</p>
        <h1 className="font-display font-black leading-none mb-2 select-none">
          <span className="gold-text text-6xl sm:text-7xl md:text-8xl">Filmi</span>
          <span className="text-crimson-400 italic text-4xl sm:text-5xl md:text-7xl">Paheli</span>
        </h1>
        <p className="text-gold-600 font-display italic text-lg mb-1 select-none">फ़िल्मी पहेली</p>
        <p className="text-gold-700 font-body text-sm tracking-widest uppercase mb-8">
          ✦ Guess the Bollywood movie · Outwit your friends ✦
        </p>

        {/* ── Two mode cards ── */}
        <div className="w-full max-w-2xl grid sm:grid-cols-2 gap-4 mb-6">

          {/* Multiplayer card */}
          <div className="card-dark rounded-2xl p-6 text-left border border-ink-600 hover:border-gold-700 transition-all duration-200">
            <p className="text-2xl mb-3">👥</p>
            <p className="font-display font-bold text-lg text-gold-400 mb-1">Multiplayer</p>
            <p className="text-gold-700 text-sm font-body mb-4">Play with friends in real time. One host picks the movie, everyone guesses.</p>
            <div className="flex flex-col gap-2">
              <button onClick={onCreateParty} className="btn-gold w-full py-3 font-semibold">
                🎬 Create a Party
              </button>
              <button onClick={onJoinParty} className="btn-ghost w-full py-3">
                🎟 Join a Party
              </button>
            </div>
          </div>

          {/* Solo play card */}
          <div className="card-dark rounded-2xl p-6 text-left border border-ink-600 hover:border-gold-700 transition-all duration-200">
            <p className="text-2xl mb-3">🎯</p>
            <p className="font-display font-bold text-lg text-gold-400 mb-1">Solo Play</p>
            <p className="text-gold-700 text-sm font-body mb-4">Play alone with daily challenges or go head-to-head against the computer.</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={onDailyChallenge}
                className="w-full py-3 rounded-lg font-body font-semibold text-sm transition-all duration-150 border relative
                  bg-gradient-to-b from-crimson-700 to-crimson-900 border-crimson-600 text-gold-200
                  hover:from-crimson-600 hover:to-crimson-800 active:scale-95"
              >
                🎯 Daily Challenge #{getDayNumber()}
                {played && (
                  <span className="absolute top-1 right-2 text-[10px] text-green-400">✓ Done</span>
                )}
              </button>
              <button onClick={onVsComputer} className="btn-ghost w-full py-3 text-sm">
                🤖 vs Computer
              </button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mb-4 text-xs font-body">
          {[
            { icon: '🎬', label: 'Any Bollywood Movie' },
            { icon: '🆓', label: 'Free · No Login'    },
            { icon: '⚡', label: 'Real-time'           },
            { icon: '📱', label: 'Mobile Friendly'     },
          ].map(s => (
            <span key={s.label} className="text-gold-700 flex items-center gap-1.5">
              <span>{s.icon}</span><span>{s.label}</span>
            </span>
          ))}
        </div>

        {/* Quick links */}
        <div className="flex gap-4 text-xs font-body">
          <button onClick={() => { window.location.hash = '#how-to-play'; }}
            className="text-gold-600 hover:text-gold-400 underline-offset-2 hover:underline transition-colors">
            How to Play →
          </button>
          <button onClick={() => { window.location.hash = '#faq'; }}
            className="text-gold-600 hover:text-gold-400 underline-offset-2 hover:underline transition-colors">
            FAQ →
          </button>
        </div>

        <p className="text-gold-800 text-xs mt-3 font-body">
          📲 Tap Share → "Add to Home Screen" to install as app
        </p>
      </section>

      {/* Ad */}
      <div className="relative z-10 max-w-3xl mx-auto w-full px-4 pb-4">
        <AdBanner slot="SLOT_ID_1" format="auto" className="max-w-2xl mx-auto" />
      </div>

      <p className="sr-only">
        FilmiPaheli is a free online multiplayer Bollywood movie guessing game. Daily challenge and vs computer modes available. Play with friends — no account required.
      </p>

      <div className="film-strip w-full relative z-10" />
      <Footer />
    </div>
  );
}
