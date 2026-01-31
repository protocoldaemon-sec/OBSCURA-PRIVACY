// Backend API configuration
// Obscura Main API (Privacy Transfers - Deposit/Withdraw)
export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Dark OTC API (RFQ Trading)
export const DARK_OTC_API_URL = process.env.NEXT_PUBLIC_DARK_OTC_API || 'http://localhost:3001'

// Use proxy to avoid CORS issues (deprecated - use BACKEND_URL directly)
export const API_BASE = '/api/backend'

// Contract addresses
export const CONTRACTS = {
  solana: {
    programId: 'GG9U34H1xXkuzvv8Heoy4UWav5vUgrQFEVwrYMi84QuE',
    vaultPDA: '6owJu2yXoPvTbM67XwmRguVRQhCADaswHkAVhVHSvoH7',
    vaultStatePDA: '5L1Vh6ftZWncYc1SEdZsoEX4DKaqCY6ZoQ3CdcEqursB',
  },
  sepolia: {
    vault: '0xc4937Ba6418eE72EDABF72694198024b5a3599CC',
    settlement: '0x88dA9c5D9801cb33615f0A516eb1098dF1889DA9',
  }
}

// Deposit note interface
export interface DepositNote {
  commitment: string
  nullifier: string
  nullifierHash: string
  secret: string
  amount: string
  token: string
  chainId: string
  timestamp: number
  txHash?: string
}

// Generate deposit note client-side (secrets never leave browser)
export function generateDepositNote(
  amount: string,
  chainId: string,
  token: string = 'native'
): DepositNote {
  // Generate random bytes using Web Crypto API
  const secretBytes = new Uint8Array(32)
  const nullifierBytes = new Uint8Array(32)
  crypto.getRandomValues(secretBytes)
  crypto.getRandomValues(nullifierBytes)
  
  const secret = Array.from(secretBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  const nullifier = Array.from(nullifierBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  
  // Convert amount to smallest unit based on token type
  let amountInSmallestUnit: string
  
  // Determine decimals based on token
  let decimals: number
  if (token === 'native') {
    decimals = chainId.includes('solana') ? 9 : 18 // SOL or ETH
  } else if (token === 'usdc' || token === 'usdt') {
    decimals = 6 // USDC and USDT use 6 decimals
  } else {
    decimals = chainId.includes('solana') ? 9 : 18 // Default
  }
  
  amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, decimals)).toString()
  
  console.log(`[generateDepositNote] Creating note:`, {
    inputAmount: amount,
    token,
    chainId,
    decimals,
    amountInSmallestUnit
  })
  
  // Compute hashes (simplified - in production use proper SHA256)
  const nullifierHash = `0x${simpleHash(nullifier)}`
  const commitment = `0x${simpleHash(secret + nullifier + amountInSmallestUnit + token + chainId)}`
  
  return {
    commitment,
    nullifier,
    nullifierHash,
    secret,
    amount: amountInSmallestUnit, // Store in smallest unit (lamports/wei)
    token: token.toLowerCase(),
    chainId,
    timestamp: Date.now(),
  }
}

