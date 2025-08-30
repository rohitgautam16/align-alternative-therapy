// src/pages/BlogPostPage.jsx
import React, { useMemo, useRef, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import stubBlogs from '../stubs/blogs';
import Header from '../components/common/Header';

export default function BlogPostPage() {
  const { slug } = useParams();
  const location = useLocation();
  const blog = stubBlogs.find(b => b.slug === slug);
  const related = stubBlogs.filter(b => b.slug !== slug).slice(0, 3);

  // --- HERO scroll-zoom refs ---
  const heroRef = useRef(null);
  const heroImgRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

    const update = () => {
      if (!heroRef.current || !heroImgRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      // progress 0..1 as the hero scrolls past the top of viewport
      const offset = -rect.top; // 0 when hero top hits viewport top; grows as you scroll down
      const progress = clamp(offset / Math.max(rect.height, 1), 0, 1);
      const scale = 1 + progress * 0.12; // 12% zoom at end
      heroImgRef.current.style.transform = `scale(${scale})`;
    };

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };
    const onResize = onScroll;

    onScroll(); // set initial transform
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!blog) return <div className="p-6 text-center text-red-400">Post not found.</div>;

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return window.location.origin + location.pathname;
  }, [location.pathname]);

  const readingMinutes = useMemo(() => {
    const text = blog.content?.replace(/<[^>]*>/g, ' ') || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }, [blog.content]);

  return (
    <div>
      <Header />
      <article className="bg-black text-white py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16 space-y-8 sm:space-y-10">
          {/* Breadcrumb */}
          <div className="text-sm">
            <Link to="/blog" className="text-white/80 hover:text-white transition">← All articles</Link>
          </div>

          {/* Title & meta */}
          <header className="space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              {blog.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-white/70">
              {blog.category && (
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-1">
                  {blog.category}
                </span>
              )}
              {blog.author && <span>• {blog.author}</span>}
              {blog.date && <span>• {blog.date}</span>}
              <span>{readingMinutes} min read</span>
            </div>
          </header>

          {/* HERO — responsive rectangle + scroll zoom */}
          <div
            ref={heroRef}
            className="relative w-full aspect-[4/3] sm:aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
          >
            <img
              ref={heroImgRef}
              src={blog.coverImage}
              alt={blog.title}
              className="absolute inset-0 w-full h-full object-cover will-change-transform"
              style={{ transform: 'scale(1)', transformOrigin: 'center center' }}
              loading="eager"
            />
            <div className="absolute inset-0 pointer-events-none ring-1 ring-white/10" />
          </div>

          {/* CONTENT (force readable colors on black) */}
          <div
            className="
              prose prose-invert max-w-none
              prose-headings:text-white
              prose-p:text-white/90
              prose-strong:text-white
              prose-a:text-white hover:prose-a:text-white/80
              prose-blockquote:text-white/80
              prose-li:marker:text-white/60
            "
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* E-BOOK CTA */}
          <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-7">
            <h2 className="text-xl sm:text-2xl font-semibold mb-2 flex items-center gap-2">
              Get the E-book Version
            </h2>
            <p className="text-sm text-white/70 mb-4">
              Download a beautifully formatted PDF version of this article to read offline or share with your team.
            </p>
            <a
              href="/downloads/sample-ebook.pdf"
              download
              className="inline-flex items-center gap-2 rounded-full bg-secondary text-black px-5 py-2 font-medium transition active:scale-95"
            >
              Download E-book <span>↗</span>
            </a>
          </section>

          {/* SHARE */}
          <section className="pt-10 border-t border-white/10">
            <p className="text-xs uppercase tracking-wider mb-4 text-white/80">Share</p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(blog.title)}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
              >
                <span className="opacity-80">X</span> <span className="hidden sm:inline">Post</span>
              </a>
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(blog.title)}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
              >
                <span className="opacity-80">in</span> <span className="hidden sm:inline">Share</span>
              </a>
              <button
                type="button"
                onClick={() => { if (navigator?.clipboard) navigator.clipboard.writeText(shareUrl); }}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
                title="Copy link"
              >
                Copy link
              </button>
            </div>
          </section>

          {/* RELATED ARTICLES — simple, no background cards */}
          <section className="pt-10 border-t border-white/10">
            <h2 className="text-xl sm:text-2xl font-semibold mb-6">Related Articles</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  to={`/blog/${item.slug}`}
                  className="group block"
                >
                  {/* Image: fixed rectangle, no card bg */}
                  <div className="relative w-full aspect-[16/10] overflow-hidden rounded-xl">
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Text: clean, no container background */}
                  <div className="pt-3">
                    <div className="text-xs text-white/60 uppercase tracking-wide mb-1">
                      {item.category || 'Article'}
                    </div>
                    <h3 className="font-semibold text-white leading-snug line-clamp-2 group-hover:underline underline-offset-4">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-white/70 line-clamp-2">
                      {item.excerpt}
                    </p>
                    <div className="mt-3 text-sm text-white/80">
                      Read article <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
