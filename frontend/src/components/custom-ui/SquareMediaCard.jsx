import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import OptimizedImage from '../common/OptimizedImage';

const CARD_IMAGE_SIZE = 360;

export const SquareMediaCard = memo(function SquareMediaCard({
  type,
  data,
  fallback
}) {
  const navigate = useNavigate();

  const rawImage =
    data?.image ||
    data?.artwork_filename ||
    data?.cover_image;

  const image = rawImage || fallback;

  const link =
    type === 'song'
      ? `/dashboard/song/${data.slug}`
      : `/dashboard/playlist/${data.slug}`;

  return (
    <div
      onClick={() => navigate(link)}
      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
    >
      <OptimizedImage
        src={image}
        widths={[160, 320, 480]}
        sizes="33vw"
        width={CARD_IMAGE_SIZE}
        height={CARD_IMAGE_SIZE}
        alt={data?.title || 'media'}
        fallback={fallback}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      <div className="absolute bottom-3 left-2 right-3">
        <p className="text-sm font-medium text-white truncate">
          {data?.title}
        </p>
      </div>
    </div>
  );
});