// Synchronous hash for compatibility (uses simple but unique hash)
function simpleHash(input: string): string {
  // Use a better hash algorithm - FNV-1a
  let hash = 2166136261 // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619) // FNV prime
  }
  // Add timestamp and random to ensure uniqueness
  const unique = `${Math.abs(hash)}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  // Create longer hash by hashing multiple times
  let result = ''
  for (let i = 0; i < 4; i++) {
    let h = 2166136261
    const segment = unique + i.toString()
    for (let j = 0; j < segment.length; j++) {
      h ^= segment.charCodeAt(j)
      h = Math.imul(h, 16777619)
    }
    result += Math.abs(h).toString(16).padStart(8, '0')
  }
  return result.slice(0, 64)
}

// Save deposit note to local storage
export function saveDepositNote(note: DepositNote): void {
  const notes = getDepositNotes()
  
  // Prevent duplicate notes (same commitment or same txHash)
  const isDuplicate = notes.some(n => 
    n.commitment === note.commitment || 
    (note.txHash && n.txHash === note.txHash)
  )
  
  if (isDuplicate) {
    console.warn('[saveDepositNote] Duplicate note detected, skipping save')
    return
  }
  
  // Only save notes with valid txHash (confirmed on-chain)
  if (!note.txHash) {
    console.warn('[saveDepositNote] Note has no txHash, skipping save')
    return
  }
  
  notes.push(note)
  localStorage.setItem('obscura_deposit_notes', JSON.stringify(notes))
}

// Get all deposit notes from local storage
export function getDepositNotes(): DepositNote[] {
  try {
    const stored = localStorage.getItem('obscura_deposit_notes')
    if (!stored) return []
    
    const notes: DepositNote[] = JSON.parse(stored)
    
    // Migration: Add nullifierHash to old notes that don't have it
    let needsMigration = false
    const migratedNotes = notes.map(note => {
      if (!note.nullifierHash && note.nullifier) {
        // Compute nullifierHash from nullifier
        const nullifierHash = `0x${simpleHash(note.nullifier)}`
        needsMigration = true
        console.log('[Migration] Adding nullifierHash to old deposit note:', {
          commitment: note.commitment.slice(0, 20) + '...',
          nullifierHash: nullifierHash.slice(0, 20) + '...'
        })
        return { ...note, nullifierHash }
      }
      return note
    })
    
    // Save migrated notes back to localStorage
    if (needsMigration) {
      localStorage.setItem('obscura_deposit_notes', JSON.stringify(migratedNotes))
      console.log('[Migration] ✅ Migrated', migratedNotes.length, 'deposit notes')
    }
    
    return migratedNotes
  } catch {
    return []
  }
}

// Remove used deposit note
export function removeDepositNote(commitment: string): void {
  const notes = getDepositNotes().filter(n => n.commitment !== commitment)
  localStorage.setItem('obscura_deposit_notes', JSON.stringify(notes))
}

export async function fetchHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`)
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  } catch (error) {
    console.error('Health check failed:', error)
    throw error
  }
}

export async function fetchInfo() {
  try {
    const res = await fetch(`${BACKEND_URL}/`)
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  } catch (error) {
    console.error('Info fetch failed:', error)
    throw error
  }
}

export async function fetchBatches() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/batches`)
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  } catch (error) {
    console.error('Batches fetch failed:', error)
    throw error
  }
}

export async function submitDeposit(data: {
  network: string
  token: string
  amount: string
  signature: string
  depositor: string
}) {
  const res = await fetch(`${BACKEND_URL}/api/v1/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function submitSwap(data: {
  dex: string
  chain: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  minAmountOut: string
  slippage: number
  privacyLevel: string
  sender?: string
  signature?: string
}) {
  const res = await fetch(`${BACKEND_URL}/api/v1/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function registerPool(data: {
  merkleRoot: string
  totalKeys: number
  params: { w: number; n: number }
}) {
  const res = await fetch(`${BACKEND_URL}/api/v1/pools`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function lookupPool(merkleRoot: string) {
  const res = await fetch(`${BACKEND_URL}/api/v1/pools/${encodeURIComponent(merkleRoot)}`)
  return res.json()
}

// ============ Privacy Vault Functions ============

/**
 * Submit private deposit to vault
 * User signs the transaction via wallet (Phantom/MetaMask)
 * Returns deposit note with secrets for later withdrawal
 */
export async function submitPrivateDeposit(data: {
  network: string       // solana-devnet, sepolia
  token: string         // native, usdc
  amount: string        // Amount as string
  txHash: string        // Signed transaction hash from wallet
  depositor: string     // Depositor address (for tracking only)
}): Promise<{
  success: boolean
  depositNote?: DepositNote
  error?: string
}> {
  try {
    // Generate deposit note client-side (secrets stay local)
    const depositNote = generateDepositNote(data.amount, data.network, data.token)
    depositNote.txHash = data.txHash
    
    // Register deposit with backend (only commitment, not secrets)
    const res = await fetch(`${BACKEND_URL}/api/v1/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        network: data.network,
        token: data.token,
        amount: data.amount,
        commitment: depositNote.commitment,
        txHash: data.txHash,
        depositor: data.depositor
      })
    })
    
    const result = await res.json()
    
    if (!res.ok || !result.success) {
      return { success: false, error: result.error || 'Deposit registration failed' }
    }
    
    // Save deposit note locally
    saveDepositNote(depositNote)
    
    return { success: true, depositNote }
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' }
  }
}

