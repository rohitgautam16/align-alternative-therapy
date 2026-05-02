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

const DEFAULT_TRANSFORM_HOST = 'https://cdn.align-alternativetherapy.com';
const DEFAULT_IMAGE_QUALITY = 85;
const TRANSFORMABLE_HOSTS = new Set([
  'cdn.align-alternativetherapy.com',
  'images.unsplash.com',
  'plus.unsplash.com',
  'images.pexels.com',
  'cdn.pixabay.com',
]);
const NON_TRANSFORMABLE_EXTENSIONS = new Set(['.avif', '.webp', '.svg', '.gif']);

function isLocalDevHost() {
  if (typeof window === 'undefined') return false;

  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
}

function transformsEnabled() {
  return import.meta.env?.VITE_ENABLE_CLOUDFLARE_IMAGES !== 'false';
}

function getTransformPrefix() {
  const configuredHost =
    import.meta.env?.VITE_CLOUDFLARE_IMAGE_HOST || DEFAULT_TRANSFORM_HOST;
  const host = configuredHost.replace(/\/+$/, '');

  return `${host}/cdn-cgi/image/`;
}

export function normalizeImageSource(src) {
  if (!src || typeof src !== 'string') return '';
  return src.trim().replace(/ /g, '%20');
}

function getImagePathname(src) {
  const pathWithoutQuery = src.split('?')[0].toLowerCase();

  if (pathWithoutQuery.startsWith('/')) {
    return pathWithoutQuery;
  }

  try {
    return new URL(src).pathname.toLowerCase();
  } catch {
    return pathWithoutQuery;
  }
}

function hasNonTransformableExtension(src) {
  const pathname = getImagePathname(src);
  return [...NON_TRANSFORMABLE_EXTENSIONS].some((extension) =>
    pathname.endsWith(extension)
  );
}

function canTransformImage(src) {
  if (!transformsEnabled()) return false;
  if (!src || isLocalDevHost()) return false;
  if (src.includes('/cdn-cgi/image/')) return false;
  if (src.startsWith('data:') || src.startsWith('blob:')) return false;
  if (hasNonTransformableExtension(src)) return false;

  if (src.startsWith('/')) {
    return true;
  }

  try {
    const url = new URL(src);
    return TRANSFORMABLE_HOSTS.has(url.hostname);
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

  return `${getTransformPrefix()}${buildTransformOptions(options)}/${transformSrc}`;
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
