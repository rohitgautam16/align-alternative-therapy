import { useEffect } from 'react';

const SITE_NAME = 'Align Alternative Therapy';
const SITE_URL = 'https://align-alternativetherapy.com';
const DEFAULT_DESCRIPTION =
  'Align Alternative Therapy offers sound healing, frequency-based audio, and personalized wellness tools for calm, focus, sleep, and balance.';

function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value == null) return;
    element.setAttribute(key, value);
  });
}

function upsertLink(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value == null) return;
    element.setAttribute(key, value);
  });
}

export function stripHtml(value = '') {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function truncateDescription(value = '', maxLength = 160) {
  const text = stripHtml(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
}

export default function useDocumentMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  robots,
  author,
  publishedTime,
  canonical,
} = {}) {
  useEffect(() => {
    const pageTitle = title?.includes(SITE_NAME)
      ? title
      : `${title || SITE_NAME} | ${SITE_NAME}`;
    const pageDescription = truncateDescription(description || DEFAULT_DESCRIPTION);
    const canonicalUrl = absoluteUrl(canonical || path);

    document.title = pageTitle;

    upsertMeta('meta[name="description"]', {
      name: 'description',
      content: pageDescription,
    });

    if (robots) {
      upsertMeta('meta[name="robots"]', {
        name: 'robots',
        content: robots,
      });
    }

    if (author) {
      upsertMeta('meta[name="author"]', {
        name: 'author',
        content: author,
      });
    }

    if (publishedTime) {
      upsertMeta('meta[property="article:published_time"]', {
        property: 'article:published_time',
        content: publishedTime,
      });
    }

    upsertLink('link[rel="canonical"]', {
      rel: 'canonical',
      href: canonicalUrl,
    });

    upsertLink('link[rel="alternate"][hreflang="en"]', {
      rel: 'alternate',
      hrefLang: 'en',
      href: canonicalUrl,
    });

    upsertLink('link[rel="alternate"][hreflang="x-default"]', {
      rel: 'alternate',
      hrefLang: 'x-default',
      href: canonicalUrl,
    });
  }, [author, canonical, description, path, publishedTime, robots, title]);
}