/**
 * Submit withdrawal request to relayer
 * Relayer executes the withdrawal - user's address NOT visible on-chain
 */
export async function submitWithdrawal(data: {
  commitment: string      // From deposit note
  nullifierHash: string   // From deposit note
  recipient: string       // Destination address
  amount: string          // Amount to withdraw
  chainId: string         // solana-devnet, sepolia
  token?: string          // Token type (native, usdc, usdt) - optional for backward compatibility
}): Promise<{
  success: boolean
  requestId?: string
  estimatedFee?: string
  txHash?: string
  error?: string
  alreadyUsed?: boolean   // True if nullifier was already used (withdrawal already completed)
  netAmount?: number      // Net amount after fee deduction
  fee?: {
    amount: number
    percentage: number
    currency: string
  }
}> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    const result = await res.json()
    
    // Parse and handle specific error messages
    const errorStr = result.error || ''
    
    // Check for NullifierAlreadyUsed error - means withdrawal was already completed
    if (errorStr.includes('NullifierAlreadyUsed') || errorStr.includes('Nullifier already used')) {
      removeDepositNote(data.commitment)
      return { 
        success: false, 
        error: 'This withdrawal was already completed. The deposit note has been removed.',
        alreadyUsed: true
      }
    }
    
    // Check for insufficient funds error
    if (errorStr.includes('insufficient lamports') || errorStr.includes('insufficient funds')) {
      // Extract amounts from error message if possible
      const match = errorStr.match(/insufficient lamports (\d+), need (\d+)/)
      if (match) {
        const has = (parseInt(match[1]) / 1e9).toFixed(4)
        const needs = (parseInt(match[2]) / 1e9).toFixed(4)
        return {
          success: false,
          error: `Vault has insufficient balance. Available: ${has} SOL, Required: ${needs} SOL. Please try a smaller amount or contact support.`
        }
      }
      return {
        success: false,
        error: 'Vault has insufficient balance for this withdrawal. Please try a smaller amount or contact support.'
      }
    }
    
    // Check for simulation failed errors
    if (errorStr.includes('Simulation failed') || errorStr.includes('Transaction simulation failed')) {
      return {
        success: false,
        error: 'Transaction simulation failed. The vault may not have enough balance. Please try a smaller amount.'
      }
    }
    
    // Check for custom program errors
    if (errorStr.includes('custom program error')) {
      return {
        success: false,
        error: 'Smart contract error occurred. The vault may be temporarily unavailable. Please try again later or contact support.'
      }
    }
    
    if (!res.ok || !result.success) {
      return { success: false, error: result.error || 'Withdrawal request failed' }
    }
    
    // If successful, remove the used deposit note
    if (result.success && result.txHash) {
      removeDepositNote(data.commitment)
    }
    
    return result
  } catch (error: any) {
    // Also check error message for NullifierAlreadyUsed
    const errorMsg = error.message || ''
    if (errorMsg.includes('NullifierAlreadyUsed') || errorMsg.includes('Nullifier already used')) {
      removeDepositNote(data.commitment)
      return { 
        success: false, 
        error: 'This withdrawal was already completed. The deposit note has been removed.',
        alreadyUsed: true
      }
    }
    return { success: false, error: error.message || 'Network error' }
  }
}

/**
 * Get relayer service statistics
 */
export async function getRelayerStats(): Promise<{
  totalDeposits: number
  totalWithdrawals: number
  totalVolume: string
  pendingRequests: number
  usedNullifiers: number
}> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/relayer/stats`)
    return res.json()
  } catch {
    return {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalVolume: '0',
      pendingRequests: 0,
      usedNullifiers: 0
    }
  }
}

/**
 * Get withdrawal request status
 */
export async function getWithdrawalStatus(requestId: string): Promise<{
  requestId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  txHash?: string
  error?: string
}> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/relayer/request/${requestId}`)
    return res.json()
  } catch {
    return { requestId, status: 'failed', error: 'Network error' }
  }
}

/**
 * Get deposit note by commitment (from local storage)
 */
export function getDepositNoteByCommitment(commitment: string): DepositNote | undefined {
  return getDepositNotes().find(n => n.commitment === commitment)
}

/**
 * Get deposit notes by chain
 */
export function getDepositNotesByChain(chainId: string): DepositNote[] {
  return getDepositNotes().filter(n => n.chainId === chainId)
}
