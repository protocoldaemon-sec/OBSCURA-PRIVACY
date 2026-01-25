'use client'

import { motion } from 'framer-motion'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function CTA() {
  const { connected } = useWallet()
  const router = useRouter()

  // Prefetch dashboard for instant navigation
  useEffect(() => {
    if (connected) {
      router.prefetch('/dashboard')
    }
  }, [connected, router])

  return (
    <section className="pt-6 pb-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-brand-secondary/10 to-blue-500/20" />
      <div className="absolute inset-0 bg-background-primary/80" />
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center glow-purple">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold mb-6 font-title">
            Ready for <span className="gradient-text">Private</span> Transactions?
          </h2>
          
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join the future of privacy-preserving finance. Your transactions, your business.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {connected ? (
              <Link
                href="/dashboard"
                className="px-10 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity glow-purple"
              >
                Launch App →
              </Link>
            ) : (
              <WalletMultiButton className="!px-10 !py-4 !bg-gradient-to-r !from-brand-primary !to-brand-secondary !rounded-xl !font-semibold !text-lg hover:!opacity-90 !transition-opacity glow-purple" />
            )}
            
            <a
              href="https://docs.obscura.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-4 glass rounded-xl font-semibold text-lg hover:bg-white/5 transition-colors"
            >
              Read Docs
            </a>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-500">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Open Source
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-500">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Audited Contracts
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-500">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Non-Custodial
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
