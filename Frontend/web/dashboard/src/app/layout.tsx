import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { WalletContextProvider } from '@/components/WalletProvider'
import EVMWalletProvider from '@/providers/EVMWalletProvider'

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins'
})

export const metadata: Metadata = {
  title: 'Obscura - Post-Quantum Private Transactions',
  description: 'Privacy-preserving transactions powered by WOTS+ signatures and stealth addresses. Quantum-resistant security for the future.',
  keywords: ['crypto', 'privacy', 'quantum-resistant', 'solana', 'ethereum', 'stealth', 'WOTS'],
  icons: {
    icon: '/logo_white_no-text.png',
    shortcut: '/logo_white_no-text.png',
    apple: '/logo_white_no-text.png',
  },
  openGraph: {
    title: 'Obscura - Post-Quantum Private Transactions',
    description: 'Privacy-preserving transactions powered by WOTS+ signatures and stealth addresses.',
    type: 'website',
    images: [
      {
        url: '/logo_white_no-text.png',
        width: 512,
        height: 512,
        alt: 'Obscura Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Obscura - Post-Quantum Private Transactions',
    description: 'Privacy-preserving transactions powered by WOTS+ signatures and stealth addresses.',
    images: ['/logo_white_no-text.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} bg-background-primary text-white antialiased`}>
        <EVMWalletProvider>
          <WalletContextProvider>
            {children}
          </WalletContextProvider>
        </EVMWalletProvider>
      </body>
    </html>
  )
}
