'use client'

import { FC, ReactNode, useMemo, useState, useEffect } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css'

interface Props {
  children: ReactNode
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  const [mounted, setMounted] = useState(false)
  
  // Use devnet for testing, mainnet-beta for production
  const endpoint = useMemo(() => clusterApiUrl('devnet'), [])
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  // Always render the provider, but suppress hydration warnings
  // This ensures useWallet() always has a context
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {mounted ? children : (
            <div style={{ visibility: 'hidden' }}>{children}</div>
          )}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
