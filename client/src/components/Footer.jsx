import React from 'react';
import { navigate } from '../router';

const LINKS = [
  { label: 'Blog',          path: '/blog'        },
  { label: 'How to Play',   path: '/how-to-play' },
  { label: 'FAQ',           path: '/faq'         },
  { label: 'Terms',         path: '/terms'       },
  { label: 'Privacy Policy', path: '/privacy'   },
  { label: 'Disclaimer',    path: '/disclaimer'  },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-ink-700 py-6 px-6">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-4">
        {LINKS.map((l) => (
          <a
            key={l.path}
            href={l.path}
            onClick={(e) => { e.preventDefault(); navigate(l.path); }}
            className="text-gold-700 hover:text-gold-400 text-xs font-body underline-offset-2 hover:underline transition-colors"
          >
            {l.label}
          </a>
        ))}
      </div>
      <p className="text-gold-700 text-sm font-body flex items-center justify-center gap-2 flex-wrap">
        <span>Made with</span>
        <span className="text-crimson-400 animate-pulse text-base">♥</span>
        <span>by</span>
        <span className="font-semibold text-gold-500">Piyush Jindal</span>
        <span className="text-gold-800">·</span>
        <span className="text-gold-800">© 2026 FilmiPaheli.com · All rights reserved</span>
      </p>
    </footer>
  );
}
