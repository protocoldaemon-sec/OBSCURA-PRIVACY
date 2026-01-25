'use client';

import React, { useState } from 'react';
import { useSilentSwap, useSwap } from '@silentswap/react';
import { useAccount, useWalletClient } from 'wagmi';
import { useSolanaAdapter } from '@silentswap/react';
import { useUserAddress } from '@/hooks/useUserAddress';

export function EvmToSolanaSwap() {
  const { evmAddress, solAddress } = useUserAddress();
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { solanaConnector, solanaConnectionAdapter } = useSolanaAdapter();

  const {
    executeSwap,
    isSwapping,
    currentStep,
    orderId,
    orderComplete,
    swapError,
  } = useSilentSwap();

  const { setInputAmount, setDestinations } = useSwap();
  const [amount, setAmount] = useState('');

  const handleSwap = async () => {
    if (!solAddress || !evmAddress) {
      alert('Both Solana and EVM wallets must be connected');
      return;
    }

    if (!solanaConnector?.publicKey) {
      alert('Solana wallet not connected');
      return;
    }

    try {
      setInputAmount(amount);

      // Execute swap - USDC on Avalanche to USDC SPL on Solana
      const result = await executeSwap({
        sourceAsset: 'eip155:43114/erc20:0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC on Avalanche
        sourceAmount: amount,
        destinations: [{
          asset: 'solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/erc20:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC SPL
          contact: `caip10:solana:*:${solAddress}`,
          amount: '',
        }],
        splits: [1],
        senderContactId: `caip10:eip155:43114:${evmAddress}`,
        integratorId: process.env.NEXT_PUBLIC_INTEGRATOR_ID,
      });

      if (result) {
        console.log('Swap initiated:', result.orderId);
      }
    } catch (error) {
      console.error('Swap failed:', error);
      alert(`Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 max-w-md mx-auto bg-zinc-900 rounded-2xl text-white">
      <h2 className="text-2xl font-bold mb-4">Swap USDC → SOL USDC</h2>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400">USDC Amount (Avalanche)</label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className="p-4 bg-zinc-800 border-none rounded-xl text-xl outline-none"
          disabled={isSwapping}
        />
        <p className="text-xs text-zinc-500">
          EVM Address: {evmAddress?.slice(0, 8)}...{evmAddress?.slice(-8)}
        </p>
        <p className="text-xs text-zinc-500">
          Solana Address: {solAddress?.slice(0, 8)}...{solAddress?.slice(-8)}
        </p>
      </div>

      {isSwapping && (
        <div className="p-4 bg-yellow/10 border border-yellow/20 rounded-xl">
          <p className="font-semibold text-yellow">Status: {currentStep || 'Processing'}</p>
        </div>
      )}

      {swapError && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
          <p className="text-red-400">Error: {swapError.message}</p>
        </div>
      )}

      {orderComplete && orderId && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
          <p className="text-green-400">Swap Complete! Order ID: {orderId}</p>
        </div>
      )}

      <button
        onClick={handleSwap}
        disabled={isSwapping || !amount || !solAddress || !evmAddress}
        className="w-full py-4 bg-yellow text-black font-bold rounded-xl disabled:opacity-20 disabled:cursor-not-allowed"
      >
        {isSwapping ? 'Executing Swap...' : 'Swap USDC → SOL USDC'}
      </button>
    </div>
  );
}
