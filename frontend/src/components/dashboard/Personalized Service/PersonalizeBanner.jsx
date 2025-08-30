// src/components/dashboard/PersonalizeBanner.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import { useGetSubscriptionSummaryQuery } from '../../../utils/api';

const BG_IMG =
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0';
const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1169&auto=format&fit=crop';

export default function PersonalizeBanner() {
  const navigate = useNavigate();
  const user = useAuthUser();
  const userId = user?.id ?? 'anon';


  // Authoritative: server summary
  const {
    data: subSummary,
    isFetching,
    isError,
    refetch,
  } = useGetSubscriptionSummaryQuery(userId, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 0,
  });

  // Fallback to cookie ONLY if summary not present (cookie can be stale)
  const hasAddonFromSummary = subSummary?.hasAddon;
  const hasAddonFromCookie = Number(user?.has_addon) === 1;
  const hasAddon = typeof hasAddonFromSummary === 'boolean'
    ? hasAddonFromSummary
    : hasAddonFromCookie;

  const [imgSrc, setImgSrc] = React.useState(BG_IMG);
  const onImgError = React.useCallback(() => {
    if (imgSrc !== FALLBACK_IMG) setImgSrc(FALLBACK_IMG);
  }, [imgSrc]);

  const ctaText = hasAddon ? 'Start a request' : 'Get Personalized Support';
  const target = hasAddon ? '/dashboard/personalize' : '/pricing';

  const onClick = () => navigate(target);

  // If you want to ensure a refetch after returning from Stripe success page,
  // you can set sessionStorage.setItem('shouldRefetchSub', '1') there and:
  React.useEffect(() => {
    const flag = sessionStorage.getItem('shouldRefetchSub');
    if (flag) {
      sessionStorage.removeItem('shouldRefetchSub');
      refetch();
    }
  }, [refetch]);

  return (
    <section
      className="
        relative overflow-hidden rounded-2xl m-4
        h-58 sm:h-50 md:h-64 flex items-end
        bg-neutral-900
      "
    >
      {/* Background image with fallback */}
      <img
        src={imgSrc}
        onError={onImgError}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
        decoding="async"
      />

      {/* Subtle dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />

      {/* Content */}
      <div className="relative px-5 sm:px-7 lg:px-8 py-8 sm:py-10">
        <div className="max-w-2xl text-white">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Personalized Recommendations
            </h2>
            {isFetching && (
              <span className="text-[11px] text-white/60">updating…</span>
            )}
          </div>

          <p className="text-sm sm:text-base text-white/85 mt-1">
            Hand-picked tracks and playlists tuned to your mood and goals. Ask, iterate, and refine quickly.
          </p>

          {!hasAddon && (
            <p className="text-xs text-white/70 mt-2">
              This feature requires the Personalized Add-on.
            </p>
          )}

          <button
            type="button"
            onClick={onClick}
            className="
              mt-4 inline-flex items-center gap-2
              rounded-lg px-4 py-2 text-sm
              border border-white/80 text-white
              bg-white/10 backdrop-blur-sm
              hover:bg-white hover:text-black hover:border-white
              transition-all duration-300 drop-shadow-lg
              cursor-pointer
            "
            aria-label={ctaText}
          >
            {ctaText}
            <ArrowRight size={16} />
          </button>

          {isError && (
            <div className="mt-2 text-xs text-red-400">
              Couldn’t refresh membership. We’ll keep trying on focus.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
