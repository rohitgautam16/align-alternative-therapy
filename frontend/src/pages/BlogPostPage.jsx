import React, { useMemo, useRef, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  useGetBlogBySlugQuery,
  useListBlogsByCategorySlugQuery,
} from '../utils/api';
import BlogContent from '../components/blog/BlogContent';
import useDocumentMeta, { truncateDescription } from '../hooks/useDocumentMeta';

const BlogPostPage = () => {
  const { slug } = useParams();
  const location = useLocation();

  const { data, isLoading } = useGetBlogBySlugQuery(slug);
  const blog = data?.data;

  const heroRef = useRef(null);
  const heroImgRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    const img = heroImgRef.current;
    if (!hero || !img) return;

    let rafId = 0;

    const update = () => {
      const rect = hero.getBoundingClientRect();
      const windowH = window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      const raw = Math.min(scrolled / (windowH * 0.4), 1);
      const eased = raw * raw * (4 - raw);
      const scale = 1 + eased * 0.3;

      img.style.transform = `scale(${scale})`;
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return window.location.origin + location.pathname;
  }, [location.pathname]);

  const readingMinutes = useMemo(() => {
    const text = blog?.content?.replace(/<[^>]*>/g, ' ') || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }, [blog?.content]);

  const primaryCategory = blog?.categories?.[0];
  const { data: relatedData } = useListBlogsByCategorySlugQuery(
    primaryCategory?.slug,
    { skip: !primaryCategory }
  );

  const related = (relatedData?.data || [])
    .filter(b => b.slug !== slug)
    .slice(0, 3);
  const publishedTime = blog?.published_at
    ? new Date(blog.published_at).toISOString()
    : undefined;

  useDocumentMeta({
    title: blog?.title || 'Member Blog Article',
    description: truncateDescription(
      blog?.excerpt || blog?.content || `Read ${blog?.title || 'this article'} from Align Alternative Therapy.`
    ),
    path: `/dashboard/blog/${slug}`,
    robots: 'noindex,nofollow',
    author: blog?.author,
    publishedTime,
  });

  if (isLoading) {
    return <div className="p-10 text-white">Loading...</div>;
  }

  if (!blog) {
    return <div className="p-6 text-center text-red-400">Post not found.</div>;
  }

  const breadcrumbItems = [
    { label: 'Home', to: '/' },
    { label: 'Blog', to: '/dashboard/blog' },
    ...(primaryCategory
      ? [{ label: primaryCategory.name, to: `/dashboard/blog/category/${primaryCategory.slug}` }]
      : []),
    { label: blog.title },
  ];

  return (
    <article className="bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-white/70">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;

            return (
              <React.Fragment key={`${item.label}-${index}`}>
                {index > 0 && <span aria-hidden="true">/</span>}
                {isLast ? (
                  <span className="text-white">{item.label}</span>
                ) : (
                  <Link to={item.to} className="hover:text-white">
                    {item.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        <header className="space-y-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold">
            {blog.title}
          </h1>

          {Array.isArray(blog.categories) && blog.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {blog.categories.map(cat => (
                <span
                  key={cat.id}
                  className="inline-flex rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
            <span>{blog.author || 'Align Alternative Therapy'}</span>
            {blog.published_at && (
              <time dateTime={publishedTime}>
                - {new Date(blog.published_at).toLocaleDateString()}
              </time>
            )}
            <span>- {readingMinutes} min read</span>
          </div>
        </header>

        <div
          ref={heroRef}
          className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl border border-white/10"
        >
          <img
            ref={heroImgRef}
            src={blog.cover_image}
            alt={blog.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
        </div>

        <div>
          <BlogContent html={blog.content} />
        </div>

        <section className="pt-8 border-t border-white/10">
          <p className="text-xs uppercase mb-4 text-white/60">Share</p>
          <div className="flex gap-3 flex-wrap">
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/15 px-4 py-2 text-sm"
            >
              X
            </a>
            <a
              href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/15 px-4 py-2 text-sm"
            >
              LinkedIn
            </a>
          </div>
        </section>

        {primaryCategory && related.length > 0 && (
          <section className="pt-10 border-t border-white/10">
            <h2 className="text-xl sm:text-2xl font-semibold mb-6">
              More in {primaryCategory.name}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map(item => (
                <Link
                  key={item.id}
                  to={`/dashboard/blog/${item.slug}`}
                  className="group block"
                >
                  <div className="relative w-full aspect-[16/10] overflow-hidden rounded-xl bg-white/5">
                    <img
                      src={item.cover_image || '/images/blog-placeholder.jpg'}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  <div className="pt-3">
                    <div className="text-xs text-white/60 uppercase tracking-wide mb-1">
                      {primaryCategory.name}
                    </div>

                    <h3 className="font-semibold text-white leading-snug line-clamp-2 group-hover:underline underline-offset-4">
                      {item.title}
                    </h3>

                    {item.excerpt && (
                      <p className="mt-2 text-sm text-white/70 line-clamp-2">
                        {item.excerpt}
                      </p>
                    )}

                    <div className="mt-3 text-sm text-white/80">
                      Read article
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
};

export default BlogPostPage;
