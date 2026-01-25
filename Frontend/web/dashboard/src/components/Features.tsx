'use client'

import { motion } from 'framer-motion'

const features = [
  {
    icon: 'lock',
    title: 'Post-Quantum Security',
    description: 'WOTS+ signatures protect your transactions from future quantum computer attacks.',
    gradient: 'from-[#52057B] to-[#892CDC]',
  },
  {
    icon: 'eye-off',
    title: 'Stealth Addresses',
    description: 'One-time addresses ensure your transactions cannot be linked or traced.',
    gradient: 'from-[#892CDC] to-[#BC6FF1]',
  },
  {
    icon: 'shield',
    title: 'Shielded Amounts',
    description: 'Pedersen commitments hide transaction amounts while proving validity.',
    gradient: 'from-[#BC6FF1] to-[#892CDC]',
  },
  {
    icon: 'zap',
    title: 'Gas Efficient',
    description: 'Heavy cryptography happens off-chain. Only commitments verified on-chain.',
    gradient: 'from-[#892CDC] to-[#52057B]',
  },
  {
    icon: 'globe',
    title: 'Multi-Chain',
    description: 'Support for Ethereum, Solana, Polygon, Arbitrum and more chains.',
    gradient: 'from-[#52057B] to-[#BC6FF1]',
  },
  {
    icon: 'file-check',
    title: 'Compliance Ready',
    description: 'Optional viewing keys for regulatory compliance without sacrificing privacy.',
    gradient: 'from-[#BC6FF1] to-[#52057B]',
  },
]

const IconComponent = ({ name }: { name: string }) => {
  const icons: Record<string, JSX.Element> = {
    'lock': <path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4" />,
    'eye-off': <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>,
    'shield': <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    'zap': <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    'globe': <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></>,
    'file-check': <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M9 15l2 2 4-4" /></>,
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  )
}

export default function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 font-title">
            Privacy <span className="gradient-text">Reimagined</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Built from the ground up with cutting-edge cryptography to protect your financial privacy.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="glass rounded-2xl p-6 h-full hover:border-brand-primary/50 transition-colors">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-white`}>
                  <IconComponent name={feature.icon} />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
