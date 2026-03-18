import React from 'react';

/* Decorative film reel SVG */
function FilmReel({ size = 64, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden animate-fade-in">

      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-crimson-900 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gold-900 rounded-full opacity-10 blur-3xl" />
        <FilmReel size={120} className="absolute top-12 left-12 opacity-10 animate-flicker" />
        <FilmReel size={80} className="absolute bottom-20 right-16 opacity-10 animate-flicker" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Film strip top */}
      <div className="film-strip w-full absolute top-0" />

      {/* Main card */}
      <div className="relative z-10 text-center max-w-xl w-full">

        {/* Logo cluster */}
        <div className="flex justify-center mb-6 gap-6 items-center">
          <FilmReel size={48} className="opacity-60" />
          <div className="text-gold-500 text-5xl">🎬</div>
          <FilmReel size={48} className="opacity-60 scale-x-[-1]" />
        </div>

        <div className="mb-2">
          <span className="font-display text-xs tracking-[0.4em] uppercase text-gold-700">
            Welcome to
          </span>
        </div>

        <h1 className="font-display font-black text-5xl md:text-7xl leading-none mb-3">
          <span className="gold-text">Bollywood</span>
          <br />
          <span className="text-crimson-400 italic text-4xl md:text-5xl">Hangman</span>
        </h1>

        <p className="text-gold-700 font-body text-sm tracking-widest uppercase mb-10">
          ✦ &nbsp; Guess the movie · Outwit your friends &nbsp; ✦
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onCreateParty}
            className="btn-gold text-base px-10 py-4 font-semibold"
          >
            🎬 &nbsp; Create a Party
          </button>
          <button
            onClick={onJoinParty}
            className="btn-ghost text-base px-10 py-4"
          >
            🎟 &nbsp; Join a Party
          </button>
        </div>

        {/* Rules snippet */}
        <div className="mt-14 card-dark corner-deco rounded-xl px-8 py-6 text-left space-y-2">
          <p className="font-display text-gold-500 text-sm tracking-widest uppercase mb-4">How to Play</p>
          <ul className="text-gold-700 text-sm space-y-2 font-body">
            <li className="flex gap-2"><span className="text-crimson-400 mt-0.5">→</span> Host picks a Bollywood movie and gives a hint letter.</li>
            <li className="flex gap-2"><span className="text-crimson-400 mt-0.5">→</span> Guests guess one letter at a time.</li>
            <li className="flex gap-2"><span className="text-crimson-400 mt-0.5">→</span> Each wrong guess strikes a letter from <span className="font-mono text-crimson-400 font-bold">BOLLYWOOD</span>.</li>
            <li className="flex gap-2"><span className="text-crimson-400 mt-0.5">→</span> Game over if all 9 lives are lost.</li>
            <li className="flex gap-2"><span className="text-crimson-400 mt-0.5">→</span> Up to 5 players · No login needed.</li>
          </ul>
        </div>
      </div>

      {/* Film strip bottom */}
      <div className="film-strip w-full absolute bottom-0" />
    </div>
  );
}
