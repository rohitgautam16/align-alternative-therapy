// src/pages/SubscribePage.jsx
import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useCheckoutSubscriptionMutation,
  useValidatePromoCodeMutation
} from '../utils/api';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';

const cardVariants = {
  offscreen: { opacity: 0, y: 50 },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

// ---------- auth gate ----------
function useAuthGate() {
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();
  const [loginPromptOpen, setLoginPromptOpen] = React.useState(false);

  const requireAuthThen = useCallback(
    (fn) => {
      if (isAuthenticated) fn?.();
      else {
        sessionStorage.setItem(
          'returnToPath',
          window.location.pathname + window.location.search
        );
        sessionStorage.setItem('loginRedirect', 'return');
        setLoginPromptOpen(true);
      }
    },
    [isAuthenticated]
  );

  const proceedToLogin = useCallback(() => {
    setLoginPromptOpen(false);
    navigate('/login');
  }, [navigate]);

  return { requireAuthThen, loginPromptOpen, setLoginPromptOpen, proceedToLogin };
}

export default function SubscribePage() {
  const navigate = useNavigate();
  const { requireAuthThen, loginPromptOpen, setLoginPromptOpen, proceedToLogin } =
    useAuthGate();

  const [checkout, { isLoading, error }] = useCheckoutSubscriptionMutation();
  const [validatePromo, { isLoading: validatingPromo }] =
    useValidatePromoCodeMutation();

  // Promo state (only Yearly)
  const [promoInput, setPromoInput] = React.useState("");
  const [validatedPromo, setValidatedPromo] = React.useState(null);
  const [promoError, setPromoError] = React.useState("");
  const [showPromoInput, setShowPromoInput] = React.useState(false);

  // Validate promo
  async function handleApplyPromo() {
    try {
      setPromoError("");
      const result = await validatePromo({ promoCode: promoInput }).unwrap();

      if (!result.valid) {
        setValidatedPromo(null);
        setPromoError("Invalid or expired promo code");
        return;
      }

      setValidatedPromo(result);
      setPromoError("");
    } catch (err) {
      setPromoError("Could not validate promo code");
    }
  }

  // Checkout
  async function startCheckout(plan) {
    try {
      const result = await checkout({
        plan,
        promoCode: plan === "annual" ? validatedPromo?.promoCode || null : null
      }).unwrap();

      if (result.url) window.location.href = result.url;
      else navigate('/dashboard');
    } catch (err) {
      alert(err?.data?.error || 'Checkout failed');
    }
  }

  const handleBasePlanClick = (plan) =>
    requireAuthThen(() => startCheckout(plan));

  const handeConatctSales = () => navigate('/contact-us');

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-50"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-8 right-8 z-50 p-3 cursor-pointer rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 transition-all duration-300 group"
      >
        <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
      </button>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-sm font-medium tracking-wide">PRICING PLANS</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-light mb-6 tracking-tight">
            Choose Your <span className="font-medium">Plan</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-light">
            Unlock your inner calm with Align
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto mb-24">

          {/* MONTHLY */}
          <motion.div variants={cardVariants} initial="offscreen" whileInView="onscreen" viewport={{ once: true }} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>

            <div className="relative h-full bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8 transition-all duration-300 group-hover:border-white/20 group-hover:scale-[1.02]">
              <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm">
                <span className="text-xs font-semibold text-blue-300 tracking-wider">POPULAR</span>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-medium mb-2">Monthly</h3>
                <p className="text-sm text-gray-400">Perfect for getting started</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-6xl font-light tracking-tight">$151</span>
                  <span className="text-gray-400 text-lg font-light">/month</span>
                </div>
                <p className="text-sm text-gray-500">Billed monthly</p>
              </div>

              <button
                onClick={() => handleBasePlanClick('monthly')}
                disabled={isLoading}
                className="w-full py-4 rounded-full bg-white text-black font-medium hover:bg-gray-100 transition-all duration-300 shadow-lg disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Subscribe Monthly'}
              </button>
            </div>
          </motion.div>

          {/* YEARLY CARD */}
          <motion.div variants={cardVariants} initial="offscreen" whileInView="onscreen" viewport={{ once: true }} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-secondary-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>

            <div className="relative h-full bg-gradient-to-br from-white/[0.12] to-white/[0.05] backdrop-blur-xl rounded-3xl border-2 border-white/20 p-8 transition-all duration-300 group-hover:border-white/30 group-hover:scale-[1.02] shadow-2xl">

              {/* Badge */}
              <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-green-500/20 border border-green-400/40 backdrop-blur-sm">
                <span className="text-xs font-semibold text-green-300 tracking-wider">BEST VALUE</span>
              </div>

              {/* Title */}
              <div className="mb-8">
                <h3 className="text-2xl font-medium mb-2">Yearly</h3>
                <p className="text-sm text-gray-400">Best value for committed members</p>
              </div>

              {/* Pricing */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                  {/* <span className="text-4xl font-light text-gray-500 line-through">$1499</span> */}
                  <span className="text-6xl font-light tracking-tight">$1499</span>
                </div>
                <p className="text-sm text-gray-400">Billed annually · Save $500</p>
              </div>

              {/* "Have a coupon code?" CTA */}
              {!showPromoInput && (
                <button
                  onClick={() => setShowPromoInput(true)}
                  className="text-sm text-gray-300 cursor-pointer hover:text-white transition-all mb-6"
                >
                  Have a coupon code ? 
                </button>
              )}

              {/* Promo Input Section */}
              {showPromoInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 space-y-2"
                >
                  <div className="flex gap-2 items-start">
                    <input
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value);
                        setValidatedPromo(null);
                        setPromoError("");
                      }}
                      placeholder="Enter code"
                      className={`flex-1 pl-2 py-3 rounded-xl bg-white/5 border ${
                        validatedPromo
                          ? "border-green-400/40"
                          : promoError
                          ? "border-red-400/40"
                          : "border-white/10"
                      } text-white placeholder-gray-500 focus:outline-none`}
                    />

                    <button
                      onClick={handleApplyPromo}
                      disabled={validatingPromo || !promoInput.trim()}
                      className="px-4 py-3 bg-white text-black rounded-xl font-medium hover:bg-gray-100 disabled:opacity-50"
                    >
                      {validatingPromo ? "..." : "Apply"}
                    </button>

                    {/* Remove Coupon */}
                    <button
                      onClick={() => {
                        setShowPromoInput(false);
                        setPromoInput("");
                        setValidatedPromo(null);
                        setPromoError("");
                      }}
                      className="pl-0.5 md:pl-2 py-3 rounded-xl cursor-pointer text-white transition"
                    >
                      ✕
                    </button>
                  </div>

                  {validatedPromo && (
                    <p className="text-green-400 text-sm">✔ Promo applied: {validatedPromo.trialDays} days free trial</p>
                  )}

                  {promoError && <p className="text-red-400 text-sm">{promoError}</p>}
                </motion.div>
              )}

              <button
                onClick={() => handleBasePlanClick("annual")}
                disabled={
                  isLoading ||
                  validatingPromo ||
                  (showPromoInput && promoInput && !validatedPromo)
                }
                className="w-full py-4 rounded-full bg-white text-black font-medium hover:bg-gray-100 transition-all duration-300 shadow-xl disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Subscribe Yearly"}
              </button>
            </div>
          </motion.div>


          {/* ALIGN+ */}
          <motion.div variants={cardVariants} initial="offscreen" whileInView="onscreen" viewport={{ once: true }} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 rounded-3xl blur-xl transition-all duration-500 opacity-50"></div>

            <div className="relative h-full bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl rounded-3xl border border-white/[0.08] p-8 transition-all duration-300">
              <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm">
                <span className="text-xs font-semibold text-amber-300 tracking-wider">SOON</span>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-medium mb-2 text-gray-300">ALIGN+</h3>
                <p className="text-sm text-gray-500">Exclusive elite access</p>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-light text-gray-400">Premium</span>
                <p className="text-sm text-gray-600 mt-2">Coming soon</p>
              </div>

              <button
                disabled
                className="w-full py-4 rounded-full bg-white/5 text-gray-500 font-medium border border-white/10 cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </motion.div>
        </div>

        {/* Banner */}
        {/* <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl max-w-6xl mx-auto"
        >
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1545132059-a90e55c5286c?ixlib=rb-4.1.0&auto=format&fit=crop&q=80&w=1200"
              alt="Music Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 px-10 md:px-16 py-16">
            <div className="flex-1 text-center md:text-left space-y-6">
              <h3 className="text-3xl md:text-4xl font-light leading-tight">
                Personalized Songs &<br />
                <span className="font-medium">Tailored Recommendations</span>
              </h3>

              <p className="text-gray-300 text-base max-w-md leading-relaxed">
                Discover melodies crafted to match your mood, preferences, and emotions.
                Experience a truly unique musical journey.
              </p>

              <button
                onClick={handeConatctSales}
                className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-medium hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-white/20 group"
              >
                Contact Sales
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </button>
            </div>
          </div>
        </motion.div> */}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center"
          >
            <p className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-6 py-3 inline-block">
              {error.data?.error || error.error}
            </p>
          </motion.div>
        )}
      </div>

      {/* Login modal */}
      {loginPromptOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <h4 className="text-2xl font-medium mb-3">Login Required</h4>
            <p className="text-gray-400 mb-8">
              Please log in to continue to checkout.
            </p>

            <div className="flex gap-3">
              <button
                onClick={proceedToLogin}
                className="flex-1 px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-gray-100 transition-all duration-300"
              >
                Go to Login
              </button>

              <button
                onClick={() => setLoginPromptOpen(false)}
                className="flex-1 px-6 py-3 rounded-full bg-transparent border border-white/20 hover:border-white/40 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
