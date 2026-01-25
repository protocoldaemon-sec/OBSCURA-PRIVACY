import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';

/**
 * Custom hook to get both EVM and Solana addresses
 */
export function useUserAddress() {
  // Get EVM address from wagmi
  const { address: evmAddress } = useAccount();
  
  // Get Solana address from wallet adapter
  const { publicKey } = useWallet();
  const solAddress = publicKey?.toBase58();

  return {
    evmAddress: evmAddress || null,
    solAddress: solAddress || null,
  };
}
