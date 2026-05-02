import React, { forwardRef, useMemo, useState } from 'react';
import { getOptimizedImageSrcSet, getOptimizedImageUrl } from '../../utils/imageHelpers';

const DEFAULT_WIDTHS = [320, 480, 640, 960, 1280];

const OptimizedImage = forwardRef(function OptimizedImage({
  src,
  alt = '',
  width,
  height,
  widths = DEFAULT_WIDTHS,
  sizes = '100vw',
  quality = 85,
  fit = 'cover',
  fallback,
  priority = false,
  loading,
  decoding = 'async',
  onError,
  ...props
}, ref) {
  const [failed, setFailed] = useState(false);
  const activeSrc = failed && fallback ? fallback : src;
  const transformOptions = useMemo(
    () => ({ width, height, quality, fit }),
    [fit, height, quality, width]
  );
  const optimizedSrc = getOptimizedImageUrl(activeSrc, transformOptions);
  const optimizedSrcSet = getOptimizedImageSrcSet(activeSrc, widths, transformOptions);

  return (
    <img
      {...props}
      ref={ref}
      src={optimizedSrc}
      srcSet={optimizedSrcSet}
      sizes={optimizedSrcSet ? sizes : undefined}
      width={width}
      height={height}
      alt={alt}
      loading={loading || (priority ? 'eager' : 'lazy')}
      fetchPriority={priority ? 'high' : props.fetchPriority}
      decoding={decoding}
      onError={(event) => {
        if (fallback && !failed) {
          event.currentTarget.removeAttribute('srcset');
          setFailed(true);
          return;
        }

        onError?.(event);
      }}
    />
  );
});

export default OptimizedImage;
