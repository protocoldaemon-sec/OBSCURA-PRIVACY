'use client'

import { useState, useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAccount } from 'wagmi'
import { parseEther } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  generateDepositNote, 
  saveDepositNote, 
  getDepositNotes,
  removeDepositNote,
  submitWithdrawal,
  CONTRACTS,
  DepositNote 
} from '@/lib/api'
import { CHAIN_LOGOS, TOKEN_LOGOS } from '@/lib/logos'
import LoadingModal from '@/components/ui/LoadingModal'

interface Props {
  onSuccess: (type: string, id: string) => void
  showModal: (title: string, result: any, isSuccess: boolean) => void
  requireWalletConnection: () => boolean
}

const TOKENS: Record<string, { value: string; label: string; logo: string }[]> = {
  'solana-devnet': [
    { value: 'native', label: 'SOL', logo: 'SOL' },
    { value: 'usdc', label: 'USDC', logo: 'USDC' },
    { value: 'usdt', label: 'USDT', logo: 'USDT' }
  ],
  'sepolia': [
    { value: 'native', label: 'ETH', logo: 'ETH' },
    { value: 'usdc', label: 'USDC', logo: 'USDC' },
    { value: 'usdt', label: 'USDT', logo: 'USDT' }
  ]
}

// Token mint addresses for Solana Devnet
// Note: There are multiple USDC mints on devnet, we'll try the most common ones
const SOLANA_TOKEN_MINTS: Record<string, string[]> = {
  'usdc': [
    '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Official USDC Devnet
    'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr', // Circle USDC Devnet
    'CpMah17kQEL2wqyMKt3mZBdTnZbkbfx4nqmQMFDP5vwp'  // SPL Token Faucet USDC
  ],
  'usdt': [
    'EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS'  // USDT Devnet
  ]
}

// Token decimals
const TOKEN_DECIMALS: Record<string, number> = {
  'native': 9,  // SOL
  'usdc': 6,    // USDC
  'usdt': 6,    // USDT
  'eth': 18     // ETH
}

const NETWORKS = [
  { id: 'solana-devnet', label: 'Solana Devnet', logo: 'solana' },
  { id: 'sepolia', label: 'Sepolia (ETH)', logo: 'ethereum' }
]

// Minimum deposit amount (same for SOL and ETH)
const MIN_DEPOSIT = 0.0003

