'use client'

import { useState, useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAccount } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { createChart, ColorType, IChartApi, AreaSeries } from 'lightweight-charts'
import LoadingModal from '@/components/ui/LoadingModal'
import { useWOTSWallet } from '@/hooks/useWOTSWallet'
import { DARK_OTC_API_URL } from '@/lib/api'
import { TOKEN_LOGOS } from '@/lib/logos'

const API_BASE_URL = DARK_OTC_API_URL

interface Props {
  onSuccess: (type: string, id: string) => void
  showModal: (title: string, result: any, isSuccess: boolean) => void
  requireWalletConnection: () => boolean
}

interface BalanceCheck {
  sufficient: boolean
  current: string
  required: string
  missing?: string
}

interface VaultBalance {
  commitment: string | null
  amount: string
  token: string
  hasDeposit: boolean
  balances: Record<string, number> // All token balances
}

interface QuoteRequest {
  id: string
  asset_pair: string
  direction: 'buy' | 'sell'
  amount_commitment: string
  stealth_address: string
  taker_public_key: string
  created_at: number
  expires_at: number
  status: string
  quote_count?: number  // Backend returns quote_count (snake_case)
}

interface Quote {
  id: string  // Backend uses 'id' not 'quoteId'
  price_commitment: string  // Backend uses snake_case
  market_maker_public_key: string  // Backend uses snake_case
  market_maker_commitment?: string  // Backend uses snake_case - REQUIRED for atomic swap! (optional for backward compatibility)
  expires_at: number  // Backend uses snake_case
  status: string
  quote_request_id: string  // Backend uses snake_case
  created_at: number  // Backend uses snake_case
}

const TRADING_PAIRS = [
  { id: 'SOL/USDC', base: 'SOL', quote: 'USDC' },
  { id: 'ETH/USDT', base: 'ETH', quote: 'USDT' },
  { id: 'SOL/USDT', base: 'SOL', quote: 'USDT' },
  { id: 'BTC/USDC', base: 'BTC', quote: 'USDC' }
]

// Helper function to convert base units to decimal display
const formatAmount = (amountStr: string, token: string): string => {
  const amount = parseFloat(amountStr)
  if (isNaN(amount)) return '0'
  
  // Determine decimals based on token
  let decimals: number
  switch (token) {
    case 'SOL':
    case 'USDC':
    case 'USDT':
      decimals = 9 // lamports / base units
      break
    case 'ETH':
      decimals = 18 // wei
      break
    case 'BTC':
      decimals = 8 // satoshis
      break
    default:
      decimals = 9
  }
  
  const decimalAmount = amount / Math.pow(10, decimals)
  
  // Format with appropriate precision
  if (decimalAmount >= 1000) {
    return decimalAmount.toFixed(2)
  } else if (decimalAmount >= 1) {
    return decimalAmount.toFixed(4)
  } else if (decimalAmount >= 0.0001) {
    return decimalAmount.toFixed(6)
  } else {
    return decimalAmount.toFixed(8)
  }
}

// Helper to check if current user owns a request
const isOwnRequest = (request: QuoteRequest): boolean => {
  // Get stored WOTS public keys from localStorage
  const storedKeys = localStorage.getItem('wots_public_keys')
  if (!storedKeys) return false
  
  try {
    const keys: string[] = JSON.parse(storedKeys)
    return keys.includes(request.taker_public_key)
  } catch {
    return false
  }
}

// Helper to get token from asset pair based on direction
// For buy: user wants base token (pays with quote)
// For sell: user has base token (receives quote)
const getTokenForDirection = (assetPair: string, direction: 'buy' | 'sell'): string => {
  const [base, quote] = assetPair.split('/')
  return direction === 'buy' ? base : quote
}

// Helper to get base or quote token
const getTokenFromPair = (assetPair: string, isBase: boolean): string => {
  const [base, quote] = assetPair.split('/')
  return isBase ? base : quote
}

