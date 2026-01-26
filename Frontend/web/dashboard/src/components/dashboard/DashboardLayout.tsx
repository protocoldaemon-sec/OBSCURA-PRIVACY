'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { motion, AnimatePresence } from 'framer-motion'
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { fetchHealth, fetchInfo, fetchBatches } from '@/lib/api'
import { TOKEN_LOGOS, CHAIN_LOGOS } from '@/lib/logos'
import FloatingLines from '@/components/ui/BgFloatingLines'
import DashboardSection from './sections/DashboardSection'
import DepositSection from './sections/DepositSection'
import DarkOTCSection from './sections/DarkOTCSection'
import ResultModal from './ResultModal'

type Section = 'dashboard' | 'deposit' | 'dark-otc'
type WalletType = 'solana' | 'evm' | null

export interface ActivityItem {
  type: string
  id: string
  time: string
}

export interface ModalData {
  title: string
  result: any
  isSuccess: boolean
}

const menuVariants = {
  closed: { opacity: 0, height: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  open: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }
}

export default function DashboardLayout() {
  // Solana wallet
  const { publicKey, connected: solanaConnected, disconnect: solanaDisconnect, select, wallets } = useWallet()
  
  // EVM wallet
  const { address: evmAddress, isConnected: evmConnected } = useAccount()
  const { connect: evmConnect } = useConnect()
  const { disconnect: evmDisconnect } = useDisconnect()
  const { data: evmBalanceData } = useBalance({ address: evmAddress, chainId: 11155111 })

  const [activeSection, setActiveSection] = useState<Section>('dashboard')
  const [serverStatus, setServerStatus] = useState('Connecting...')
  const [isServerConnected, setIsServerConnected] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([])
  const [modal, setModal] = useState<ModalData | null>(null)
  const [solanaBalance, setSolanaBalance] = useState<string>('--')
  const [solanaUSDCBalance, setSolanaUSDCBalance] = useState<string>('--')
  const [solanaUSDTBalance, setSolanaUSDTBalance] = useState<string>('--')
  const [walletSelectorOpen, setWalletSelectorOpen] = useState(false)
  const [preferredWallet, setPreferredWallet] = useState<WalletType>(null)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [networkError, setNetworkError] = useState<string | null>(null)
  const [showNetworkError, setShowNetworkError] = useState(false)

  // Determine active wallet - use preferred if set, otherwise check what's connected
  const activeWallet: WalletType = preferredWallet 
    ? (preferredWallet === 'solana' && solanaConnected ? 'solana' : preferredWallet === 'evm' && evmConnected ? 'evm' : null)
    : (solanaConnected ? 'solana' : evmConnected ? 'evm' : null)

  // Auto-disconnect other wallet when one connects (single wallet mode)
  useEffect(() => {
    if (solanaConnected && evmConnected) {
      // Disconnect the non-preferred wallet
      if (preferredWallet === 'evm') {
        solanaDisconnect()
      } else {
        evmDisconnect()
      }
    }
  }, [solanaConnected, evmConnected, preferredWallet])

  // Reset preferred wallet when disconnected
  useEffect(() => {
    if (!solanaConnected && !evmConnected) {
      setPreferredWallet(null)
    }
  }, [solanaConnected, evmConnected])

  // Network validation - Check if user is on correct network
  useEffect(() => {
    const validateNetwork = async () => {
      // Validate Solana network (must be Devnet)
      if (solanaConnected && publicKey) {
        try {
          const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
          // Try to get account info to verify we're on devnet
          const accountInfo = await connection.getAccountInfo(publicKey)
          
          // Additional check: try mainnet connection to see if account exists there
          const mainnetConnection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
          const mainnetInfo = await mainnetConnection.getAccountInfo(publicKey)
          
          // If account has more activity on mainnet, likely user is on mainnet
          if (mainnetInfo && accountInfo && mainnetInfo.lamports > accountInfo.lamports * 10) {
            setNetworkError('⚠️ Please switch to Solana Devnet. This app only works on Devnet.')
            setShowNetworkError(true)
            solanaDisconnect()
            return
          }
          
          setNetworkError(null)
          setShowNetworkError(false)
        } catch (error) {
          console.error('Network validation error:', error)
        }
      }
      
      // Validate EVM network (must be Sepolia testnet - chainId 11155111)
      if (evmConnected && evmAddress) {
        try {
          if (typeof window !== 'undefined' && window.ethereum) {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' })
            const chainIdDecimal = parseInt(chainId, 16)
            
            // Sepolia chainId = 11155111
            if (chainIdDecimal !== 11155111) {
              const networkNames: Record<number, string> = {
                1: 'Ethereum Mainnet',
                5: 'Goerli Testnet',
                11155111: 'Sepolia Testnet',
                137: 'Polygon Mainnet',
                80001: 'Polygon Mumbai'
              }
              
              const currentNetworkName = networkNames[chainIdDecimal] || `Chain ID ${chainIdDecimal}`
              
              setNetworkError(`⚠️ Wrong Network! Please switch to Sepolia Testnet. You're currently on ${currentNetworkName}.`)
              setShowNetworkError(true)
              evmDisconnect()
              return
            }
            
            setNetworkError(null)
            setShowNetworkError(false)
          }
        } catch (error) {
          console.error('EVM network validation error:', error)
        }
      }
    }
    
    validateNetwork()
  }, [solanaConnected, evmConnected, publicKey, evmAddress])

  // Get current balance based on active wallet
  const currentBalance = activeWallet === 'solana' 
    ? `${solanaBalance} SOL`
    : activeWallet === 'evm' && evmBalanceData
    ? `${(Number(evmBalanceData.value) / 1e18).toFixed(4)} ETH`
    : '--'

  const currentToken = activeWallet === 'solana' ? 'SOL' : 'ETH'
  const currentLogo = activeWallet === 'solana' ? TOKEN_LOGOS.SOL : TOKEN_LOGOS.ETH
  const currentChainLogo = activeWallet === 'solana' ? CHAIN_LOGOS.solana : CHAIN_LOGOS.ethereum
  const currentNetwork = activeWallet === 'solana' ? 'Solana Devnet' : 'Sepolia'

  // Load activity log from localStorage (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('obscura_activity_log')
      if (saved) {
        try { setActivityLog(JSON.parse(saved)) } catch (e) { console.error('Failed to parse activity log:', e) }
      }
    }
  }, [])

  const addActivity = (type: string, id: string) => {
    if (typeof window !== 'undefined') {
      const newLog = [{ type, id, time: new Date().toLocaleTimeString() }, ...activityLog].slice(0, 10)
      setActivityLog(newLog)
      localStorage.setItem('obscura_activity_log', JSON.stringify(newLog))
    }
  }

  const showModal = (title: string, result: any, isSuccess: boolean) => setModal({ title, result, isSuccess })

  const refreshDashboard = async () => {
    try {
      const [info, health, batches] = await Promise.all([fetchInfo(), fetchHealth(), fetchBatches()])
      setServerStatus('Server Online')
      setIsServerConnected(true)
    } catch {
      setServerStatus('Server Offline')
      setIsServerConnected(false)
    }
  }

  // Fetch Solana balance (SOL + USDC + USDT)
  const fetchSolanaBalance = async () => {
    if (!publicKey || !solanaConnected) { 
      setSolanaBalance('--')
      setSolanaUSDCBalance('--')
      setSolanaUSDTBalance('--')
      return 
    }
    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
      
      // Fetch SOL balance
      const balance = await connection.getBalance(publicKey)
      setSolanaBalance((balance / LAMPORTS_PER_SOL).toFixed(4))
      
      // Fetch USDC balance
      try {
        const { getAssociatedTokenAddress, getAccount } = await import('@solana/spl-token')
        const usdcMints = [
          '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Official USDC Devnet
          'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr', // Circle USDC Devnet
          'CpMah17kQEL2wqyMKt3mZBdTnZbkbfx4nqmQMFDP5vwp'  // SPL Token Faucet USDC
        ]
        let totalUSDC = 0
        
        console.log(`[DashboardLayout] Fetching USDC balance for wallet: ${publicKey.toBase58()}`)
        
        for (const mintStr of usdcMints) {
          try {
            const mint = new PublicKey(mintStr)
            const tokenAccount = await getAssociatedTokenAddress(mint, publicKey)
            const accountInfo = await getAccount(connection, tokenAccount)
            const amount = Number(accountInfo.amount)
            
            if (amount > 0) {
              const balance = amount / 1e6
              console.log(`[DashboardLayout] ✅ Found ${balance} USDC at mint ${mintStr}`)
              totalUSDC += balance
            }
          } catch (err) {
            // Silent fail - account doesn't exist for this mint
          }
        }
        
        console.log(`[DashboardLayout] Total USDC: ${totalUSDC}`)
        setSolanaUSDCBalance(totalUSDC > 0 ? totalUSDC.toFixed(2) : '0')
      } catch (err) {
        console.error('[DashboardLayout] Error fetching USDC:', err)
        setSolanaUSDCBalance('0')
      }
      
      // Fetch USDT balance
      try {
        const { getAssociatedTokenAddress, getAccount } = await import('@solana/spl-token')
        const usdtMint = new PublicKey('EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS')
        const tokenAccount = await getAssociatedTokenAddress(usdtMint, publicKey)
        const accountInfo = await getAccount(connection, tokenAccount)
        const usdtBalance = Number(accountInfo.amount) / 1e6
        setSolanaUSDTBalance(usdtBalance > 0 ? usdtBalance.toFixed(2) : '0')
      } catch {
        setSolanaUSDTBalance('0')
      }
    } catch (err) { 
      console.error('[DashboardLayout] Error fetching balances:', err)
      setSolanaBalance('Error')
      setSolanaUSDCBalance('Error')
      setSolanaUSDTBalance('Error')
    }
  }

  useEffect(() => {
    fetchSolanaBalance()
    const interval = setInterval(fetchSolanaBalance, 10000)
    return () => clearInterval(interval)
  }, [publicKey, solanaConnected])

  useEffect(() => {
    refreshDashboard()
    const interval = setInterval(refreshDashboard, 30000)
    return () => clearInterval(interval)
  }, [])

  const navItems: { id: Section; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'deposit', label: 'Privacy Transfers' },
    { id: 'dark-otc', label: 'Dark OTC' }
  ]

  const handleNavClick = (id: Section) => { setActiveSection(id); setMobileMenuOpen(false) }

  // Connect handlers - disconnect other wallet first and set preference
  const handleConnectSolana = (walletName: string) => {
    if (evmConnected) evmDisconnect()
    setPreferredWallet('solana')
    select(walletName as any)
    setWalletSelectorOpen(false)
  }

  const handleConnectEVM = () => {
    if (solanaConnected) solanaDisconnect()
    setPreferredWallet('evm')
    evmConnect({ connector: injected() })
    setWalletSelectorOpen(false)
  }

  const handleDisconnect = () => {
    if (solanaConnected) solanaDisconnect()
    if (evmConnected) evmDisconnect()
    setPreferredWallet(null)
    setWalletSelectorOpen(false)
  }

  // Get wallet address display
  const walletAddress = activeWallet === 'solana' && publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : activeWallet === 'evm' && evmAddress
    ? `${evmAddress.slice(0, 4)}...${evmAddress.slice(-4)}`
    : null

  // Check if wallet is connected - used by child components
  const requireWalletConnection = () => {
    if (!activeWallet) {
      setShowConnectModal(true)
      return false
    }
    return true
  }


  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative" style={{ fontFamily: 'var(--font-poppins, Poppins), sans-serif' }}>
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* <FloatingLines enabledWaves={['top', 'middle', 'bottom']} lineCount={[5, 5, 5]} lineDistance={[8, 6, 4]} bendRadius={5.0} bendStrength={-0.5} interactive={true} parallax={true} /> */}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-[#2a2a3a]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between py-4">
            <a href="https://obscura-app.com" className="flex items-center gap-2 md:gap-3">
              <img src="/logo-white.png" alt="Obscura" className="h-8 md:h-10 w-auto" />
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex gap-2">
              {navItems.map((item, index) => (
                <motion.button 
                  key={item.id} 
                  onClick={() => setActiveSection(item.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeSection === item.id ? 'bg-[#1a1a24] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1a1a24]'}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.label}
                </motion.button>
              ))}
            </nav>

            {/* Right side - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {/* Multi-Token Balance - only show if wallet connected */}
              {activeWallet === 'solana' && solanaConnected && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a24] rounded-lg border border-[#2a2a3a]">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 leading-none">Devnet Balance</span>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <img src={TOKEN_LOGOS.SOL} alt="SOL" className="w-4 h-4 rounded-full" />
                        <span className="text-xs font-medium">{solanaBalance}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <img src={TOKEN_LOGOS.USDC} alt="USDC" className="w-4 h-4 rounded-full" />
                        <span className="text-xs font-medium">{solanaUSDCBalance}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <img src={TOKEN_LOGOS.USDT} alt="USDT" className="w-4 h-4 rounded-full" />
                        <span className="text-xs font-medium">{solanaUSDTBalance}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* EVM Balance - single token */}
              {activeWallet === 'evm' && evmConnected && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a24] rounded-lg border border-[#2a2a3a]">
                  <img src={TOKEN_LOGOS.ETH} alt="ETH" className="w-4 h-4 rounded-full" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 leading-none">Sepolia</span>
                    <span className="text-xs font-medium leading-none mt-0.5">{evmBalanceData ? `${(Number(evmBalanceData.value) / 1e18).toFixed(4)}` : '--'}</span>
                  </div>
                </div>
              )}
              
              {/* Vault Balance Display - Multi Token */}
              {activeWallet && (() => {
                // Calculate vault balance from all deposit notes
                const depositNotes = typeof window !== 'undefined' ? (() => {
                  try {
                    const stored = localStorage.getItem('obscura_deposit_notes')
                    return stored ? JSON.parse(stored) : []
                  } catch {
                    return []
                  }
                })() : []
                
                // Group by token and sum amounts
                const vaultBalances: Record<string, number> = {}
                
                depositNotes.forEach((note: any) => {
                  const token = note.token || 'native'
                  
                  // Determine decimals based on token type and chainId
                  let decimals: number
                  if (token === 'native') {
                    // For native tokens, check chainId
                    decimals = note.chainId?.includes('solana') ? 9 : 18
                  } else if (token === 'usdc' || token === 'usdt') {
                    decimals = 6
                  } else {
                    // Fallback
                    decimals = note.chainId?.includes('solana') ? 9 : 18
                  }
                  
                  console.log(`[Vault Balance] Processing note:`, {
                    token,
                    chainId: note.chainId,
                    rawAmount: note.amount,
                    decimals,
                    calculatedAmount: Number(note.amount) / Math.pow(10, decimals)
                  })
                  
                  const amount = Number(note.amount) / Math.pow(10, decimals)
                  vaultBalances[token] = (vaultBalances[token] || 0) + amount
                })
                
                const hasDeposit = Object.keys(vaultBalances).length > 0
                
                return (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                    hasDeposit ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-500/10 border-gray-500/30'
                  }`}>
                    <svg className={`w-4 h-4 ${hasDeposit ? 'text-green-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 leading-none">Vault</span>
                      {hasDeposit ? (
                        <div className="flex items-center gap-2 mt-0.5">
                          {vaultBalances['native'] && (
                            <div className="flex items-center gap-1">
                              <img src={activeWallet === 'solana' ? TOKEN_LOGOS.SOL : TOKEN_LOGOS.ETH} alt="" className="w-3 h-3 rounded-full" />
                              <span className="text-xs font-medium text-green-400">{vaultBalances['native'].toFixed(4)}</span>
                            </div>
                          )}
                          {vaultBalances['usdc'] && (
                            <div className="flex items-center gap-1">
                              <img src={TOKEN_LOGOS.USDC} alt="" className="w-3 h-3 rounded-full" />
                              <span className="text-xs font-medium text-green-400">{vaultBalances['usdc'].toFixed(2)}</span>
                            </div>
                          )}
                          {vaultBalances['usdt'] && (
                            <div className="flex items-center gap-1">
                              <img src={TOKEN_LOGOS.USDT} alt="" className="w-3 h-3 rounded-full" />
                              <span className="text-xs font-medium text-green-400">{vaultBalances['usdt'].toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-medium leading-none mt-0.5 text-gray-400">No Deposit</span>
                      )}
                    </div>
                  </div>
                )
              })()}
              
              {/* Single Wallet Selector */}
              <div className="relative z-[60]">
                {activeWallet ? (
                  <button onClick={() => setWalletSelectorOpen(!walletSelectorOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#1a1a24] rounded-lg border border-[#2a2a3a] hover:border-[#3a3a4a] transition-all touch-manipulation">
                    <img src={currentChainLogo} alt="" className="w-5 h-5 rounded-full" />
                    <span className="text-sm">{walletAddress}</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${walletSelectorOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : (
                  <button 
                    onClick={() => setWalletSelectorOpen(!walletSelectorOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#892CDC] to-[#52057B] rounded-lg text-sm font-medium hover:opacity-90 transition-all touch-manipulation active:scale-95 min-h-[44px]"
                  >
                    <span>Connect Wallet</span>
                    <svg className={`w-4 h-4 transition-transform ${walletSelectorOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
                
                {/* Dropdown */}
                <AnimatePresence>
                  {walletSelectorOpen && (
                    <>
                      <motion.div 
                        className="fixed inset-0 z-[70] bg-black/20" 
                        onClick={() => setWalletSelectorOpen(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                      <motion.div 
                        className="absolute right-0 top-full mt-2 w-64 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl shadow-xl z-[80] overflow-hidden"
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2, type: "spring", damping: 25 }}
                      >
                      {activeWallet ? (
                        <>
                          <div className="p-3 border-b border-[#2a2a3a]">
                            <p className="text-xs text-gray-500 uppercase">Connected</p>
                          </div>
                          <div className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img src={currentChainLogo} alt="" className="w-5 h-5 rounded" />
                              <div>
                                <p className="text-sm font-medium">{currentNetwork}</p>
                                <p className="text-xs text-gray-500">{walletAddress}</p>
                              </div>
                            </div>
                            <button onClick={handleDisconnect} className="text-xs text-red-400 hover:text-red-300">Disconnect</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-3 border-b border-[#2a2a3a]">
                            <p className="text-xs text-gray-500 uppercase">Solana Wallets</p>
                          </div>
                          {wallets.slice(0, 4).map((w) => (
                            <button key={w.adapter.name} onClick={() => handleConnectSolana(w.adapter.name)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-[#252530] transition-colors touch-manipulation active:bg-[#2a2a3a]">
                              <img src={w.adapter.icon} alt={w.adapter.name} className="w-6 h-6 rounded" />
                              <span className="text-sm font-medium">{w.adapter.name}</span>
                            </button>
                          ))}
                          <div className="p-3 border-t border-[#2a2a3a]">
                            <p className="text-xs text-gray-500 uppercase mb-2">EVM Wallets</p>
                          </div>
                          <button onClick={handleConnectEVM} className="w-full flex items-center gap-3 p-3 hover:bg-[#252530] transition-colors touch-manipulation active:bg-[#2a2a3a]">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-6 h-6" />
                            <span className="text-sm font-medium">MetaMask (Sepolia)</span>
                          </button>
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            {/* Server Status - Paling Kanan */}
            <div className="relative group px-2 py-2 bg-[#1a1a24] rounded-lg border border-[#2a2a3a]">
              <span className={`w-2 h-2 rounded-full block ${isServerConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <div className="absolute right-0 top-full mt-2 px-2 py-1 bg-[#1a1a24] border border-[#2a2a3a] rounded text-xs text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {serverStatus}
              </div>
            </div>
            </div>

            {/* Mobile menu button */}
            <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>


          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div variants={menuVariants} initial="closed" animate="open" exit="closed" className="lg:hidden py-4 border-t border-[#2a2a3a] overflow-hidden">
                <div className="flex flex-col gap-1 mb-4">
                  {navItems.map(item => (
                    <button key={item.id} onClick={() => handleNavClick(item.id)}
                      className={`px-4 py-3 text-sm font-medium rounded-lg transition-all text-left ${activeSection === item.id ? 'bg-[#1a1a24] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1a1a24]'}`}>
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm px-4 py-2">
                  <span className={`w-2 h-2 rounded-full ${isServerConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-gray-400">{serverStatus}</span>
                </div>

                {activeWallet && (
                  <div className="px-4 py-2">
                    {activeWallet === 'solana' ? (
                      <div className="p-3 bg-[#1a1a24] rounded-lg border border-[#2a2a3a]">
                        <div className="text-xs text-gray-500 mb-2">Devnet Balance</div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img src={TOKEN_LOGOS.SOL} alt="SOL" className="w-5 h-5 rounded-full" />
                              <span className="text-sm text-gray-400">SOL</span>
                            </div>
                            <span className="text-base font-medium">{solanaBalance}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img src={TOKEN_LOGOS.USDC} alt="USDC" className="w-5 h-5 rounded-full" />
                              <span className="text-sm text-gray-400">USDC</span>
                            </div>
                            <span className="text-base font-medium">{solanaUSDCBalance}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img src={TOKEN_LOGOS.USDT} alt="USDT" className="w-5 h-5 rounded-full" />
                              <span className="text-sm text-gray-400">USDT</span>
                            </div>
                            <span className="text-base font-medium">{solanaUSDTBalance}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-[#1a1a24] rounded-lg border border-[#2a2a3a]">
                        <div className="text-xs text-gray-500">Sepolia Balance</div>
                        <div className="flex items-center gap-2 text-lg font-medium mt-1">
                          <img src={TOKEN_LOGOS.ETH} alt="ETH" className="w-5 h-5 rounded-full" />
                          <span>{evmBalanceData ? `${(Number(evmBalanceData.value) / 1e18).toFixed(4)}` : '--'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Vault Balance - Mobile */}
                {activeWallet && (() => {
                  const stored = typeof window !== 'undefined' ? localStorage.getItem('obscura_deposit_notes') : null
                  const depositNotes = stored ? JSON.parse(stored) : []
                  
                  const TOKEN_DECIMALS: Record<string, number> = {
                    'native': 9,
                    'usdc': 6,
                    'usdt': 6
                  }
                  
                  const vaultBalances: Record<string, number> = {}
                  depositNotes.forEach((note: any) => {
                    const token = note.token || 'native'
                    const decimals = TOKEN_DECIMALS[token] || 9
                    const amount = Number(note.amount) / Math.pow(10, decimals)
                    vaultBalances[token] = (vaultBalances[token] || 0) + amount
                  })
                  
                  const hasDeposit = Object.keys(vaultBalances).length > 0
                  
                  return (
                    <div className="px-4 pb-2">
                      <div className={`p-3 rounded-lg border ${hasDeposit ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <svg className={`w-4 h-4 ${hasDeposit ? 'text-green-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-xs font-medium text-white">Vault Balance</span>
                          {hasDeposit && (
                            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded ml-auto">Ready</span>
                          )}
                        </div>
                        {hasDeposit ? (
                          <div className="flex flex-wrap gap-2 text-xs">
                            {vaultBalances['native'] && (
                              <div className="flex items-center gap-1">
                                <img src={TOKEN_LOGOS.SOL} alt="" className="w-3 h-3 rounded-full" />
                                <span className="font-medium text-green-400">{vaultBalances['native'].toFixed(4)} SOL</span>
                              </div>
                            )}
                            {vaultBalances['usdc'] && (
                              <div className="flex items-center gap-1">
                                <img src={TOKEN_LOGOS.USDC} alt="" className="w-3 h-3 rounded-full" />
                                <span className="font-medium text-green-400">{vaultBalances['usdc'].toFixed(2)} USDC</span>
                              </div>
                            )}
                            {vaultBalances['usdt'] && (
                              <div className="flex items-center gap-1">
                                <img src={TOKEN_LOGOS.USDT} alt="" className="w-3 h-3 rounded-full" />
                                <span className="font-medium text-green-400">{vaultBalances['usdt'].toFixed(2)} USDT</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-gray-400">No Deposit</span>
                        )}
                      </div>
                    </div>
                  )
                })()}

                <div className="pt-4 mt-2 border-t border-[#2a2a3a] px-4">
                  {activeWallet ? (
                    <div className="flex items-center justify-between p-3 bg-[#1a1a24] rounded-lg border border-[#2a2a3a]">
                      <div className="flex items-center gap-2">
                        <img src={currentChainLogo} alt="" className="w-5 h-5 rounded" />
                        <span className="text-sm">{walletAddress}</span>
                      </div>
                      <button onClick={handleDisconnect} className="text-xs text-red-400 hover:text-red-300">Disconnect</button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setShowConnectModal(true)
                        setMobileMenuOpen(false)
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-[#892CDC] to-[#52057B] rounded-lg text-sm font-medium touch-manipulation active:scale-95 transition-transform"
                    >
                      Connect Wallet
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-10">
        {activeSection === 'dashboard' && (
          <DashboardSection 
            stats={{ healthStatus: isServerConnected ? 'Online' : 'Offline', healthTime: new Date().toLocaleTimeString(), batchCount: 0, poolCount: 0, apiVersion: '0.4.0', walletBalance: currentBalance, tokenType: activeWallet === 'solana' ? 'SOL' : activeWallet === 'evm' ? 'ETH' : null }} 
            activityLog={activityLog} 
            onRefresh={refreshDashboard} 
          />
        )}
        {activeSection === 'deposit' && (
          <DepositSection 
            onSuccess={(type, id) => addActivity(type, id)} 
            showModal={showModal} 
            requireWalletConnection={requireWalletConnection}
          />
        )}
        {activeSection === 'dark-otc' && (
          <DarkOTCSection 
            onSuccess={(type, id) => addActivity(type, id)} 
            showModal={showModal}
            requireWalletConnection={requireWalletConnection}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#2a2a3a] mt-16 bg-[#0a0a0f]/50 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-10 text-center">
          <p className="text-gray-500 text-sm">Obscura - Post-Quantum Secure Intent Settlement</p>
          <p className="text-gray-600 text-xs mt-1">Built with WOTS+ signatures and SIP Protocol</p>
          <p className="text-gray-600 text-xs mt-3">A product by <span className="text-gray-400">Daemon Blockint Technologies</span></p>
        </div>
      </footer>

      {modal && <ResultModal {...modal} onClose={() => setModal(null)} />}
      
      {/* Wallet Connection Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <>
            <motion.div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConnectModal(false)}
            />
            <motion.div 
              className="fixed inset-0 z-[101] flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl max-w-md w-full p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#892CDC] to-[#52057B] flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Connect Wallet</h3>
                      <p className="text-sm text-gray-400">Choose your wallet to continue</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowConnectModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Wallet Options */}
                <div className="space-y-3">
                  {/* Solana Wallets */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 uppercase font-medium px-2">Solana Wallets</p>
                    {wallets.slice(0, 4).map((w) => (
                      <button 
                        key={w.adapter.name}
                        onClick={() => {
                          handleConnectSolana(w.adapter.name)
                          setShowConnectModal(false)
                        }}
                        className="w-full flex items-center gap-3 p-4 bg-[#252530] hover:bg-[#2a2a3a] rounded-xl transition-all border border-transparent hover:border-[#892CDC]/30"
                      >
                        <img src={w.adapter.icon} alt={w.adapter.name} className="w-8 h-8 rounded-lg" />
                        <span className="text-sm font-medium text-white">{w.adapter.name}</span>
                        <svg className="w-5 h-5 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>

                  {/* EVM Wallets */}
                  <div className="space-y-2 pt-2">
                    <p className="text-xs text-gray-500 uppercase font-medium px-2">EVM Wallets</p>
                    <button 
                      onClick={() => {
                        handleConnectEVM()
                        setShowConnectModal(false)
                      }}
                      className="w-full flex items-center gap-3 p-4 bg-[#252530] hover:bg-[#2a2a3a] rounded-xl transition-all border border-transparent hover:border-[#892CDC]/30"
                    >
                      <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-8 h-8" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">MetaMask</p>
                        <p className="text-xs text-gray-400">Sepolia Testnet</p>
                      </div>
                      <svg className="w-5 h-5 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="mt-6 p-4 bg-[#252530]/50 rounded-xl border border-[#2a2a3a]">
                  <p className="text-xs text-gray-400 text-center">
                    By connecting your wallet, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Network Error Modal */}
      <AnimatePresence>
        {showNetworkError && networkError && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
              onClick={() => setShowNetworkError(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101]"
            >
              <div className="bg-[#1a1a24] border-2 border-red-500/50 rounded-2xl p-6 mx-4 shadow-2xl">
                {/* Error Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>

                {/* Error Message */}
                <h3 className="text-xl font-bold text-white text-center mb-2">Wrong Network</h3>
                <p className="text-gray-300 text-center mb-6">{networkError}</p>

                {/* Instructions */}
                <div className="bg-[#252530] rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-400 mb-3">Required Networks:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={CHAIN_LOGOS.solana} alt="Solana" className="w-5 h-5" />
                      <span className="text-sm text-white">Solana Devnet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img src={CHAIN_LOGOS.ethereum} alt="Ethereum" className="w-5 h-5" />
                      <span className="text-sm text-white">Sepolia Testnet (Chain ID: 11155111)</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowNetworkError(false)
                      setNetworkError(null)
                    }}
                    className="flex-1 px-4 py-3 bg-[#252530] hover:bg-[#2a2a3a] text-white rounded-lg transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowNetworkError(false)
                      setNetworkError(null)
                      // Reopen connect modal to try again
                      setShowConnectModal(true)
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#892CDC] to-[#6B1FA8] hover:from-[#9D3EF0] hover:to-[#7C29BC] text-white rounded-lg transition-all font-medium"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