// Custom Network Select
function NetworkSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = NETWORKS.find(n => n.id === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm text-gray-400 mb-2">Network</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg text-white hover:border-[#3a3a4a] transition-colors"
      >
        <img src={CHAIN_LOGOS[selected?.logo || 'ethereum']} alt={value} className="w-5 h-5 rounded-full" />
        <span className="flex-1 text-left">{selected?.label}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg shadow-xl z-[100] overflow-hidden">
          {NETWORKS.map(n => (
            <button
              key={n.id}
              type="button"
              onClick={() => { onChange(n.id); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#252530] transition-colors ${value === n.id ? 'bg-[#252530]' : ''}`}
            >
              <img src={CHAIN_LOGOS[n.logo]} alt={n.id} className="w-5 h-5 rounded-full" />
              <span className="text-white">{n.label}</span>
              {value === n.id && (
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

// Custom Token Select
function TokenSelect({ 
  value, 
  onChange, 
  tokens 
}: { 
  value: string
  onChange: (v: string) => void
  tokens: { value: string; label: string; logo: string }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = tokens.find(t => t.value === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm text-gray-400 mb-2">Token</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg text-white hover:border-[#3a3a4a] transition-colors"
      >
        <img src={TOKEN_LOGOS[selected?.logo || 'ETH']} alt={selected?.label} className="w-5 h-5 rounded-full" />
        <span className="flex-1 text-left">{selected?.label}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg shadow-xl z-[100] overflow-hidden">
          {tokens.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => { onChange(t.value); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#252530] transition-colors ${value === t.value ? 'bg-[#252530]' : ''}`}
            >
              <img src={TOKEN_LOGOS[t.logo]} alt={t.label} className="w-5 h-5 rounded-full" />
              <span className="text-white">{t.label}</span>
              {value === t.value && (
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

interface ScanResult {
  success: boolean
  data?: {
    address: string
    chain: string
    entity: string | null
    riskScore: number
    riskLevel: 'NO_RISK' | 'INFORMATIONAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    riskLevelDescription: string
    sanctions: {
      isSanctioned: boolean
      programs: string[]
      matchedEntities: any[]
    }
    labels: {
      categories: string[]
      attributes: string[]
      riskIndicators: string[]
    }
  }
  error?: {
    code: string
    message: string
  }
}

type ScanStatus = 'idle' | 'scanning' | 'safe' | 'risky' | 'error'

export default function DepositSection({ onSuccess, showModal, requireWalletConnection }: Props) {
  // Solana wallet
  const { publicKey, sendTransaction } = useWallet()
  
  // EVM wallet
  const { address: evmAddress, isConnected: evmConnected } = useAccount()
  
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [network, setNetwork] = useState('solana-devnet')
  const [token, setToken] = useState('native')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [depositNotes, setDepositNotes] = useState<DepositNote[]>([])
  const [selectedNote, setSelectedNote] = useState<DepositNote | null>(null)
  const [withdrawRecipient, setWithdrawRecipient] = useState('')
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [fetchingBalance, setFetchingBalance] = useState(false)
  
  // Daemon scan state
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [showRiskConfirm, setShowRiskConfirm] = useState(false)
  
  // Loading modal state
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [loadingSteps, setLoadingSteps] = useState<Array<{
    label: string
    status: 'pending' | 'loading' | 'success' | 'error'
    description?: string
  }>>([])

  // Fetch wallet balance
  const fetchBalance = async () => {
    setFetchingBalance(true)
    try {
      if (network === 'solana-devnet' && publicKey) {
        const { Connection, LAMPORTS_PER_SOL, PublicKey } = await import('@solana/web3.js')
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
        
        if (token === 'native') {
          // Fetch native SOL balance
          const balance = await connection.getBalance(publicKey)
          setWalletBalance(balance / LAMPORTS_PER_SOL)
        } else {
          // Fetch SPL token balance (USDC/USDT)
          // Try multiple mint addresses since devnet has multiple USDC mints
          const { getAssociatedTokenAddress, getAccount } = await import('@solana/spl-token')
          const mintAddresses = SOLANA_TOKEN_MINTS[token]
          let totalBalance = 0
          
          console.log(`[Balance] ========================================`)
          console.log(`[Balance] Fetching ${token.toUpperCase()} balance...`)
          console.log(`[Balance] User wallet: ${publicKey.toBase58()}`)
          console.log(`[Balance] Trying ${mintAddresses.length} mint addresses...`)
          
          for (const mintStr of mintAddresses) {
            try {
              const mintAddress = new PublicKey(mintStr)
              console.log(`[Balance] ----------------------------------------`)
              console.log(`[Balance] Trying mint: ${mintAddress.toBase58()}`)
              
              const tokenAccount = await getAssociatedTokenAddress(mintAddress, publicKey)
              console.log(`[Balance] Expected token account: ${tokenAccount.toBase58()}`)
              
              const accountInfo = await getAccount(connection, tokenAccount)
              const amount = Number(accountInfo.amount)
              const decimals = TOKEN_DECIMALS[token]
              const balance = amount / Math.pow(10, decimals)
              
              console.log(`[Balance] Raw amount: ${amount}`)
              console.log(`[Balance] Decimals: ${decimals}`)
              console.log(`[Balance] Calculated balance: ${balance}`)
              console.log(`[Balance] Account owner: ${accountInfo.owner.toBase58()}`)
              
              if (amount > 0) {
                console.log(`[Balance] ✅ Found ${balance} ${token.toUpperCase()} at mint ${mintAddress.toBase58()}`)
                totalBalance += balance
              } else {
                console.log(`[Balance] ⚠️ Account exists but balance is 0`)
              }
            } catch (error: any) {
              console.log(`[Balance] ❌ Error at mint ${mintStr}:`, error.message)
            }
          }
          
          console.log(`[Balance] ========================================`)
          console.log(`[Balance] FINAL Total ${token.toUpperCase()} balance: ${totalBalance}`)
          console.log(`[Balance] ========================================`)
          setWalletBalance(totalBalance)
        }
      } else if (network === 'sepolia' && evmAddress) {
        // Fetch ETH balance using viem
        const { createPublicClient, http, formatEther } = await import('viem')
        const { sepolia } = await import('viem/chains')
        const client = createPublicClient({ chain: sepolia, transport: http('https://rpc.sepolia.org') })
        
        if (token === 'native') {
          const balance = await client.getBalance({ address: evmAddress })
          setWalletBalance(parseFloat(formatEther(balance)))
        } else {
          // TODO: Fetch ERC20 token balance for USDC/USDT on Sepolia
          setWalletBalance(0)
        }
      } else {
        setWalletBalance(0)
      }
    } catch (error) {
      console.error('[Balance] CRITICAL ERROR:', error)
      setWalletBalance(0)
    } finally {
      setFetchingBalance(false)
    }
  }

  // Fetch balance when wallet, network, or token changes
  useEffect(() => {
    if (publicKey) {
      console.log(`[Wallet] Connected Solana wallet: ${publicKey.toBase58()}`)
    }
    if (evmAddress) {
      console.log(`[Wallet] Connected EVM wallet: ${evmAddress}`)
    }
    fetchBalance()
    const interval = setInterval(fetchBalance, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [publicKey, evmAddress, network, token]) // ← Added token dependency

  // Load deposit notes on mount
  useEffect(() => {
    setDepositNotes(getDepositNotes())
  }, [])

  const handleNetworkChange = (newNetwork: string) => {
    setNetwork(newNetwork)
    setToken('native')
  }

  // Scan wallet using Daemon Engine (Cyclops API)
  const scanWallet = async (address: string): Promise<ScanResult> => {
    const response = await fetch('https://cyclops-api.daemonprotocol.com/api/v1/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: address, maxDepth: 1 })
    })
    return response.json()
  }

  // Check if risk level is concerning
  const isRisky = (riskLevel: string): boolean => {
    return ['MEDIUM', 'HIGH', 'CRITICAL'].includes(riskLevel)
  }

  // Get risk level color
  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'NO_RISK': return 'text-green-400'
      case 'INFORMATIONAL': return 'text-blue-400'
      case 'LOW': return 'text-yellow-400'
      case 'MEDIUM': return 'text-orange-400'
      case 'HIGH': return 'text-red-400'
      case 'CRITICAL': return 'text-red-600'
      default: return 'text-gray-400'
    }
  }

  // Get risk level background
  const getRiskBg = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'NO_RISK': return 'bg-green-500/10 border-green-500/30'
      case 'INFORMATIONAL': return 'bg-blue-500/10 border-blue-500/30'
      case 'LOW': return 'bg-yellow-500/10 border-yellow-500/30'
      case 'MEDIUM': return 'bg-orange-500/10 border-orange-500/30'
      case 'HIGH': return 'bg-red-500/10 border-red-500/30'
      case 'CRITICAL': return 'bg-red-600/20 border-red-600/50'
      default: return 'bg-gray-500/10 border-gray-500/30'
    }
  }

  // Check if amount exceeds balance
  const amountExceedsBalance = amount && parseFloat(amount) > walletBalance
  
  // Check if amount is below minimum
  const amountBelowMinimum = !!(amount && parseFloat(amount) > 0 && parseFloat(amount) < MIN_DEPOSIT)
  
  // Set max amount
  const setMaxAmount = () => {
    if (walletBalance > 0) {
      // Leave some for gas fees
      const maxAmount = network === 'solana-devnet' 
        ? Math.max(0, walletBalance - 0.001) // Reserve 0.001 SOL for fees
        : Math.max(0, walletBalance - 0.0001) // Reserve 0.0001 ETH for fees
      setAmount(maxAmount.toFixed(6))
    }
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check wallet connection first
    if (!requireWalletConnection()) {
      return
    }
    
    // Check minimum deposit
    if (parseFloat(amount) < MIN_DEPOSIT) {
      showModal('Error', { 
        error: 'Amount too low',
        details: `Minimum deposit is ${MIN_DEPOSIT} ${network === 'solana-devnet' ? 'SOL' : 'ETH'}`
      }, false)
      return
    }
    
    // Check wallet connection based on network
    if (network === 'solana-devnet' && (!publicKey || !sendTransaction)) {
      showModal('Error', { error: 'Please connect your Solana wallet first' }, false)
      return
    }
    if (network === 'sepolia' && !evmConnected) {
      showModal('Error', { error: 'Please connect MetaMask first' }, false)
      return
    }

    setLoading(true)
    setShowLoadingModal(true)
    setLoadingSteps([
      { label: 'Generating deposit note', status: 'loading', description: 'Creating secure commitment...' },
      { label: 'Preparing transaction', status: 'pending', description: 'Building transaction...' },
      { label: 'Approve & send', status: 'pending', description: 'Please approve in your wallet' },
      { label: 'Confirming on-chain', status: 'pending', description: 'Waiting for confirmation...' },
    ])
    
    try {
      // Step 1: Generate deposit note (add small delay so user can see step 1)
      await new Promise(resolve => setTimeout(resolve, 500))
      const depositNote = generateDepositNote(amount, network, token)
      
      // Step 1 complete, move to step 2
      setLoadingSteps(prev => prev.map((step, i) => 
        i === 0 ? { ...step, status: 'success' } :
        i === 1 ? { ...step, status: 'loading' } : step
      ))
      
      let txHash = ''
      
      // Step 2-4: Execute on-chain deposit
      if (network === 'solana-devnet' && publicKey) {
        const { 
          Connection, 
          Transaction, 
          SystemProgram, 
          PublicKey, 
          LAMPORTS_PER_SOL,
          ComputeBudgetProgram 
        } = await import('@solana/web3.js')
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
        
        const vaultPubkey = new PublicKey(CONTRACTS.solana.vaultPDA)
        const decimals = TOKEN_DECIMALS[token]
        const baseAmount = Math.floor(parseFloat(amount) * Math.pow(10, decimals))
        
        const transaction = new Transaction()
        transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }))
        
        if (token === 'native') {
          // Native SOL transfer
          const balance = await connection.getBalance(publicKey)
          if (balance < baseAmount + 5000) {
            throw new Error(`Insufficient balance. You have ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL but need ${(baseAmount / LAMPORTS_PER_SOL).toFixed(6)} SOL + fees`)
          }
          
          transaction.add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: vaultPubkey,
              lamports: baseAmount,
            })
          )
        } else {
          // SPL token transfer (USDC/USDT)
          const { 
            createTransferInstruction, 
            getAssociatedTokenAddress,
            createAssociatedTokenAccountInstruction,
            getAccount
          } = await import('@solana/spl-token')
          
          // Find which mint address has balance
          const mintAddresses = SOLANA_TOKEN_MINTS[token]
          let selectedMint: any = null
          let fromTokenAccount: any = null
          let userBalance = 0
          
          console.log(`[Deposit] ========================================`)
          console.log(`[Deposit] Starting SPL token deposit...`)
          console.log(`[Deposit] User wallet: ${publicKey.toBase58()}`)
          
          for (const mintStr of mintAddresses) {
            try {
              const mintAddress = new PublicKey(mintStr)
              const tokenAccount = await getAssociatedTokenAddress(mintAddress, publicKey)
              console.log(`[Deposit] Checking mint: ${mintAddress.toBase58()}`)
              console.log(`[Deposit] User token account: ${tokenAccount.toBase58()}`)
              
              const accountInfo = await getAccount(connection, tokenAccount)
              const amount = Number(accountInfo.amount)
              
              console.log(`[Deposit] Balance at this mint: ${amount}`)
              
              if (amount > 0) {
                selectedMint = mintAddress
                fromTokenAccount = tokenAccount
                userBalance = amount
                console.log(`[Deposit] ✅ Selected mint: ${mintAddress.toBase58()} with balance: ${amount}`)
                break
              }
            } catch (error: any) {
              console.log(`[Deposit] ❌ No account at mint ${mintStr}: ${error.message}`)
              continue
            }
          }
          
          if (!selectedMint || !fromTokenAccount) {
            throw new Error(`You don't have any ${token.toUpperCase()} tokens. Please get some ${token.toUpperCase()} from a faucet first.`)
          }
          
          if (userBalance === 0) {
            throw new Error(`You don't have any ${token.toUpperCase()} tokens. Please get some ${token.toUpperCase()} from a faucet first.`)
          }
          
          if (userBalance < baseAmount) {
            const decimals = TOKEN_DECIMALS[token]
            throw new Error(`Insufficient ${token.toUpperCase()} balance. You have ${(userBalance / Math.pow(10, decimals)).toFixed(2)} ${token.toUpperCase()} but need ${parseFloat(amount).toFixed(2)} ${token.toUpperCase()}`)
          }
          
          console.log(`[Deposit] Getting vault token account...`)
          console.log(`[Deposit] Vault PDA: ${vaultPubkey.toBase58()}`)
          
          // For vault PDA, we need to derive the associated token account
          // But vault PDA might be off-curve, so we need to handle this carefully
          let toTokenAccount: any
          
          try {
            // Try to get the associated token account for the vault
            // This might fail if vault is a PDA
            toTokenAccount = await getAssociatedTokenAddress(
              selectedMint,
              vaultPubkey,
              true // allowOwnerOffCurve = true for PDAs
            )
            console.log(`[Deposit] Vault token account (with allowOwnerOffCurve): ${toTokenAccount.toBase58()}`)
          } catch (error: any) {
            console.log(`[Deposit] ❌ Failed to get vault token account: ${error.message}`)
            throw new Error(`Cannot create token account for vault PDA. The vault may not support SPL tokens yet. Please contact support.`)
          }
          
          // Check if vault token account exists, if not create it
          const toAccountInfo = await connection.getAccountInfo(toTokenAccount)
          console.log(`[Deposit] Vault token account exists: ${!!toAccountInfo}`)
          
          if (!toAccountInfo) {
            console.log(`[Deposit] Creating vault token account...`)
            transaction.add(
              createAssociatedTokenAccountInstruction(
                publicKey, // payer
                toTokenAccount, // associated token account
                vaultPubkey, // owner (vault PDA)
                selectedMint // mint
              )
            )
          }
          
          // Add transfer instruction
          console.log(`[Deposit] Adding transfer instruction...`)
          console.log(`[Deposit] From: ${fromTokenAccount.toBase58()}`)
          console.log(`[Deposit] To: ${toTokenAccount.toBase58()}`)
          console.log(`[Deposit] Amount: ${baseAmount}`)
          
          transaction.add(
            createTransferInstruction(
              fromTokenAccount,
              toTokenAccount,
              publicKey,
              baseAmount
            )
          )
          
          console.log(`[Deposit] ========================================`)
        }
        
        // Step 2 complete: Transaction prepared
        setLoadingSteps(prev => prev.map((step, i) => 
          i === 1 ? { ...step, status: 'success' } :
          i === 2 ? { ...step, status: 'loading' } : step
        ))
        
        // Step 3: Wallet approval + send (this waits for user to approve)
        const signature = await sendTransaction(transaction, connection, {
          skipPreflight: true,
          maxRetries: 3,
        })
        
        // Small delay so user can see step 3 complete
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Step 3 complete, Step 4: Confirming
        setLoadingSteps(prev => prev.map((step, i) => 
          i === 2 ? { ...step, status: 'success' } :
          i === 3 ? { ...step, status: 'loading' } : step
        ))
        
        const latestBlockhash = await connection.getLatestBlockhash('confirmed')
        await connection.confirmTransaction({
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        }, 'confirmed')
        
        txHash = signature
        
      } else if (network === 'sepolia' && evmAddress) {
        // Use window.ethereum directly for simpler flow
        const { createWalletClient, createPublicClient, custom, http } = await import('viem')
        const { sepolia } = await import('viem/chains')
        
        const walletClient = createWalletClient({
          chain: sepolia,
          transport: custom((window as any).ethereum)
        })
        
        const publicClient = createPublicClient({
          chain: sepolia,
          transport: http('https://rpc.sepolia.org')
        })
        
        // Step 2 complete: Transaction prepared
        setLoadingSteps(prev => prev.map((step, i) => 
          i === 1 ? { ...step, status: 'success' } :
          i === 2 ? { ...step, status: 'loading' } : step
        ))
        
        // Step 3: Wallet approval + send (this waits for user to approve)
        const hash = await walletClient.sendTransaction({
          account: evmAddress,
          to: CONTRACTS.sepolia.vault as `0x${string}`,
          value: parseEther(amount),
        })
        
        // Small delay so user can see step 3 complete
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Step 3 complete, Step 4: Confirming
        setLoadingSteps(prev => prev.map((step, i) => 
          i === 2 ? { ...step, status: 'success' } :
          i === 3 ? { ...step, status: 'loading' } : step
        ))
        
        // Wait for confirmation
        await publicClient.waitForTransactionReceipt({ hash })
        
        txHash = hash
      }

      // All steps complete
      setLoadingSteps(prev => prev.map(step => ({ ...step, status: 'success' })))
      
      // Register deposit with backend (for cSPL balance tracking)
      depositNote.txHash = txHash
      try {
        const { BACKEND_URL } = await import('@/lib/api')
        
        // Map network to proper chain name
        const chainName = network === 'solana-devnet' ? 'solana' : 
                         network === 'sepolia' ? 'ethereum' : network
        
        const backendResponse = await fetch(`${BACKEND_URL}/api/v1/deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            network: chainName, // Send proper chain name
            token,
            amount,
            commitment: depositNote.commitment,
            txHash,
            depositor: network === 'solana-devnet' ? publicKey?.toBase58() : evmAddress,
            signature: 'client-signed'
          })
        })
        
        const backendResult = await backendResponse.json()
        
        if (!backendResult.success) {
          console.warn('[Deposit] Backend registration failed (non-critical):', backendResult.error)
        } else if (backendResult.commitment) {
          // Update deposit note with backend commitment (SIP-generated)
          depositNote.commitment = backendResult.commitment
        }
      } catch (err) {
        console.warn('[Deposit] Backend registration failed (non-critical):', err)
      }
      
      // Save deposit note locally (with backend commitment if available)
      saveDepositNote(depositNote)
      setDepositNotes(getDepositNotes())

      // Close loading modal after short delay
      setTimeout(() => {
        setShowLoadingModal(false)
        
        // Show success modal with correct token display
        const tokenLabel = TOKENS[network].find(t => t.value === token)?.label || token.toUpperCase()
        showModal('Deposit Successful', {
          success: true,
          message: 'Funds deposited to vault! Deposit note saved locally.',
          commitment: depositNote.commitment,
          txHash: depositNote.txHash,
          network,
          amount: `${amount} ${tokenLabel}`,
          token: tokenLabel,
          warning: '⚠️ Your nullifier and secret are stored locally. Do not clear browser data!',
          explorer: network === 'solana-devnet' 
            ? `https://explorer.solana.com/tx/${depositNote.txHash}?cluster=devnet`
            : `https://sepolia.etherscan.io/tx/${depositNote.txHash}`
        }, true)
        
        onSuccess('deposit', depositNote.commitment)
        setAmount('')
      }, 1000)
      
    } catch (err: any) {
      console.error('[Deposit] Error:', err)
      
      // Mark current step as error
      setLoadingSteps(prev => prev.map(step => 
        step.status === 'loading' ? { ...step, status: 'error' } : step
      ))
      
      setTimeout(() => {
        setShowLoadingModal(false)
        
        let errorMessage = err.message || 'Transaction failed'
        let errorDetails = 'Make sure you have enough balance for the deposit + gas fees'
        
        if (err.name === 'WalletSendTransactionError') {
          errorMessage = 'Transaction rejected or failed'
          errorDetails = 'Please check: 1) You have enough SOL for deposit + fees (~0.000005 SOL), 2) You approved the transaction in your wallet'
        } else if (err.message?.includes('User rejected')) {
          errorMessage = 'Transaction cancelled'
          errorDetails = 'You rejected the transaction in your wallet'
        } else if (err.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient balance'
          errorDetails = `You need at least ${amount} SOL + gas fees (~0.000005 SOL)`
        }
        
        showModal('Deposit Error', { 
          error: errorMessage,
          details: errorDetails
        }, false)
      }, 1000)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check wallet connection first
    if (!requireWalletConnection()) {
      return
    }
    
    if (!selectedNote) {
      showModal('Error', { error: 'Please select a deposit note' }, false)
      return
    }
    if (!withdrawRecipient) {
      showModal('Error', { error: 'Please enter recipient address' }, false)
      return
    }

    // CRITICAL: Check if nullifier has been used in Dark OTC settlements
    if (selectedNote.nullifierHash) {
      try {
        const { BACKEND_URL } = await import('@/lib/api')
        console.log('[Withdraw] Checking if nullifier is used in Dark OTC...')
        const response = await fetch(`${BACKEND_URL}/api/v1/rfq/check-nullifier/${selectedNote.nullifierHash}`)
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.isUsed) {
            showModal('Deposit Already Used', {
              error: 'This deposit has been used in a Dark OTC settlement',
              details: `This deposit was used in a trade settlement and cannot be withdrawn.\n\nSettlement ID: ${result.data.settlementId || 'N/A'}\nUsed at: ${result.data.usedAt ? new Date(result.data.usedAt).toLocaleString() : 'N/A'}\n\nThe funds have already been transferred to the counterparty.`,
              action: 'Select Another Deposit'
            }, false)
            
            // Remove this deposit note from localStorage since it's used
            removeDepositNote(selectedNote.commitment)
            setDepositNotes(getDepositNotes())
            setSelectedNote(null)
            return
          }
        }
      } catch (error) {
        console.error('[Withdraw] Error checking nullifier:', error)
        // Continue with withdrawal if backend check fails (don't block user)
      }
    }

    // Start scanning
    setScanStatus('scanning')
    setScanResult(null)
    setShowRiskConfirm(false)

    try {
      const result = await scanWallet(withdrawRecipient)
      setScanResult(result)

      if (!result.success) {
        setScanStatus('error')
        return
      }

      if (result.data && isRisky(result.data.riskLevel)) {
        setScanStatus('risky')
        setShowRiskConfirm(true)
      } else {
        setScanStatus('safe')
        // Auto proceed if safe
        await executeWithdraw(result)
      }
    } catch (err: any) {
      setScanStatus('error')
      setScanResult({ success: false, error: { code: 'NETWORK_ERROR', message: err.message } })
    }
  }

  const executeWithdraw = async (currentScanResult?: ScanResult | null) => {
    if (!selectedNote) return

    setLoading(true)
    setShowRiskConfirm(false)
    setShowLoadingModal(true)
    setLoadingSteps([
      { label: 'Preparing withdrawal request', status: 'loading', description: 'Validating deposit note...' },
      { label: 'Submitting to relayer', status: 'pending', description: 'Sending request to backend...' },
      { label: 'Executing withdrawal', status: 'pending', description: 'Relayer processing transaction...' },
      { label: 'Confirming on-chain', status: 'pending', description: 'Waiting for confirmation...' },
    ])
    
    const scanData = currentScanResult || scanResult
    
    try {
      // Step 1: Prepare (add delay so user can see)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Step 1 complete, move to step 2
      setLoadingSteps(prev => prev.map((step, i) => 
        i === 0 ? { ...step, status: 'success' } :
        i === 1 ? { ...step, status: 'loading' } : step
      ))
      
      // Step 2: Submit to relayer
      const result = await submitWithdrawal({
        commitment: selectedNote.commitment,
        nullifierHash: selectedNote.nullifierHash,
        recipient: withdrawRecipient,
        amount: selectedNote.amount,
        chainId: selectedNote.chainId,
        token: selectedNote.token || 'native' // Pass token type to backend
      })

      if (result.success) {
        // Step 2 complete, move to step 3
        setLoadingSteps(prev => prev.map((step, i) => 
          i === 1 ? { ...step, status: 'success' } :
          i === 2 ? { ...step, status: 'loading' } : step
        ))
        
        // Small delay for step 3
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Step 3 complete, move to step 4
        setLoadingSteps(prev => prev.map((step, i) => 
          i === 2 ? { ...step, status: 'success' } :
          i === 3 ? { ...step, status: 'loading' } : step
        ))
        
        // Small delay for step 4
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // All steps complete
        setLoadingSteps(prev => prev.map(step => ({ ...step, status: 'success' })))
        
        // Remove used deposit note
        removeDepositNote(selectedNote.commitment)
        setDepositNotes(getDepositNotes())
        
        // Use net amount from API response (after fee deduction)
        const isSolana = selectedNote.chainId.includes('solana')
        const tokenDecimals = TOKEN_DECIMALS[selectedNote.token] || (isSolana ? 9 : 18)
        const netAmount = result.netAmount 
          ? result.netAmount.toFixed(selectedNote.token === 'native' ? 6 : 2)
          : (Number(selectedNote.amount) / Math.pow(10, tokenDecimals)).toFixed(selectedNote.token === 'native' ? 6 : 2)
        const withdrawToken = selectedNote.token === 'native' 
          ? (isSolana ? 'SOL' : 'ETH')
          : selectedNote.token.toUpperCase()
        const withdrawChain = selectedNote.chainId
        const savedRecipient = withdrawRecipient
        const feeInfo = result.fee
        
        setSelectedNote(null)
        setWithdrawRecipient('')
        setScanStatus('idle')
        setScanResult(null)
        
        setTimeout(() => {
          setShowLoadingModal(false)
          
          showModal('Withdrawal Submitted', {
            success: true,
            requestId: result.requestId,
            txHash: result.txHash,
            message: 'Relayer executed your withdrawal privately',
            amount: `${netAmount} ${withdrawToken}`, // Already includes token, don't add again
            fee: feeInfo ? `${feeInfo.amount.toFixed(6)} ${feeInfo.currency} (${feeInfo.percentage}%)` : undefined,
            chain: withdrawChain,
            recipient: savedRecipient,
            walletScan: scanData?.data ? {
              riskScore: scanData.data.riskScore,
              riskLevel: scanData.data.riskLevel
            } : null
          }, true)
          
          onSuccess('withdraw', result.txHash || result.requestId || 'withdraw')
        }, 1000)
      } else {
        // Check if it's an "already used" error
        if (result.alreadyUsed) {
          // Refresh deposit notes list since the note was removed
          setDepositNotes(getDepositNotes())
          setSelectedNote(null)
          setWithdrawRecipient('')
          setScanStatus('idle')
          setScanResult(null)
          
          setTimeout(() => {
            setShowLoadingModal(false)
            showModal('Already Withdrawn', {
              success: true,
              message: 'This deposit was already withdrawn successfully. The note has been removed from your list.',
              info: 'Check your wallet - the funds should already be there!'
            }, true)
          }, 500)
          return
        }
        throw new Error(result.error || 'Withdrawal failed')
      }
    } catch (err: any) {
      // Check if error message indicates already used nullifier
      const errorMsg = err.message || ''
      if (errorMsg.includes('NullifierAlreadyUsed') || errorMsg.includes('already used') || errorMsg.includes('already completed')) {
        // Refresh deposit notes and show success message
        removeDepositNote(selectedNote.commitment)
        setDepositNotes(getDepositNotes())
        setSelectedNote(null)
        setWithdrawRecipient('')
        setScanStatus('idle')
        setScanResult(null)
        
        setTimeout(() => {
          setShowLoadingModal(false)
          showModal('Already Withdrawn', {
            success: true,
            message: 'This deposit was already withdrawn successfully. The note has been removed from your list.',
            info: 'Check your wallet - the funds should already be there!'
          }, true)
        }, 500)
        return
      }
      
      // Mark current step as error
      setLoadingSteps(prev => prev.map(step => 
        step.status === 'loading' ? { ...step, status: 'error' } : step
      ))
      
      setTimeout(() => {
        setShowLoadingModal(false)
        showModal('Withdrawal Failed', { error: err.message }, false)
      }, 1000)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmRiskyWithdraw = async () => {
    await executeWithdraw(scanResult)
  }

  const handleCancelRiskyWithdraw = () => {
    setShowRiskConfirm(false)
    setScanStatus('idle')
    setScanResult(null)
  }

  const vaultAddress = network === 'solana-devnet' 
    ? CONTRACTS.solana.vaultPDA 
    : CONTRACTS.sepolia.vault

  return (
    <section>
      {/* Header with fade in */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-semibold mb-2">Privacy Vault</h2>
        <p className="text-gray-400">Deposit and withdraw with true end-to-end privacy</p>
      </motion.div>

      {/* Tabs with animation */}
      <div className="max-w-xl mx-auto mb-6">
        <motion.div 
          className="flex bg-[#1a1a24] rounded-lg p-1 border border-[#2a2a3a]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <motion.button
            onClick={() => setActiveTab('deposit')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === 'deposit' 
                ? 'bg-indigo-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Deposit
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('withdraw')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === 'withdraw' 
                ? 'bg-indigo-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Withdraw ({depositNotes.length})
          </motion.button>
        </motion.div>
      </div>

      <motion.div 
        className="max-w-xl mx-auto bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-4 sm:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'deposit' ? (
            <motion.form 
              key="deposit"
              onSubmit={handleDeposit} 
              className="space-y-5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
            <NetworkSelect value={network} onChange={handleNetworkChange} />
            
            <TokenSelect 
              value={token} 
              onChange={setToken} 
              tokens={TOKENS[network] || TOKENS['solana-devnet']} 
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm text-gray-400">Amount</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Balance: {fetchingBalance ? '...' : `${walletBalance.toFixed(token === 'native' ? 4 : 2)} ${TOKENS[network].find(t => t.value === token)?.label || token.toUpperCase()}`}
                  </span>
                  <button
                    type="button"
                    onClick={setMaxAmount}
                    className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded hover:bg-indigo-500/30 transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                required
                className={`w-full px-4 py-3 bg-[#0d0d12] border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${
                  amountExceedsBalance || amountBelowMinimum
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-[#2a2a3a] focus:border-indigo-500'
                }`}
              />
              {amountExceedsBalance && (
                <p className="text-xs text-red-400 mt-1">
                  Insufficient balance. You have {walletBalance.toFixed(token === 'native' ? 4 : 2)} {TOKENS[network].find(t => t.value === token)?.label || token.toUpperCase()}
                </p>
              )}
              {amountBelowMinimum && !amountExceedsBalance && (
                <p className="text-xs text-yellow-400 mt-1">
                  ⚠️ Minimum deposit is {MIN_DEPOSIT} {network === 'solana-devnet' ? 'SOL' : 'ETH'}
                </p>
              )}
            </div>

            {/* Privacy Info */}
            <div className="bg-[#12121a] rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">True Privacy Guaranteed</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Your deposit note (nullifier + secret) stays in your browser. 
                    Withdrawals use direct transfer from relayer - no vault PDA link. 
                    Your identity cannot be traced on-chain.
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500 pt-2 border-t border-[#2a2a3a]">
                <span className="text-gray-400">Shared Vault:</span> {vaultAddress.slice(0, 8)}...{vaultAddress.slice(-6)}
                <span className="ml-2 text-gray-600">(public, same for all users)</span>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || (network === 'solana-devnet' ? !publicKey : !evmConnected) || amountBelowMinimum}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? 'Processing...' : (network === 'solana-devnet' ? !publicKey : !evmConnected) ? 'Connect Wallet' : amountBelowMinimum ? `Min ${MIN_DEPOSIT} ${network === 'solana-devnet' ? 'SOL' : 'ETH'}` : 'Deposit to Vault'}
            </motion.button>
          </motion.form>
        ) : (
          <motion.form 
            key="withdraw"
            onSubmit={handleWithdraw} 
            className="space-y-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Deposit Notes List */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Select Deposit Note</label>
              {depositNotes.length === 0 ? (
                <motion.div 
                  className="p-4 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-gray-500 text-sm">No deposit notes found</p>
                  <p className="text-gray-600 text-xs mt-1">Make a deposit first</p>
                </motion.div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <AnimatePresence mode="popLayout">
                    {depositNotes
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map((note, index) => {
                    // Convert amount from smallest unit to display unit based on token type
                    const tokenDecimals = TOKEN_DECIMALS[note.token] || (note.chainId.includes('solana') ? 9 : 18)
                    const displayAmount = (Number(note.amount) / Math.pow(10, tokenDecimals)).toFixed(
                      note.token === 'native' ? 6 : 2
                    )
                    const displayToken = note.token === 'native' 
                      ? (note.chainId.includes('solana') ? 'SOL' : 'ETH')
                      : note.token.toUpperCase()
                    
                    // Get token logo (not chain logo!)
                    const tokenLogo = note.token === 'native'
                      ? (note.chainId.includes('solana') ? TOKEN_LOGOS.SOL : TOKEN_LOGOS.ETH)
                      : TOKEN_LOGOS[note.token.toUpperCase() as keyof typeof TOKEN_LOGOS] || TOKEN_LOGOS.SOL
                    
                    // Format timestamp
                    const depositDate = new Date(note.timestamp)
                    const now = new Date()
                    const diffMs = now.getTime() - depositDate.getTime()
                    const diffMins = Math.floor(diffMs / 60000)
                    const diffHours = Math.floor(diffMs / 3600000)
                    const diffDays = Math.floor(diffMs / 86400000)
                    
                    let timeAgo = ''
                    if (diffMins < 1) timeAgo = 'Just now'
                    else if (diffMins < 60) timeAgo = `${diffMins}m ago`
                    else if (diffHours < 24) timeAgo = `${diffHours}h ago`
                    else if (diffDays < 7) timeAgo = `${diffDays}d ago`
                    else timeAgo = depositDate.toLocaleDateString()
                    
                    return (
                      <motion.button
                        key={note.commitment}
                        type="button"
                        onClick={() => setSelectedNote(note)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          selectedNote?.commitment === note.commitment
                            ? 'bg-indigo-500/20 border-indigo-500'
                            : 'bg-[#0d0d12] border-[#2a2a3a] hover:border-[#3a3a4a]'
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        layout
                      >
                        <div className="flex items-start gap-3">
                          {/* Token Logo (not chain logo!) */}
                          <img 
                            src={tokenLogo} 
                            alt={displayToken} 
                            className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
                          />
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium">{displayAmount} {displayToken}</p>
                                <p className="text-xs text-gray-500">{note.chainId}</p>
                              </div>
                              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                {timeAgo}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              {note.commitment.slice(0, 20)}...
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Recipient Address */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Recipient Address</label>
              <input
                type="text"
                value={withdrawRecipient}
                onChange={(e) => setWithdrawRecipient(e.target.value)}
                placeholder={selectedNote?.chainId?.includes('solana') ? 'Solana address...' : '0x...'}
                required
                className="w-full px-4 py-3 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                This can be ANY address - your identity stays hidden
              </p>
            </div>

            {/* Selected Note Info */}
            {selectedNote && (() => {
              const isSolana = selectedNote.chainId.includes('solana')
              const amount = Number(selectedNote.amount)
              
              // Get token decimals and display name from deposit note
              const tokenDecimals = TOKEN_DECIMALS[selectedNote.token] || (isSolana ? 9 : 18)
              const displayAmount = (amount / Math.pow(10, tokenDecimals)).toFixed(
                selectedNote.token === 'native' ? 6 : 2
              )
              const token = selectedNote.token === 'native' 
                ? (isSolana ? 'SOL' : 'ETH')
                : selectedNote.token.toUpperCase()
              
              // Calculate tiered fee (0.05% - 0.1%)
              const amountInUnit = amount / Math.pow(10, tokenDecimals)
              let feePercent: number
              if (amountInUnit <= 10) feePercent = 0.001        // 0.1%
              else if (amountInUnit <= 100) feePercent = 0.0008  // 0.08%
              else if (amountInUnit <= 1000) feePercent = 0.0006 // 0.06%
              else feePercent = 0.0005                           // 0.05%
              
              const minFeeLamports = 100_000 // 0.0001 SOL
              const minFeeWei = 10_000_000_000_000 // 0.00001 ETH
              const minFeeToken = 100_000 // 0.1 USDC/USDT (6 decimals)
              
              const calculatedFee = amount * feePercent
              const minFee = selectedNote.token === 'native' 
                ? (isSolana ? minFeeLamports : minFeeWei)
                : minFeeToken
              const actualFee = Math.max(calculatedFee, minFee)
              const netAmount = amount - actualFee
              
              const displayFee = (actualFee / Math.pow(10, tokenDecimals)).toFixed(
                selectedNote.token === 'native' ? 6 : 2
              )
              const displayNet = (netAmount / Math.pow(10, tokenDecimals)).toFixed(
                selectedNote.token === 'native' ? 6 : 2
              )
              
              return (
                <div className="bg-[#12121a] rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Deposit Amount</span>
                    <span>{displayAmount} {token}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Chain</span>
                    <span>{selectedNote.chainId}</span>
                  </div>
                  <div className="flex justify-between text-sm text-yellow-400">
                    <span>Relayer Fee ({(feePercent * 100).toFixed(2)}%)</span>
                    <span>-{displayFee} {token}</span>
                  </div>
                  <div className="border-t border-[#2a2a3a] pt-2 mt-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-400">You Receive</span>
                      <span className="text-green-400">{displayNet} {token}</span>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Privacy Reminder */}
            <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-sm text-green-400 font-medium">Private Withdrawal</p>
                <p className="text-xs text-gray-400 mt-1">
                  The relayer will execute this withdrawal. On-chain, only the relayer's address appears - not yours.
                </p>
              </div>
            </div>

            {/* Daemon Engine Scan UI */}
            {scanStatus === 'scanning' && (
              <div className="p-4 bg-[#0d0d12] border border-[#2a2a3a] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full border-2 border-t-indigo-500 border-r-indigo-500 border-b-transparent border-l-transparent animate-spin" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <img src="/adaptive-icon.png" alt="Daemon" className="h-4 w-auto opacity-80" />
                      <span className="text-sm font-medium text-white">Scanning with Daemon Engine</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Analyzing recipient wallet for risks...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Scan Result - Safe */}
            {scanStatus === 'safe' && scanResult?.data && (
              <div className={`p-4 border rounded-xl ${getRiskBg(scanResult.data.riskLevel)}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">Wallet Verified</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRiskBg(scanResult.data.riskLevel)} ${getRiskColor(scanResult.data.riskLevel)}`}>
                        {scanResult.data.riskLevel.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Risk Score: {scanResult.data.riskScore}/100</p>
                  </div>
                </div>
              </div>
            )}

            {/* Scan Result - Risky with Confirmation */}
            {scanStatus === 'risky' && scanResult?.data && showRiskConfirm && (
              <div className={`p-4 border rounded-xl ${getRiskBg(scanResult.data.riskLevel)}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">Risk Detected</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRiskBg(scanResult.data.riskLevel)} ${getRiskColor(scanResult.data.riskLevel)}`}>
                        {scanResult.data.riskLevel.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Risk Score: {scanResult.data.riskScore}/100</p>
                    
                    {/* Risk Details */}
                    <div className="mt-3 space-y-2 text-xs">
                      {scanResult.data.entity && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Entity:</span>
                          <span className="text-white">{scanResult.data.entity}</span>
                        </div>
                      )}
                      {scanResult.data.sanctions?.isSanctioned && (
                        <div className="flex items-center gap-2 text-red-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          <span>SANCTIONED WALLET</span>
                        </div>
                      )}
                      {scanResult.data.labels?.categories?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {scanResult.data.labels.categories.slice(0, 3).map((cat, i) => (
                            <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                      {scanResult.data.labels?.riskIndicators?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {scanResult.data.labels.riskIndicators.slice(0, 3).map((ind, i) => (
                            <span key={i} className="px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded text-xs">
                              {ind}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Confirmation Buttons */}
                    <div className="flex gap-3 mt-4">
                      <button
                        type="button"
                        onClick={handleCancelRiskyWithdraw}
                        className="flex-1 py-2 px-4 bg-[#2a2a3a] hover:bg-[#3a3a4a] rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmRiskyWithdraw}
                        disabled={loading}
                        className="flex-1 py-2 px-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-sm font-medium text-red-400 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Processing...' : 'Proceed Anyway'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scan Error */}
            {scanStatus === 'error' && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-white">Scan Failed</span>
                    <p className="text-xs text-gray-400 mt-1">
                      {scanResult?.error?.message || 'Unable to verify wallet. You can still proceed.'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => { setScanStatus('idle'); setScanResult(null) }}
                    className="flex-1 py-2 px-4 bg-[#2a2a3a] hover:bg-[#3a3a4a] rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => executeWithdraw()}
                    disabled={loading}
                    className="flex-1 py-2 px-4 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-lg text-sm font-medium text-yellow-400 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Proceed Without Scan'}
                  </button>
                </div>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading || !selectedNote || !withdrawRecipient || scanStatus === 'scanning' || showRiskConfirm}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {scanStatus === 'scanning' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Scanning Wallet...
                </span>
              ) : loading ? 'Processing...' : 'Request Private Withdrawal'}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
      </motion.div>
      
      {/* Loading Modal */}
      <LoadingModal
        isOpen={showLoadingModal}
        title={activeTab === 'deposit' ? 'Processing Deposit' : 'Processing Withdrawal'}
        steps={loadingSteps}
      />
    </section>
  )
}
