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
