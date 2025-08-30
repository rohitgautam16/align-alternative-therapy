// src/pages/SubscribePage.jsx
import React from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PlanImg from '../assets/images/girl-piano.jpg';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCheckoutSubscriptionMutation } from '../utils/api';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';

const cardVariants = {
  offscreen: { opacity: 0, y: 20 },
  onscreen: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ---------- auth gate ----------
function useAuthGate() {
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginPromptOpen, setLoginPromptOpen] = React.useState(false);

  const requireAuthThen = React.useCallback(
    (actionFn) => {
      if (isAuthenticated) {
        actionFn?.();
      } else {
        // save where to return; your DashboardHome reads this and redirects back
        const current = location.pathname + location.search;
        sessionStorage.setItem('returnToPath', current);
        sessionStorage.setItem('loginRedirect', 'return'); // optional flag you already use
        setLoginPromptOpen(true);
      }
    },
    [isAuthenticated, location.pathname, location.search]
  );

  const proceedToLogin = React.useCallback(() => {
    setLoginPromptOpen(false);
    navigate('/login'); // your login lands on /dashboard; DashboardHome handles returnToPath
  }, [navigate]);

  return { requireAuthThen, loginPromptOpen, setLoginPromptOpen, proceedToLogin };
}

// ---------- tiny atoms ----------
const PlanFeature = ({ text }) => (
  <li className="flex items-center">
    <Check className="h-5 w-5 text-gray-400 mr-3" />
    <span className="text-gray-300">{text}</span>
  </li>
);

const Plan = ({
  name,
  price,
  originalPrice,
  discountedPrice,
  features,
  buttonText,
  onSelect,
  loading,
}) => (
  <motion.div
    variants={cardVariants}
    initial="offscreen"
    whileInView="onscreen"
    viewport={{ once: true, amount: 0.5 }}
    whileHover={{ scale: 1.05, transition: { type: 'spring', stiffness: 300 } }}
    className="relative bg-[#0A0A0A] rounded-3xl p-6 border border-gray-800 h-full flex flex-col"
  >
    <div className="mb-6">
      <div className="flex items-baseline flex-wrap">
        {discountedPrice != null ? (
          <>
            <span className="text-2xl font-light line-through text-gray-400">
              CA${originalPrice}
            </span>
            <span className="text-3xl font-light ml-2">CA${discountedPrice}</span>
          </>
        ) : (
          <span className="text-3xl font-light">
            {price === 0 ? 'CA$0' : `CA$${price}`}
          </span>
        )}
        <span className="ml-2 text-gray-400 whitespace-nowrap">
          {name.includes('Monthly') ? '/ Month' : name.includes('Yearly') ? '/ Year' : ''}
        </span>
      </div>
      <h3 className="text-xl font-light mt-4 mb-6">{name}</h3>
    </div>

    <ul className="space-y-4 mb-6 flex-grow">
      {features.map((feat, i) => (
        <PlanFeature key={i} text={feat.text} />
      ))}
    </ul>

    <button
      onClick={onSelect}
      disabled={loading}
      className="w-full bg-white text-black py-3 rounded-full font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
    >
      {loading ? 'Processing…' : buttonText}
    </button>
  </motion.div>
);

