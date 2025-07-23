import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: 'John',
    email: '',
    phone: '',
    message: ''
  });

  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const hrRef = useRef(null);
  const contactOptionsRef = useRef(null);
  const hr2Ref = useRef(null);
  const formTitleRef = useRef(null);
  const formRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    // Wait for DOM to be ready
    const initAnimations = () => {
      // Check if all required refs are available
      const refs = [hr2Ref.current, formTitleRef.current, formRef.current, imageRef.current];
      const availableRefs = refs.filter(ref => ref !== null);

      if (availableRefs.length === 0) {
        console.log('No refs available for animation');
        return;
      }

      try {
        // GSAP Timeline Animation
        const tl = gsap.timeline({ defaults: { duration: 1, ease: "power3.out" } });
        
        // Set initial states only for available refs
        gsap.set(availableRefs, {
          y: 80,
          opacity: 0,
          filter: "blur(10px)"
        });

        // Animate elements with stagger (only available ones)
        let delay = 0;
        if (hr2Ref.current) {
          tl.to(hr2Ref.current, { y: 0, opacity: 1, filter: "blur(0px)" }, delay);
          delay += 0.5;
        }
        
        if (formTitleRef.current) {
          tl.to(formTitleRef.current, { y: 0, opacity: 1, filter: "blur(0px)" }, `-=${delay > 0 ? 0.5 : 0}`);
        }
        
        if (formRef.current && imageRef.current) {
          tl.to([formRef.current, imageRef.current], { 
            y: 0, 
            opacity: 1, 
            filter: "blur(0px)", 
            stagger: 0.2 
          }, "-=0.5");
        } else if (formRef.current) {
          tl.to(formRef.current, { y: 0, opacity: 1, filter: "blur(0px)" }, "-=0.5");
        } else if (imageRef.current) {
          tl.to(imageRef.current, { y: 0, opacity: 1, filter: "blur(0px)" }, "-=0.5");
        }

        // Form fields stagger animation
        const formFields = formRef.current?.querySelectorAll('input, textarea, button');
        if (formFields && formFields.length > 0) {
          gsap.set(formFields, { x: -30, opacity: 0 });
          gsap.to(formFields, {
            x: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
            delay: 2.5
          });
        }

        console.log('Animations initialized successfully');

      } catch (error) {
        console.error('Animation error:', error);
      }
    };

    // Use setTimeout to ensure DOM is ready
    const timer = setTimeout(initAnimations, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(50px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fade-in-up {
            animation: fadeInUp 0.8s ease forwards;
          }
        `}
      </style>
      
      <div ref={containerRef} className="min-h-screen bg-black text-white p-8 font-sans">
        <div className="px-8 mx-auto">
          {/* Header Section */}
          {/* <div className="mb-16">
            <h2 ref={titleRef} className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Ready to Align? Let's Connect
            </h2>
            <h4 ref={subtitleRef} className="text-xl md:text-2xl font-bold text-gray-300">
              Sense our energy — whether you're curious, inspired, or seeking support, we're here to meet you where you are.
            </h4>
          </div> */}

          {/* HR Separator */}
          {/* <hr ref={hrRef} className="border-gray-600 mb-20" /> */}

          {/* Contact Options */}
          {/* <div ref={contactOptionsRef} className="grid md:grid-cols-3 gap-12 mb-20">
            <div className="space-y-3 bg-transparent border border-white px-6 py-3 rounded-2xl transition-colors duration-200 ease-in-out">
              <h3 className="text-3xl font-medium text-white leading-relaxed">Explore Our Sound‑Therapy Sessions</h3>
              <p className="inline-block text-white font-medium"
                style={{ fontFamily: 'Bosch' }}>
                Curious about how our sessions, customizable packages, or pricing can support your journey? 
                Discover an approach that resonates with your unique needs—let us guide you through what's 
                available and find the best fit for your path to alignment.
              </p>
            </div>
            
            <div className="space-y-3 bg-transparent border border-white px-6 py-3 rounded-2xl transition-colors duration-200 ease-in-out">
              <h3 className="text-3xl font-medium text-white leading-relaxed">Share Your Thoughts & Questions</h3>
              <div className="inline-block text-white font-medium"
                   style={{ fontFamily: 'Bosch' }}>
                Have a question, feedback, or something on your mind? We warmly welcome your voice—whether 
                you're exploring options or reflecting on your experience. Reach out anytime, and expect a 
                caring, thoughtful response by the next business day.
              </div>
            </div>
            
            <div className="space-y-3 bg-transparent border border-white px-6 py-3 rounded-2xl transition-colors duration-200 ease-in-out">
              <h3 className="text-3xl font-medium text-white leading-relaxed">How Can We Support You Now?</h3>
              <div className="inline-block text-white font-medium"
                   style={{ fontFamily: 'Bosch' }}>
                Already on this healing journey, or ready to begin? Let us know where you are and how we can assist—whether 
                it's booking your next session, addressing concerns, or offering guidance. We're here alongside you, every 
                step forward.
              </div>
            </div>
          </div> */}

          {/* HR Separator */}
          <hr ref={hr2Ref} className="border-gray-600 mb-20" />

          {/* Form and Image Section */}
          <div className="grid lg:grid-cols-2 gap-16 items-start"
               style={{ fontFamily: 'Bosch' }}>
            {/* Form */}
            <div>
              <h3 ref={formTitleRef} className="text-4xl font-bold mb-12">Reach Out to Us</h3>
              <form ref={formRef} className="space-y-8" onSubmit={handleSubmit}>
                {/* Name and Email Row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-300">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-transparent border-b-2 border-white pb-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-300 transition-colors text-lg"
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-300">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-transparent border-b-2 border-gray-600 pb-3 text-white placeholder-gray-400 focus:outline-none focus:border-white transition-colors text-lg"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                
                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-300">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-b-2 border-gray-600 pb-3 text-white placeholder-gray-400 focus:outline-none focus:border-white transition-colors text-lg"
                    placeholder="Your phone number"
                  />
                </div>
                
                {/* Message */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-300">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full bg-transparent border-b-2 border-gray-600 pb-3 text-white placeholder-gray-400 focus:outline-none focus:border-white transition-colors text-lg resize-none"
                    placeholder="Your message..."
                  />
                </div>
                
                <button
                  type="submit"
                  className="bg-white text-black px-16 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 cursor-pointer mt-8"
                >
                  Send
                </button>
              </form>
            </div>

            {/* Image */}
            <div ref={imageRef} className="relative h-full">
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                alt="Aerial view of green agricultural fields"
                className="w-full h-full min-h-[600px] object-cover rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactForm;
