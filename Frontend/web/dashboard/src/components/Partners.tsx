'use client'

import { motion } from 'framer-motion'

const partners = [
  { name: 'Daemon Protocol', logo: '/daemonprotocol_logo_White_transparent_text.png', height: 'h-12', padding: 'px-4 py-2' },
  { name: 'Arcium', logo: '/Arcium_Isolated_White.png', height: 'h-8', padding: 'px-8 py-4' },
  { name: 'Helius', logo: '/Helius-Horizontal-Logo-White.png', height: 'h-12', padding: 'px-4 py-2' },
]

const chains = [
  { 
    name: 'Solana', 
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' 
  },
  { 
    name: 'Ethereum', 
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' 
  },
  { 
    name: 'Polygon', 
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png' 
  },
  { 
    name: 'Arbitrum', 
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png' 
  },
]

export default function Partners() {
  return (
    <section id="partners" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Powered By */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-gray-500 text-sm uppercase tracking-widest mb-8">Powered By</p>
          <div className="flex flex-wrap items-center justify-center gap-12">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`glass ${partner.padding} rounded-xl hover:border-brand-primary/50 transition-colors`}
              >
                <img src={partner.logo} alt={partner.name} className={`${partner.height} w-auto`} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Supported Chains */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-gray-500 text-sm uppercase tracking-widest mb-8">Supported Chains</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {chains.map((chain, index) => (
              <motion.div
                key={chain.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 glass px-6 py-3 rounded-full"
              >
                <img src={chain.logo} alt={chain.name} className="w-6 h-6 rounded-full" />
                <span className="text-gray-300 font-medium">{chain.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tech Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 glass rounded-2xl p-4 sm:p-8 overflow-hidden"
        >
          <h3 className="text-xl font-bold text-center mb-8 font-title">Built With</h3>
          
          {/* Desktop Layout */}
          <div className="hidden md:flex justify-center gap-0 w-full">
            {[
              { name: 'WOTS+', desc: 'Quantum-resistant signatures', shape: 'trapezoid-left' },
              { name: 'Pedersen', desc: 'Homomorphic commitments', shape: 'parallelogram' },
              { name: 'Stealth', desc: 'One-time addresses', shape: 'parallelogram' },
              { name: 'ZK Compression', desc: '1000x cheaper storage', shape: 'trapezoid-right' },
            ].map((tech, index) => (
              <motion.div 
                key={tech.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, zIndex: 10 }}
                className="relative p-6 text-center flex-1 min-w-[200px] cursor-pointer group"
                style={{
                  clipPath: tech.shape === 'trapezoid-left' 
                    ? 'polygon(0 0, 100% 0, 90% 100%, 0 100%)'
                    : tech.shape === 'trapezoid-right'
                    ? 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)'
                    : 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)',
                  background: 'linear-gradient(180deg, rgba(26,26,36,0.8) 0%, rgba(26,26,36,0.5) 100%)',
                  marginLeft: index > 0 ? '-30px' : '0',
                }}
              >
                <div className="absolute inset-0 border border-[#2a2a3a] group-hover:border-brand-primary transition-all duration-300" 
                  style={{
                    clipPath: tech.shape === 'trapezoid-left' 
                      ? 'polygon(0 0, 100% 0, 90% 100%, 0 100%)'
                      : tech.shape === 'trapezoid-right'
                      ? 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)'
                      : 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)',
                  }}
                />
                <div className="absolute inset-0 bg-brand-primary/0 group-hover:bg-brand-primary/10 transition-all duration-300"
                  style={{
                    clipPath: tech.shape === 'trapezoid-left' 
                      ? 'polygon(0 0, 100% 0, 90% 100%, 0 100%)'
                      : tech.shape === 'trapezoid-right'
                      ? 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)'
                      : 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)',
                  }}
                />
                <div className="relative z-10">
                  <div className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary font-mono font-bold mb-2">{tech.name}</div>
                  <div className="text-gray-400 text-xs group-hover:text-gray-300 transition-colors">{tech.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile Layout - Zigzag Parallelograms */}
          <div className="md:hidden flex flex-col gap-0">
            {[
              { name: 'WOTS+', desc: 'Quantum-resistant signatures', skew: 'left' },
              { name: 'Pedersen', desc: 'Homomorphic commitments', skew: 'right' },
              { name: 'Stealth', desc: 'One-time addresses', skew: 'left' },
              { name: 'ZK Compression', desc: '1000x cheaper storage', skew: 'right' },
            ].map((tech, index) => (
              <motion.div 
                key={tech.name}
                initial={{ opacity: 0, x: tech.skew === 'left' ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative p-4 text-center cursor-pointer group"
                style={{
                  clipPath: tech.skew === 'left' 
                    ? 'polygon(0 0, 100% 10%, 100% 100%, 0 90%)'
                    : 'polygon(0 10%, 100% 0, 100% 90%, 0 100%)',
                  background: 'linear-gradient(180deg, rgba(26,26,36,0.8) 0%, rgba(26,26,36,0.5) 100%)',
                  marginTop: index > 0 ? '-10px' : '0',
                }}
              >
                <div className="absolute inset-0 border border-[#2a2a3a] group-hover:border-brand-primary transition-all duration-300" 
                  style={{
                    clipPath: tech.skew === 'left' 
                      ? 'polygon(0 0, 100% 10%, 100% 100%, 0 90%)'
                      : 'polygon(0 10%, 100% 0, 100% 90%, 0 100%)',
                  }}
                />
                <div className="absolute inset-0 bg-brand-primary/0 group-hover:bg-brand-primary/10 transition-all duration-300"
                  style={{
                    clipPath: tech.skew === 'left' 
                      ? 'polygon(0 0, 100% 10%, 100% 100%, 0 90%)'
                      : 'polygon(0 10%, 100% 0, 100% 90%, 0 100%)',
                  }}
                />
                <div className="relative z-10 py-2">
                  <div className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary font-mono font-bold mb-1">{tech.name}</div>
                  <div className="text-gray-400 text-xs group-hover:text-gray-300 transition-colors">{tech.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
