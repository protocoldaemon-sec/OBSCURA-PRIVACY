'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const steps = [
  {
    step: '01',
    title: 'Connect Wallet',
    description: 'Connect your Solana or EVM wallet to get started with private transactions.',
  },
  {
    step: '02',
    title: 'Create Intent',
    description: 'Specify your transfer or swap details. All data is encrypted client-side.',
  },
  {
    step: '03',
    title: 'Sign with WOTS+',
    description: 'Your intent is signed with quantum-resistant WOTS+ signatures off-chain.',
  },
  {
    step: '04',
    title: 'Private Settlement',
    description: 'Only the commitment is verified on-chain. Your details stay private.',
  },
]

export default function HowItWorks() {
  const [activeCard, setActiveCard] = useState(0)
  const [isGlowing, setIsGlowing] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlowing(true)
      
      // Glow for 1.5 seconds, then move to next card
      setTimeout(() => {
        setIsGlowing(false)
        setTimeout(() => {
          setActiveCard((prev) => (prev + 1) % 4)
        }, 300) // Small delay before moving to next
      }, 1500)
    }, 2500) // Total cycle: 2.5 seconds per card

    return () => clearInterval(interval)
  }, [])

  return (
    <section id="how-it-works" className="py-24 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-primary/5 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 font-title">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Simple, secure, and private. Four steps to quantum-resistant transactions.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-primary via-brand-secondary to-blue-500 -translate-y-1/2" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                {/* Animated border container */}
                <div 
                  className={`absolute -inset-[2px] rounded-2xl transition-all duration-500 ${
                    activeCard === index 
                      ? 'opacity-100' 
                      : 'opacity-0'
                  }`}
                  style={{
                    background: activeCard === index 
                      ? 'linear-gradient(90deg, #892CDC, #BC6FF1, #52057B, #892CDC)' 
                      : 'transparent',
                    backgroundSize: '300% 100%',
                    animation: activeCard === index ? 'borderMove 2s linear infinite' : 'none',
                  }}
                />
                
                {/* Glow effect */}
                <div 
                  className={`absolute -inset-[2px] rounded-2xl transition-all duration-300 ${
                    activeCard === index && isGlowing 
                      ? 'opacity-100' 
                      : 'opacity-0'
                  }`}
                  style={{
                    boxShadow: '0 0 30px rgba(137, 44, 220, 0.8), 0 0 60px rgba(188, 111, 241, 0.5), 0 0 90px rgba(137, 44, 220, 0.3)',
                  }}
                />

                <div className={`glass rounded-2xl p-6 text-center relative z-10 transition-all duration-500 ${
                  activeCard === index ? 'bg-[#0d0d12]/90' : ''
                }`}>
                  {/* Step number */}
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-sm font-bold mx-auto mb-4 transition-all duration-500 ${
                    activeCard === index && isGlowing ? 'scale-110 shadow-lg shadow-brand-primary/50' : ''
                  }`}>
                    {step.step}
                  </div>
                  
                  {/* Content */}
                  <h3 className={`text-lg font-semibold mb-2 transition-all duration-500 ${
                    activeCard === index ? 'text-white' : ''
                  }`}>{step.title}</h3>
                  <p className={`text-sm transition-all duration-500 ${
                    activeCard === index ? 'text-gray-300' : 'text-gray-400'
                  }`}>{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CSS for border animation */}
        <style jsx>{`
          @keyframes borderMove {
            0% {
              background-position: 0% 50%;
            }
            100% {
              background-position: 300% 50%;
            }
          }
        `}</style>

        {/* Privacy Levels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <h3 className="text-2xl font-bold text-center mb-8 font-title">Choose Your Privacy Level</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Transparent', desc: 'Full visibility for debugging', color: 'border-gray-500' },
              { name: 'Shielded', desc: 'Maximum privacy protection', color: 'border-brand-primary', recommended: true },
              { name: 'Compliant', desc: 'With viewing keys for audits', color: 'border-blue-500' },
            ].map((level) => (
              <div
                key={level.name}
                className={`glass rounded-xl p-6 text-center border-2 ${level.color} ${level.recommended ? 'glow-purple' : ''}`}
              >
                {level.recommended && (
                  <span className="inline-block px-3 py-1 bg-brand-primary/20 text-brand-primary text-xs rounded-full mb-3">
                    Recommended
                  </span>
                )}
                <h4 className="font-semibold mb-1">{level.name}</h4>
                <p className="text-gray-400 text-sm">{level.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
