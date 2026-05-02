export function buildImageUrl(basePath, image, artwork, fallback) {
  let url;

  if (image) {
    if (image.startsWith('http')) {
      url = image.includes('%20')
        ? image
        : image.replace(/ /g, '%20');
    } else {
      url = `${basePath}/${encodeURIComponent(image)}`;
    }
  } else if (artwork) {
    url = `${basePath}/${encodeURIComponent(artwork)}`;
  } else {
    return fallback;
  }

  // Try to verify the URL exists (lightweight approach)
  return url;
}

const TRANSFORM_PREFIX = '/cdn-cgi/image/';
const DEFAULT_IMAGE_QUALITY = 85;
const TRANSFORMABLE_HOSTS = new Set([
  'cdn.align-alternativetherapy.com',
  'images.unsplash.com',
  'plus.unsplash.com',
  'images.pexels.com',
  'cdn.pixabay.com',
]);

function isLocalDevHost() {
  if (typeof window === 'undefined') return false;

  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
}

function normalizeImageSource(src) {
  if (!src || typeof src !== 'string') return '';
  return src.trim().replace(/ /g, '%20');
}

function canTransformImage(src) {
  if (!src || isLocalDevHost()) return false;
  if (src.startsWith(TRANSFORM_PREFIX) || src.includes('/cdn-cgi/image/')) return false;
  if (src.startsWith('data:') || src.startsWith('blob:')) return false;

  if (src.startsWith('/')) {
    const pathname = src.split('?')[0].toLowerCase();
    return !pathname.endsWith('.svg') && !pathname.endsWith('.gif');
  }

  try {
    const url = new URL(src);
    const pathname = url.pathname.toLowerCase();

    if (!TRANSFORMABLE_HOSTS.has(url.hostname)) return false;
    if (pathname.endsWith('.svg') || pathname.endsWith('.gif')) return false;

    return true;
  } catch {
    return false;
  }
}

function buildTransformOptions({ width, height, quality = DEFAULT_IMAGE_QUALITY, fit = 'cover' } = {}) {
  const options = ['format=auto'];

  if (quality) options.push(`quality=${quality}`);

  if (width) options.push(`width=${Math.round(width)}`);
  if (height) options.push(`height=${Math.round(height)}`);
  if (fit) options.push(`fit=${fit}`);

  return options.join(',');
}

export function getOptimizedImageUrl(src, options = {}) {
  const normalizedSrc = normalizeImageSource(src);

  if (!canTransformImage(normalizedSrc)) {
    return normalizedSrc;
  }

  const transformSrc = normalizedSrc.startsWith('/')
    ? normalizedSrc.replace(/^\/+/, '')
    : normalizedSrc;

  return `${TRANSFORM_PREFIX}${buildTransformOptions(options)}/${transformSrc}`;
}

export function getOptimizedBackgroundImage(src, options = {}) {
  const optimizedUrl = getOptimizedImageUrl(src, options);
  return optimizedUrl ? `url("${optimizedUrl}")` : undefined;
}

export function getOptimizedImageSrcSet(src, widths = [], options = {}) {
  const normalizedSrc = normalizeImageSource(src);

  if (!canTransformImage(normalizedSrc)) {
    return undefined;
  }

  const baseWidth = Number(options.width) || 0;
  const baseHeight = Number(options.height) || 0;
  const heightRatio = baseWidth && baseHeight ? baseHeight / baseWidth : null;

  return widths
    .filter(Boolean)
    .map((width) => {
      const nextOptions = {
        ...options,
        width,
        height: heightRatio ? Math.round(width * heightRatio) : options.height,
      };

      return `${getOptimizedImageUrl(normalizedSrc, nextOptions)} ${width}w`;
    })
    .join(', ');
}
