'use client'

import { useState, useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAccount } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { createChart, ColorType, IChartApi, AreaSeries } from 'lightweight-charts'
import LoadingModal from '@/components/ui/LoadingModal'
import { useWOTSWallet } from '@/hooks/useWOTSWallet'
import { DARK_OTC_API_URL, BACKEND_URL } from '@/lib/api'
import { TOKEN_LOGOS } from '@/lib/logos'

const API_BASE_URL = DARK_OTC_API_URL
const OBSCURA_API_URL = BACKEND_URL // Obscura-LLMS API for balance queries

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
  amount?: string  // Real amount in base units (lamports/wei) - may not be returned by backend
  stealth_address: string
  taker_public_key: string
  created_at: number
  expires_at: number
  status: string
  quote_count?: number  // Backend returns quote_count (snake_case)
}

interface Quote {
  // Backend now uses camelCase (updated API)
  quoteId?: string  // NEW camelCase format
  id?: string  // OLD snake_case format (backward compatibility)
  price?: string  // Real price (plaintext number)
  priceCommitment?: string  // Real price (plaintext) - camelCase
  price_commitment?: string  // OLD snake_case (backward compatibility)
  marketMakerPublicKey?: string  // camelCase
  market_maker_public_key?: string  // OLD snake_case (backward compatibility)
  marketMakerAddress?: string  // camelCase
  marketMakerCommitment?: string  // camelCase
  market_maker_commitment?: string  // OLD snake_case (backward compatibility)
  marketMakerNullifierHash?: string  // camelCase
  market_maker_nullifier_hash?: string  // OLD snake_case (backward compatibility)
  expiresAt?: number  // camelCase
  expires_at?: number  // OLD snake_case (backward compatibility)
  status: string
  quoteRequestId?: string  // camelCase
  quote_request_id?: string  // OLD snake_case (backward compatibility)
  createdAt?: number  // camelCase
  created_at?: number  // OLD snake_case (backward compatibility)
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
  switch (token.toUpperCase()) {
    case 'SOL':
      decimals = 9 // lamports
      break
    case 'USDC':
    case 'USDT':
      decimals = 6 // USDC/USDT use 6 decimals
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

// Helper to get real amount from localStorage (backend only returns commitment hash)
const getRequestAmount = (request: QuoteRequest): string => {
  // First try to get from request object if backend returns it
  if (request.amount) {
    return request.amount
  }

  // Fallback: Get from localStorage
  try {
    const requestAmounts = localStorage.getItem('dark_otc_request_amounts')
    if (!requestAmounts) return request.amount_commitment // Fallback to commitment (will show wrong number)

    const amounts: Record<string, string> = JSON.parse(requestAmounts)
    return amounts[request.id] || request.amount_commitment
  } catch {
    return request.amount_commitment
  }
}

// Helper to get token from asset pair based on direction
// For BUY: user wants to BUY base token, so they need to INPUT quote token (payment)
// For SELL: user wants to SELL base token, so they need to INPUT base token (what they're selling)
const getTokenForDirection = (assetPair: string, direction: 'buy' | 'sell'): string => {
  const [base, quote] = assetPair.split('/')
  // BUY SOL/USDC = Need USDC to buy SOL → return quote
  // SELL SOL/USDC = Need SOL to sell → return base
  return direction === 'buy' ? quote : base
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
          {TRADING_PAIRS.map(pair => {
            const isEnabled = pair.id === 'SOL/USDC'
            return (
              <button
                key={pair.id}
                type="button"
                onClick={() => { 
                  if (isEnabled) {
                    onChange(pair.id)
                    setOpen(false)
                  }
                }}
                disabled={!isEnabled}
                className={`w-full flex items-center gap-2 px-3 py-3 transition-colors ${
                  !isEnabled 
                    ? 'cursor-not-allowed opacity-40' 
                    : value === pair.id 
                      ? 'bg-[#252530] hover:bg-[#252530]' 
                      : 'hover:bg-[#252530]'
                }`}
              >
                <div className="flex items-center gap-1">
                  <img src={TOKEN_LOGOS[pair.base]} alt={pair.base} className="w-4 h-4 rounded-full" />
                  <span className={`text-sm font-medium ${isEnabled ? 'text-white' : 'text-gray-600'}`}>{pair.base}</span>
                </div>
                <span className={`text-sm ${isEnabled ? 'text-gray-400' : 'text-gray-700'}`}>/</span>
                <div className="flex items-center gap-1">
                  <img src={TOKEN_LOGOS[pair.quote]} alt={pair.quote} className="w-4 h-4 rounded-full" />
                  <span className={`text-sm font-medium ${isEnabled ? 'text-white' : 'text-gray-600'}`}>{pair.quote}</span>
                </div>
                {!isEnabled && (
                  <span className="ml-auto text-[10px] px-2 py-0.5 bg-gray-700/50 text-gray-500 rounded">Soon</span>
                )}
                {isEnabled && value === pair.id && (
                  <svg className="w-4 h-4 text-indigo-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )
          })}
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
  const [priceData, setPriceData] = useState<{ [key: string]: number | number[][] }>({})
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
    validHours: '24',
    selectedDepositCommitment: '' // NEW: Selected deposit for request
  })

  // NEW: Available deposits for taker (filtered by token based on direction)
  const [availableDepositsForRequest, setAvailableDepositsForRequest] = useState<Array<{
    commitment: string
    nullifierHash: string
    amount: string
    token: string
    displayAmount: string
    usedForQuoteId?: string
  }>>([])

  // Form state for Submit Quote
  const [quoteForm, setQuoteForm] = useState({
    price: '',
    validHours: '12',
    selectedDepositCommitment: '' // NEW: Selected deposit for quote
  })

  // NEW: Available deposits for market maker (filtered by token)
  const [availableDeposits, setAvailableDeposits] = useState<Array<{
    commitment: string
    nullifierHash: string
    amount: string
    token: string
    displayAmount: string
    usedForQuoteId?: string // Track if deposit is used for a quote
  }>>([])

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

  // NEW: Reload deposits whenever form changes (pair/direction) OR modal opens
  useEffect(() => {
    if (showCreateModal) {
      loadAvailableDepositsForRequest()
    }
  }, [showCreateModal, createForm.assetPair, createForm.direction])

  // NEW: Poll to check if market maker's quotes are accepted and clean up used deposits
  useEffect(() => {
    const checkUsedDeposits = async () => {
      try {
        const stored = localStorage.getItem('obscura_deposit_notes')
        if (!stored) {
          console.log('[DarkOTC Cleanup] No deposit notes found')
          return
        }

        const depositNotes = JSON.parse(stored)
        // Check for deposis used in quotes OR requests
        const usedDeposits = depositNotes.filter((note: any) => note.usedForQuoteId || note.usedForRequestId)

        if (usedDeposits.length === 0) {
          console.log('[DarkOTC Cleanup] No used deposits to check')
          return
        }

        console.log('[DarkOTC Cleanup] ========================================')
        console.log('[DarkOTC Cleanup] Checking', usedDeposits.length, 'used deposits...')
        usedDeposits.forEach((note: any, i: number) => {
          const id = note.usedForQuoteId ? `QuoteID: ${note.usedForQuoteId}` : `RequestID: ${note.usedForRequestId}`
          console.log(`[DarkOTC Cleanup] ${i + 1}. ${id}, Commitment: ${note.commitment.slice(0, 20)}...`)
        })

        // Get all requests to check quote statuses
        const requestsResponse = await fetch(`${API_BASE_URL}/api/v1/rfq/quote-requests`)
        if (!requestsResponse.ok) {
          console.error('[DarkOTC Cleanup] Failed to fetch requests:', requestsResponse.status)
          return
        }

        const requestsData = await requestsResponse.json()
        if (!requestsData.success) {
          console.error('[DarkOTC Cleanup] Requests API returned error:', requestsData.error)
          return
        }

        const allRequests = requestsData.data.quoteRequests || []
        console.log('[DarkOTC Cleanup] Found', allRequests.length, 'total requests')

        let needsUpdate = false
        const updatedNotes = await Promise.all(
          depositNotes.map(async (note: any) => {
            // Skip clean deposits
            if (!note.usedForQuoteId && !note.usedForRequestId) return note

            // CASE 1: Used for Maker Quote
            if (note.usedForQuoteId) {
              console.log(`[DarkOTC Cleanup] Checking quote ${note.usedForQuoteId}...`)

              try {
                // Find the request that has this quote
                for (const request of allRequests) {
                  const quotesResponse = await fetch(`${API_BASE_URL}/api/v1/rfq/quote-request/${request.id}/quotes`)
                  if (!quotesResponse.ok) continue

                  const quotesData = await quotesResponse.json()
                  if (!quotesData.success) continue

                  const quotes = quotesData.data.quotes || []
                  const myQuote = quotes.find((q: any) => q.id === note.usedForQuoteId)

                  if (myQuote) {
                    console.log(`[DarkOTC Cleanup] Found quote! Status: ${myQuote.status}`)

                    // CRITICAL: Check if request is filled (means quote was accepted)
                    if (request.status === 'filled') {
                      console.log('[DarkOTC Cleanup] ✅ REQUEST FILLED! Removing deposit:', {
                        quoteId: note.usedForQuoteId,
                        requestId: request.id,
                        commitment: note.commitment.slice(0, 20) + '...'
                      })
                      needsUpdate = true
                      return null // Mark for removal
                    }

                    // Check quote status
                    if (myQuote.status === 'accepted' || myQuote.status === 'filled') {
                      console.log('[DarkOTC Cleanup] ✅ Quote accepted/filled! Removing deposit:', {
                        quoteId: note.usedForQuoteId,
                        status: myQuote.status,
                        commitment: note.commitment.slice(0, 20) + '...'
                      })
                      needsUpdate = true
                      return null // Mark for removal
                    }

                    // If quote expired or cancelled, unmark the deposit (can be reused)
                    if (myQuote.status === 'expired' || myQuote.status === 'cancelled') {
                      console.log('[DarkOTC Cleanup] ⚠️ Quote expired/cancelled, unmarking deposit:', note.usedForQuoteId)
                      needsUpdate = true
                      return {
                        ...note,
                        usedForQuoteId: undefined,
                        usedAt: undefined
                      }
                    }

                    console.log('[DarkOTC Cleanup] Quote still active, keeping deposit marked')
                    break // Found the quote, no need to check other requests
                  }
                }
              } catch (error) {
                console.error('[DarkOTC Cleanup] Error checking quote:', note.usedForQuoteId, error)
              }
            }

            // CASE 2: Used for Taker Request
            if (note.usedForRequestId) {
              console.log(`[DarkOTC Cleanup] Checking request ${note.usedForRequestId}...`)
              try {
                const request = allRequests.find((r: any) => r.id === note.usedForRequestId)

                if (request) {
                  console.log(`[DarkOTC Cleanup] Found request! Status: ${request.status}`)

                  // If request filled, deposit is spent
                  if (request.status === 'filled') {
                    console.log('[DarkOTC Cleanup] ✅ REQUEST FILLED! Removing Taker deposit')
                    needsUpdate = true
                    return null
                  }

                  // If expired or cancelled, deposit is refundable/reusable
                  if (request.status === 'expired' || request.status === 'cancelled') {
                    console.log('[DarkOTC Cleanup] Request expired/cancelled, unmarking Taker deposit')
                    needsUpdate = true
                    return {
                      ...note,
                      usedForRequestId: undefined,
                      usedAt: undefined
                    }
                  }

                  console.log('[DarkOTC Cleanup] Request still active/pending, keeping deposit marked')
                } else {
                  console.log('[DarkOTC Cleanup] Request not found in list (might be old)')
                }
              } catch (error) {
                console.error('[DarkOTC Cleanup] Error checking request:', note.usedForRequestId, error)
              }
            }

            return note
          })
        )

        if (needsUpdate) {
          // Filter out null entries (removed deposits)
          const cleanedNotes = updatedNotes.filter(note => note !== null)
          const removedCount = depositNotes.length - cleanedNotes.length

          localStorage.setItem('obscura_deposit_notes', JSON.stringify(cleanedNotes))
          console.log('[DarkOTC Cleanup] ✅ UPDATED! Removed', removedCount, 'deposits')
          console.log('[DarkOTC Cleanup] Remaining deposits:', cleanedNotes.length)

          // Refresh vault balance to reflect changes
          loadVaultBalance()
        } else {
          console.log('[DarkOTC Cleanup] No changes needed')
        }

        console.log('[DarkOTC Cleanup] ========================================')
      } catch (error) {
        console.error('[DarkOTC Cleanup] Error:', error)
      }
    }

    // Check immediately on mount
    console.log('[DarkOTC Cleanup] Starting polling service...')
    checkUsedDeposits()

    // Poll every 10 seconds to check for accepted quotes
    const interval = setInterval(checkUsedDeposits, 10000)

    return () => {
      console.log('[DarkOTC Cleanup] Stopping polling service')
      clearInterval(interval)
    }
  }, [])

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

      // CRITICAL: Query backend to get list of used nullifiers from settlements
      let backendUsedNullifiers: string[] = []
      try {
        console.log('[DarkOTC] Querying backend for used nullifiers...')
        const response = await fetch(`${API_BASE_URL}/api/v1/rfq/used-nullifiers`)
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.usedNullifiers) {
            backendUsedNullifiers = result.data.usedNullifiers
            console.log('[DarkOTC] Backend reports', backendUsedNullifiers.length, 'used nullifiers')
          }
        } else {
          console.warn('[DarkOTC] Failed to fetch used nullifiers from backend:', response.status)
        }
      } catch (error) {
        console.error('[DarkOTC] Error fetching used nullifiers from backend:', error)
      }

      // CRITICAL FIX: Sort deposit notes by timestamp (newest first)
      // This ensures we select the LATEST deposit, not the first one
      const sortedNotes = [...depositNotes].sort((a: any, b: any) => {
        const timeA = a.timestamp || a.createdAt || 0
        const timeB = b.timestamp || b.createdAt || 0
        return timeB - timeA // Newest first
      })

      console.log('[DarkOTC] Sorted deposit notes (newest first):')
      sortedNotes.forEach((note: any, i: number) => {
        const time = note.timestamp || note.createdAt || 0
        console.log(`  ${i + 1}. ${note.token || 'native'} - ${new Date(time).toISOString()} - ${note.commitment?.slice(0, 16)}...`)
      })

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
      let selectedNullifierHash: string | null = null

      // Load used nullifiers from localStorage (local tracking)
      const usedNullifiers = localStorage.getItem('obscura_used_nullifiers')
      const localUsedList: string[] = usedNullifiers ? JSON.parse(usedNullifiers) : []

      // Merge local and backend used nullifiers
      const allUsedNullifiers = Array.from(new Set([...localUsedList, ...backendUsedNullifiers]))
      console.log('[DarkOTC] Total used nullifiers (local + backend):', allUsedNullifiers.length)

      // CRITICAL: Remove deposit notes with used nullifiers from localStorage
      const cleanedNotes = sortedNotes.filter((note: any) => {
        if (note.nullifierHash && allUsedNullifiers.includes(note.nullifierHash)) {
          console.log('[DarkOTC] ⚠️ Removing deposit with USED nullifier from localStorage:', {
            nullifierHash: note.nullifierHash.slice(0, 16) + '...',
            commitment: note.commitment?.slice(0, 16) + '...',
            source: backendUsedNullifiers.includes(note.nullifierHash) ? 'backend' : 'local'
          })
          return false // Remove from list
        }
        return true // Keep in list
      })

      // Save cleaned notes back to localStorage
      if (cleanedNotes.length !== sortedNotes.length) {
        localStorage.setItem('obscura_deposit_notes', JSON.stringify(cleanedNotes))
        console.log('[DarkOTC] ✅ Cleaned localStorage: removed', sortedNotes.length - cleanedNotes.length, 'used deposits')
      }

      // Query balance for each deposit note (sorted by newest first)
      for (const note of cleanedNotes) {
        try {
          const token = note.token || 'native'
          const commitment = note.commitment
          const nullifierHash = note.nullifierHash

          console.log(`[DarkOTC] Querying balance for ${token} commitment: ${commitment.slice(0, 16)}...`)

          // Query Obscura-LLMS API for vault balance (NOT Dark OTC API!)
          const response = await fetch(`${OBSCURA_API_URL}/api/v1/balance`, {
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

            // Select NEWEST available balance as primary (first in sorted list with balance > 0)
            if (!selectedCommitment && balanceNum > 0) {
              selectedCommitment = commitment
              selectedToken = token
              selectedAmount = balanceNum.toString()
              selectedNullifierHash = nullifierHash
              console.log(`[DarkOTC] ✅ Selected NEWEST deposit: ${token} ${balanceNum} (${commitment.slice(0, 16)}...)`)
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
              selectedNullifierHash = nullifierHash
              console.log(`[DarkOTC] ✅ Selected NEWEST deposit (fallback): ${token} ${amount} (${commitment.slice(0, 16)}...)`)
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
            selectedNullifierHash = note.nullifierHash
            console.log(`[DarkOTC] ✅ Selected NEWEST deposit (error fallback): ${token} ${amount} (${note.commitment.slice(0, 16)}...)`)
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
            // Backend now uses camelCase - support both formats
            const expiresAt = Number(quote.expiresAt || quote.expires_at)
            const quoteId = quote.quoteId || quote.id

            if (isNaN(expiresAt) || expiresAt <= 0) {
              console.warn('[DarkOTC] Invalid expiresAt timestamp:', expiresAt, 'for quote:', quoteId)
              return false
            }

            const isExpired = expiresAt <= Date.now()
            const isActive = !isExpired && quote.status === 'active'

            console.log('[DarkOTC] Quote filter:', {
              quoteId: quoteId,
              status: quote.status,
              expiresAt: expiresAt,
              expiresAtDate: new Date(expiresAt).toISOString(),
              now: Date.now(),
              nowDate: new Date().toISOString(),
              isExpired,
              isActive
            })

            return isActive
          } catch (error) {
            console.error('[DarkOTC] Error filtering quote:', quote.quoteId || quote.id, error)
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

  // NEW: Load available deposits for taker when creating request
  const loadAvailableDepositsForRequest = () => {
    try {
      const stored = localStorage.getItem('obscura_deposit_notes')
      const depositNotes = stored ? JSON.parse(stored) : []

      console.log('[DarkOTC] ========================================')
      console.log('[DarkOTC] Loading deposits for request...')
      console.log('[DarkOTC] Total deposit notes in localStorage:', depositNotes.length)

      if (depositNotes.length === 0) {
        console.log('[DarkOTC] No deposit notes found for request')
        console.log('[DarkOTC] ========================================')
        setAvailableDepositsForRequest([])
        return
      }

      // Log all deposits
      console.log('[DarkOTC] All deposits:')
      depositNotes.forEach((note: any, i: number) => {
        console.log(`  ${i + 1}. Token: "${note.token || 'native'}", Amount: ${note.amount}, Commitment: ${note.commitment?.slice(0, 20)}...`)
      })

      // Determine which token is needed based on direction
      // BUY SOL/USDC = Need USDC to buy SOL
      // SELL SOL/USDC = Need SOL to sell
      const requiredToken = getTokenForDirection(createForm.assetPair, createForm.direction)

      console.log('[DarkOTC] Asset Pair:', createForm.assetPair)
      console.log('[DarkOTC] Direction:', createForm.direction)
      console.log('[DarkOTC] Required Token:', requiredToken)

      // Load used nullifiers to skip them
      const usedNullifiers = localStorage.getItem('obscura_used_nullifiers')
      const usedList: string[] = usedNullifiers ? JSON.parse(usedNullifiers) : []
      console.log('[DarkOTC] Used nullifiers:', usedList.length)

      // Filter deposits by required token and exclude used ones
      const filtered = depositNotes
        .filter((note: any) => {
          const noteToken = (note.token || 'native').toLowerCase()
          const requiredTokenLower = requiredToken.toLowerCase()

          console.log(`[DarkOTC] Checking deposit: noteToken="${noteToken}", required="${requiredTokenLower}"`)

          // More flexible token matching
          let tokenMatch = false

          // Direct match
          if (noteToken === requiredTokenLower) {
            tokenMatch = true
            console.log(`  ✅ Direct match: ${noteToken} === ${requiredTokenLower}`)
          }
          // SOL variations
          else if ((noteToken === 'native' || noteToken === 'sol') && (requiredTokenLower === 'sol' || requiredTokenLower === 'native')) {
            tokenMatch = true
            console.log(`  ✅ SOL match: ${noteToken} matches ${requiredTokenLower}`)
          }
          // USDC variations
          else if (noteToken === 'usdc' && requiredTokenLower === 'usdc') {
            tokenMatch = true
            console.log(`  ✅ USDC match`)
          }
          // USDT variations
          else if (noteToken === 'usdt' && requiredTokenLower === 'usdt') {
            tokenMatch = true
            console.log(`  ✅ USDT match`)
          }
          else {
            console.log(`  ❌ No match: ${noteToken} !== ${requiredTokenLower}`)
          }

          if (!tokenMatch) return false

          // Skip if nullifier is used
          if (note.nullifierHash && usedList.includes(note.nullifierHash)) {
            console.log(`  ❌ Skipping: USED nullifier ${note.nullifierHash.slice(0, 16)}...`)
            return false
          }

          // Skip if already used for a quote
          if (note.usedForQuoteId) {
            console.log(`  ❌ Skipping: Used for quote ${note.usedForQuoteId}`)
            return false
          }

          console.log(`  ✅ PASSED all filters`)
          return true
        })
        .map((note: any) => {
          const noteToken = (note.token || 'native').toLowerCase()
          const decimals = noteToken === 'usdc' || noteToken === 'usdt' ? 6 : 9
          const amount = Number(note.amount) / Math.pow(10, decimals)
          const displayToken = noteToken === 'native' ? 'SOL' : noteToken.toUpperCase()

          return {
            commitment: note.commitment,
            nullifierHash: note.nullifierHash,
            amount: note.amount,
            token: noteToken,
            displayAmount: `${amount.toFixed(4)} ${displayToken}`,
            usedForQuoteId: note.usedForQuoteId
          }
        })

      console.log('[DarkOTC] ========================================')
      console.log('[DarkOTC] Filtered deposits for request:', filtered.length)
      if (filtered.length > 0) {
        console.log('[DarkOTC] Available deposits:')
        filtered.forEach((d: any, i: number) => {
          console.log(`  ${i + 1}. ${d.displayAmount} - ${d.commitment.slice(0, 20)}...`)
        })
      }
      console.log('[DarkOTC] ========================================')

      setAvailableDepositsForRequest(filtered)

      // Auto-select first deposit if available
      if (filtered.length > 0 && !createForm.selectedDepositCommitment) {
        const decimals = filtered[0].token === 'usdc' || filtered[0].token === 'usdt' ? 6 : 9
        const amount = Number(filtered[0].amount) / Math.pow(10, decimals)
        setCreateForm(prev => ({
          ...prev,
          selectedDepositCommitment: filtered[0].commitment,
          amount: amount.toString()
        }))
        console.log('[DarkOTC] Auto-selected first deposit:', filtered[0].displayAmount)
      }
    } catch (error) {
      console.error('[DarkOTC] Error loading deposits for request:', error)
      setAvailableDepositsForRequest([])
    }
  }

  // NEW: Load available deposits for market maker based on request direction
  const loadAvailableDepositsForQuote = (request: QuoteRequest) => {
    try {
      const stored = localStorage.getItem('obscura_deposit_notes')
      const depositNotes = stored ? JSON.parse(stored) : []

      // Determine required token based on direction
      const [base, quote] = request.asset_pair.split('/')
      // Market maker needs: base token if taker is buying, quote token if taker is selling
      const requiredToken = request.direction === 'buy' ? base : quote

      console.log('[DarkOTC] Loading deposits for market maker')
      console.log('[DarkOTC] Request direction:', request.direction)
      console.log('[DarkOTC] Required token:', requiredToken)

      // Filter deposits by required token AND exclude used deposits
      const filtered = depositNotes
        .filter((note: any) => {
          // Normalize token names for comparison
          const noteToken = note.token === 'native' ? 'SOL' : note.token.toUpperCase()
          const matches = noteToken === requiredToken.toUpperCase()

          // CRITICAL: Exclude deposits that are already used for quotes
          const isUsed = note.usedForQuoteId && note.usedForQuoteId !== ''

          if (isUsed) {
            console.log('[DarkOTC] ⚠️ Skipping used deposit:', {
              commitment: note.commitment.slice(0, 20) + '...',
              usedForQuoteId: note.usedForQuoteId
            })
          }

          console.log('[DarkOTC] Deposit check:', {
            noteToken,
            requiredToken,
            matches,
            isUsed,
            willInclude: matches && !isUsed
          })

          return matches && !isUsed
        })
        .map((note: any) => {
          // Normalize token for display
          const token = note.token === 'native' ? 'SOL' : note.token.toUpperCase()
          const displayAmount = formatAmount(note.amount, token)
          return {
            commitment: note.commitment,
            nullifierHash: note.nullifierHash,
            amount: note.amount,
            token: token,
            displayAmount: `${displayAmount} ${token}`,
            usedForQuoteId: note.usedForQuoteId
          }
        })

      console.log('[DarkOTC] Available deposits (unused):', filtered.length)
      filtered.forEach((d: { displayAmount: string }, i: number) => {
        console.log(`[DarkOTC]   ${i + 1}. ${d.displayAmount}`)
      })

      setAvailableDeposits(filtered)

      // Auto-select first deposit if available AND set price
      if (filtered.length > 0) {
        const firstDeposit = filtered[0]
        const tokenLower = firstDeposit.token.toLowerCase()
        const isStablecoin = tokenLower === 'usdc' || tokenLower === 'usdt'
        const decimals = isStablecoin ? 6 : 9
        const amount = Number(firstDeposit.amount) / Math.pow(10, decimals)
        const priceValue = amount > 0 ? amount.toString() : '0.01'

        console.log('[DarkOTC] Auto-selecting first deposit with price:', {
          deposit: firstDeposit.displayAmount,
          calculatedPrice: priceValue
        })

        setQuoteForm(prev => ({ 
          ...prev, 
          selectedDepositCommitment: firstDeposit.commitment,
          price: priceValue
        }))
      } else {
        setQuoteForm(prev => ({ 
          ...prev, 
          selectedDepositCommitment: '',
          price: ''
        }))
      }
    } catch (error) {
      console.error('[DarkOTC] Error loading deposits:', error)
      setAvailableDeposits([])
    }
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

    // Validate deposit selection
    if (!createForm.selectedDepositCommitment) {
      showModal('Error', {
        error: 'No deposit selected',
        details: 'Please select a deposit to use for this request'
      }, false)
      return
    }

    // Get selected deposit details
    const selectedDeposit = availableDepositsForRequest.find(d => d.commitment === createForm.selectedDepositCommitment)
    if (!selectedDeposit) {
      showModal('Error', {
        error: 'Selected deposit not found',
        details: 'Please try selecting a different deposit'
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

      // Step 2: Create commitment (use selected deposit's commitment)
      await new Promise(resolve => setTimeout(resolve, 500))
      const amountCommitment = selectedDeposit.commitment

      setLoadingSteps(prev => prev.map((step, i) =>
        i === 1 ? { ...step, status: 'success' } :
          i === 2 ? { ...step, status: 'loading' } : step
      ))

      // Step 3: Sign with WOTS+ (post-quantum signature)
      // Use amount from selected deposit (already in base units)
      const amountInBaseUnits = selectedDeposit.amount
      const timeout = Date.now() + (parseInt(createForm.validHours) * 3600 * 1000)

      console.log('[DarkOTC] Create request with deposit:', {
        selectedDeposit: selectedDeposit.displayAmount,
        commitment: selectedDeposit.commitment.slice(0, 20) + '...',
        amountInBaseUnits: amountInBaseUnits,
        assetPair: createForm.assetPair,
        direction: createForm.direction
      })

      // Format message according to backend expectation
      const message = `create_quote_request:${createForm.assetPair}:${createForm.direction}:${amountInBaseUnits}:${timeout}`

      // Generate unique WOTS+ signature (one-time use only!)
      const tag = `create-request-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const { signature, publicKey: wotsPublicKey } = await signWithWOTS(message, tag)

      setLoadingSteps(prev => prev.map((step, i) =>
        i === 2 ? { ...step, status: 'success' } :
          i === 3 ? { ...step, status: 'loading' } : step
      ))

      // Step 4: Submit to API
      console.log('[DarkOTC] Submitting request to backend...')

      const payload = {
        assetPair: createForm.assetPair,
        direction: createForm.direction,
        amount: amountInBaseUnits,
        timeout: timeout,
        signature: signature,
        publicKey: wotsPublicKey,
        walletAddress: publicKey?.toBase58() || evmAddress,
        message: message,
        chainId: 'solana-devnet',
        commitment: selectedDeposit.commitment, // Use selected deposit's commitment
        nullifierHash: selectedDeposit.nullifierHash // Include nullifier for tracking
      }

      console.log('[DarkOTC] Request payload:', {
        ...payload,
        signatureLength: signature.length,
        publicKeyLength: wotsPublicKey.length,
        commitment: payload.commitment.slice(0, 20) + '...'
      })

      const response = await fetch(`${API_BASE_URL}/api/v1/rfq/quote-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      console.log('[DarkOTC] Response status:', response.status)
      const result = await response.json()
      console.log('[DarkOTC] Response data:', result)

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

        // Store request amount for display
        const requestAmounts = localStorage.getItem('dark_otc_request_amounts')
        const amounts: Record<string, string> = requestAmounts ? JSON.parse(requestAmounts) : {}
        amounts[result.data.requestId] = amountInBaseUnits
        localStorage.setItem('dark_otc_request_amounts', JSON.stringify(amounts))
        console.log('[DarkOTC] Stored request amount:', { requestId: result.data.requestId, amount: amountInBaseUnits })

        // Mark deposit as used for this request
        const storedDeposits = localStorage.getItem('obscura_deposit_notes')
        const depositNotes = storedDeposits ? JSON.parse(storedDeposits) : []
        const updatedDeposits = depositNotes.map((note: any) => {
          if (note.commitment === selectedDeposit.commitment) {
            return {
              ...note,
              usedForRequestId: result.data.requestId,
              usedAt: Date.now()
            }
          }
          return note
        })
        localStorage.setItem('obscura_deposit_notes', JSON.stringify(updatedDeposits))
      } catch (err) {
        console.error('[DarkOTC] Failed to store public key:', err)
      }

      setTimeout(() => {
        setShowLoadingModal(false)
        setShowCreateModal(false)
        setCreateForm({
          assetPair: 'SOL/USDC',
          direction: 'buy',
          amount: '',
          validHours: '24',
          selectedDepositCommitment: ''
        })

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

    // STRICT VALIDATION: Market maker MUST select a deposit
    if (!quoteForm.selectedDepositCommitment) {
      const [base, quote] = selectedRequest.asset_pair.split('/')
      const requiredToken = selectedRequest.direction === 'buy' ? base : quote

      showModal('Deposit Required', {
        error: `You must deposit ${requiredToken} before submitting a quote`,
        details: selectedRequest.direction === 'buy'
          ? `Taker is buying ${base}, so you (market maker) need ${base} to sell.\n\nGo to Deposit section and deposit ${base} first.`
          : `Taker is selling ${base}, so you (market maker) need ${quote} to buy.\n\nGo to Deposit section and deposit ${quote} first.`,
        action: 'Go to Deposit Section',
        requiredToken: requiredToken
      }, false)
      return
    }

    // Get selected deposit details
    const selectedDeposit = availableDeposits.find(d => d.commitment === quoteForm.selectedDepositCommitment)
    if (!selectedDeposit) {
      showModal('Error', { error: 'Selected deposit not found. Please try again.' }, false)
      return
    }

    // Fallback: Ensure price is set from deposit if missing validation
    if (!quoteForm.price) {
      console.log('[DarkOTC] Price missing in form, deriving from selected deposit...')
      const tokenLower = selectedDeposit.token.toLowerCase()
      const isStablecoin = tokenLower === 'usdc' || tokenLower === 'usdt'
      const decimals = isStablecoin ? 6 : 9
      const amount = Number(selectedDeposit.amount) / Math.pow(10, decimals)
      setQuoteForm(prev => ({ ...prev, price: amount.toString() }))
      // Continue execution with derived price...
      // Note: state update is async, so we should use local variable if we proceed immediately
    }

    // BALANCE VALIDATION: Check if deposit amount is sufficient
    // NOTE: We can only validate if deposit token matches required token
    // For cross-token trades (e.g., USDC deposit for SOL request), we skip validation
    // because we need price to convert between tokens
    const requestAmount = parseFloat(getRequestAmount(selectedRequest))
    const depositAmount = parseFloat(selectedDeposit.amount)
    const [base, quote] = selectedRequest.asset_pair.split('/')

    // CRITICAL: Market maker needs OPPOSITE token of taker
    // Taker BUY base → Market maker SELL base (needs base token)
    // Taker SELL base → Market maker BUY base (needs quote token)
    const marketMakerNeedsToken = selectedRequest.direction === 'buy' ? base : quote

    // But request amount is always in TAKER's token
    // Taker BUY → request in quote (what taker pays)
    // Taker SELL → request in base (what taker sells)
    const requestToken = selectedRequest.direction === 'buy' ? quote : base

    const depositToken = selectedDeposit.token

    console.log('[DarkOTC] Balance validation:', {
      requestAmount,
      depositAmount,
      requestToken,
      marketMakerNeedsToken,
      depositToken,
      sameToken: depositToken.toUpperCase() === marketMakerNeedsToken.toUpperCase()
    })

    // Only validate if deposit token matches what market maker needs
    if (depositToken.toUpperCase() === marketMakerNeedsToken.toUpperCase()) {
      // For same-token validation, we need to check if amounts are comparable
      // If request is in different token, skip validation
      if (requestToken.toUpperCase() !== marketMakerNeedsToken.toUpperCase()) {
        console.log('[DarkOTC] ⚠️ Skipping validation - request in', requestToken, 'but market maker provides', marketMakerNeedsToken)
      } else if (depositAmount < requestAmount) {
        showModal('Insufficient Balance', {
          error: `Your deposit is not enough for this quote`,
          details: `Request amount: ${formatAmount(requestAmount.toString(), marketMakerNeedsToken)} ${marketMakerNeedsToken}\n` +
            `Your deposit: ${selectedDeposit.displayAmount}\n\n` +
            `You need at least ${formatAmount(requestAmount.toString(), marketMakerNeedsToken)} ${marketMakerNeedsToken} to fulfill this quote.`,
          action: 'Deposit More',
          requiredAmount: formatAmount(requestAmount.toString(), marketMakerNeedsToken),
          currentAmount: selectedDeposit.displayAmount
        }, false)
        return
      }
    } else {
      console.log('[DarkOTC] ⚠️ Skipping balance validation - different tokens (deposit:', depositToken, 'vs needed:', marketMakerNeedsToken, ')')
      console.log('[DarkOTC] Market maker will provide', depositToken, 'to', selectedRequest.direction === 'buy' ? 'sell' : 'buy', marketMakerNeedsToken)
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

      // Convert price to base units based on quote token
      const [base, quote] = selectedRequest.asset_pair.split('/')
      // Price is always in quote token (e.g., USDC for SOL/USDC)
      const priceToken = quote

      // Determine decimals based on token
      let decimals: number
      switch (priceToken.toUpperCase()) {
        case 'SOL':
          decimals = 9 // lamports
          break
        case 'USDC':
        case 'USDT':
          decimals = 6 // USDC/USDT use 6 decimals
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

      let rawPrice = quoteForm.price
      if (!rawPrice || isNaN(parseFloat(rawPrice)) || parseFloat(rawPrice) <= 0) {
        const isStable = ['usdc', 'usdt'].includes(selectedDeposit.token.toLowerCase())
        const dec = isStable ? 6 : 9
        rawPrice = (Number(selectedDeposit.amount) / Math.pow(10, dec)).toString()
      }
      const priceInBaseUnits = Math.floor(parseFloat(rawPrice) * Math.pow(10, decimals)).toString()

      console.log('[DarkOTC] Submit quote conversion:', {
        inputPrice: quoteForm.price,
        priceToken: priceToken,
        decimals: decimals,
        priceInBaseUnits: priceInBaseUnits
      })

      // Format message according to backend expectation
      const message = `submit_quote:${selectedRequest.id}:${priceInBaseUnits}:${expirationTime}`

      // Generate unique WOTS+ signature (one-time use only!)
      const tag = `submit-quote-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const { signature, publicKey: wotsPublicKey } = await signWithWOTS(message, tag)

      setLoadingSteps(prev => prev.map((step, i) =>
        i === 1 ? { ...step, status: 'success' } :
          i === 2 ? { ...step, status: 'loading' } : step
      ))

      // Step 3: Submit to API with selected deposit
      console.log('[DarkOTC] Submitting quote with selected deposit...')
      console.log('[DarkOTC] Request ID:', selectedRequest.id)
      console.log('[DarkOTC] Selected deposit:', selectedDeposit.displayAmount)
      console.log('[DarkOTC] Commitment:', selectedDeposit.commitment)
      console.log('[DarkOTC] NullifierHash:', selectedDeposit.nullifierHash)

      // Prepare payload with selected deposit
      const payload: any = {
        quoteRequestId: selectedRequest.id,
        price: priceInBaseUnits,
        expirationTime: expirationTime,
        signature: signature, // WOTS+ signature (4288 hex chars)
        publicKey: wotsPublicKey, // WOTS+ public key (4416 hex chars)
        message: message, // Include signed message for verification
        walletAddress: publicKey?.toBase58() || evmAddress, // ← REQUIRED for settlement!
        commitment: selectedDeposit.commitment, // ← From selected deposit
        nullifierHash: selectedDeposit.nullifierHash, // ← From selected deposit
        chainId: 'solana-devnet'
      }

      console.log('[DarkOTC] Payload:', {
        ...payload,
        signatureLength: signature.length,
        publicKeyLength: wotsPublicKey.length,
        hasCommitment: true,
        hasNullifierHash: true
      })

      const response = await fetch(`${API_BASE_URL}/api/v1/rfq/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      console.log('[DarkOTC] Response status:', response.status)
      const result = await response.json()
      console.log('[DarkOTC] Response data:', result)

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit quote')
      }

      setLoadingSteps(prev => prev.map(step => ({ ...step, status: 'success' })))

      // CRITICAL: Mark deposit as used to prevent double-spend
      const quoteId = result.data.quoteId
      try {
        const stored = localStorage.getItem('obscura_deposit_notes')
        const depositNotes = stored ? JSON.parse(stored) : []

        const updatedNotes = depositNotes.map((note: any) => {
          if (note.commitment === selectedDeposit.commitment) {
            console.log('[DarkOTC] ✅ Marking deposit as used for quote:', quoteId)
            return {
              ...note,
              usedForQuoteId: quoteId, // Mark as used
              usedAt: Date.now()
            }
          }
          return note
        })

        localStorage.setItem('obscura_deposit_notes', JSON.stringify(updatedNotes))
        console.log('[DarkOTC] Deposit marked as used, cannot be reused')
      } catch (error) {
        console.error('[DarkOTC] Failed to mark deposit as used:', error)
      }

      setTimeout(() => {
        setShowLoadingModal(false)
        setShowQuoteModal(false)
        setQuoteForm({ price: '', validHours: '12', selectedDepositCommitment: '' })

        showModal('Quote Submitted', {
          success: true,
          message: 'Your quote has been submitted with post-quantum security',
          quoteId: result.data.quoteId,
          requestId: selectedRequest.id,
          depositUsed: selectedDeposit.displayAmount,
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

    // DEBUG: Log all deposit notes in localStorage
    console.log('=== ACCEPT QUOTE DEBUG ===')
    console.log('[DarkOTC] Current vault balance:', vaultBalance)
    console.log('[DarkOTC] Commitment to be used:', vaultBalance.commitment)

    try {
      const stored = localStorage.getItem('obscura_deposit_notes')
      const depositNotes = stored ? JSON.parse(stored) : []
      console.log('[DarkOTC] All deposit notes in localStorage:', depositNotes.length)
      depositNotes.forEach((note: any, index: number) => {
        console.log(`[DarkOTC] Note ${index + 1}:`, {
          commitment: note.commitment?.slice(0, 20) + '...',
          nullifierHash: note.nullifierHash?.slice(0, 20) + '...',
          amount: note.amount,
          token: note.token,
          isCurrentlyUsed: note.commitment === vaultBalance.commitment
        })
      })

      // Find the note being used
      const currentNote = depositNotes.find((note: any) => note.commitment === vaultBalance.commitment)
      if (currentNote) {
        console.log('[DarkOTC] ✅ Found matching deposit note:')
        console.log('[DarkOTC]   - Commitment:', currentNote.commitment)
        console.log('[DarkOTC]   - NullifierHash:', currentNote.nullifierHash)
        console.log('[DarkOTC]   - Amount:', currentNote.amount)
        console.log('[DarkOTC]   - Token:', currentNote.token)
      } else {
        console.warn('[DarkOTC] ⚠️ No matching deposit note found for commitment:', vaultBalance.commitment)
      }
    } catch (error) {
      console.error('[DarkOTC] Error reading deposit notes:', error)
    }
    console.log('=========================')

    // STRICT CHECK: Taker MUST have deposited (blocking)
    if (!vaultBalance.hasDeposit || !vaultBalance.commitment) {
      const [base, quote_token] = selectedRequest.asset_pair.split('/')
      const requiredToken = selectedRequest.direction === 'buy' ? quote_token : base

      showModal('Deposit Required', {
        error: `You must deposit ${requiredToken} before accepting quotes`,
        details: selectedRequest.direction === 'buy'
          ? `You're buying ${base}, so you need ${quote_token} to pay for it. Go to Deposit section and deposit ${quote_token} first.`
          : `You're selling ${base}, so you need ${base} in your vault. Go to Deposit section and deposit ${base} first.`,
        action: 'Go to Deposit Section',
        requiredToken: requiredToken
      }, false)
      return
    }

    // STRICT CHECK: Market maker MUST have deposited (blocking)
    const mmCommitment = quote.marketMakerCommitment || quote.market_maker_commitment
    if (!mmCommitment) {
      const [base, quote_token] = selectedRequest.asset_pair.split('/')
      const mmRequiredToken = selectedRequest.direction === 'buy' ? base : quote_token

      showModal('Market Maker Not Ready', {
        error: 'Market maker has not deposited yet',
        details: `The market maker needs to deposit ${mmRequiredToken} before you can accept this quote. This ensures atomic settlement.\n\nPlease try another quote or wait for this market maker to deposit.`,
        action: 'Select Another Quote',
        requiredToken: mmRequiredToken
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
      const quoteId = quote.quoteId || quote.id || ''
      const message = `accept_quote:${quoteId}`

      // Generate unique WOTS+ signature (one-time use only!)
      const tag = `accept-quote-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const { signature, publicKey: wotsPublicKey } = await signWithWOTS(message, tag)

      setLoadingSteps(prev => prev.map((step, i) =>
        i === 1 ? { ...step, status: 'success' } :
          i === 2 ? { ...step, status: 'loading' } : step
      ))

      // Step 3: Submit to API
      console.log('[DarkOTC] Accepting quote...')
      console.log('[DarkOTC] Quote ID:', quoteId)
      console.log('[DarkOTC] Request ID:', selectedRequest.id)
      console.log('[DarkOTC] Vault commitment:', vaultBalance.commitment)
      console.log('[DarkOTC] Market maker commitment:', quote.marketMakerCommitment || quote.market_maker_commitment)

      // Get nullifierHash from deposit note
      let nullifierHash: string | undefined
      try {
        const stored = localStorage.getItem('obscura_deposit_notes')
        const depositNotes = stored ? JSON.parse(stored) : []
        const currentNote = depositNotes.find((note: any) => note.commitment === vaultBalance.commitment)
        if (currentNote) {
          nullifierHash = currentNote.nullifierHash
          console.log('[DarkOTC] Found nullifierHash from deposit note:', nullifierHash)
        } else {
          console.warn('[DarkOTC] No nullifierHash found for commitment!')
        }
      } catch (error) {
        console.error('[DarkOTC] Error getting nullifierHash:', error)
      }

      // CRITICAL: Validate nullifierHash exists before proceeding
      if (!nullifierHash) {
        throw new Error('Nullifier hash is required. Your deposit note may be corrupted or from an old version. Please make a new deposit.')
      }

      // CRITICAL: Check if nullifier has been used before (prevent double-spend)
      try {
        const usedNullifiers = localStorage.getItem('obscura_used_nullifiers')
        const usedList = usedNullifiers ? JSON.parse(usedNullifiers) : []

        if (usedList.includes(nullifierHash)) {
          throw new Error('This deposit has already been used for settlement. Please select a different deposit or make a new one.')
        }

        console.log('[DarkOTC] ✅ Nullifier not used before, proceeding...')
      } catch (error: any) {
        if (error.message.includes('already been used')) {
          throw error
        }
        console.warn('[DarkOTC] Could not check nullifier usage:', error)
      }

      // Get market maker's nullifierHash from the quote
      // Backend should have stored this when market maker submitted the quote
      const marketMakerNullifierHash = quote.marketMakerNullifierHash || quote.market_maker_nullifier_hash

      if (!marketMakerNullifierHash) {
        throw new Error('Market maker nullifier hash not found. The market maker needs to resubmit their quote with the latest version.')
      }

      const mmCommitment = quote.marketMakerCommitment || quote.market_maker_commitment || ''

      console.log('[DarkOTC] Payload:', {
        signature: signature.substring(0, 50) + '...',
        publicKey: wotsPublicKey.substring(0, 50) + '...',
        message: message,
        takerCommitment: vaultBalance.commitment,
        takerNullifierHash: nullifierHash,
        takerAddress: publicKey?.toBase58() || evmAddress,
        marketMakerCommitment: mmCommitment,
        marketMakerNullifierHash: marketMakerNullifierHash,
        chainId: 'solana-devnet'
      })

      const response = await fetch(`${API_BASE_URL}/api/v1/rfq/quote/${quoteId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: signature,
          publicKey: wotsPublicKey,
          message: message,
          takerCommitment: vaultBalance.commitment,
          takerNullifierHash: nullifierHash,
          takerAddress: publicKey?.toBase58() || evmAddress,
          marketMakerCommitment: mmCommitment,
          marketMakerNullifierHash: marketMakerNullifierHash,
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

        // CRITICAL: Mark nullifier as used to prevent double-spend
        if (nullifierHash) {
          try {
            const usedNullifiers = localStorage.getItem('obscura_used_nullifiers')
            const usedList = usedNullifiers ? JSON.parse(usedNullifiers) : []

            if (!usedList.includes(nullifierHash)) {
              usedList.push(nullifierHash)
              localStorage.setItem('obscura_used_nullifiers', JSON.stringify(usedList))
              console.log('[DarkOTC] ✅ Marked nullifier as used:', nullifierHash.slice(0, 20) + '...')
            }
          } catch (error) {
            console.error('[DarkOTC] Failed to mark nullifier as used:', error)
          }
        }

        // CRITICAL: Remove TAKER's deposit note after successful settlement
        try {
          const stored = localStorage.getItem('obscura_deposit_notes')
          const depositNotes = stored ? JSON.parse(stored) : []
          
          console.log('[DarkOTC Accept] Removing taker deposit note...')
          console.log('[DarkOTC Accept] Before removal:', depositNotes.length, 'deposits')
          
          // Remove the deposit note that was used for this acceptance
          const updatedNotes = depositNotes.filter((note: any) => {
            const isUsedNote = note.commitment === vaultBalance.commitment
            if (isUsedNote) {
              console.log('[DarkOTC Accept] ✅ Removing taker deposit:', {
                commitment: note.commitment.slice(0, 20) + '...',
                nullifierHash: note.nullifierHash?.slice(0, 20) + '...',
                amount: note.amount,
                token: note.token
              })
            }
            return !isUsedNote
          })
          
          localStorage.setItem('obscura_deposit_notes', JSON.stringify(updatedNotes))
          console.log('[DarkOTC Accept] After removal:', updatedNotes.length, 'deposits')
          console.log('[DarkOTC Accept] ✅ Taker deposit removed successfully')
          
          // Refresh vault balance to reflect changes
          loadVaultBalance()
        } catch (error) {
          console.error('[DarkOTC Accept] Failed to remove taker deposit note:', error)
        }

        // CRITICAL: Also remove MARKET MAKER's deposit note if we're the market maker
        // This handles the case where the same user is both taker and market maker (testing)
        try {
          const mmNullifier = quote.marketMakerNullifierHash || quote.market_maker_nullifier_hash
          if (mmNullifier) {
            const stored = localStorage.getItem('obscura_deposit_notes')
            const depositNotes = stored ? JSON.parse(stored) : []
            
            console.log('[DarkOTC Accept] Checking for market maker deposit to remove...')
            
            // Check if we have the market maker's deposit in our localStorage
            const mmDeposit = depositNotes.find((note: any) => note.nullifierHash === mmNullifier)
            
            if (mmDeposit) {
              console.log('[DarkOTC Accept] Found market maker deposit in our localStorage, removing...')
              
              const updatedNotes = depositNotes.filter((note: any) => note.nullifierHash !== mmNullifier)
              localStorage.setItem('obscura_deposit_notes', JSON.stringify(updatedNotes))
              
              console.log('[DarkOTC Accept] ✅ Market maker deposit removed:', {
                commitment: mmDeposit.commitment.slice(0, 20) + '...',
                nullifierHash: mmDeposit.nullifierHash.slice(0, 20) + '...'
              })
              
              // Mark MM nullifier as used too
              const usedNullifiers = localStorage.getItem('obscura_used_nullifiers')
              const usedList = usedNullifiers ? JSON.parse(usedNullifiers) : []
              if (!usedList.includes(mmNullifier)) {
                usedList.push(mmNullifier)
                localStorage.setItem('obscura_used_nullifiers', JSON.stringify(usedList))
                console.log('[DarkOTC Accept] ✅ Marked MM nullifier as used')
              }
              
              // Refresh vault balance again
              loadVaultBalance()
            } else {
              console.log('[DarkOTC Accept] Market maker deposit not in our localStorage (different user)')
            }
          }
        } catch (error) {
          console.error('[DarkOTC Accept] Failed to remove market maker deposit:', error)
        }

        showModal('Quote Accepted', {
          success: true,
          message: 'Quote accepted and settled with post-quantum security',
          quoteId: quoteId,
          requestId: selectedRequest.id,
          txHash: result.data.txHash,
          zkCompressed: result.data.zkCompressed,
          privacy: 'Settlement completed with stealth addresses and WOTS+ signatures'
        }, true)

        onSuccess('dark-otc-accept', quoteId)
        loadRequests()
        loadVaultBalance() // Refresh vault balance after settlement (will show 0 now)
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
      const bestPriceStr = best.price || best.priceCommitment || best.price_commitment || '0'
      const quotePriceStr = quote.price || quote.priceCommitment || quote.price_commitment || '0'
      const bestPrice = parseFloat(bestPriceStr)
      const quotePrice = parseFloat(quotePriceStr)

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

  // Fetch current prices and sparkline from Binance
  const fetchPrices = async () => {
    setPriceLoading(true)
    try {
      console.log('[Binance] Fetching prices...')

      // Binance symbol mapping
      const symbols = ['SOLUSDT', 'ETHUSDT', 'BTCUSDT']
      
      // Fetch current prices from Binance
      const pricePromises = symbols.map(async (symbol) => {
        try {
          const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
          const data = await response.json()
          return { symbol, data }
        } catch (error) {
          console.error(`[Binance] Error fetching price for ${symbol}:`, error)
          return { symbol, data: null }
        }
      })

      const priceResults = await Promise.all(pricePromises)
      
      // Fetch 7-day kline (candlestick) data for sparkline
      const sparklinePromises = symbols.map(async (symbol) => {
        try {
          console.log(`[Binance] Fetching sparkline for ${symbol}...`)
          // Get 7 days of daily klines
          const response = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=7`
          )
          const data = await response.json()
          // Convert kline data to [timestamp, price] format
          const prices = data.map((kline: any) => [kline[0], parseFloat(kline[4])]) // [timestamp, close price]
          console.log(`[Binance] Sparkline data for ${symbol}:`, prices.length, 'points')
          return { symbol, prices }
        } catch (error) {
          console.error(`[Binance] Error fetching sparkline for ${symbol}:`, error)
          return { symbol, prices: [] }
        }
      })

      const sparklineResults = await Promise.all(sparklinePromises)

      // Build price data object
      const newPriceData: any = {
        'USDC': 1,
        'USDT': 1,
      }

      priceResults.forEach(result => {
        if (result.data) {
          const token = result.symbol.replace('USDT', '')
          newPriceData[token] = parseFloat(result.data.lastPrice)
          newPriceData[`${token}_change`] = parseFloat(result.data.priceChangePercent)
        }
      })

      sparklineResults.forEach(result => {
        const token = result.symbol.replace('USDT', '')
        newPriceData[`${token}_sparkline`] = result.prices
      })

      console.log('[Binance] Final price data:', newPriceData)
      setPriceData(newPriceData)
    } catch (error) {
      console.error('[Binance] Failed to fetch prices:', error)
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

  // Get Binance symbol for token
  const getBinanceSymbol = (token: string): string => {
    const mapping: { [key: string]: string } = {
      'SOL': 'SOLUSDT',
      'ETH': 'ETHUSDT',
      'BTC': 'BTCUSDT',
      'USDC': 'USDCUSDT',
      'USDT': 'USDTUSDT'
    }
    return mapping[token] || 'SOLUSDT'
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
                  // loadAvailableDepositsForRequest() - Moved to useEffect
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
                        className={`relative p-4 rounded-lg border text-left transition-all ${selectedRequest?.id === request.id
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
                                <span className={`px-2 py-0.5 rounded text-xs ${request.direction === 'buy'
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
                                  {formatAmount(getRequestAmount(request), getTokenForDirection(request.asset_pair, request.direction))}
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
                    )
                  }
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
                          // Load available deposits for this request
                          loadAvailableDepositsForQuote(selectedRequest)
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
                      <span className={`font-medium ${selectedRequest.direction === 'buy' ? 'text-green-400' : 'text-red-400'
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
                          {formatAmount(getRequestAmount(selectedRequest), getTokenForDirection(selectedRequest.asset_pair, selectedRequest.direction))}
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

                            // Backend now returns camelCase - support both formats
                            const priceValue = quote.price || quote.priceCommitment || quote.price_commitment || '0'
                            const pricePerUnit = formatAmount(priceValue, quoteToken)

                            // Get request amount (in taker's token)
                            const requestAmount = getRequestAmount(selectedRequest)
                            const amountToken = getTokenForDirection(selectedRequest.asset_pair, selectedRequest.direction)
                            const amount = formatAmount(requestAmount, amountToken)

                            // Calculate what user will receive based on their role
                            let receiveAmount = '0.0000'
                            let receiveToken = ''

                            const isTaker = isOwnRequest(selectedRequest)

                            if (isTaker) {
                              // TAKER VIEW: User created the request, viewing market maker's quote
                              if (selectedRequest.direction === 'buy') {
                                // BUY: Taker pays USDC, receives SOL
                                receiveAmount = pricePerUnit // SOL from market maker
                                receiveToken = baseToken // SOL
                              } else {
                                // SELL: Taker pays SOL, receives USDC
                                receiveAmount = pricePerUnit // USDC from market maker
                                receiveToken = quoteToken // USDC
                              }
                            } else {
                              // MARKET MAKER VIEW: User is viewing someone else's request
                              if (selectedRequest.direction === 'buy') {
                                // Taker wants to BUY SOL: MM receives USDC, pays SOL
                                receiveAmount = amount // USDC from taker
                                receiveToken = amountToken // USDC
                              } else {
                                // Taker wants to SELL SOL: MM receives SOL, pays USDC
                                receiveAmount = amount // SOL from taker
                                receiveToken = amountToken // SOL
                              }
                            }

                            return (
                              <motion.div
                                key={quote.quoteId || quote.id}
                                className="p-4 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg hover:border-indigo-500/50 transition-colors"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                layout
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-1">
                                      {selectedRequest.direction === 'sell' ? 'Price per Unit' : 'Market Maker Offers'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={TOKEN_LOGOS[selectedRequest.direction === 'sell' ? quoteToken : baseToken]}
                                        alt=""
                                        className="w-4 h-4 rounded-full"
                                      />
                                      <p className="text-lg font-bold text-white">{pricePerUnit}</p>
                                      <span className="text-sm text-gray-400">
                                        {selectedRequest.direction === 'sell' ? quoteToken : baseToken}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                      You will receive: <span className="text-white font-medium">{receiveAmount} {receiveToken}</span>
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
                                    {isOwnRequest(selectedRequest) && (
                                      <motion.button
                                        onClick={() => handleAcceptQuote(quote)}
                                        className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 rounded text-xs font-medium transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        Accept
                                      </motion.button>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-[#2a2a3a]">
                                  <span>MM: {(quote.marketMakerPublicKey || quote.market_maker_public_key || '').slice(0, 8)}...{(quote.marketMakerPublicKey || quote.market_maker_public_key || '').slice(-6)}</span>
                                  <span>Expires {formatTimeLeft(quote.expiresAt || quote.expires_at || 0)}</span>
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
                      onChange={(value) => {
                        setCreateForm({ ...createForm, assetPair: value, selectedDepositCommitment: '', amount: '' })
                      }}
                    />

                    {/* Direction */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Direction</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCreateForm({ ...createForm, direction: 'buy', selectedDepositCommitment: '', amount: '' })
                          }}
                          className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${createForm.direction === 'buy'
                            ? 'bg-green-500 text-white'
                            : 'bg-[#0d0d12] text-gray-400 hover:text-white'
                            }`}
                        >
                          Buy
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCreateForm({ ...createForm, direction: 'sell', selectedDepositCommitment: '', amount: '' })
                          }}
                          className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${createForm.direction === 'sell'
                            ? 'bg-red-500 text-white'
                            : 'bg-[#0d0d12] text-gray-400 hover:text-white'
                            }`}
                        >
                          Sell
                        </button>
                      </div>
                    </div>

                    {/* Select Deposit & Valid Hours Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          Select Deposit
                          <span className="text-red-400 ml-1">*</span>
                        </label>
                        {availableDepositsForRequest.length > 0 ? (
                          <select
                            value={createForm.selectedDepositCommitment}
                            onChange={(e) => {
                              const selected = availableDepositsForRequest.find(d => d.commitment === e.target.value)
                              if (selected) {
                                const decimals = selected.token === 'usdc' || selected.token === 'usdt' ? 6 : 9
                                const amount = Number(selected.amount) / Math.pow(10, decimals)
                                setCreateForm({
                                  ...createForm,
                                  selectedDepositCommitment: e.target.value,
                                  amount: amount.toString()
                                })
                              }
                            }}
                            required
                            className="w-full px-3 py-2 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                          >
                            <option value="">Select a deposit...</option>
                            {availableDepositsForRequest.map((deposit, index) => (
                              <option key={deposit.commitment} value={deposit.commitment}>
                                {deposit.displayAmount} (Deposit #{index + 1})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            No deposits available
                          </div>
                        )}
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

                    {/* Show selected deposit info */}
                    {createForm.selectedDepositCommitment && (() => {
                      const selected = availableDepositsForRequest.find(d => d.commitment === createForm.selectedDepositCommitment)
                      if (!selected) return null
                      return (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-blue-400">Selected Deposit</span>
                          </div>
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Amount:</span>
                              <span className="text-white font-medium">{selected.displayAmount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Commitment:</span>
                              <span className="text-gray-300 font-mono">{selected.commitment.slice(0, 16)}...</span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {availableDepositsForRequest.length === 0 && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-sm font-medium text-yellow-400">No Deposits Available</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          You need to deposit {getTokenForDirection(createForm.assetPair, createForm.direction)} first before creating a {createForm.direction} request.
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {createForm.direction === 'buy'
                            ? `To BUY ${createForm.assetPair.split('/')[0]}, deposit ${createForm.assetPair.split('/')[1]} (payment token)`
                            : `To SELL ${createForm.assetPair.split('/')[0]}, deposit ${createForm.assetPair.split('/')[0]} (token to sell)`
                          }
                        </p>
                      </div>
                    )}

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
                      const hasDeposit = createForm.selectedDepositCommitment && availableDepositsForRequest.length > 0
                      const hasAmount = createForm.amount && parseFloat(createForm.amount) > 0
                      const isValid = hasDeposit && hasAmount

                      let errorMessage = ''
                      if (!hasDeposit) {
                        errorMessage = 'Select a deposit to use for this request'
                      } else if (!hasAmount) {
                        errorMessage = 'Invalid amount'
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
                            className={`w-full py-3 rounded-lg font-semibold transition-all ${isValid
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
                                href={`https://www.binance.com/en/trade/${getBinanceSymbol(base)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-gray-500 hover:text-indigo-400 transition-colors"
                              >
                                Binance ↗
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
                                <span className="text-white font-medium">
                                  {parseFloat(createForm.amount).toFixed(4)} {
                                    // Display token based on direction:
                                    // BUY: User pays with quote token (USDC)
                                    // SELL: User pays with base token (SOL)
                                    createForm.direction === 'buy' ? quote : base
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between text-sm mt-1">
                                <span className="text-gray-400">Estimated Value:</span>
                                <span className="text-green-400 font-semibold">
                                  {createForm.direction === 'buy' ? (
                                    // BUY: Show how much base token (SOL) user will get
                                    // Amount in USDC / SOL price = SOL amount
                                    <>~{(parseFloat(createForm.amount) / basePrice).toFixed(6)} {base}</>
                                  ) : (
                                    // SELL: Show USD value of base token (SOL) being sold
                                    // Amount in SOL * SOL price = USD value
                                    <>${(parseFloat(createForm.amount) * basePrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                                  )}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Binance Chart Widget */}
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
                              href={`https://www.binance.com/en/trade/${getBinanceSymbol(base)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              Binance
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
                    {/* Price Selection - Based on Deposit */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Select Price from Deposit</label>
                      {availableDeposits.length > 0 ? (
                        <select
                          value={quoteForm.selectedDepositCommitment}
                          onChange={(e) => {
                            const commitment = e.target.value
                            console.log('[DarkOTC Quote] Deposit selected:', commitment)
                            
                            const deposit = availableDeposits.find(d => d.commitment === commitment)
                            if (deposit) {
                              const tokenLower = deposit.token.toLowerCase()
                              const isStablecoin = tokenLower === 'usdc' || tokenLower === 'usdt'
                              const decimals = isStablecoin ? 6 : 9
                              const amount = Number(deposit.amount) / Math.pow(10, decimals)

                              console.log('[DarkOTC Quote] Calculated price:', {
                                token: deposit.token,
                                rawAmount: deposit.amount,
                                decimals,
                                calculatedAmount: amount,
                                isValid: amount > 0
                              })

                              // CRITICAL FIX: Ensure price is always valid
                              const priceValue = amount > 0 ? amount.toString() : '0.01'

                              setQuoteForm({
                                ...quoteForm,
                                selectedDepositCommitment: commitment,
                                price: priceValue
                              })

                              console.log('[DarkOTC Quote] Form updated with price:', priceValue)
                            } else {
                              // Reset if empty selection
                              console.log('[DarkOTC Quote] No deposit found, resetting form')
                              setQuoteForm({
                                ...quoteForm,
                                selectedDepositCommitment: '',
                                price: ''
                              })
                            }
                          }}
                          required
                          className="w-full px-4 py-3 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="">Select amount...</option>
                          {availableDeposits.map((deposit, index) => {
                            // Handle native token as SOL
                            const tokenLower = deposit.token.toLowerCase()
                            const isStablecoin = tokenLower === 'usdc' || tokenLower === 'usdt'
                            const decimals = isStablecoin ? 6 : 9
                            const amount = Number(deposit.amount) / Math.pow(10, decimals)
                            // Display token properly (native → SOL)
                            const displayToken = tokenLower === 'native' ? 'SOL' : deposit.token.toUpperCase()
                            return (
                              <option key={`price-${deposit.commitment}`} value={deposit.commitment}>
                                {amount.toFixed(6)} {displayToken} (Deposit #{index + 1})
                              </option>
                            )
                          })}
                        </select>
                      ) : (
                        <div className="w-full px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                          No deposits available - deposit first to set price
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Price is based on your deposit amount</p>
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
                            <span className="font-medium flex items-center gap-1">
                              {(() => {
                                // Get request amount (in base units like lamports/wei)
                                const requestAmount = getRequestAmount(selectedRequest)
                                
                                // Market maker receives the request amount in the appropriate token:
                                // - If taker BUYs base token (SOL) → MM receives quote token (USDC) = request amount
                                // - If taker SELLs base token (SOL) → MM receives base token (SOL) = request amount
                                const receivingToken = selectedRequest.direction === 'buy' 
                                  ? selectedRequest.asset_pair.split('/')[1]  // Quote token (USDC)
                                  : selectedRequest.asset_pair.split('/')[0]  // Base token (SOL)
                                
                                // Format the amount with correct token decimals
                                const amount = formatAmount(requestAmount, receivingToken)
                                
                                // Calculate profit/loss percentage
                                const [base, quote] = selectedRequest.asset_pair.split('/')
                                const currentMarketPrice: number = typeof priceData[base] === 'number' ? priceData[base] as number : 0
                                const quotePrice = parseFloat(quoteForm.price)
                                
                                let profitLossPercent = 0
                                let isProfitable = false
                                
                                if (currentMarketPrice > 0 && quotePrice > 0) {
                                  // Calculate profit/loss based on direction
                                  if (selectedRequest.direction === 'buy') {
                                    // Taker BUYs SOL at quote price, MM receives USDC
                                    // MM is profitable if quote price > market price (taker pays more)
                                    profitLossPercent = ((quotePrice - currentMarketPrice) / currentMarketPrice) * 100
                                    isProfitable = quotePrice > currentMarketPrice
                                  } else {
                                    // Taker SELLs SOL at quote price, MM receives SOL
                                    // MM is profitable if quote price < market price (MM buys cheaper)
                                    profitLossPercent = ((currentMarketPrice - quotePrice) / currentMarketPrice) * 100
                                    isProfitable = quotePrice < currentMarketPrice
                                  }
                                }
                                
                                const profitLossColor = isProfitable ? 'text-green-400' : 'text-red-400'
                                const profitLossLabel = isProfitable ? 'Profit' : 'Loss'
                                const absPercent = Math.abs(profitLossPercent).toFixed(2)
                                
                                return (
                                  <>
                                    <span className={profitLossColor}>
                                      {amount} {receivingToken}
                                    </span>
                                    {currentMarketPrice > 0 && (
                                      <span className={`text-[10px] ${profitLossColor}`}>
                                        ({profitLossLabel} {absPercent}%)
                                      </span>
                                    )}
                                  </>
                                )
                              })()}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Validation & Submit */}
                    {(() => {
                      const hasPrice = quoteForm.price && parseFloat(quoteForm.price) > 0
                      const hasDeposit = quoteForm.selectedDepositCommitment !== ''
                      const isValid = hasPrice && hasDeposit

                      console.log('[DarkOTC Quote Validation]', {
                        price: quoteForm.price,
                        parsedPrice: parseFloat(quoteForm.price),
                        hasPrice,
                        hasDeposit,
                        isValid,
                        selectedCommitment: quoteForm.selectedDepositCommitment
                      })

                      let errorMessage = ''
                      if (!hasDeposit) {
                        errorMessage = 'Select a deposit first'
                      } else if (!hasPrice) {
                        errorMessage = 'Enter price'
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
                            className={`w-full py-3 rounded-lg font-semibold transition-all ${isValid
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
                                href={`https://www.binance.com/en/trade/${getBinanceSymbol(base)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-gray-500 hover:text-indigo-400 transition-colors"
                              >
                                Binance ↗
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

                        {/* Binance Chart Widget */}
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
                              href={`https://www.binance.com/en/trade/${getBinanceSymbol(base)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              Binance
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
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${isCancelling
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
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${isCancelling
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
