// src/pages/SubscribePage.jsx
import React from 'react';
import { Check, X } from 'lucide-react';
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
        const current = location.pathname + location.search;
        sessionStorage.setItem('returnToPath', current);
        sessionStorage.setItem('loginRedirect', 'return');
        setLoginPromptOpen(true);
      }
    },
    [isAuthenticated, location.pathname, location.search]
  );

  const proceedToLogin = React.useCallback(() => {
    setLoginPromptOpen(false);
    navigate('/login');
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

const Plan = ({ name, price, originalPrice, discountedPrice, features, buttonText, onSelect, loading }) => (
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
          <span className="text-3xl font-light">{price === 0 ? 'CA$0' : `CA$${price}`}</span>
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
      className="w-full bg-white text-black py-3 rounded-full cursor-pointer font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
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

// ---------- page ----------
export default function SubscribePage() {
  const navigate = useNavigate();
  const { requireAuthThen, loginPromptOpen, setLoginPromptOpen, proceedToLogin } = useAuthGate();

  const [checkout, { isLoading, error }] = useCheckoutSubscriptionMutation();

  async function startBaseCheckout({ plan, trial = false }) {
    try {
      const result = await checkout({ plan, trial }).unwrap();
      if (result.url) {
        window.location.href = result.url;
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      alert(err?.data?.error || 'Checkout failed');
    }
  }

  const handleBasePlanClick = (plan, trial = false) => {
    requireAuthThen(() => startBaseCheckout({ plan, trial }));
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
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Top-right cross button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      <div className="max-w-screen mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-light mb-4">Our Pricing Plan</h2>
          <p className="text-base text-gray-400 max-w-3xl mx-auto">
            Unlock Your Inner Calm with Align
          </p>
        </div>

        {/* Featured + Plans */}
        <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Featured Card */}
          <motion.div
            variants={cardVariants}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: true, amount: 0.5 }}
            whileHover={{ scale: 1.05, transition: { type: 'spring', stiffness: 300 } }}
            className="relative bg-white/90 rounded-3xl p-6 py-10 overflow-hidden h-full flex flex-col"
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
            {/* <button
              className="w-full bg-black text-white py-3 cursor-pointer rounded-full font-medium hover:bg-gray-800 transition-colors"
              onClick={handeConatctSales}
            >
              Contact Sales
            </button> */}
          </motion.div>

          {/* Plan Cards */}
          {plans.map((p, i) => (
            <Plan key={i} {...p} loading={isLoading} />
          ))}
        </div>

        {/* Server error display */}
        {error && (
          <p className="mt-6 text-center text-red-400">
            {error.data?.error || error.error}
          </p>
        )}
      </div>

      {/* Login required modal */}
      <Modal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)}>
        <div className="space-y-4">
          <h4 className="text-lg font-medium">Login Required</h4>
          <p className="text-sm text-gray-400">Please log in to continue to checkout.</p>
          <div className="flex gap-2">
            <button
              onClick={proceedToLogin}
              className="flex-1 px-4 py-2 rounded-lg cursor-pointer bg-white text-black font-medium hover:bg-gray-100"
            >
              Go to Login
            </button>
            <button
              onClick={() => setLoginPromptOpen(false)}
              className="flex-1 px-4 py-2 rounded-lg cursor-pointer bg-transparent border border-gray-700 hover:border-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
