import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import PlanImg from '../../assets/images/girl-piano.jpg';


const cardVariants = {
  offscreen: { opacity: 0, y: 20 },
  onscreen: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5 }
  },
};

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
        {discountedPrice !== undefined ? (
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
          {name === 'Monthly Plan'
            ? '/ Month'
            : name === 'Yearly Plan'
            ? '/ Year'
            : ''}
        </span>
      </div>
      <h3 className="text-xl font-light mt-4 mb-6">{name}</h3>
    </div>

    <ul className="space-y-4 mb-6 flex-grow">
      {features.map((feature, index) => (
        <PlanFeature key={index} text={feature.text} />
      ))}
    </ul>

    <button className="w-full bg-white text-black py-3 rounded-full font-medium hover:bg-secondary cursor-pointer transition-colors">
      {buttonText}
    </button>
  </motion.div>
);

const plans = [
  {
    name: "1 Month Free Access",
    price: 0,
    features: [
      { text: "Basic Audio Quality" },
      { text: "Limited Content" },
      { text: "24/7 Customer Support" },
      { text: "Personalized Recommendations" },
    ],
    buttonText: "Select Free Access",
  },
  {
    name: "Monthly Plan",
    price: 9.99,
    features: [
      { text: "Basic Audio Quality" },
      { text: "Free Content" },
      { text: "24/7 Customer Support" },
      { text: "Personalized Recommendations" },
    ],
    buttonText: "Select Monthly Plan",
  },
  {
    name: "Yearly Plan",
    originalPrice: 120,
    discountedPrice: 108,
    features: [
      { text: "Higher Audio Quality" },
      { text: "Exclusive Content" },
      { text: "Offline Listening" },
      { text: "24/7 Priority Support" },
      { text: "Personalized Recommendations" },
      { text: "Early Access to New Releases" },
    ],
    buttonText: "Select Yearly Plan",
  }
];



export default function Plans() {
  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-light mb-4">Our Pricing Plan</h2>
          <p className="text-base text-gray-400 max-w-3xl mx-auto">
            Unlock Your Inner Calm with Align
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Featured Card */}
          <motion.div
            variants={cardVariants}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: true, amount: 0.5 }}
            whileHover={{ scale: 1.05, transition: { type: 'spring', stiffness: 300 } }}
            className="relative bg-[#ffffffcd] rounded-3xl p-6 overflow-hidden h-full flex flex-col"
          >
            <div className="aspect-video mb-6">
              <img
                src={PlanImg}
                alt="Featured"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
            <h3 className="text-xl text-gray-800 font-light mb-4 flex-grow">
              Discover tranquility through a curated selection of products and practices for mind, body, and soul.
            </h3>
            <button className="w-full bg-white text-black cursor-pointer py-3 rounded-full font-medium hover:bg-secondary transition-colors">
              Contact Sale
            </button>
          </motion.div>

          {/* Plan Cards */}
          {plans.map((plan, index) => (
            <Plan key={index} {...plan} />
          ))}
        </div>
      </div>
    </div>
  );
}