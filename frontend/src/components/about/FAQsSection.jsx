import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';

const FAQ = () => {
  const [openItem, setOpenItem] = useState(0);
  const [visibleItems, setVisibleItems] = useState(3);
  const [faqListHeight, setFaqListHeight] = useState(600);
  const faqRef = useRef(null);
  const faqListRef = useRef(null);

  const faqData = [
    {
      question: "What is invoice discounting in the media and entertainment industry?",
      answer: "Invoice discounting in the media and entertainment industry involves providing funds to production companies based on their anticipated future cash flows/invoices. In exchange, investors earn stable returns when the invoices are paid by a third party, typically a buyer of film or music rights (for example, Netflix, Hotstar, Prime)."
    },
    {
      question: "What is the minimum investment amount at BetterInvest?",
      answer: "The minimum investment amount varies by investment opportunity and product type. Please contact our investment team for specific details about current offerings and minimum investment requirements."
    },
    {
      question: "How does BetterInvest select content producers to fund?",
      answer: "BetterInvest uses a comprehensive due diligence process to evaluate content producers, including assessment of their track record, financial stability, content portfolio, and partnership with established distributors and platforms."
    },
    {
      question: "What are the typical returns for investors?",
      answer: "Returns vary based on the specific investment opportunity and risk profile. Our investment team provides detailed projections and historical performance data for each opportunity during the investment process."
    },
    {
      question: "How long is the typical investment period?",
      answer: "Investment periods typically range from 6 months to 2 years, depending on the production timeline and distribution agreements. Each opportunity will have specific timeline details provided upfront."
    },
    {
      question: "What happens if a production fails to deliver?",
      answer: "We have comprehensive risk management strategies in place, including insurance policies, completion bonds, and diversified investment portfolios to protect investor interests in case of production issues."
    },
    {
      question: "Can I withdraw my investment early?",
      answer: "Early withdrawal options depend on the specific investment terms and current market conditions. Our team can discuss available options based on your individual circumstances and investment agreement."
    },
    {
      question: "How do I track my investment performance?",
      answer: "Investors receive regular updates through our investor portal, including quarterly reports, production milestones, and financial performance metrics. You'll have full transparency into your investment progress."
    }
  ];

  // Page entrance animation
  useEffect(() => {
    gsap.fromTo(
      faqRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
    );
  }, []);

  // Accurate height tracking with proper timing
  useEffect(() => {
    const updateHeight = () => {
      if (faqListRef.current) {
        const rect = faqListRef.current.getBoundingClientRect();
        setFaqListHeight(rect.height);
      }
    };

    // Multiple update attempts to catch all animation states
    const timers = [
      setTimeout(updateHeight, 50),
      setTimeout(updateHeight, 200),
      setTimeout(updateHeight, 500)
    ];
    
    const resizeObserver = new ResizeObserver(updateHeight);
    if (faqListRef.current) {
      resizeObserver.observe(faqListRef.current);
    }

    window.addEventListener('resize', updateHeight);
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [visibleItems, openItem]);

  const toggleItem = (idx) => setOpenItem(openItem === idx ? -1 : idx);
  const handleShowMore = () => setVisibleItems(v => Math.min(v + 3, faqData.length));
  const handleShowLess = () => { 
    setVisibleItems(3); 
    if (openItem >= 3) setOpenItem(-1); 
  };

  // Smooth animations
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    shown: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeInOut' } }
  };

  const answerVariants = {
    closed: {
      height: 0,
      opacity: 0,
      transition: { 
        height: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
        opacity: { duration: 0.2 }
      }
    },
    open: {
      height: 'auto',
      opacity: 1,
      transition: { 
        height: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
        opacity: { duration: 0.3, delay: 0.1 }
      }
    }
  };

  const iconVariants = { 
    closed: { rotate: 0 }, 
    open: { rotate: 45 } 
  };

  return (
    <div className="h-auto bg-black py-6 md:py-8 lg:py-10 px-4 md:px-6 lg:px-8 font-sans" ref={faqRef}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <span className="inline-block bg-gray-200 text-gray-800 px-4 md:px-4 py-2 rounded-full text-xs md:text-sm font-semibold mb-4 md:mb-5 uppercase tracking-wider">
            SUPPORT
          </span>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight px-2">
            Frequently Asked Questions
          </h1>
        </div>

        {/* Mobile Layout: Image above FAQs */}
        <div className="block md:hidden">
          {/* Mobile Image */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative w-full max-w-xs h-80 rounded-2xl overflow-hidden shadow-2xl">
              <motion.img
                src="https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                alt="FAQ Support"
                className="w-full h-full object-cover cursor-pointer"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
              
              <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-transparent flex flex-col items-center justify-center p-6">
                <motion.div 
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
                
                <h3 className="text-xl font-bold text-white mb-3 text-center">
                  Have Questions?
                </h3>
                
                <p className="text-gray-200 text-center text-sm leading-relaxed mb-4">
                  Find answers to commonly asked questions
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-white font-bold text-base">{faqData.length}</div>
                    <div className="text-gray-300 text-xs">Questions</div>
                  </div>
                  <div className="w-px h-6 bg-gray-400"></div>
                  <div className="text-center">
                    <div className="text-white font-bold text-base">24/7</div>
                    <div className="text-gray-300 text-xs">Support</div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-white/20 rounded-full opacity-60 animate-pulse"></div>
              <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-white/10 rounded-full opacity-40"></div>
              <div className="absolute top-1/2 -right-4 w-3 h-3 bg-white/15 rounded-full opacity-50"></div>
            </div>
          </motion.div>

          {/* Mobile FAQ List */}
          <div className="w-full">
            <motion.div ref={faqListRef} className="space-y-3" layout>
              <AnimatePresence mode="wait">
                {faqData.slice(0, visibleItems).map((item, idx) => (
                  <motion.div
                    key={idx}
                    className={`rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                      openItem === idx ? 'bg-gray-200' : 'bg-transparent border border-gray-600'
                    }`}
                    variants={cardVariants}
                    initial="hidden"
                    animate="shown"
                    exit="exit"
                    layout
                    whileHover={{ scale: 1.01 }}
                    onClick={() => toggleItem(idx)}
                  >
                    <div className="flex justify-between items-center p-4">
                      <h3 className={`text-sm font-semibold flex-1 leading-relaxed pr-3 transition-colors duration-300 ${
                        openItem === idx ? 'text-gray-800' : 'text-white'
                      }`}>
                        {item.question}
                      </h3>

                      <motion.div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          openItem === idx ? 'bg-black text-white' : 'bg-gray-200 text-gray-800'
                        }`}
                        variants={iconVariants}
                        animate={openItem === idx ? 'open' : 'closed'}
                        transition={{ duration: 0.3 }}
                        whileHover={{ scale: 1.1 }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {openItem === idx && (
                        <motion.div
                          variants={answerVariants}
                          initial="closed"
                          animate="open"
                          exit="closed"
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4">
                            <p className="text-sm leading-relaxed text-gray-800">
                              {item.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Mobile Show More/Less Button */}
              <div className="flex justify-center pt-4">
                {visibleItems < faqData.length ? (
                  <motion.button
                    className="bg-gray-200 text-gray-800 font-semibold py-2.5 px-6 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm"
                    onClick={handleShowMore}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Show More
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.button>
                ) : (
                  <motion.button
                    className="bg-gray-200 text-gray-800 font-semibold py-2.5 px-6 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm"
                    onClick={handleShowLess}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Show Less
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Tablet & Desktop Layout: Side by side */}
        <div className="hidden md:flex items-start justify-center gap-8 lg:gap-12 xl:gap-16">
          
          {/* Image with dynamic height - Tablet & Desktop */}
          <motion.div
            className="flex-shrink-0 flex justify-center"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <motion.div 
              className="relative w-64 md:w-72 lg:w-80 rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl"
              animate={{ height: faqListHeight }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ minHeight: '400px' }}
            >
              <motion.img
                src="https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                alt="FAQ Support"
                className="w-full h-full object-cover cursor-pointer"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
              
              <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-transparent flex flex-col items-center justify-center p-6 lg:p-8">
                <motion.div 
                  className="w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-full flex items-center justify-center mb-4 lg:mb-6 shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <svg width="32" height="32" className="lg:w-10 lg:h-10" viewBox="0 0 24 24" fill="none">
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
                
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 lg:mb-4 text-center">
                  Have Questions?
                </h3>
                
                <p className="text-gray-200 text-center text-sm leading-relaxed mb-4 lg:mb-6 px-2">
                  Find answers to the most commonly asked questions about our platform
                </p>
                
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">{faqData.length}</div>
                    <div className="text-gray-300 text-xs">Questions</div>
                  </div>
                  <div className="w-px h-6 lg:h-8 bg-gray-400"></div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">24/7</div>
                    <div className="text-gray-300 text-xs">Support</div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-2 -right-2 lg:-top-3 lg:-right-3 w-4 h-4 lg:w-6 lg:h-6 bg-white/20 rounded-full opacity-60 animate-pulse"></div>
              <div className="absolute -bottom-3 -left-3 lg:-bottom-4 lg:-left-4 w-6 h-6 lg:w-8 lg:h-8 bg-white/10 rounded-full opacity-40"></div>
              <div className="absolute top-1/2 -right-4 lg:-right-6 w-3 h-3 lg:w-4 lg:h-4 bg-white/15 rounded-full opacity-50"></div>
            </motion.div>
          </motion.div>

          {/* FAQ List - Tablet & Desktop */}
          <div className="flex-1 w-full max-w-2xl lg:max-w-3xl">
            <motion.div ref={faqListRef} className="space-y-3" layout>
              <AnimatePresence mode="wait">
                {faqData.slice(0, visibleItems).map((item, idx) => (
                  <motion.div
                    key={idx}
                    className={`rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                      openItem === idx ? 'bg-gray-200' : 'bg-transparent border border-gray-600'
                    }`}
                    variants={cardVariants}
                    initial="hidden"
                    animate="shown"
                    exit="exit"
                    layout
                    whileHover={{ scale: 1.01 }}
                    onClick={() => toggleItem(idx)}
                  >
                    <div className="flex justify-between items-center p-5 lg:p-6">
                      <h3 className={`text-base lg:text-lg font-semibold flex-1 leading-relaxed pr-4 lg:pr-5 transition-colors duration-300 ${
                        openItem === idx ? 'text-gray-800' : 'text-white'
                      }`}>
                        {item.question}
                      </h3>

                      <motion.div
                        className={`w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          openItem === idx ? 'bg-black text-white' : 'bg-gray-200 text-gray-800'
                        }`}
                        variants={iconVariants}
                        animate={openItem === idx ? 'open' : 'closed'}
                        transition={{ duration: 0.3 }}
                        whileHover={{ scale: 1.1 }}
                      >
                        <svg width="20" height="20" className="lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none">
                          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {openItem === idx && (
                        <motion.div
                          variants={answerVariants}
                          initial="closed"
                          animate="open"
                          exit="closed"
                          className="overflow-hidden"
                        >
                          <div className="px-5 lg:px-6 pb-5 lg:pb-6">
                            <p className="text-sm lg:text-base leading-relaxed text-gray-800">
                              {item.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Tablet & Desktop Show More/Less Button */}
              <div className="flex justify-center pt-5 lg:pt-6">
                {visibleItems < faqData.length ? (
                  <motion.button
                    className="bg-gray-200 text-gray-800 font-semibold py-2.5 lg:py-3 px-6 lg:px-8 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm lg:text-base"
                    onClick={handleShowMore}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Show More
                    <svg width="18" height="18" className="lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.button>
                ) : (
                  <motion.button
                    className="bg-gray-200 text-gray-800 font-semibold py-2.5 lg:py-3 px-6 lg:px-8 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm lg:text-base"
                    onClick={handleShowLess}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Show Less
                    <svg width="18" height="18" className="lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="none">
                      <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
