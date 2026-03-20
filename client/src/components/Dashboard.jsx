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
  { icon: '🎬', value: '∞', label: 'Bollywood Movies' },
  { icon: '👥', value: '5',  label: 'Players per Room' },
  { icon: '🆓', value: 'Free', label: 'No Login Needed' },
  { icon: '⚡', value: 'Live', label: 'Real-time Play' },
];

const HOW_TO = [
  { step: '01', title: 'Create a Party', desc: 'Host starts a room and shares the code or link with friends.' },
  { step: '02', title: 'Pick a Movie',   desc: 'Host chooses any Bollywood film and sets optional hint letters.' },
  { step: '03', title: 'Guess Letters',  desc: 'Each player independently guesses one letter at a time.' },
  { step: '04', title: 'Win the Round',  desc: 'Reveal the full title before BOLLYWOOD runs out of lives!' },
];

export default function Dashboard({ onCreateParty, onJoinParty }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden animate-fade-in">

      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-crimson-900 rounded-full opacity-10 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-gold-900 rounded-full opacity-8 blur-[100px]" />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] bg-crimson-900 rounded-full opacity-8 blur-[100px]" />
        <FilmReel size={200} className="absolute top-10 right-10 opacity-5 animate-flicker hidden lg:block" />
        <FilmReel size={140} className="absolute bottom-32 left-8 opacity-5 animate-flicker hidden lg:block" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="film-strip w-full relative z-10" />

      {/* ── Hero ── */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-12 pb-8 text-center">

        {/* Logo cluster */}
        <div className="flex items-center justify-center gap-5 mb-8">
          <FilmReel size={52} className="opacity-50 hidden sm:block" />
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-gold-600 opacity-20 rounded-full scale-150" />
            <span className="relative text-6xl sm:text-7xl" aria-hidden="true">🎬</span>
          </div>
          <FilmReel size={52} className="opacity-50 scale-x-[-1] hidden sm:block" />
        </div>

        {/* Brand */}
        <div className="mb-2">
          <span className="font-display text-xs sm:text-sm tracking-[0.4em] uppercase text-gold-700">Welcome to</span>
        </div>
        <h1 className="font-display font-black leading-none mb-3 select-none">
          <span className="gold-text text-7xl sm:text-8xl md:text-9xl">Filmi</span>
          <span className="text-crimson-400 italic text-5xl sm:text-6xl md:text-8xl">Paheli</span>
        </h1>
        <p className="text-gold-600 font-display italic text-xl sm:text-2xl mb-3 select-none">
          फ़िल्मी पहेली
        </p>
        <p className="text-gold-700 font-body text-sm tracking-[0.2em] uppercase mb-10 max-w-md">
          ✦ &nbsp; Guess the Bollywood movie · Outwit your friends &nbsp; ✦
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-sm sm:max-w-none">
          <button
            onClick={onCreateParty}
            className="btn-gold text-base px-10 py-4 font-semibold text-lg"
            aria-label="Create a new game party"
          >
            🎬 &nbsp; Create a Party
          </button>
          <button
            onClick={onJoinParty}
            className="btn-ghost text-base px-10 py-4 text-lg"
            aria-label="Join an existing game party"
          >
            🎟 &nbsp; Join a Party
          </button>
        </div>

        {/* Install hint for PWA */}
        <p className="text-gold-800 text-xs mt-6 font-body">
          📲 Install as app — tap Share → "Add to Home Screen" on mobile
        </p>
      </section>

      {/* ── Stats bar ── */}
      <section className="relative z-10 border-y border-ink-700 bg-ink-900 bg-opacity-60 py-6 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-display font-bold text-xl text-gold-400">{s.value}</div>
              <div className="text-gold-700 text-xs font-body">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ad: Between Stats and How To Play ── */}
      {/* Leaderboard (728x90 on desktop, responsive on mobile) */}
      {/* After approval, replace 'SLOT_ID_1' with your actual slot ID from AdSense */}
      <div className="relative z-10 max-w-3xl mx-auto w-full px-4 py-4">
        <AdBanner
          slot="SLOT_ID_1"
          format="auto"
          className="max-w-2xl mx-auto"
        />
      </div>

      {/* ── How to Play ── */}
      <section className="relative z-10 max-w-5xl mx-auto w-full px-4 py-14">
        <h2 className="font-display font-bold text-center text-3xl sm:text-4xl gold-text mb-2">
          How to Play FilmiPaheli
        </h2>
        <p className="text-center text-gold-700 text-sm font-body mb-10">
          Get your friends together — no account needed
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_TO.map((step) => (
            <div key={step.step} className="card-dark rounded-2xl p-6 relative overflow-hidden group hover:border-gold-700 transition-all duration-300">
              {/* Step number watermark */}
              <div className="absolute -top-2 -right-2 font-display font-black text-7xl text-ink-700 select-none leading-none">
                {step.step}
              </div>
              <div className="relative">
                <p className="font-display font-bold text-gold-400 text-lg mb-2">{step.title}</p>
                <p className="text-gold-700 text-sm font-body leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Ad: Between How-to cards and Rules — only on desktop, non-intrusive */}
        <div className="hidden lg:block mt-2">
          <AdBanner
            slot="SLOT_ID_2"
            format="auto"
            className="max-w-xl mx-auto"
          />
        </div>

        {/* Rules detail */}}
        <div className="mt-8 card-dark corner-deco rounded-2xl px-6 sm:px-10 py-8 grid sm:grid-cols-2 gap-4">
          <div>
            <p className="font-display text-gold-500 text-sm tracking-widest uppercase mb-4">Game Rules</p>
            <ul className="text-gold-700 text-sm space-y-2.5 font-body">
              <li className="flex gap-2"><span className="text-crimson-400 shrink-0 mt-0.5">→</span> Each player gets their own independent game board</li>
              <li className="flex gap-2"><span className="text-crimson-400 shrink-0 mt-0.5">→</span> Wrong guesses strike letters from <span className="font-mono text-crimson-400 font-bold">BOLLYWOOD</span></li>
              <li className="flex gap-2"><span className="text-crimson-400 shrink-0 mt-0.5">→</span> Lose all 9 lives = Game Over for you</li>
              <li className="flex gap-2"><span className="text-crimson-400 shrink-0 mt-0.5">→</span> Guess correctly = earn points based on lives remaining</li>
            </ul>
          </div>
          <div>
            <p className="font-display text-gold-500 text-sm tracking-widest uppercase mb-4">Scoring</p>
            <div className="card-dark rounded-xl p-4 text-center">
              <p className="font-mono text-gold-400 text-base mb-1">Lives Left × 10 + 20</p>
              <p className="text-gold-700 text-xs font-body">Points accumulate across all rounds</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                {[9,5,1].map(l => (
                  <div key={l} className="bg-ink-700 rounded-lg p-2">
                    <p className="font-mono font-bold text-gold-400">{l * 10 + 20}</p>
                    <p className="text-gold-700">{l} lives left</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO hidden text */}
      <p className="sr-only">
        FilmiPaheli is a free online multiplayer Bollywood movie guessing game. Similar to hangman, players guess letters to reveal the Bollywood film title. Play with friends online, no account required.
      </p>

      {/* ── Ad: Above Footer ── */}
      <div className="relative z-10 max-w-3xl mx-auto w-full px-4 pb-6">
        <AdBanner
          slot="SLOT_ID_3"
          format="auto"
          className="max-w-2xl mx-auto"
        />
      </div>

      <div className="film-strip w-full relative z-10" />
      <Footer />
    </div>
  );
}