function Modal({ open, onClose, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md bg-[#0B0B0B] rounded-2xl border border-gray-800 p-6 shadow-xl"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------- glassmorphism add-on banner (monthly + addon bundle) ----------
function AddonGlassBanner({ loading, onStartBundle, onMonthlyOnly }) {
  return (
    <section className="mt-12">
      <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-white/15 to-white/5">
        <div className="relative rounded-[calc(1.5rem-1px)] border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="pointer-events-none absolute -inset-20 bg-[radial-gradient(40rem_20rem_at_10%_0%,rgba(255,255,255,0.10),transparent),radial-gradient(40rem_24rem_at_100%_0%,rgba(255,255,255,0.06),transparent)]" />
          <div className="relative p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* left */}
              <div className="md:col-span-4 flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" width="22" height="22" className="text-white/90">
                    <path
                      fill="currentColor"
                      d="M5 21a1 1 0 0 1-.7-1.7L14.6 9 16 10.4 5.7 20.7A1 1 0 0 1 5 21Zm10.6-10.6-2-2L16.6 5 19 7.4 15.6 10.4ZM7 7V5h2V3h2v2h2v2h-2v2h-2V7H7Z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-white/50">Premium Add-on</div>
                  <h3 className="text-2xl font-light text-white/95 flex items-center gap-2">
                    Personalized Service
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/70" />
                  </h3>
                  <p className="mt-2 text-sm text-white/70 leading-relaxed">
                    Human-in-the-loop guidance with tailored tracks & playlists matched to your mood and goals.
                  </p>
                </div>
              </div>

              {/* middle features */}
              <div className="md:col-span-4">
                <ul className="grid sm:grid-cols-2 gap-2">
                  {[
                    'Tailored tracks & playlists',
                    'Iterative chat & follow-ups',
                    'Mood & category aligned',
                    'Seamless with Monthly plan',
                  ].map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-white/80">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-white/30">
                        <span className="w-2 h-2 rounded-full bg-white/80" />
                      </span>
                      <span className="text-sm">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* right CTA card */}
              <div className="md:col-span-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-white/50">Bundle</div>
                      <div className="text-lg text-white/90">Monthly + Personalized Add-on</div>
                    </div>
                    <div className="hidden sm:block text-xs text-white/60">
                      <span className="inline-flex items-center gap-1">
                        <svg viewBox="0 0 24 24" width="16" height="16" className="text-white/70">
                          <path fill="currentColor" d="M12 2 1 9l11 7 9-5.73V17h2V9L12 2Z" />
                        </svg>
                        Secure checkout
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={onStartBundle}
                    disabled={loading}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2
                               rounded-xl bg-white text-black font-semibold px-4 py-3
                               hover:bg-white/90 active:scale-[0.99] transition
                               disabled:opacity-50"
                  >
                    {loading ? 'Processing…' : 'Start with Personalized Add-on'}
                    <svg viewBox="0 0 24 24" width="18" height="18" className="text-black/80">
                      <path fill="currentColor" d="M13 5v2h3.59L6 17.59 7.41 19 18 8.41V12h2V5z" />
                    </svg>
                  </button>

                  <p className="mt-3 text-xs text-white/60">
                    Prefer only the Monthly plan?{' '}
                    <button
                      type="button"
                      onClick={onMonthlyOnly}
                      className="underline underline-offset-4 hover:text-white/80"
                    >
                      Continue without add-on
                    </button>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-white/50">
              <div className="inline-flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-white/60" />
                Cancel anytime
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-white/40" />
                No hidden fees
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-white/30" />
                Works worldwide
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- page ----------
export default function SubscribePage() {
  const navigate = useNavigate();
  const { requireAuthThen, loginPromptOpen, setLoginPromptOpen, proceedToLogin } = useAuthGate();

  const [checkout, { isLoading, error }] = useCheckoutSubscriptionMutation();

  // confirmation modal for adding add-on with base plan
  const [addOnChoice, setAddOnChoice] = React.useState({ open: false, plan: 'monthly', trial: false });

  async function startBaseCheckout({ plan, trial = false, includeAddon = false }) {
    try {
      const result = await checkout({ plan, trial, includeAddon }).unwrap();
      if (result.url) {
        window.location.href = result.url;
      } else {
        // updated in place (rare) → just go to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      // if server returns 401 we still show login prompt via requireAuthThen at call sites
      console.error('Checkout failed:', err);
      alert(err?.data?.error || 'Checkout failed');
    }
  }

  // base plan card click → ask to include add-on?
  const handleBasePlanClick = (plan, trial = false) => {
    requireAuthThen(() => setAddOnChoice({ open: true, plan, trial }));
  };

  const confirmBaseNoAddon = () => {
    const { plan, trial } = addOnChoice;
    setAddOnChoice((s) => ({ ...s, open: false }));
    startBaseCheckout({ plan, trial, includeAddon: false });
  };

  const confirmBaseWithAddon = () => {
    const { plan, trial } = addOnChoice;
    setAddOnChoice((s) => ({ ...s, open: false }));
    startBaseCheckout({ plan, trial, includeAddon: true });
  };

  const handeConatctSales = () => navigate('/contact-us');

  const plans = [
    {
      name: '1 Month Free Access',
      price: 0,
      features: [
        { text: 'Basic Audio Quality' },
        { text: 'Limited Content' },
        { text: '24/7 Customer Support' },
        { text: 'Personalized Recommendations' },
      ],
      buttonText: 'Get 1-Month Free',
      onSelect: () => handleBasePlanClick('monthly', true),
    },
    {
      name: 'Monthly Plan',
      price: 9.99,
      features: [
        { text: 'Basic Audio Quality' },
        { text: 'Unlimited Content' },
        { text: '24/7 Customer Support' },
        { text: 'Personalized Recommendations' },
      ],
      buttonText: 'Subscribe Monthly',
      onSelect: () => handleBasePlanClick('monthly'),
    },
    {
      name: 'Yearly Plan',
      originalPrice: 120,
      discountedPrice: 108,
      features: [
        { text: 'High Audio Quality' },
        { text: 'Exclusive Content' },
        { text: 'Offline Listening' },
        { text: 'Priority Support' },
        { text: 'Early Access Releases' },
      ],
      buttonText: 'Subscribe Yearly',
      onSelect: () => handleBasePlanClick('annual'),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-screen mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-light mb-4">Our Pricing Plan</h2>
          <p className="text-base text-gray-400 max-w-3xl mx-auto">
            Unlock Your Inner Calm with Align
          </p>
        </div>

        {/* Featured + Plans */}
        <div className="grid gap-6 md:gap-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {/* Featured Card */}
          <motion.div
            variants={cardVariants}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: true, amount: 0.5 }}
            whileHover={{ scale: 1.05, transition: { type: 'spring', stiffness: 300 } }}
            className="relative bg-white/90 rounded-3xl p-6 overflow-hidden h-full flex flex-col"
          >
            <div className="aspect-video mb-6">
              <img
                src={PlanImg}
                alt="Featured"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
            <h3 className="text-xl text-gray-800 font-light mb-4 flex-grow">
              Discover tranquility through a curated selection of music and experiences.
            </h3>
            <button
              className="w-full bg-black text-white py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
              onClick={handeConatctSales}
            >
              Contact Sales
            </button>
          </motion.div>

          {/* Plan Cards */}
          {plans.map((p, i) => (
            <Plan key={i} {...p} loading={isLoading} />
          ))}
        </div>

        {/* Glassmorphism Add-on Banner (Monthly + Add-on Bundle) */}
        <AddonGlassBanner
          loading={isLoading}
          onStartBundle={() =>
            requireAuthThen(() => startBaseCheckout({ plan: 'monthly', includeAddon: true }))
          }
          onMonthlyOnly={() =>
            requireAuthThen(() => startBaseCheckout({ plan: 'monthly', includeAddon: false }))
          }
        />

        {/* Server error display */}
        {error && (
          <p className="mt-6 text-center text-red-400">
            {error.data?.error || error.error}
          </p>
        )}
      </div>

      {/* Include Add-on? (modal on base plan card click) */}
      <Modal open={addOnChoice.open} onClose={() => setAddOnChoice((s) => ({ ...s, open: false }))}>
        <div className="space-y-4">
          <h4 className="text-lg font-medium">Add Personalized Service?</h4>
          <p className="text-sm text-gray-400">
            Enhance your plan with tailored recommendations and human-in-the-loop guidance. You can remove it anytime.
          </p>
          <div className="flex gap-2 flex-col sm:flex-row">
            <button
              onClick={confirmBaseWithAddon}
              className="flex-1 px-4 py-2 rounded-lg bg-white text-black font-medium hover:bg-gray-100"
            >
              Yes, add it
            </button>
            <button
              onClick={confirmBaseNoAddon}
              className="flex-1 px-4 py-2 rounded-lg bg-transparent border border-gray-700 hover:border-gray-600"
            >
              No, continue
            </button>
          </div>
        </div>
      </Modal>

      {/* Login required modal */}
      <Modal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)}>
        <div className="space-y-4">
          <h4 className="text-lg font-medium">Login Required</h4>
          <p className="text-sm text-gray-400">Please log in to continue to checkout.</p>
          <div className="flex gap-2">
            <button
              onClick={proceedToLogin}
              className="flex-1 px-4 py-2 rounded-lg bg-white text-black font-medium hover:bg-gray-100"
            >
              Go to Login
            </button>
            <button
              onClick={() => setLoginPromptOpen(false)}
              className="flex-1 px-4 py-2 rounded-lg bg-transparent border border-gray-700 hover:border-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
