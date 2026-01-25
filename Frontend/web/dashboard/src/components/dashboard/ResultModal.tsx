'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ResultModalProps {
  title: string
  result: any
  isSuccess: boolean
  onClose: () => void
}

// Shorten long hex strings
const shortenHex = (str: string, chars = 8) => {
  if (!str || str.length <= chars * 2 + 3) return str
  return `${str.slice(0, chars + 2)}...${str.slice(-chars)}`
}

// Copy button component with feedback
function CopyButton({ text, variant = 'default' }: { text: string; variant?: 'default' | 'primary' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const baseClass = variant === 'primary' 
    ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20'
    : 'text-gray-500 hover:text-white hover:bg-white/10'

  return (
    <button 
      onClick={handleCopy}
      className={`transition-colors p-1 rounded ${baseClass}`}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-400">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
      )}
    </button>
  )
}

export default function ResultModal({ title, result, isSuccess, onClose }: ResultModalProps) {

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-xl"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="relative bg-[#1a1a24] border border-[#2a2a3a] rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="relative p-6 pb-4 text-center bg-gradient-to-b from-indigo-500/10 to-transparent">
            <div className={`w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center ${
              isSuccess 
                ? 'bg-green-500/20 text-green-500 ring-4 ring-green-500/10'
                : 'bg-red-500/20 text-red-500 ring-4 ring-red-500/10'
            }`}>
              {isSuccess ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              )}
            </div>
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {isSuccess ? 'Operation completed successfully' : 'Something went wrong'}
            </p>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 pb-6 max-h-[400px] overflow-y-auto">
            {isSuccess && result.success !== false ? (
              <div className="space-y-3">
                {/* Intent ID - Primary highlight */}
                {result.intentId && (
                  <div className="p-4 bg-gradient-to-br from-indigo-500/15 to-indigo-500/5 border border-indigo-500/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-indigo-300 font-medium uppercase tracking-wider">Intent ID</span>
                      <CopyButton text={result.intentId} variant="primary" />
                    </div>
                    <div className="text-sm font-mono text-white break-all">{result.intentId}</div>
                  </div>
                )}

                {/* Info Grid - Type, Chain, Privacy */}
                {(result.type || result.sourceChain || result.privacyLevel) && (
                  <div className="grid grid-cols-3 gap-2">
                    {result.type && (
                      <div className="p-3 bg-[#12121a] border border-[#2a2a3a] rounded-xl text-center">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Type</div>
                        <div className="text-sm text-white font-medium capitalize">{result.type}</div>
                      </div>
                    )}
                    {result.sourceChain && (
                      <div className="p-3 bg-[#12121a] border border-[#2a2a3a] rounded-xl text-center">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Chain</div>
                        <div className="text-sm text-white font-medium capitalize">
                          {result.sourceChain}{result.targetChain && result.targetChain !== result.sourceChain ? ` > ${result.targetChain}` : ''}
                        </div>
                      </div>
                    )}
                    {result.privacyLevel && (
                      <div className="p-3 bg-[#12121a] border border-[#2a2a3a] rounded-xl text-center">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Privacy</div>
                        <div className="text-sm text-white font-medium capitalize">{result.privacyLevel}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Transfer Details - Amount & Recipient */}
                {(result.amount || result.recipient) && (
                  <div className="space-y-2">
                    {result.amount && (
                      <div className="p-4 bg-gradient-to-br from-green-500/15 to-green-500/5 border border-green-500/30 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-300 font-medium uppercase tracking-wider">Amount</span>
                          <span className="text-lg text-white font-bold">{result.amount}</span>
                        </div>
                      </div>
                    )}
                    {result.recipient && (
                      <div className="p-4 bg-[#12121a] border border-[#2a2a3a] rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Recipient</span>
                          <CopyButton text={result.recipient} />
                        </div>
                        <div className="text-sm font-mono text-gray-300">{shortenHex(result.recipient, 10)}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Stealth Address */}
                {result.stealthAddress && (
                  <div className="p-4 bg-[#12121a] border border-[#2a2a3a] rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Stealth Address</span>
                      <CopyButton text={result.stealthAddress} />
                    </div>
                    <div className="text-sm font-mono text-gray-300">{shortenHex(result.stealthAddress, 10)}</div>
                  </div>
                )}

                {/* Commitment */}
                {result.commitment && (
                  <div className="p-4 bg-[#12121a] border border-[#2a2a3a] rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Commitment</span>
                      <CopyButton text={result.commitment} />
                    </div>
                    <div className="text-sm font-mono text-gray-300">{shortenHex(result.commitment, 10)}</div>
                  </div>
                )}

                {/* Wallet Scan - Subtle info row */}
                {result.walletScan && (
                  <div className="p-3 bg-[#12121a] border border-[#2a2a3a] rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                        </svg>
                        <span className="text-xs text-gray-400">Wallet Scan</span>
                      </div>
                      <span className={`text-xs font-medium ${
                        result.walletScan.riskLevel === 'NO_RISK' || result.walletScan.riskLevel === 'LOW' || result.walletScan.riskLevel === 'INFORMATIONAL'
                          ? 'text-green-400'
                          : 'text-orange-400'
                      }`}>
                        {result.walletScan.riskLevel?.replace('_', ' ')} ({result.walletScan.riskScore}/100)
                      </span>
                    </div>
                  </div>
                )}

                {/* Pool specific - Merkle Root */}
                {result.merkleRoot && (
                  <div className="p-4 bg-gradient-to-br from-indigo-500/15 to-indigo-500/5 border border-indigo-500/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-indigo-300 font-medium uppercase tracking-wider">Merkle Root</span>
                      <CopyButton text={result.merkleRoot} variant="primary" />
                    </div>
                    <div className="text-sm font-mono text-white break-all">{shortenHex(result.merkleRoot, 12)}</div>
                    {result.totalKeys && (
                      <div className="mt-2 pt-2 border-t border-indigo-500/20 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Total Keys</span>
                        <span className="text-sm text-white font-medium">{result.totalKeys.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Expires At */}
                {result.expiresAt && (
                  <div className="p-3 bg-[#12121a] border border-[#2a2a3a] rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Expires</span>
                      <span className="text-sm text-white">{new Date(result.expiresAt * 1000).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 8v4m0 4h.01"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-red-400 font-medium">
                      {result.error || result.details || 'An unknown error occurred'}
                    </div>
                    {result.hint && (
                      <p className="text-gray-500 text-xs mt-2">{result.hint}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-black/20 border-t border-[#2a2a3a]">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
