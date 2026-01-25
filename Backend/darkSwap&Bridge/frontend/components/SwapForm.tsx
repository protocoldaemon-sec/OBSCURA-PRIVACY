'use client';

import React from 'react';
import { useSilentSwap, useSwap, formatUsdValue } from '@silentswap/react';
import { useUserAddress } from '@/hooks/useUserAddress';

export function SwapForm() {
  // Get swap settings from useSwap (managed via Zustand)
  const { 
    tokenIn, 
    tokenOut, 
    inputAmount, 
    setInputAmount, 
    destinations,
    splits 
  } = useSwap();

  // Get swap logic and status from useSilentSwap
  const {
    executeSwap,
    isSwapping,
    swapLoading,
    currentStep,
    orderId,
    orderComplete,
    orderStatusTexts,
    handleNewSwap,
    serviceFeeUsd,
    bridgeFeeIngressUsd,
    bridgeFeeEgressUsd,
    slippageUsd,
    overheadUsd,
    egressEstimatesLoading
  } = useSilentSwap();

  // Get user address for senderContactId
  const { evmAddress, solAddress } = useUserAddress();

  const handleExecute = async () => {
    try {
      if (!tokenIn || !inputAmount) {
        alert('Please select a token and enter an amount');
        return;
      }

      // Determine sender contact ID based on source asset chain
      const isSourceSolana = tokenIn.caip19.startsWith('solana:');
      const senderContactId = isSourceSolana && solAddress
        ? `caip10:solana:*:${solAddress}`
        : evmAddress
        ? `caip10:eip155:1:${evmAddress}`
        : '';

      if (!senderContactId) {
        alert('Wallet address required');
        return;
      }

      // Execute swap with all required parameters
      const result = await executeSwap({
        sourceAsset: tokenIn.caip19,
        sourceAmount: inputAmount,
        destinations: destinations,
        splits: splits,
        senderContactId: senderContactId,
        integratorId: process.env.NEXT_PUBLIC_INTEGRATOR_ID, // Optional: for tracking
      });

      if (result) {
        console.log('Swap initiated:', result.orderId);
      }
    } catch (err) {
      console.error('Swap failed:', err);
    }
  };

  if (orderComplete && orderId) {
    return (
      <div className="p-6 bg-green-50 rounded-xl">
        <h2 className="text-xl font-bold mb-4">Swap Complete!</h2>
        <p>Order ID: {orderId}</p>
        <button 
          onClick={handleNewSwap}
          className="mt-4 px-6 py-2 bg-yellow text-black font-semibold rounded-lg"
        >
          New Swap
        </button>
      </div>
    );
  }

  const totalFeesUsd = serviceFeeUsd + bridgeFeeIngressUsd + bridgeFeeEgressUsd;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-md mx-auto bg-zinc-900 rounded-2xl text-white">
      {/* Input Section */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400">Input Amount ({tokenIn?.symbol})</label>
        <input 
          type="text" 
          value={inputAmount}
          onChange={(e) => setInputAmount(e.target.value)}
          placeholder="0.00"
          className="p-4 bg-zinc-800 border-none rounded-xl text-xl outline-none focus:ring-1 focus:ring-yellow/50"
          disabled={isSwapping}
        />
      </div>

      {/* Fee Breakdown */}
      <div className="space-y-2 p-4 bg-zinc-800/50 rounded-xl text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-400">Total Fees:</span>
          <span>${formatUsdValue(totalFeesUsd)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Price Impact:</span>
          <span className="text-red-400">-${formatUsdValue(slippageUsd)}</span>
        </div>
      </div>

      {/* Status Tracking */}
      {isSwapping && (
        <div className="p-4 bg-yellow/10 border border-yellow/20 rounded-xl">
          <p className="font-semibold text-yellow mb-2">Status: {currentStep || 'Processing'}</p>
          <div className="space-y-2">
            {orderStatusTexts.map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-yellow animate-pulse" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleExecute}
        disabled={isSwapping || swapLoading || egressEstimatesLoading || !inputAmount}
        className="w-full py-4 bg-yellow text-black font-bold rounded-xl disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
      >
        {isSwapping ? 'Executing Swap...' : 'Swap Now'}
      </button>
    </div>
  );
}
