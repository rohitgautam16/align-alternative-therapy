// src/pages/SubscribePage.jsx
import React from 'react'
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import PlanImg from '../assets/images/girl-piano.jpg'
import { useCheckoutSubscriptionMutation } from '../utils/api'
import { useNavigate } from 'react-router-dom'

const cardVariants = {
  offscreen: { opacity: 0, y: 20 },
  onscreen: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5 }
  },
}

const PlanFeature = ({ text }) => (
  <li className="flex items-center">
    <Check className="h-5 w-5 text-gray-400 mr-3" />
    <span className="text-gray-300">{text}</span>
  </li>
)

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
            <span className="text-3xl font-light ml-2">
              CA${discountedPrice}
            </span>
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
      {features.map((feat, i) => <PlanFeature key={i} text={feat.text} />)}
    </ul>

    <button
      onClick={onSelect}
      disabled={loading}
      className="w-full bg-white text-black py-3 rounded-full font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
    >
      {loading ? 'Processing…' : buttonText}
    </button>
  </motion.div>
)

export default function SubscribePage() {
  const [checkout, { isLoading, data, error }] = useCheckoutSubscriptionMutation()

  const handleSubscribe = async (plan, trial = false) => {
    try {
      const result = await checkout({ plan, trial }).unwrap()
      if (result.url) {
        // redirect to Stripe Checkout
        window.location.href = result.url
      } else {
        console.log('Subscription updated in-place:', result.subscription)
      }
    } catch (err) {
      console.error('Checkout failed:', err)
    }
  }

   const navigate = useNavigate();

   const handeConatctSales = () => {
    navigate('/contact-us');
  };

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
      onSelect: () => handleSubscribe('monthly', true),
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
      onSelect: () => handleSubscribe('monthly'),
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
      onSelect: () => handleSubscribe('annual'),
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-screen mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-light mb-4">Our Pricing Plan</h2>
          <p className="text-base text-gray-400 max-w-3xl mx-auto">
            Unlock Your Inner Calm with Align
          </p>
        </div>
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
            <button className="w-full bg-black text-white py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
              onClick={handeConatctSales}>
              Contact Sales
            </button>
          </motion.div>

          {/* Plan Cards */}
          {plans.map((p, i) => (
            <Plan
              key={i}
              {...p}
              loading={isLoading}
            />
          ))}
        </div>

        {error && (
          <p className="mt-6 text-center text-red-400">
            {error.data?.error || error.error}
          </p>
        )}
      </div>
    </div>
  )
}
