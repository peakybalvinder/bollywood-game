import React from 'react';
import Footer from './Footer';
import AdBanner from './AdBanner';

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

const STATS = [
  { icon: '🎬', label: 'Any Bollywood Movie' },
  { icon: '👥', label: 'Up to 5 Players' },
  { icon: '🆓', label: 'Free — No Login' },
  { icon: '⚡', label: 'Real-time Multiplayer' },
];

export default function Dashboard({ onCreateParty, onJoinParty }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden animate-fade-in">

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-crimson-900 rounded-full opacity-10 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-gold-900 rounded-full opacity-8 blur-[100px]" />
        <FilmReel size={180} className="absolute top-8 right-8 opacity-5 animate-flicker hidden lg:block" />
        <FilmReel size={120} className="absolute bottom-24 left-6 opacity-5 animate-flicker hidden lg:block" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="film-strip w-full relative z-10" />

      {/* ── Hero — designed to fit one screen ── */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 text-center">

        {/* Logo */}
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

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-xs sm:max-w-none mb-8">
          <button onClick={onCreateParty} className="btn-gold text-base px-10 py-4 font-semibold text-lg" aria-label="Create party">
            🎬 &nbsp; Create a Party
          </button>
          <button onClick={onJoinParty} className="btn-ghost text-base px-10 py-4 text-lg" aria-label="Join party">
            🎟 &nbsp; Join a Party
          </button>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
          {STATS.map((s) => (
            <span key={s.label} className="text-gold-700 text-xs font-body flex items-center gap-1.5">
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </span>
          ))}
        </div>

        {/* Quick links */}
        <div className="flex gap-4 text-xs font-body">
          <button
            onClick={() => { window.location.hash = '#how-to-play'; }}
            className="text-gold-600 hover:text-gold-400 underline-offset-2 hover:underline transition-colors"
          >
            How to Play →
          </button>
          <button
            onClick={() => { window.location.hash = '#faq'; }}
            className="text-gold-600 hover:text-gold-400 underline-offset-2 hover:underline transition-colors"
          >
            FAQ →
          </button>
        </div>

        {/* PWA hint */}
        <p className="text-gold-800 text-xs mt-4 font-body">
          📲 Tap Share → "Add to Home Screen" to install as app
        </p>
      </section>

      {/* Ad — single placement, lazy loaded */}
      <div className="relative z-10 max-w-3xl mx-auto w-full px-4 pb-4">
        <AdBanner slot="SLOT_ID_1" format="auto" className="max-w-2xl mx-auto" />
      </div>

      {/* SEO text */}
      <p className="sr-only">
        FilmiPaheli is a free online multiplayer Bollywood movie guessing game. Play with friends — no account required.
      </p>

      <div className="film-strip w-full relative z-10" />
      <Footer />
    </div>
  );
}
