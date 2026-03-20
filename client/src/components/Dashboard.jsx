import React from 'react';
import Footer from './Footer';

function FilmReel({ size = 64, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="32" cy="32" r="30" stroke="#A07500" strokeWidth="2" strokeDasharray="4 2" />
      <circle cx="32" cy="32" r="20" stroke="#A07500" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="6" fill="#A07500" />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const r = 26;
        const rad = (deg * Math.PI) / 180;
        const x = 32 + r * Math.cos(rad);
        const y = 32 + r * Math.sin(rad);
        return <circle key={deg} cx={x} cy={y} r="4" fill="#3D1515" stroke="#A07500" strokeWidth="1" />;
      })}
    </svg>
  );
}

export default function Dashboard({ onCreateParty, onJoinParty }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden animate-fade-in">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-crimson-900 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gold-900 rounded-full opacity-10 blur-3xl" />
        <FilmReel size={120} className="absolute top-12 left-12 opacity-10 animate-flicker" />
        <FilmReel size={80} className="absolute bottom-20 right-16 opacity-10 animate-flicker" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="film-strip w-full" />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="relative z-10 text-center max-w-xl w-full">

          {/* Logo */}
          <div className="flex justify-center mb-6 gap-6 items-center">
            <FilmReel size={48} className="opacity-60" />
            <div className="text-gold-500 text-5xl" aria-hidden="true">🎬</div>
            <FilmReel size={48} className="opacity-60 scale-x-[-1]" />
          </div>

          <p className="font-display text-xs tracking-[0.4em] uppercase text-gold-700 mb-2">
            Welcome to
          </p>

          {/* Brand name — H1 for SEO */}
          <h1 className="font-display font-black leading-none mb-3">
            <span className="gold-text text-6xl md:text-8xl">Filmi</span>
            <span className="text-crimson-400 italic text-5xl md:text-7xl">Paheli</span>
          </h1>

          <p className="text-gold-600 font-display italic text-lg mb-2">
            फ़िल्मी पहेली
          </p>

          <p className="text-gold-700 font-body text-sm tracking-widest uppercase mb-10">
            ✦ &nbsp; Guess the Bollywood movie · Outwit your friends &nbsp; ✦
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onCreateParty}
              className="btn-gold text-base px-10 py-4 font-semibold"
              aria-label="Create a new game party"
            >
              🎬 &nbsp; Create a Party
            </button>
            <button
              onClick={onJoinParty}
              className="btn-ghost text-base px-10 py-4"
              aria-label="Join an existing game party"
            >
              🎟 &nbsp; Join a Party
            </button>
          </div>

          {/* How to play — keyword-rich for SEO */}
          <div className="mt-14 card-dark corner-deco rounded-xl px-8 py-6 text-left space-y-2">
            <p className="font-display text-gold-500 text-sm tracking-widest uppercase mb-4">
              How to Play FilmiPaheli
            </p>
            <ul className="text-gold-700 text-sm space-y-2 font-body">
              <li className="flex gap-2"><span className="text-crimson-400 mt-0.5">→</span> Host picks any Bollywood movie and gives hint letters.</li>
              <li className="flex gap-2"><span className="text-crimson-400 mt-0.5">→</span> Each player guesses independently — one letter at a time.</li>
              <li className="flex gap-2"><span className="text-crimson-400 mt-0.5">→</span> Each wrong guess strikes a letter from <span className="font-mono text-crimson-400 font-bold">BOLLYWOOD</span>.</li>
              <li className="flex gap-2"><span className="text-crimson-400 mt-0.5">→</span> Guess the movie before all 9 lives are lost!</li>
              <li className="flex gap-2"><span className="text-crimson-400 mt-0.5">→</span> Up to 5 players · No login needed · 100% free.</li>
            </ul>
          </div>

          {/* SEO-rich hidden text block for crawlers */}
          <p className="sr-only">
            FilmiPaheli is a free online multiplayer Bollywood movie guessing game.
            Similar to hangman, players guess letters to reveal the Bollywood film title.
            Play with friends online, no account required. Supports up to 5 players per room.
            Share a link or room code to invite friends instantly.
          </p>
        </div>
      </div>

      <div className="film-strip w-full" />
      <Footer />
    </div>
  );
}
