// src/components/dashboard/Personalized Service/PBMyRecommendations.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X } from 'lucide-react';
import { useListMyPbRecommendationsQuery } from '../../../utils/api';
import { useSubscription } from '../../../context/SubscriptionContext';
import CarouselSection from '../../dashboard/CarouselSection';
import PlaylistCard from '../../custom-ui/PlaylistCard';
import SongCard from '../../custom-ui/SongCard';
import MobilePagedGrid from '../../custom-ui/MobilePagedGrid';
import { SquareMediaCard } from '../../custom-ui/SquareMediaCard';

export default function PBMyRecommendations() {

  const location = useLocation();
  const { data, isLoading, isError, refetch } = useListMyPbRecommendationsQuery();
  const { baseEntitled } = useSubscription();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('pb') === 'success') {
      refetch();
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [location, refetch]);

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [paymentUrl, setPaymentUrl] = useState(null);

  const renderGridItem = useCallback((entry) => (
    <CardWithMeta
      key={entry.key}
      kind={entry.type === 'playlist' ? 'playlist' : 'song'}
      item={entry.data}
      meta={entry.meta}
      k={entry.key}
    />
  ), []);


  if (isError || !Array.isArray(data) || data.length === 0) return null;

  const unified = [];

  for (const entry of data) {
    const rec = entry?.recommendation;
    if (!rec) continue;

    const recTitle = rec.title?.trim() || 'Personalized Pack';
    const recId = rec.id;
    const paymentStatus = rec.payment_status || 'pending';
    const paymentLinkUrl = rec.payment_link_url || null;

    const items = Array.isArray(entry?.items) ? entry.items : [];

    for (const it of items) {

      if (it.item_type === 'track' && it.track) {
        unified.push({
          type: 'song',
          data: it.track,
          meta: {
            recId,
            recTitle,
            paymentStatus,
            paymentLinkUrl,
            prescription: it.prescription_note || '',
          },
          key: `rec-${recId}-song-${it.track.id}-${it.id}`,
        });
      }

      if (it.item_type === 'playlist' && it.playlist) {
        unified.push({
          type: 'playlist',
          data: it.playlist,
          meta: {
            recId,
            recTitle,
            paymentStatus,
            paymentLinkUrl,
            prescription: it.prescription_note || '',
          },
          key: `rec-${recId}-pl-${it.playlist.id}-${it.id}`,
        });
      }

    }
  }

  if (unified.length === 0) return null;


  function CardWithMeta({ kind, item, meta, k }) {

    const locked = meta.paymentStatus !== 'paid' && meta.paymentStatus !== 'free';

    const handleLockedClick = (e) => {
      e.stopPropagation();
      if (!locked) return;

      if (meta.paymentLinkUrl) {
        setPopupMessage('This recommendation is locked. Complete payment to unlock access.');
        setPaymentUrl(meta.paymentLinkUrl);
      } else {
        setPopupMessage('Payment link not generated yet. Please contact support or wait for the admin to set up payment.');
        setPaymentUrl(null);
      }

      setShowPopup(true);
    };

    return (
      <div
        key={k}
        className="relative group"
        onClick={locked ? handleLockedClick : undefined}
      >

        {/* MOBILE GRID CARD */}
        <div className="md:hidden">
          <SquareMediaCard
            type={kind}
            data={item}
            fallback="https://cdn.align-alternativetherapy.com/static-pages-media/Align-fallback-img.png"
          />
        </div>

        {/* DESKTOP CARD */}
        <div className="hidden md:block">
          {kind === 'playlist' ? (
            <PlaylistCard
              playlist={item}
              isLockedOverlay={locked}
              disableTierCheck
            />
          ) : (
            <SongCard
              song={item}
              isLockedOverlay={locked}
              disableTierCheck
            />
          )}
        </div>

        {/* Recommendation Badge */}
        <div className="absolute top-2 left-2">
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-[11px]
            bg-transparent backdrop-blur-sm text-gray-100 ring-1 ring-white/15"
            title={meta.recTitle}
          >
            {meta.recTitle}
          </span>
        </div>

        {/* Lock Overlay */}
        {locked && (
          <div className="absolute inset-0 flex items-center cursor-pointer justify-center bg-black/60 backdrop-blur-[2px] rounded-md">
            <button
              onClick={handleLockedClick}
              className="p-2 md:p-4 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
            >
              <Lock className="w-4 h-4 md:w-8 md:h-8 text-white" />
            </button>
          </div>
        )}

        {/* Prescription Note */}
        {meta.prescription?.trim() && (
          <div
            className="mt-2 px-2 py-1 text-xs text-gray-100 line-clamp-2 backdrop-blur-sm"
            title={meta.prescription}
          >
            Note — {meta.prescription}
          </div>
        )}

      </div>
    );
  }


  return (
    <>

      {/* MOBILE GRID */}
      <div className="md:hidden">
        <MobilePagedGrid
          title="For You"
          items={unified}
          isLoading={isLoading}
          itemsPerPage={9}
          renderItem={renderGridItem}
        />
      </div>

      {/* DESKTOP CAROUSEL */}
      <div className="hidden md:block">
        <CarouselSection
          title="For You"
          items={unified}
          isLoading={isLoading}
          renderItem={(entry) => (
            <CardWithMeta
              key={entry.key}
              kind={entry.type === 'playlist' ? 'playlist' : 'song'}
              item={entry.data}
              meta={entry.meta}
              k={entry.key}
            />
          )}
        />
      </div>


      {/* PAYMENT POPUP */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 12 }}
              className="relative bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 w-[90%] max-w-md text-center shadow-lg"
            >

              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-3 right-3 text-white hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center">

                <Lock className="w-10 h-10 text-secondary mb-3" />

                <p className="text-white text-lg font-medium mb-5">
                  {popupMessage}
                </p>

                {paymentUrl ? (
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-secondary text-gray-900 px-5 py-2.5 rounded-full hover:bg-secondary/80"
                  >
                    Pay to Unlock
                  </a>
                ) : (
                  <button
                    onClick={() => setShowPopup(false)}
                    className="bg-gray-600 text-white px-5 py-2.5 rounded-full hover:bg-gray-500"
                  >
                    Close
                  </button>
                )}

              </div>

            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}