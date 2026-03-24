/**
 * Tiny path-based router.
 * Uses history.pushState — no library needed.
 * The _redirects file sends all 404s to index.html so deep links work.
 */

export function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function getPath() {
  return window.location.pathname;
}

/** Update <title> and meta description for SEO */
export function setPageMeta({ title, description, canonical }) {
  document.title = title;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', description);
  const og_title = document.querySelector('meta[property="og:title"]');
  if (og_title) og_title.setAttribute('content', title);
  const og_desc = document.querySelector('meta[property="og:description"]');
  if (og_desc) og_desc.setAttribute('content', description);
  const canon = document.querySelector('link[rel="canonical"]');
  if (canon) canon.setAttribute('href', canonical || `https://www.filmipaheli.com${window.location.pathname}`);
}
