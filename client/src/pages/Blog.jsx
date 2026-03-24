import React, { useEffect } from 'react';
import { POSTS } from '../blog/posts';
import { navigate, setPageMeta } from '../router';
import Footer from '../components/Footer';

export default function Blog({ onBack }) {
  useEffect(() => {
    setPageMeta({
      title: 'Blog — FilmiPaheli | Bollywood Game Tips, Guides & Lists',
      description: 'Guides, movie lists, and tips for playing Bollywood guessing games online. Learn how to play FilmiPaheli and discover the best Bollywood movies to guess.',
      canonical: 'https://www.filmipaheli.com/blog',
    });
    window.scrollTo(0, 0);
  }, []);

  const CATEGORY_COLORS = {
    Guide:  'bg-crimson-900 text-crimson-400 border-crimson-800',
    Lists:  'bg-gold-900   text-gold-500   border-gold-800',
    About:  'bg-ink-700    text-gold-600   border-ink-600',
  };

  return (
    <div className="bg-cinema min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-4 px-4 md:px-8 py-3 border-b border-ink-700 bg-ink-950 bg-opacity-95 backdrop-blur">
        <button onClick={onBack} className="btn-ghost text-sm px-3 py-1.5 shrink-0">← Back</button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">🎬</span>
          <span className="font-display font-bold text-gold-400 text-base truncate">FilmiPaheli · Blog</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-10">
        <div className="text-center mb-12">
          <h1 className="font-display font-black text-4xl md:text-5xl gold-text mb-3">FilmiPaheli Blog</h1>
          <p className="text-gold-700 font-body text-base max-w-xl mx-auto">
            Guides, movie lists, and everything you need to become the ultimate Bollywood game champion.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {POSTS.map((post) => (
            <article
              key={post.slug}
              onClick={() => navigate(`/blog/${post.slug}`)}
              className="card-dark rounded-2xl p-6 cursor-pointer hover:border-gold-700 transition-all duration-200 group flex flex-col"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-body font-semibold px-2 py-0.5 rounded border ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.About}`}>
                  {post.category}
                </span>
                <span className="text-gold-800 text-xs font-body">{post.readTime}</span>
              </div>
              <h2 className="font-display font-bold text-lg text-gold-300 group-hover:text-gold-200 transition-colors mb-3 flex-1 leading-snug">
                {post.title}
              </h2>
              <p className="text-gold-700 text-sm font-body leading-relaxed mb-4 line-clamp-3">
                {post.description}
              </p>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-ink-700">
                <span className="text-gold-800 text-xs font-body">
                  {new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="text-gold-500 text-sm group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
