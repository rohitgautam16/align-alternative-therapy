// src/pages/BlogPostPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import stubBlogs from '../stubs/blogs';
import Header from '../components/common/Header';

export default function BlogPostPage() {
  const { slug } = useParams();
  const blog = stubBlogs.find(b => b.slug === slug);
  const related = stubBlogs.filter(b => b.slug !== slug).slice(0, 3);

  if (!blog) return <div className="p-6 text-center text-red-400">Post not found.</div>;

  return (
    <div>
    <Header />
      <article className="mx-auto bg-black px-40 py-20 space-y-12">
      <h1 className="text-4xl text-white font-bold">{blog.title}</h1>

      <img
        src={blog.coverImage}
        alt={blog.title}
        className="w-full h-3/5 object-cover rounded-md"
      />

      <div
        className="prose text-white prose-invert mt-4"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      {/* E-BOOK DOWNLOAD SECTION */}
      <div className="mt-12 p-6 rounded-lg border border-white/20 bg-white/5 text-white">
        <h2 className="text-2xl font-semibold mb-4">📘 Get the E-book Version</h2>
        <p className="text-sm text-gray-300 mb-4">
          Download a beautifully formatted PDF version of this article to read offline or share with your team.
        </p>
        <a
          href="/downloads/sample-ebook.pdf"
          download
          className="inline-block bg-secondary text-white px-5 py-2 rounded-md font-medium transition"
        >
          Download E-book
        </a>
      </div>

      {/* SHARE SECTION */}
      <div className="pt-12 border-t border-white/20">
        <p className="text-sm uppercase tracking-wide mb-4 text-white">Share</p>
        <div className="flex space-x-4 text-white text-xl">
          <a
            href={`https://twitter.com/intent/tweet?url=${window.location.href}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition"
          >
            <i className="fab fa-twitter" /> Twitter
          </a>
          <a
            href={`https://www.linkedin.com/shareArticle?mini=true&url=${window.location.href}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-300 transition"
          >
            <i className="fab fa-linkedin" /> LinkedIn
          </a>
        </div>
      </div>

      {/* RELATED ARTICLES */}
      <section className="pt-12 border-t border-white/20">
        <h2 className="text-2xl font-bold mb-6 text-white">Related Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {related.map(item => (
            <Link
              key={item.slug}
              to={`/blog/${item.slug}`}
              className="group rounded overflow-hidden transition"
            >
              <img
                src={item.coverImage}
                alt={item.title}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400 mt-1">{item.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </article>
    </div>
    
  );
}