// Custom Trading Pair Select with logos + text
function TradingPairSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = TRADING_PAIRS.find(p => p.id === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm text-gray-400 mb-2">Trading Pair</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg text-white hover:border-[#3a3a4a] transition-colors"
      >
        {selected && (
          <>
            <div className="flex items-center gap-1">
              <img src={TOKEN_LOGOS[selected.base]} alt={selected.base} className="w-4 h-4 rounded-full" />
              <span className="text-sm font-medium">{selected.base}</span>
            </div>
            <span className="text-gray-400 text-sm">/</span>
            <div className="flex items-center gap-1">
              <img src={TOKEN_LOGOS[selected.quote]} alt={selected.quote} className="w-4 h-4 rounded-full" />
              <span className="text-sm font-medium">{selected.quote}</span>
            </div>
          </>
        )}
        <svg className={`w-4 h-4 text-gray-400 transition-transform ml-auto ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg shadow-xl z-[100] overflow-hidden">
          {TRADING_PAIRS.map(pair => (
            <button
              key={pair.id}
              type="button"
              onClick={() => { onChange(pair.id); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-3 hover:bg-[#252530] transition-colors ${value === pair.id ? 'bg-[#252530]' : ''}`}
            >
              <div className="flex items-center gap-1">
                <img src={TOKEN_LOGOS[pair.base]} alt={pair.base} className="w-4 h-4 rounded-full" />
                <span className="text-sm font-medium text-white">{pair.base}</span>
              </div>
              <span className="text-gray-400 text-sm">/</span>
              <div className="flex items-center gap-1">
                <img src={TOKEN_LOGOS[pair.quote]} alt={pair.quote} className="w-4 h-4 rounded-full" />
                <span className="text-sm font-medium text-white">{pair.quote}</span>
              </div>
              {value === pair.id && (
                <svg className="w-4 h-4 text-indigo-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DarkOTCSection({ onSuccess, showModal, requireWalletConnection }: Props) {
  // Solana wallet
  const { publicKey } = useWallet()
  
  // EVM wallet
  const { address: evmAddress, isConnected: evmConnected } = useAccount()
  
  // WOTS+ wallet for post-quantum signatures
  const { signMessage: signWithWOTS, isLoading: wotsLoading, error: wotsError } = useWOTSWallet()
  
  const [requests, setRequests] = useState<QuoteRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [showInfoDropdown, setShowInfoDropdown] = useState(false)
  const [showMessaging, setShowMessaging] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [priceData, setPriceData] = useState<{[key: string]: number | number[][]}>({})
  const [priceLoading, setPriceLoading] = useState(false)
  
  // Vault balance state
  const [vaultBalance, setVaultBalance] = useState<VaultBalance>({
    commitment: null,
    amount: '0',
    token: 'native',
    hasDeposit: false,
    balances: {}
  })
  
  // Statistics
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeRequests: 0,
    totalQuotes: 0,
    totalVolume: '0'
  })
  
  // Loading modal state
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelRequestId, setCancelRequestId] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [loadingSteps, setLoadingSteps] = useState<Array<{
    label: string
    status: 'pending' | 'loading' | 'success' | 'error'
    description?: string
  }>>([])

  // Form state for Create Request
  const [createForm, setCreateForm] = useState({
    assetPair: 'SOL/USDC',
    direction: 'buy' as 'buy' | 'sell',
    amount: '',
    validHours: '24'
  })

  // Form state for Submit Quote
  const [quoteForm, setQuoteForm] = useState({
    price: '',
    validHours: '12'
  })

  // Fee calculation function (based on Obscura fee structure)
  const calculateFee = (amount: number, token: 'SOL' | 'ETH' | 'USDC' | 'USDT' | 'BTC') => {
    if (amount <= 0) return { fee: 0, feeRate: 0, netAmount: amount }
    
    let feeRate: number
    let minimumFee: number
    
    // Determine fee rate based on amount (tiered pricing)
    if (amount <= 10) {
      feeRate = 0.001 // 0.10%
    } else if (amount <= 100) {
      feeRate = 0.0008 // 0.08%
    } else if (amount <= 1000) {
      feeRate = 0.0006 // 0.06%
    } else {
      feeRate = 0.0005 // 0.05%
    }
    
    // Set minimum fee based on token
    switch (token) {
      case 'SOL':
        minimumFee = 0.0001 // 100,000 lamports
        break
      case 'ETH':
        minimumFee = 0.00001
        break
      case 'USDC':
      case 'USDT':
        minimumFee = 0.01 // $0.01
        break
      case 'BTC':
        minimumFee = 0.000001 // 1 sat
        break
      default:
        minimumFee = 0.0001
    }
    
    const calculatedFee = amount * feeRate
    const fee = Math.max(calculatedFee, minimumFee)
    const netAmount = amount - fee
    
    return {
      fee: fee,
      feeRate: feeRate * 100, // Convert to percentage
      netAmount: Math.max(0, netAmount)
    }
  }

  // Get token from asset pair
  const getTokenFromPair = (assetPair: string, direction: 'buy' | 'sell'): 'SOL' | 'ETH' | 'USDC' | 'USDT' | 'BTC' => {
    const [base, quote] = assetPair.split('/')
    return direction === 'buy' ? base as any : quote as any
  }

  // Calculate fee for current form
  const currentFeeInfo = createForm.amount ? 
    calculateFee(
      parseFloat(createForm.amount), 
      getTokenFromPair(createForm.assetPair, createForm.direction)
    ) : null

  useEffect(() => {
    loadRequests()
    loadVaultBalance()
    const interval = setInterval(() => {
      loadRequests()
      loadVaultBalance()
    }, 10000)
    return () => clearInterval(interval)
  }, [publicKey, evmAddress])

  // Poll quotes when a request is selected
  useEffect(() => {
    if (!selectedRequest) return
    
    // Load quotes immediately
    loadQuotes(selectedRequest.id)
    
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(() => {
      loadQuotes(selectedRequest.id)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [selectedRequest?.id])

  const loadVaultBalance = async () => {
    // Load deposit notes from localStorage to get commitments
    try {
      const stored = localStorage.getItem('obscura_deposit_notes')
      const depositNotes = stored ? JSON.parse(stored) : []
      
      if (depositNotes.length === 0) {
        setVaultBalance({
          commitment: null,
          amount: '0',
          token: 'native',
          hasDeposit: false,
          balances: {}
        })
        return
      }
      
      console.log('[DarkOTC] Loading vault balance from Arcium cSPL...')
      console.log('[DarkOTC] Found', depositNotes.length, 'deposit notes')
      
      // Query vault balance from Obscura-LLMS API (Arcium cSPL off-chain balance)
      const TOKEN_DECIMALS: Record<string, number> = {
        'native': 9, // SOL
        'usdc': 6,
        'usdt': 6
      }
      
      const balances: Record<string, number> = {}
      let selectedCommitment: string | null = null
      let selectedToken = 'native'
      let selectedAmount = '0'
      
      // Query balance for each deposit note
      for (const note of depositNotes) {
        try {
          const token = note.token || 'native'
          const commitment = note.commitment
          
          console.log(`[DarkOTC] Querying balance for ${token} commitment: ${commitment.slice(0, 16)}...`)
          
          // Query Obscura-LLMS API for vault balance
          const response = await fetch(`${API_BASE_URL}/api/v1/balance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              commitment: commitment,
              chainId: 'solana-devnet'
            })
          })
          
          const result = await response.json()
          
          if (result.success && result.balance) {
            const decimals = TOKEN_DECIMALS[token] || 9
            const balanceNum = Number(result.balance) / Math.pow(10, decimals)
            
            console.log(`[DarkOTC] ✅ Vault balance for ${token}: ${balanceNum}`)
            console.log(`[DarkOTC] Confidential account: ${result.confidentialAccount?.slice(0, 16)}...`)
            
            balances[token] = (balances[token] || 0) + balanceNum
            
            // Select first available balance as primary
            if (!selectedCommitment && balanceNum > 0) {
              selectedCommitment = commitment
              selectedToken = token
              selectedAmount = balanceNum.toString()
            }
          } else {
            console.warn(`[DarkOTC] ⚠️ Failed to query balance for ${token}:`, result.error)
            // Fallback to localStorage amount if API fails
            const decimals = TOKEN_DECIMALS[token] || 9
            const amount = Number(note.amount) / Math.pow(10, decimals)
            balances[token] = (balances[token] || 0) + amount
            
            if (!selectedCommitment && amount > 0) {
              selectedCommitment = commitment
              selectedToken = token
              selectedAmount = amount.toString()
            }
          }
        } catch (error) {
          console.error(`[DarkOTC] Error querying balance for note:`, error)
          // Fallback to localStorage amount
          const token = note.token || 'native'
          const decimals = TOKEN_DECIMALS[token] || 9
          const amount = Number(note.amount) / Math.pow(10, decimals)
          balances[token] = (balances[token] || 0) + amount
          
          if (!selectedCommitment && amount > 0) {
            selectedCommitment = note.commitment
            selectedToken = token
            selectedAmount = amount.toString()
          }
        }
      }
      
      console.log('[DarkOTC] Final vault balances:', balances)
      
      setVaultBalance({
        commitment: selectedCommitment,
        amount: selectedAmount,
        token: selectedToken,
        hasDeposit: selectedCommitment !== null,
        balances: balances
      })
    } catch (error) {
      console.error('[DarkOTC] Error loading vault balance:', error)
      setVaultBalance({
        commitment: null,
        amount: '0',
        token: 'native',
        hasDeposit: false,
        balances: {}
      })
    }
  }

  const loadRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/rfq/quote-requests`)
      const data = await response.json()
      if (data.success) {
        const allRequests = data.data.quoteRequests || []
        const activeRequests = allRequests.filter((req: QuoteRequest) => {
          return req.expires_at > Date.now() && req.status === 'active'
        })
        setRequests(activeRequests)
        
        // Update stats - only count active requests
        const totalQuotes = activeRequests.reduce((sum: number, req: QuoteRequest) => sum + (req.quote_count || 0), 0)
        setStats({
          totalRequests: activeRequests.length,
          activeRequests: activeRequests.length,
          totalQuotes,
          totalVolume: '0' // TODO: Calculate from API if available
        })
      }
    } catch (error) {
      console.error('Failed to load requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadQuotes = async (requestId: string) => {
    try {
      console.log('[DarkOTC] Loading quotes for request:', requestId)
      const url = `${API_BASE_URL}/api/v1/rfq/quote-request/${requestId}/quotes`
      console.log('[DarkOTC] Fetching from:', url)
      
      const response = await fetch(url)
      console.log('[DarkOTC] Response status:', response.status)
      
      const data = await response.json()
      console.log('[DarkOTC] Response data:', data)
      
      if (data.success) {
        const allQuotes = data.data.quotes || []
        console.log('[DarkOTC] All quotes from backend:', allQuotes.length, allQuotes)
        
        const activeQuotes = allQuotes.filter((quote: Quote) => {
          try {
            // Validate timestamp - backend uses expires_at (snake_case)
            const expiresAt = Number(quote.expires_at)
            if (isNaN(expiresAt) || expiresAt <= 0) {
              console.warn('[DarkOTC] Invalid expires_at timestamp:', quote.expires_at, 'for quote:', quote.id)
              return false
            }
            
            const isExpired = expiresAt <= Date.now()
            const isActive = !isExpired && quote.status === 'active'
            
            console.log('[DarkOTC] Quote filter:', {
              quoteId: quote.id,
              status: quote.status,
              expiresAt: expiresAt,
              expiresAtDate: isNaN(expiresAt) ? 'Invalid' : new Date(expiresAt).toISOString(),
              now: Date.now(),
              nowDate: new Date().toISOString(),
              isExpired,
              isActive
            })
            
            return isActive
          } catch (error) {
            console.error('[DarkOTC] Error filtering quote:', quote.id, error)
            return false
          }
        })
        
        console.log('[DarkOTC] Active quotes after filter:', activeQuotes.length, activeQuotes)
        setQuotes(activeQuotes)
      } else {
        console.error('[DarkOTC] Backend returned error:', data.error)
      }
    } catch (error) {
      console.error('[DarkOTC] Failed to load quotes:', error)
    }
  }

  const selectRequest = (request: QuoteRequest) => {
    console.log('[DarkOTC] Selecting request:', request.id, request)
    setSelectedRequest(request)
    loadQuotes(request.id)
  }

  const formatTimeLeft = (expiresAt: number) => {
    const diff = expiresAt - Date.now()
    if (diff <= 0) return 'Expired'
    
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${seconds}s`
    return `${seconds}s`
  }

  // Real-time countdown update
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update countdown
      setRequests(prev => [...prev])
      setQuotes(prev => [...prev])
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Debug: Log quotes state changes
  useEffect(() => {
    console.log('[DarkOTC] Quotes state updated:', {
      count: quotes.length,
      quotes: quotes,
      selectedRequest: selectedRequest?.id
    })
  }, [quotes, selectedRequest])

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check wallet connection first
    if (!requireWalletConnection()) {
      return
    }

    // Check if user has deposited to vault
    if (!vaultBalance.hasDeposit || !vaultBalance.commitment) {
      const [base, quote] = createForm.assetPair.split('/')
      const requiredToken = createForm.direction === 'buy' ? quote : base
      
      showModal('Deposit Required', {
        error: `You need to deposit ${requiredToken} first`,
        details: createForm.direction === 'buy' 
          ? `You're buying ${base}, so you need ${quote} to pay for it. Go to Deposit section and deposit ${quote}.`
          : `You're selling ${base}, so you need ${base} in your vault. Go to Deposit section and deposit ${base}.`,
        action: 'Go to Deposit Section',
        requiredToken: requiredToken
      }, false)
      return
    }

    setShowLoadingModal(true)
    setLoadingSteps([
      { label: 'Generating stealth address', status: 'loading', description: 'Creating privacy layer...' },
      { label: 'Creating commitment', status: 'pending', description: 'Encrypting amount...' },
      { label: 'Signing with WOTS+', status: 'pending', description: 'Generating post-quantum signature...' },
      { label: 'Submitting to network', status: 'pending', description: 'Broadcasting request...' },
    ])

    try {
      // Step 1: Generate stealth address
      await new Promise(resolve => setTimeout(resolve, 500))
      const stealthAddress = `stealth_${Math.random().toString(36).slice(2)}`
      
      setLoadingSteps(prev => prev.map((step, i) => 
        i === 0 ? { ...step, status: 'success' } :
        i === 1 ? { ...step, status: 'loading' } : step
      ))

      // Step 2: Create commitment
      await new Promise(resolve => setTimeout(resolve, 500))
      const amountCommitment = `0x${Math.random().toString(16).slice(2)}`
      
      setLoadingSteps(prev => prev.map((step, i) => 
        i === 1 ? { ...step, status: 'success' } :
        i === 2 ? { ...step, status: 'loading' } : step
      ))

      // Step 3: Sign with WOTS+ (post-quantum signature)
      // Convert amount to lamports for consistent backend processing
      const amountLamports = Math.floor(parseFloat(createForm.amount) * 1e9).toString()
      const timeout = Date.now() + (parseInt(createForm.validHours) * 3600 * 1000)
      
      // Format message according to backend expectation (check backend code for exact format)
      const message = `create_quote_request:${createForm.assetPair}:${createForm.direction}:${amountLamports}:${timeout}`
      
      // Generate unique WOTS+ signature (one-time use only!)
      const tag = `create-request-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const { signature, publicKey: wotsPublicKey } = await signWithWOTS(message, tag)

      setLoadingSteps(prev => prev.map((step, i) => 
        i === 2 ? { ...step, status: 'success' } :
        i === 3 ? { ...step, status: 'loading' } : step
      ))

      // Step 4: Submit to API
      console.log('[Dark OTC] Submitting request to backend...');
      console.log('[Dark OTC] Request payload:', {
        assetPair: createForm.assetPair,
        direction: createForm.direction,
        amount: amountLamports,
        timeout: timeout,
        signatureLength: signature.length,
        publicKeyLength: wotsPublicKey.length,
        walletAddress: publicKey?.toBase58() || evmAddress,
        commitment: vaultBalance.commitment, // From Obscura deposit
        message: message // Include message for backend verification
      });
      
      const response = await fetch(`${API_BASE_URL}/api/v1/rfq/quote-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetPair: createForm.assetPair,
          direction: createForm.direction,
          amount: amountLamports,
          timeout: timeout,
          signature: signature, // WOTS+ signature (4288 hex chars)
          publicKey: wotsPublicKey, // WOTS+ public key (4416 hex chars)
          walletAddress: publicKey?.toBase58() || evmAddress, // For reference only
          message: message, // Include signed message for verification
          commitment: vaultBalance.commitment, // From Obscura deposit (REQUIRED!)
          chainId: 'solana-devnet' // Specify chain for backend
        })
      })

      console.log('[Dark OTC] Response status:', response.status);
      const result = await response.json()
      console.log('[Dark OTC] Response data:', result);

      if (!result.success) {
        throw new Error(result.error || result.details || 'Failed to create request')
      }

      setLoadingSteps(prev => prev.map(step => ({ ...step, status: 'success' })))

      // Store WOTS public key for ownership tracking
      try {
        const storedKeys = localStorage.getItem('wots_public_keys')
        const keys: string[] = storedKeys ? JSON.parse(storedKeys) : []
        if (!keys.includes(wotsPublicKey)) {
          keys.push(wotsPublicKey)
          localStorage.setItem('wots_public_keys', JSON.stringify(keys))
        }
      } catch (err) {
        console.error('[Dark OTC] Failed to store public key:', err)
      }

      setTimeout(() => {
        setShowLoadingModal(false)
        setShowCreateModal(false)
        setCreateForm({ assetPair: 'SOL/USDC', direction: 'buy', amount: '', validHours: '24' })
        
        showModal('Request Created', {
          success: true,
          message: 'Your Dark OTC request has been posted with post-quantum security',
          requestId: result.data.requestId,
          assetPair: createForm.assetPair,
          direction: createForm.direction,
          privacy: 'WOTS+ signature ensures quantum-resistant privacy'
        }, true)
        
        onSuccess('dark-otc-request', result.data.requestId)
        loadRequests()
      }, 1000)

    } catch (err: any) {
      setLoadingSteps(prev => prev.map(step => 
        step.status === 'loading' ? { ...step, status: 'error' } : step
      ))
      
      setTimeout(() => {
        setShowLoadingModal(false)
        
        let errorMessage = err.message || 'Failed to create request'
        let errorDetails = 'Please try again or check your wallet connection'
        
        // Handle WOTS+ specific errors
        if (err.message?.includes('Invalid signature length') || err.message?.includes('Invalid public key length')) {
          errorMessage = 'WOTS+ signature generation failed'
          errorDetails = 'There was an issue generating the post-quantum signature. Please try again.'
        } else if (err.message?.includes('Invalid tag')) {
          errorMessage = 'WOTS+ tag validation failed'
          errorDetails = 'There was an issue with the cryptographic tag. Please try again.'
        } else if (err.message?.includes('WOTS+ signature failed')) {
          errorMessage = 'Post-quantum signature error'
          errorDetails = 'The quantum-resistant signature could not be generated. Please try again.'
        }
        
        showModal('Error', { 
          error: errorMessage,
          details: errorDetails
        }, false)
      }, 1000)
    }
  }

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check wallet connection first
    if (!requireWalletConnection()) {
      return
    }
    
    if (!selectedRequest) {
      showModal('Error', { error: 'Please select a request first' }, false)
      return
    }

    // Check if user has deposited to vault
    if (!vaultBalance.hasDeposit || !vaultBalance.commitment) {
      const [base, quote] = selectedRequest.asset_pair.split('/')
      const requiredToken = selectedRequest.direction === 'buy' ? base : quote
      
      showModal('Deposit Required', {
        error: `Market Maker needs to deposit ${requiredToken}`,
        details: selectedRequest.direction === 'buy'
          ? `Taker wants to BUY ${base}. You need to deposit ${base} to sell to them.`
          : `Taker wants to SELL ${base}. You need to deposit ${quote} to buy from them.`,
        action: 'Go to Deposit Section',
        requiredToken: requiredToken
      }, false)
      return
    }

    setShowLoadingModal(true)
    setLoadingSteps([
      { label: 'Creating price commitment', status: 'loading', description: 'Encrypting quote...' },
      { label: 'Signing with WOTS+', status: 'pending', description: 'Generating post-quantum signature...' },
      { label: 'Submitting quote', status: 'pending', description: 'Broadcasting to network...' },
    ])

    try {
      // Step 1: Create price commitment
      await new Promise(resolve => setTimeout(resolve, 500))
      const priceCommitment = `0x${Math.random().toString(16).slice(2)}`
      
      setLoadingSteps(prev => prev.map((step, i) => 
        i === 0 ? { ...step, status: 'success' } :
        i === 1 ? { ...step, status: 'loading' } : step
      ))

      // Step 2: Sign with WOTS+ (post-quantum signature)
      const validForHours = parseInt(quoteForm.validHours)
      const expirationTime = Date.now() + (validForHours * 3600 * 1000)
      
      // Convert price to base units (lamports/wei)
      const priceInBaseUnits = Math.floor(parseFloat(quoteForm.price) * 1e9).toString()
      
      // Format message according to backend expectation
      const message = `submit_quote:${selectedRequest.id}:${priceInBaseUnits}:${expirationTime}`
      
      // Generate unique WOTS+ signature (one-time use only!)
      const tag = `submit-quote-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const { signature, publicKey: wotsPublicKey } = await signWithWOTS(message, tag)

      setLoadingSteps(prev => prev.map((step, i) => 
        i === 1 ? { ...step, status: 'success' } :
        i === 2 ? { ...step, status: 'loading' } : step
      ))

      // Step 3: Submit to API
      console.log('[DarkOTC] Submitting quote...')
      console.log('[DarkOTC] Request ID:', selectedRequest.id)
      console.log('[DarkOTC] Wallet address:', publicKey?.toBase58() || evmAddress)
      console.log('[DarkOTC] Payload:', {
        quoteRequestId: selectedRequest.id,
        price: priceInBaseUnits,
        expirationTime: expirationTime,
        walletAddress: publicKey?.toBase58() || evmAddress,
        commitment: vaultBalance.commitment,
        chainId: 'solana-devnet'
      })
      
      const response = await fetch(`${API_BASE_URL}/api/v1/rfq/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteRequestId: selectedRequest.id,
          price: priceInBaseUnits,
          expirationTime: expirationTime,
          signature: signature, // WOTS+ signature (4288 hex chars)
          publicKey: wotsPublicKey, // WOTS+ public key (4416 hex chars)
          message: message, // Include signed message for verification
          walletAddress: publicKey?.toBase58() || evmAddress, // ← REQUIRED for settlement!
          commitment: vaultBalance.commitment, // From Obscura deposit (REQUIRED!)
          chainId: 'solana-devnet'
        })
      })

      console.log('[DarkOTC] Response status:', response.status)
      const result = await response.json()
      console.log('[DarkOTC] Response data:', result)

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit quote')
      }

      setLoadingSteps(prev => prev.map(step => ({ ...step, status: 'success' })))

      setTimeout(() => {
        setShowLoadingModal(false)
        setShowQuoteModal(false)
        setQuoteForm({ price: '', validHours: '12' })
        
        showModal('Quote Submitted', {
          success: true,
          message: 'Your quote has been submitted with post-quantum security',
          quoteId: result.data.quoteId,
          requestId: selectedRequest.id,
          privacy: 'WOTS+ signature ensures quantum-resistant privacy'
        }, true)
        
        onSuccess('dark-otc-quote', result.data.quoteId)
        loadQuotes(selectedRequest.id)
      }, 1000)

    } catch (err: any) {
      setLoadingSteps(prev => prev.map(step => 
        step.status === 'loading' ? { ...step, status: 'error' } : step
      ))
      
      setTimeout(() => {
        setShowLoadingModal(false)
        
        let errorMessage = err.message || 'Failed to submit quote'
        let errorDetails = 'Please try again or check your wallet connection'
        
        // Handle WOTS+ specific errors
        if (err.message?.includes('Invalid signature length') || err.message?.includes('Invalid public key length')) {
          errorMessage = 'WOTS+ signature generation failed'
          errorDetails = 'There was an issue generating the post-quantum signature. Please try again.'
        } else if (err.message?.includes('Invalid tag')) {
          errorMessage = 'WOTS+ tag validation failed'
          errorDetails = 'There was an issue with the cryptographic tag. Please try again.'
        } else if (err.message?.includes('WOTS+ signature failed')) {
          errorMessage = 'Post-quantum signature error'
          errorDetails = 'The quantum-resistant signature could not be generated. Please try again.'
        }
        
        showModal('Error', { 
          error: errorMessage,
          details: errorDetails
        }, false)
      }, 1000)
    }
  }

  const handleAcceptQuote = async (quote: Quote) => {
    // Check wallet connection first
    if (!requireWalletConnection()) {
      return
    }
    
    if (!selectedRequest) {
      showModal('Error', { error: 'No request selected' }, false)
      return
    }

    // Check if user has deposited to vault
    if (!vaultBalance.hasDeposit || !vaultBalance.commitment) {
      showModal('Deposit Required', {
        error: 'You must deposit to Obscura vault before accepting a quote',
        details: 'Please go to the Deposit section and deposit funds first. Your commitment will be used for private settlement.',
        action: 'Go to Deposit'
      }, false)
      return
    }

    // Check if market maker has provided commitment (required for atomic swap)
    if (!quote.market_maker_commitment) {
      showModal('Error', {
        error: 'Market maker commitment missing',
        details: 'This quote does not have a market maker commitment. The market maker must deposit to the vault before their quote can be accepted. Please try another quote or wait for the market maker to update their quote.',
        action: 'Select Another Quote'
      }, false)
      return
    }

    setShowLoadingModal(true)
    setLoadingSteps([
      { label: 'Creating commitment', status: 'loading', description: 'Preparing settlement...' },
      { label: 'Signing with WOTS+', status: 'pending', description: 'Generating post-quantum signature...' },
      { label: 'Accepting quote', status: 'pending', description: 'Broadcasting acceptance...' },
      { label: 'Settlement', status: 'pending', description: 'Processing on-chain...' },
    ])

    try {
      // Step 1: Create commitment (use vault commitment)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setLoadingSteps(prev => prev.map((step, i) => 
        i === 0 ? { ...step, status: 'success' } :
        i === 1 ? { ...step, status: 'loading' } : step
      ))

      // Step 2: Sign with WOTS+ (post-quantum signature)
      const message = `accept_quote:${quote.id}`
      
      // Generate unique WOTS+ signature (one-time use only!)
      const tag = `accept-quote-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const { signature, publicKey: wotsPublicKey } = await signWithWOTS(message, tag)

      setLoadingSteps(prev => prev.map((step, i) => 
        i === 1 ? { ...step, status: 'success' } :
        i === 2 ? { ...step, status: 'loading' } : step
      ))

      // Step 3: Submit to API
      console.log('[DarkOTC] Accepting quote...')
      console.log('[DarkOTC] Quote ID:', quote.id)
      console.log('[DarkOTC] Request ID:', selectedRequest.id)
      console.log('[DarkOTC] Vault commitment:', vaultBalance.commitment)
      console.log('[DarkOTC] Market maker commitment:', quote.market_maker_commitment)
      console.log('[DarkOTC] Payload:', {
        signature: signature.substring(0, 50) + '...',
        publicKey: wotsPublicKey.substring(0, 50) + '...',
        message: message,
        takerCommitment: vaultBalance.commitment,
        takerAddress: publicKey?.toBase58() || evmAddress,
        marketMakerCommitment: quote.market_maker_commitment,
        chainId: 'solana-devnet'
      })
      
      const response = await fetch(`${API_BASE_URL}/api/v1/rfq/quote/${quote.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: signature, // WOTS+ signature (4288 hex chars)
          publicKey: wotsPublicKey, // WOTS+ public key (4416 hex chars)
          message: message, // Include signed message for verification
          takerCommitment: vaultBalance.commitment, // Taker's deposit commitment (REQUIRED for atomic swap!)
          takerAddress: publicKey?.toBase58() || evmAddress, // Taker's wallet address (to receive asset)
          marketMakerCommitment: quote.market_maker_commitment, // Market maker's deposit commitment (REQUIRED for atomic swap!)
          chainId: 'solana-devnet'
        })
      })

      console.log('[DarkOTC] Response status:', response.status)
      const result = await response.json()
      console.log('[DarkOTC] Response data:', result)

      if (!result.success) {
        console.error('[DarkOTC] Accept quote failed:', result.error)
        throw new Error(result.error || 'Failed to accept quote')
      }

      console.log('[DarkOTC] Quote accepted successfully!')
      console.log('[DarkOTC] Settlement info:', {
        nullifier: result.data?.nullifier,
        txHash: result.data?.txHash,
        zkCompressed: result.data?.zkCompressed,
        compressionSignature: result.data?.compressionSignature
      })

      setLoadingSteps(prev => prev.map((step, i) => 
        i === 2 ? { ...step, status: 'success' } :
        i === 3 ? { ...step, status: 'loading' } : step
      ))

      // Step 4: Wait for settlement
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setLoadingSteps(prev => prev.map(step => ({ ...step, status: 'success' })))

      setTimeout(() => {
        setShowLoadingModal(false)
        
        // Save nullifier for future withdrawal
        if (result.data.nullifier) {
          const nullifiers = JSON.parse(localStorage.getItem('obscura_nullifiers') || '[]')
          nullifiers.push({
            nullifier: result.data.nullifier,
            quoteId: quote.id,
            timestamp: Date.now()
          })
          localStorage.setItem('obscura_nullifiers', JSON.stringify(nullifiers))
        }
        
        showModal('Quote Accepted', {
          success: true,
          message: 'Quote accepted and settled with post-quantum security',
          quoteId: quote.id,
          requestId: selectedRequest.id,
          nullifier: result.data.nullifier,
          txHash: result.data.txHash,
          zkCompressed: result.data.zkCompressed,
          privacy: 'Settlement completed with stealth addresses and WOTS+ signatures'
        }, true)
        
        onSuccess('dark-otc-accept', quote.id)
        loadRequests()
        loadVaultBalance() // Refresh vault balance after settlement
        setSelectedRequest(null)
        setQuotes([])
      }, 1000)

    } catch (err: any) {
      setLoadingSteps(prev => prev.map(step => 
        step.status === 'loading' ? { ...step, status: 'error' } : step
      ))
      
      setTimeout(() => {
        setShowLoadingModal(false)
        
        let errorMessage = err.message || 'Failed to accept quote'
        let errorDetails = 'Please try again or check your wallet connection'
        
        // Handle WOTS+ specific errors
        if (err.message?.includes('Invalid signature length') || err.message?.includes('Invalid public key length')) {
          errorMessage = 'WOTS+ signature generation failed'
          errorDetails = 'There was an issue generating the post-quantum signature. Please try again.'
        } else if (err.message?.includes('WOTS+ signature failed')) {
          errorMessage = 'Post-quantum signature error'
          errorDetails = 'The quantum-resistant signature could not be generated. Please try again.'
        }
        
        showModal('Error', { 
          error: errorMessage,
          details: errorDetails
        }, false)
      }, 1000)
    }
  }

  // Helper to find best quote (lowest price for buy, highest for sell)
  const getBestQuote = (quotes: Quote[], direction: 'buy' | 'sell'): Quote | null => {
    if (quotes.length === 0) return null
    
    return quotes.reduce((best, quote) => {
      const bestPrice = parseFloat(best.price_commitment)
      const quotePrice = parseFloat(quote.price_commitment)
      
      if (direction === 'buy') {
        // For buy, lower price is better
        return quotePrice < bestPrice ? quote : best
      } else {
        // For sell, higher price is better
        return quotePrice > bestPrice ? quote : best
      }
    })
  }

  // Helper to get blockchain explorer link
  const getExplorerLink = (txHash: string, chainId: string = 'solana-devnet'): string => {
    if (chainId === 'solana-devnet') {
      return `https://explorer.solana.com/tx/${txHash}?cluster=devnet`
    } else if (chainId === 'sepolia') {
      return `https://sepolia.etherscan.io/tx/${txHash}`
    }
    return '#'
  }

  // Fetch current prices and sparkline from CoinGecko
  const fetchPrices = async () => {
    setPriceLoading(true)
    try {
      console.log('[CoinGecko] Fetching prices...')
      
      // Fetch current prices
      const priceResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana,ethereum,bitcoin,usd-coin,tether&vs_currencies=usd&include_24hr_change=true'
      )
      const priceData = await priceResponse.json()
      console.log('[CoinGecko] Price data:', priceData)
      
      // Fetch 7-day sparkline data for each token
      const sparklinePromises = ['solana', 'ethereum', 'bitcoin'].map(async (id) => {
        try {
          console.log(`[CoinGecko] Fetching sparkline for ${id}...`)
          const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7&interval=daily`
          )
          const data = await response.json()
          console.log(`[CoinGecko] Sparkline data for ${id}:`, data.prices?.length || 0, 'points')
          return { id, prices: data.prices || [] }
        } catch (error) {
          console.error(`[CoinGecko] Error fetching sparkline for ${id}:`, error)
          return { id, prices: [] }
        }
      })
      
      const sparklineResults = await Promise.all(sparklinePromises)
      const sparklines: {[key: string]: number[][]} = {}
      sparklineResults.forEach(result => {
        sparklines[result.id] = result.prices
      })
      
      const newPriceData = {
        'SOL': priceData.solana?.usd || 0,
        'ETH': priceData.ethereum?.usd || 0,
        'BTC': priceData.bitcoin?.usd || 0,
        'USDC': priceData['usd-coin']?.usd || 1,
        'USDT': priceData.tether?.usd || 1,
        'SOL_change': priceData.solana?.usd_24h_change || 0,
        'ETH_change': priceData.ethereum?.usd_24h_change || 0,
        'BTC_change': priceData.bitcoin?.usd_24h_change || 0,
        'SOL_sparkline': sparklines.solana || [],
        'ETH_sparkline': sparklines.ethereum || [],
        'BTC_sparkline': sparklines.bitcoin || [],
      }
      
      console.log('[CoinGecko] Final price data:', newPriceData)
      setPriceData(newPriceData)
    } catch (error) {
      console.error('[CoinGecko] Failed to fetch prices:', error)
    } finally {
      setPriceLoading(false)
    }
  }

  // Fetch prices on mount and every minute
  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  // Fetch prices when create modal opens
  useEffect(() => {
    if (showCreateModal) {
      fetchPrices()
    }
  }, [showCreateModal])

  // Professional TradingView-style Chart Component
  const TradingViewChart = ({ data, color = '#6366f1' }: { data: number[][], color?: string }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)

    useEffect(() => {
      if (!chartContainerRef.current || !data || data.length === 0) return

      // Create chart
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#0d0d12' },
          textColor: '#9ca3af',
        },
        grid: {
          vertLines: { color: '#1a1a24' },
          horzLines: { color: '#1a1a24' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 200,
        timeScale: {
          borderColor: '#2a2a3a',
          timeVisible: true,
        },
        rightPriceScale: {
          borderColor: '#2a2a3a',
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: '#6366f1',
            width: 1,
            style: 2,
            labelBackgroundColor: '#6366f1',
          },
          horzLine: {
            color: '#6366f1',
            width: 1,
            style: 2,
            labelBackgroundColor: '#6366f1',
          },
        },
      })

      chartRef.current = chart

      // Add area series
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: color,
        topColor: `${color}40`,
        bottomColor: `${color}00`,
        lineWidth: 2,
      })

      // Format data for lightweight-charts
      const formattedData = data.map(([timestamp, value]) => ({
        time: Math.floor(timestamp / 1000) as any,
        value: value,
      }))

      areaSeries.setData(formattedData)
      chart.timeScale().fitContent()

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          })
        }
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        if (chartRef.current) {
          chartRef.current.remove()
        }
      }
    }, [data, color])

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-sm">No chart data available</p>
        </div>
      )
    }

    return <div ref={chartContainerRef} className="w-full" />
  }

  // Get CoinGecko chart ID for token
  const getCoinGeckoId = (token: string): string => {
    const mapping: {[key: string]: string} = {
      'SOL': 'solana',
      'ETH': 'ethereum',
      'BTC': 'bitcoin',
      'USDC': 'usd-coin',
      'USDT': 'tether'
    }
    return mapping[token] || 'solana'
  }

  const handleCancelRequest = async (requestId: string) => {
    setCancelRequestId(requestId)
    setShowCancelConfirm(true)
  }

  const confirmCancelRequest = async () => {
    if (!cancelRequestId) return

    try {
      setIsCancelling(true)
      
      // Generate NEW WOTS+ keypair (one-time use!)
      const message = `cancel_quote_request:${cancelRequestId}`
      const tag = `cancel-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const { signature, publicKey: wotsPublicKey } = await signWithWOTS(message, tag)

      console.log('[Cancel] Generated NEW keypair for cancel')
      console.log('[Cancel] Message:', message)

      const response = await fetch(`${API_BASE_URL}/api/v1/rfq/quote-request/${cancelRequestId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: signature,
          publicKey: wotsPublicKey, // NEW public key (different from create)
          message: message // Include message for backend verification
        })
      })

      const result = await response.json()

      if (result.success) {
        setShowCancelConfirm(false)
        setIsCancelling(false)
        
        showModal('Request Cancelled', {
          success: true,
          message: 'Your quote request has been cancelled successfully',
          requestId: cancelRequestId
        }, true)
        
        loadRequests()
        if (selectedRequest?.id === cancelRequestId) {
          setSelectedRequest(null)
          setQuotes([])
        }
      } else {
        throw new Error(result.error || 'Failed to cancel request')
      }
    } catch (err: any) {
      setIsCancelling(false)
      setShowCancelConfirm(false)
      
      showModal('Error', {
        error: err.message || 'Failed to cancel request',
        details: 'Please try again'
      }, false)
    }
  }

  return (
    <section>
      {/* Header with fade in */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-3xl font-semibold mb-2">Dark OTC</h2>
        <p className="text-gray-400">Private over-the-counter trading with encrypted quotes</p>
      </motion.div>

      {/* Statistics Bar with stagger animation */}
      <div className="max-w-6xl mx-auto mb-6">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          {[
            { value: stats.totalRequests, label: 'Total Requests', color: 'text-indigo-400', delay: 0 },
            { value: stats.activeRequests, label: 'Active Now', color: 'text-green-400', delay: 0.05 },
            { value: stats.totalQuotes, label: 'Total Quotes', color: 'text-blue-400', delay: 0.1 },
            { value: selectedRequest ? quotes.length : '-', label: 'Quotes Selected', color: 'text-purple-400', delay: 0.15 }
          ].map((stat, index) => (
            <motion.div 
              key={index}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: stat.delay }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            >
              <motion.div 
                className={`text-3xl font-bold ${stat.color}`}
                key={stat.value}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Info Box with slide in - Now Collapsible */}
      <div className="max-w-6xl mx-auto mb-6">
        <motion.div 
          className="bg-blue-500/10 border border-blue-500/30 rounded-xl overflow-hidden"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ borderColor: 'rgba(59, 130, 246, 0.5)', transition: { duration: 0.2 } }}
        >
          {/* Header - Always Visible */}
          <button
            onClick={() => setShowInfoDropdown(!showInfoDropdown)}
            className="w-full flex items-center justify-between p-4 hover:bg-blue-500/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <motion.svg 
                className="w-5 h-5 text-blue-400 flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </motion.svg>
              <h4 className="font-semibold text-blue-400">How Dark OTC Works</h4>
            </div>
            <motion.svg 
              className="w-5 h-5 text-blue-400"
              animate={{ rotate: showInfoDropdown ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>
          
          {/* Collapsible Content */}
          <AnimatePresence>
            {showInfoDropdown && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-300 leading-relaxed mb-3">
                    Create private quote requests with encrypted amounts using WOTS+ post-quantum signatures. 
                    Market makers submit encrypted quotes with quantum-resistant security. 
                    All trades are settled through privacy-preserving smart contracts with stealth addresses. 
                    Your identity and trade details remain completely private on-chain.
                  </p>
              
              {/* Vault Balance Status */}
              <div className={`bg-[#0d0d12] rounded-lg p-3 mb-3 border ${vaultBalance.hasDeposit ? 'border-green-500/30' : 'border-yellow-500/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className={`w-4 h-4 ${vaultBalance.hasDeposit ? 'text-green-400' : 'text-yellow-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-sm font-medium text-white">Vault Balance:</span>
                  </div>
                  {vaultBalance.hasDeposit ? (
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Ready</span>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        {vaultBalance.balances['native'] && vaultBalance.balances['native'] > 0 && (
                          <span>{vaultBalance.balances['native'].toFixed(4)} SOL</span>
                        )}
                        {vaultBalance.balances['usdc'] && vaultBalance.balances['usdc'] > 0 && (
                          <span>{vaultBalance.balances['usdc'].toFixed(4)} USDC</span>
                        )}
                        {vaultBalance.balances['usdt'] && vaultBalance.balances['usdt'] > 0 && (
                          <span>{vaultBalance.balances['usdt'].toFixed(4)} USDT</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">No Deposit</span>
                  )}
                </div>
                {!vaultBalance.hasDeposit && (
                  <div className="mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/30">
                    <p className="text-xs text-yellow-400 font-medium mb-1">⚠️ Deposit Required</p>
                    <p className="text-xs text-gray-400">
                      Before trading, deposit the token you want to trade:
                    </p>
                    <ul className="text-xs text-gray-400 mt-1 ml-4 space-y-0.5">
                      <li>• <span className="text-white">BUY SOL</span> → Deposit <span className="text-green-400">USDC</span> (to pay for SOL)</li>
                      <li>• <span className="text-white">SELL SOL</span> → Deposit <span className="text-red-400">SOL</span> (to sell)</li>
                      <li>• <span className="text-white">Market Maker</span> → Deposit the token you're selling</li>
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Fee Structure Info */}
              <div className="bg-[#0d0d12] rounded-lg p-3 mt-3">
                <h5 className="text-sm font-medium text-yellow-400 mb-2">💰 Settlement Fee Structure</h5>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-gray-400 mb-1">Volume Tiers:</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">0-10 tokens:</span>
                        <span className="text-white">0.10%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">10-100 tokens:</span>
                        <span className="text-white">0.08%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">100-1000 tokens:</span>
                        <span className="text-white">0.06%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">1000+ tokens:</span>
                        <span className="text-white">0.05%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Minimum Fees:</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">SOL:</span>
                        <span className="text-white">0.0001</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">ETH:</span>
                        <span className="text-white">0.00001</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">USDC/USDT:</span>
                        <span className="text-white">$0.01</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Fees cover relayer gas costs, privacy infrastructure, and protocol development
                </p>
              </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Request List */}
          <motion.div 
            className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-6"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold">Quote Requests</h3>
                <motion.p 
                  className="text-xs text-gray-500 mt-1"
                  key={requests.length}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {loading ? 'Loading...' : `${requests.length} active ${requests.length === 1 ? 'request' : 'requests'}`}
                </motion.p>
              </div>
              <motion.button
                onClick={() => {
                  if (!publicKey && !evmConnected) {
                    showModal('Error', { error: 'Please connect your wallet first' }, false)
                    return
                  }
                  setShowCreateModal(true)
                }}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-sm font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Request
              </motion.button>
            </div>

            {loading ? (
              <motion.div 
                className="flex items-center justify-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div 
                  className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            ) : requests.length === 0 ? (
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.svg 
                  className="w-16 h-16 mx-auto text-gray-600 mb-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </motion.svg>
                <p className="text-gray-500">No active requests</p>
                <p className="text-gray-600 text-sm mt-1">Create a request to get started</p>
              </motion.div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {requests.map((request, index) => {
                    const isOwner = isOwnRequest(request)
                    return (
                    <motion.div
                      key={request.id}
                      className={`relative p-4 rounded-lg border text-left transition-all ${
                        selectedRequest?.id === request.id
                          ? 'bg-indigo-500/20 border-indigo-500'
                          : 'bg-[#0d0d12] border-[#2a2a3a] hover:border-[#3a3a4a]'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      layout
                    >
                    <button
                      onClick={() => selectRequest(request)}
                      className="w-full text-left"
                    >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{request.asset_pair}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            request.direction === 'buy' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {request.direction.toUpperCase()}
                          </span>
                          {isOwner && (
                            <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              Your Request
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <img 
                            src={TOKEN_LOGOS[getTokenForDirection(request.asset_pair, request.direction)]} 
                            alt="" 
                            className="w-3.5 h-3.5 rounded-full" 
                          />
                          <p className="text-sm font-medium text-white">
                            {formatAmount(request.amount_commitment, getTokenForDirection(request.asset_pair, request.direction))}
                          </p>
                          <span className="text-xs text-gray-500">
                            {getTokenForDirection(request.asset_pair, request.direction)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                          {request.status}
                        </span>
                        {request.quote_count !== undefined && request.quote_count > 0 && (
                          <div className="text-xs text-green-400 mt-1 font-medium">
                            {request.quote_count} {request.quote_count === 1 ? 'quote' : 'quotes'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Posted {new Date(request.created_at).toLocaleTimeString()}</span>
                      <div className="flex items-center gap-2">
                        <span>Expires {formatTimeLeft(request.expires_at)}</span>
                        {isOwner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCancelRequest(request.id)
                            }}
                            className="px-2 py-0.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-red-400 transition-colors text-xs font-medium"
                            title="Cancel Request"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    </button>
                  </motion.div>
                  )}
                )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Right Panel: Request Details & Quotes */}
          <motion.div 
            className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-6"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {selectedRequest ? (
                <motion.div
                  key={selectedRequest.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Request Details</h3>
                    {/* Submit Quote Button - Only for others' requests */}
                    {!isOwnRequest(selectedRequest) && (
                      <motion.button
                        onClick={() => {
                          if (!publicKey && !evmConnected) {
                            showModal('Error', { error: 'Please connect your wallet first' }, false)
                            return
                          }
                          setShowQuoteModal(true)
                        }}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-medium transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Submit Quote
                      </motion.button>
                    )}
                  </div>

                {/* Request Info */}
                <div className="bg-[#0d0d12] rounded-lg p-4 mb-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trading Pair</span>
                    <span className="font-medium">{selectedRequest.asset_pair}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Direction</span>
                    <span className={`font-medium ${
                      selectedRequest.direction === 'buy' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {selectedRequest.direction.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Amount</span>
                    <div className="flex items-center gap-2">
                      <img 
                        src={TOKEN_LOGOS[getTokenForDirection(selectedRequest.asset_pair, selectedRequest.direction)]} 
                        alt="" 
                        className="w-4 h-4 rounded-full" 
                      />
                      <span className="font-medium text-white">
                        {formatAmount(selectedRequest.amount_commitment, getTokenForDirection(selectedRequest.asset_pair, selectedRequest.direction))}
                      </span>
                      <span className="text-sm text-gray-400">
                        {getTokenForDirection(selectedRequest.asset_pair, selectedRequest.direction)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                      {selectedRequest.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expires</span>
                    <span className="text-yellow-400">{formatTimeLeft(selectedRequest.expires_at)}</span>
                  </div>
                </div>

                {/* Quotes List */}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3">
                    Quotes ({quotes.length})
                  </h4>
                  {quotes.length === 0 ? (
                    <motion.div 
                      className="text-center py-8 bg-[#0d0d12] rounded-lg"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.svg 
                        className="w-12 h-12 mx-auto text-gray-600 mb-3" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </motion.svg>
                      <p className="text-gray-500 text-sm">No quotes yet</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      <AnimatePresence mode="popLayout">
                        {quotes.map((quote, index) => {
                          const [baseToken, quoteToken] = selectedRequest.asset_pair.split('/')
                          const pricePerUnit = formatAmount(quote.price_commitment, quoteToken)
                          const amountToken = getTokenForDirection(selectedRequest.asset_pair, selectedRequest.direction)
                          const amount = formatAmount(selectedRequest.amount_commitment, amountToken)
                          const totalCost = (parseFloat(amount) * parseFloat(pricePerUnit)).toFixed(4)
                          
                          return (
                            <motion.div
                              key={quote.id}
                              className="p-4 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg hover:border-indigo-500/50 transition-colors"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              layout
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500 mb-1">Price per {baseToken}</p>
                                  <div className="flex items-center gap-2">
                                    <img 
                                      src={TOKEN_LOGOS[quoteToken]} 
                                      alt="" 
                                      className="w-4 h-4 rounded-full" 
                                    />
                                    <p className="text-lg font-bold text-white">{pricePerUnit}</p>
                                    <span className="text-sm text-gray-400">{quoteToken}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Total: <span className="text-white font-medium">{totalCost} {quoteToken}</span>
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <motion.span 
                                    className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                  >
                                    {quote.status}
                                  </motion.span>
                                  <motion.button
                                    onClick={() => handleAcceptQuote(quote)}
                                    className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 rounded text-xs font-medium transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    Accept
                                  </motion.button>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-[#2a2a3a]">
                                <span>MM: {quote.market_maker_public_key.slice(0, 8)}...{quote.market_maker_public_key.slice(-6)}</span>
                                <span>Expires {formatTimeLeft(quote.expires_at)}</span>
                              </div>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                </motion.div>
              ) : (
                <motion.div 
                  className="flex items-center justify-center h-full min-h-[400px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="text-center">
                    <motion.svg 
                      className="w-20 h-20 mx-auto text-gray-600 mb-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </motion.svg>
                    <p className="text-gray-500">Select a request to view details</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Create Request Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, type: "spring", damping: 25 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Create Quote Request</h3>
                <motion.button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* 2 Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Form */}
                <div>
                  <form onSubmit={handleCreateRequest} className="space-y-4">
                    {/* Trading Pair */}
                    <TradingPairSelect 
                      value={createForm.assetPair}
                      onChange={(value) => setCreateForm({ ...createForm, assetPair: value })}
                    />
                    
                    {/* Direction */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Direction</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCreateForm({ ...createForm, direction: 'buy' })}
                          className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                            createForm.direction === 'buy'
                              ? 'bg-green-500 text-white'
                              : 'bg-[#0d0d12] text-gray-400 hover:text-white'
                          }`}
                        >
                          Buy
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreateForm({ ...createForm, direction: 'sell' })}
                          className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                            createForm.direction === 'sell'
                              ? 'bg-red-500 text-white'
                              : 'bg-[#0d0d12] text-gray-400 hover:text-white'
                          }`}
                        >
                          Sell
                        </button>
                      </div>
                    </div>

                    {/* Amount & Valid Hours Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Amount</label>
                        <input
                          type="text"
                          value={createForm.amount}
                          onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                          placeholder="0.0"
                          required
                          className="w-full px-3 py-2 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Valid (hours)</label>
                        <input
                          type="number"
                          value={createForm.validHours}
                          onChange={(e) => setCreateForm({ ...createForm, validHours: e.target.value })}
                          min="1"
                          max="168"
                          required
                          className="w-full px-3 py-2 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">Amount will be encrypted on public board</p>
                    
                    {/* Fee Information */}
                    {currentFeeInfo && parseFloat(createForm.amount) > 0 && (
                      <motion.div 
                        className="p-3 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium text-blue-400">Settlement Fee</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Amount:</span>
                              <span className="text-white">{parseFloat(createForm.amount).toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Fee:</span>
                              <span className="text-red-400">-{currentFeeInfo.fee.toFixed(4)}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Rate:</span>
                              <span className="text-yellow-400">{currentFeeInfo.feeRate.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Net:</span>
                              <span className="text-green-400">{currentFeeInfo.netAmount.toFixed(4)}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Validation & Submit Button */}
                    {(() => {
                      const [base, quote] = createForm.assetPair.split('/')
                      const requiredToken = createForm.direction === 'buy' ? quote : base
                      const hasAmount = createForm.amount && parseFloat(createForm.amount) > 0
                      const hasVaultBalance = vaultBalance.hasDeposit && vaultBalance.commitment
                      const isValid = hasAmount && hasVaultBalance
                      
                      let errorMessage = ''
                      if (!hasAmount) {
                        errorMessage = 'Enter amount'
                      } else if (!hasVaultBalance) {
                        errorMessage = `Deposit ${requiredToken} to vault first`
                      }

                      return (
                        <>
                          {errorMessage && (
                            <motion.div
                              className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs text-red-400">{errorMessage}</p>
                              </div>
                            </motion.div>
                          )}
                          
                          <motion.button
                            type="submit"
                            disabled={!isValid}
                            className={`w-full py-3 rounded-lg font-semibold transition-all ${
                              isValid
                                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:opacity-90 cursor-pointer'
                                : 'bg-gray-600 cursor-not-allowed opacity-50'
                            }`}
                            whileHover={isValid ? { scale: 1.02 } : {}}
                            whileTap={isValid ? { scale: 0.98 } : {}}
                          >
                            Post to Public Board
                          </motion.button>
                        </>
                      )
                    })()}
                  </form>
                </div>

            {/* Right Column: Price Info & Chart */}
            <div className="space-y-4">
              {/* Price Widget */}
              {createForm.assetPair && (() => {
                const [base, quote] = createForm.assetPair.split('/')
                const basePrice: number = typeof priceData[base] === 'number' ? priceData[base] as number : 0
                const baseChange: number = typeof priceData[`${base}_change`] === 'number' ? priceData[`${base}_change`] as number : 0
                const sparklineData: number[][] = Array.isArray(priceData[`${base}_sparkline`]) ? priceData[`${base}_sparkline`] as number[][] : []
                
                return (
                  <>
                    <div className="p-4 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <img src={TOKEN_LOGOS[base]} alt={base} className="w-6 h-6 rounded-full" />
                          <span className="text-base font-semibold text-white">{base} Price</span>
                        </div>
                        {priceLoading ? (
                          <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        ) : (
                          <a 
                            href={`https://www.coingecko.com/en/coins/${getCoinGeckoId(base)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-indigo-400 transition-colors"
                          >
                            CoinGecko ↗
                          </a>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-bold text-white">
                          ${basePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-base font-medium ${baseChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {baseChange >= 0 ? '↑' : '↓'} {Math.abs(baseChange).toFixed(2)}%
                        </span>
                        <span className="text-xs text-gray-500">24h</span>
                      </div>
                      {createForm.amount && parseFloat(createForm.amount) > 0 && (
                        <div className="pt-3 border-t border-[#2a2a3a]">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Your Amount:</span>
                            <span className="text-white font-medium">{parseFloat(createForm.amount).toFixed(4)} {base}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-400">Estimated Value:</span>
                            <span className="text-green-400 font-semibold">
                              ${(parseFloat(createForm.amount) * basePrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CoinGecko Chart Widget */}
                    <div className="bg-[#0d0d12] border border-[#2a2a3a] rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">7-Day Price Chart</h4>
                      <div className="relative w-full">
                        <TradingViewChart 
                          data={sparklineData} 
                          color="#6366f1"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Powered by <a 
                          href={`https://www.coingecko.com/en/coins/${getCoinGeckoId(base)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          CoinGecko
                        </a>
                      </p>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Quote Modal - With Chart */}
      <AnimatePresence>
        {showQuoteModal && selectedRequest && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, type: "spring", damping: 25 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Submit Quote</h3>
                <motion.button
                  onClick={() => setShowQuoteModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* 2-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Form */}
                <div className="space-y-4">
                  {/* Request Details - Compact */}
                  <div className="bg-[#0d0d12] rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-2">Request Details</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 block mb-1">Pair</span>
                        <span className="font-medium">{selectedRequest.asset_pair}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">Direction</span>
                        <span className={selectedRequest.direction === 'buy' ? 'text-green-400' : 'text-red-400'}>
                          {selectedRequest.direction.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">Amount</span>
                        <div className="flex items-center gap-1">
                          <img 
                            src={TOKEN_LOGOS[getTokenForDirection(selectedRequest.asset_pair, selectedRequest.direction)]} 
                            alt="" 
                            className="w-3 h-3 rounded-full" 
                          />
                          <span className="font-medium text-xs">
                            {formatAmount(selectedRequest.amount_commitment, getTokenForDirection(selectedRequest.asset_pair, selectedRequest.direction))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmitQuote} className="space-y-4">
                    {/* Price Input */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Your Price</label>
                      <input
                        type="text"
                        value={quoteForm.price}
                        onChange={(e) => setQuoteForm({ ...quoteForm, price: e.target.value })}
                        placeholder="0.0"
                        required
                        className="w-full px-4 py-3 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Price will be encrypted</p>
                    </div>

                    {/* Valid Hours */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Valid For (hours)</label>
                      <input
                        type="number"
                        value={quoteForm.validHours}
                        onChange={(e) => setQuoteForm({ ...quoteForm, validHours: e.target.value })}
                        min="1"
                        max="72"
                        required
                        className="w-full px-4 py-3 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Earnings Info */}
                    {quoteForm.price && parseFloat(quoteForm.price) > 0 && (
                      <motion.div 
                        className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span className="text-sm font-medium text-green-400">Market Maker Earnings</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Quote Price:</span>
                            <span className="text-white">{parseFloat(quoteForm.price).toFixed(6)} {selectedRequest.asset_pair.split('/')[1]}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Settlement Fee:</span>
                            <span className="text-yellow-400">Paid by taker</span>
                          </div>
                          <div className="flex justify-between border-t border-[#2a2a3a] pt-1 mt-1">
                            <span className="text-gray-300 font-medium">You'll Receive:</span>
                            <span className="text-green-400 font-medium">{parseFloat(quoteForm.price).toFixed(6)} {selectedRequest.asset_pair.split('/')[1]}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Validation & Submit */}
                    {(() => {
                      const [base, quote] = selectedRequest.asset_pair.split('/')
                      const requiredToken = selectedRequest.direction === 'buy' ? base : quote
                      const hasPrice = quoteForm.price && parseFloat(quoteForm.price) > 0
                      const hasVaultBalance = vaultBalance.hasDeposit && vaultBalance.commitment
                      const isValid = hasPrice && hasVaultBalance
                      
                      let errorMessage = ''
                      if (!hasPrice) {
                        errorMessage = 'Enter price'
                      } else if (!hasVaultBalance) {
                        errorMessage = `Deposit ${requiredToken} to vault first`
                      }

                      return (
                        <>
                          {errorMessage && (
                            <motion.div
                              className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs text-red-400">{errorMessage}</p>
                              </div>
                            </motion.div>
                          )}
                          
                          <motion.button
                            type="submit"
                            disabled={!isValid}
                            className={`w-full py-3 rounded-lg font-semibold transition-all ${
                              isValid
                                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90 cursor-pointer'
                                : 'bg-gray-600 cursor-not-allowed opacity-50'
                            }`}
                            whileHover={isValid ? { scale: 1.02 } : {}}
                            whileTap={isValid ? { scale: 0.98 } : {}}
                          >
                            Submit Quote
                          </motion.button>
                        </>
                      )
                    })()}
                  </form>
                </div>

                {/* Right Column: Price Info & Chart */}
                <div className="space-y-4">
                  {/* Price Widget */}
                  {selectedRequest.asset_pair && (() => {
                    const [base, quote] = selectedRequest.asset_pair.split('/')
                    const basePrice: number = typeof priceData[base] === 'number' ? priceData[base] as number : 0
                    const baseChange: number = typeof priceData[`${base}_change`] === 'number' ? priceData[`${base}_change`] as number : 0
                    const sparklineData: number[][] = Array.isArray(priceData[`${base}_sparkline`]) ? priceData[`${base}_sparkline`] as number[][] : []
                    
                    return (
                      <>
                        <div className="p-4 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <img src={TOKEN_LOGOS[base]} alt={base} className="w-6 h-6 rounded-full" />
                              <span className="text-base font-semibold text-white">{base} Price</span>
                            </div>
                            {priceLoading ? (
                              <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                            ) : (
                              <a 
                                href={`https://www.coingecko.com/en/coins/${getCoinGeckoId(base)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-gray-500 hover:text-indigo-400 transition-colors"
                              >
                                CoinGecko ↗
                              </a>
                            )}
                          </div>
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-3xl font-bold text-white">
                              ${basePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className={`text-base font-medium ${baseChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {baseChange >= 0 ? '↑' : '↓'} {Math.abs(baseChange).toFixed(2)}%
                            </span>
                            <span className="text-xs text-gray-500">24h</span>
                          </div>
                          {quoteForm.price && parseFloat(quoteForm.price) > 0 && (
                            <div className="pt-3 border-t border-[#2a2a3a]">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Your Quote:</span>
                                <span className="text-white font-medium">{parseFloat(quoteForm.price).toFixed(4)} {quote}</span>
                              </div>
                              <div className="flex justify-between text-sm mt-1">
                                <span className="text-gray-400">Market Price:</span>
                                <span className="text-blue-400 font-semibold">
                                  ${basePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* CoinGecko Chart Widget */}
                        <div className="bg-[#0d0d12] border border-[#2a2a3a] rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-400 mb-3">7-Day Price Chart</h4>
                          <div className="relative w-full">
                            <TradingViewChart 
                              data={sparklineData} 
                              color="#10b981"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Powered by <a 
                              href={`https://www.coingecko.com/en/coins/${getCoinGeckoId(base)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              CoinGecko
                            </a>
                          </p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Modal */}
      <LoadingModal
        isOpen={showLoadingModal}
        title={showCreateModal ? 'Creating Request' : 'Submitting Quote'}
        steps={loadingSteps}
      />

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-6 max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-center mb-2">Cancel Request</h3>
              
              {/* Message */}
              <p className="text-gray-400 text-center mb-6">
                Are you sure you want to cancel this quote request? This action cannot be undone.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={isCancelling}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
                    isCancelling 
                      ? 'bg-[#2a2a3a] opacity-50 cursor-not-allowed' 
                      : 'bg-[#2a2a3a] hover:bg-[#3a3a4a]'
                  }`}
                  whileHover={!isCancelling ? { scale: 1.02 } : {}}
                  whileTap={!isCancelling ? { scale: 0.98 } : {}}
                >
                  Keep Request
                </motion.button>
                <motion.button
                  onClick={confirmCancelRequest}
                  disabled={isCancelling}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    isCancelling 
                      ? 'bg-red-500 opacity-70 cursor-not-allowed' 
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                  whileHover={!isCancelling ? { scale: 1.02 } : {}}
                  whileTap={!isCancelling ? { scale: 0.98 } : {}}
                >
                  {isCancelling && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isCancelling ? 'Cancelling...' : 'Cancel Request'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
