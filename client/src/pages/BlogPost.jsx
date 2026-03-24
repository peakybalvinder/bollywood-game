import React, { useEffect } from 'react';
import { getPost, POSTS } from '../blog/posts';
import { navigate, setPageMeta } from '../router';
import Footer from '../components/Footer';

export default function BlogPost({ slug, onBack }) {
  const post = getPost(slug);

  useEffect(() => {
    if (!post) return;
    setPageMeta({
      title: `${post.title} — FilmiPaheli Blog`,
      description: post.description,
      canonical: `https://www.filmipaheli.com/blog/${post.slug}`,
    });
    window.scrollTo(0, 0);
  }, [post]);

  if (!post) {
    return (
      <div className="bg-cinema min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-5xl mb-4">🎬</div>
        <h1 className="font-display font-bold text-2xl text-gold-400 mb-3">Post Not Found</h1>
        <p className="text-gold-700 text-sm mb-6">This article doesn't exist or has been moved.</p>
        <button onClick={() => navigate('/blog')} className="btn-gold px-6 py-3">← Back to Blog</button>
      </div>
    );
  }

  return (
    <div className="bg-cinema min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-4 px-4 md:px-8 py-3 border-b border-ink-700 bg-ink-950 bg-opacity-95 backdrop-blur">
        <button onClick={() => navigate('/blog')} className="btn-ghost text-sm px-3 py-1.5 shrink-0">← Blog</button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">🎬</span>
          <span className="font-display font-bold text-gold-400 text-sm truncate">FilmiPaheli Blog</span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-10">
        {/* Article header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-gold-700 text-xs font-body">
              {new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="text-gold-800">·</span>
            <span className="text-gold-700 text-xs font-body">{post.readTime}</span>
          </div>
          <h1 className="font-display font-black text-3xl md:text-4xl text-gold-300 leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-gold-600 font-body text-base leading-relaxed border-l-2 border-gold-800 pl-4">
            {post.description}
          </p>
        </div>

        {/* Article body */}
        <article className="space-y-10">
          {post.sections.map((section, i) => (
            <section key={i}>
              <h2 className="font-display font-bold text-xl text-gold-400 mb-4 pb-2 border-b border-ink-700">
                {section.h2}
              </h2>

              {section.body && (
                <p className="text-gold-700 font-body text-sm leading-relaxed mb-4">
                  {section.body}
                </p>
              )}

              {section.bullets && (
                <ul className="space-y-2.5">
                  {section.bullets.map((item, j) => (
                    <li key={j} className="flex gap-3 text-gold-700 text-sm font-body leading-relaxed">
                      <span className="text-crimson-400 shrink-0 mt-0.5 font-bold">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.numbered && (
                <ol className="space-y-2.5">
                  {section.numbered.map((item, j) => (
                    <li key={j} className="flex gap-3 text-gold-700 text-sm font-body leading-relaxed">
                      <span className="text-gold-500 shrink-0 font-mono font-bold min-w-[1.5rem]">{j + 1}.</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}
        </article>

        {/* CTA */}
        <div className="mt-12 card-dark rounded-2xl p-8 text-center border border-gold-800">
          <div className="text-4xl mb-3">🎬</div>
          <h3 className="font-display font-bold text-xl text-gold-400 mb-2">Ready to Play?</h3>
          <p className="text-gold-700 text-sm font-body mb-5">
            FilmiPaheli is free, multiplayer, and works on any device. No signup needed.
          </p>
          <button onClick={onBack} className="btn-gold px-8 py-3">
            Play FilmiPaheli Now
          </button>
        </div>

        {/* Related posts */}
        <div className="mt-10">
          <h3 className="font-display font-bold text-lg text-gold-400 mb-4">More Articles</h3>
          <div className="space-y-3">
            {POSTS
              .filter(p => p.slug !== slug)
              .slice(0, 3)
              .map(p => (
                <button
                  key={p.slug}
                  onClick={() => navigate(`/blog/${p.slug}`)}
                  className="w-full text-left card-dark rounded-xl p-4 hover:border-gold-700 transition-all group"
                >
                  <p className="font-body font-semibold text-sm text-gold-300 group-hover:text-gold-200 transition-colors">
                    {p.title}
                  </p>
                  <p className="text-gold-800 text-xs font-body mt-1">{p.readTime}</p>
                </button>
              ))
            }
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
