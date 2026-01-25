'use client'

import { motion } from 'framer-motion'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Animated Logo */}
        <motion.img
          src="/logo-white.png"
          alt="Obscura"
          animate={{ 
            rotate: 360,
            filter: [
              'drop-shadow(0 0 20px rgba(137, 44, 220, 0.3))',
              'drop-shadow(0 0 40px rgba(137, 44, 220, 0.6))',
              'drop-shadow(0 0 20px rgba(137, 44, 220, 0.3))',
            ]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
            filter: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          }}
          className="w-16 h-16"
        />
        
        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <p className="text-gray-400 text-lg">Loading Dashboard</p>
          <motion.div className="flex gap-1 justify-center mt-2">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-2 h-2 bg-brand-primary rounded-full"
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
