// src/components/blog/BlogCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function BlogCard({ blog }) {
  return (
    <div className="rounded-lg overflow-hidden shadow-lg">
      <img src={blog.coverImage} alt={blog.title} className="w-full h-48 object-cover"/>
      <div className="p-4">
        <h3 className="text-xl font-semibold">{blog.title}</h3>
        <p className="mt-2 text-gray-600">{blog.excerpt}</p>
        <a
          href={`/blog/${blog.slug}`}
          className="mt-4 inline-block text-red-500 hover:underline"
        >
          Read more →
        </a>
      </div>
    </div>
  );
}