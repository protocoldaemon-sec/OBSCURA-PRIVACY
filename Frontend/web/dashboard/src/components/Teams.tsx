'use client'

import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'

const ChromaGrid = dynamic(() => import('@/components/ui/ChromaGrid'), { ssr: false })

const teamMembers = [
  {
    image: '/teams/0xbt.png',
    title: '0xbt',
    subtitle: 'Founder & CEO',
    handle: '@XBT_kw',
    borderColor: '#892CDC',
    gradient: 'linear-gradient(145deg, #892CDC, #000)',
    url: 'https://x.com/XBT_kw'
  },
  {
    image: 'https://i.pravatar.cc/300?img=11',
    title: 'Zaki',
    subtitle: 'UI/UX Dev',
    handle: '@jordanchen',
    borderColor: '#52057B',
    gradient: 'linear-gradient(210deg, #52057B, #000)',
    url: 'https://x.com/DaemonProtocol'
  },
  {
    image: '/teams/my-pict.jpg',
    title: 'Fikri.AI',
    subtitle: 'AI Engineer',
    handle: '@fikriaf',
    borderColor: '#892CDC',
    gradient: 'linear-gradient(165deg, #892CDC, #000)',
    url: 'https://x.com/fikriaf'
  },
  {
    image: '/teams/danzi.jpg',
    title: 'ZidanCode',
    subtitle: 'Smart Contract Developer',
    handle: '@DeDanzi',
    borderColor: '#52057B',
    gradient: 'linear-gradient(195deg, #52057B, #000)',
    url: 'https://x.com/DeDanzi'
  },
]

export default function Teams() {
  return (
    <section id="teams" className="py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-title">
            Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">Team</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            The minds behind Obscura, building the future of post-quantum private transactions.
          </p>
        </motion.div>

        <div className="relative min-h-[500px]">
          <ChromaGrid
            items={teamMembers}
            radius={300}
            columns={4}
            damping={0.45}
            fadeOut={0.6}
            ease="power3.out"
          />
        </div>
      </div>
    </section>
  )
}
