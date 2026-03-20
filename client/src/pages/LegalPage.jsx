import React, { useEffect } from 'react';
import Footer from '../components/Footer';

/**
 * Shared wrapper for all legal pages.
 * Handles scroll-to-top, back navigation, and consistent layout.
 */
export default function LegalPage({ title, children, onBack }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-cinema min-h-screen flex flex-col">

      {/* Top bar */}
      <header className="sticky top-0 z-20 flex items-center gap-4 px-4 md:px-8 py-3 border-b border-ink-700 bg-ink-950 bg-opacity-95 backdrop-blur">
        <button
          onClick={onBack}
          className="btn-ghost text-sm px-3 py-1.5 shrink-0"
          aria-label="Back to home"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">🎬</span>
          <span className="font-display font-bold text-gold-400 text-base truncate">
            FilmiPaheli · {title}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-10">
        <h1 className="font-display font-black text-4xl md:text-5xl gold-text mb-2">{title}</h1>
        <p className="text-gold-800 text-sm font-body mb-10">
          FilmiPaheli.com · Last updated: March 2026
        </p>
        <div className="prose-legal">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ─── Shared prose components ─────────────────────────────────────────────── */
export function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="font-display font-bold text-xl text-gold-400 mb-4 pb-2 border-b border-ink-700">
        {title}
      </h2>
      <div className="space-y-3 text-gold-700 font-body text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export function P({ children }) {
  return <p className="text-gold-700 font-body text-sm leading-relaxed">{children}</p>;
}

export function Ul({ items }) {
  return (
    <ul className="space-y-2 mt-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-gold-700 text-sm font-body">
          <span className="text-crimson-400 shrink-0 mt-0.5">→</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Highlight({ children }) {
  return (
    <div className="bg-ink-800 border border-ink-700 rounded-xl px-5 py-4 my-4 text-gold-600 text-sm font-body leading-relaxed">
      {children}
    </div>
  );
}
