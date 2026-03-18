import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-ink-700 py-5 px-6 text-center">
      <p className="text-gold-700 text-sm font-body flex items-center justify-center gap-2 flex-wrap">
        <span>Made with</span>
        <span className="text-crimson-400 animate-pulse text-base">♥</span>
        <span>by</span>
        <span className="font-semibold text-gold-500">Piyush Jindal</span>
        <span className="text-gold-800">·</span>
        <span className="text-gold-800">© 2026 All rights reserved</span>
      </p>
    </footer>
  );
}