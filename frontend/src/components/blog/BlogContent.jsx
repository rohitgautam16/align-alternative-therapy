import DOMPurify from 'dompurify';
import { useMemo } from 'react';

export default function BlogContent({ html }) {
  const cleanHtml = useMemo(() => {
    if (!html) return '';

    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },

      ADD_ATTR: [
        'loading',
        'decoding',
        'fetchpriority',
        'referrerpolicy',
      ],

      ADD_TAGS: ['iframe'], 
    });
  }, [html]);

  return (
    <article
      className="prose prose-invert max-w-none blog-content"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
