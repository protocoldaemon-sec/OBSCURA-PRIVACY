'use client';

import React from 'react';
import { SilentSwapProvider, useSolanaAdapter } from '@silentswap/react';
import { createSilentSwapClient, ENVIRONMENT } from '@silentswap/sdk';
import { useAccount, useWalletClient } from 'wagmi';
import { useUserAddress } from '@/hooks/useUserAddress';

// Initialize the client with environment from config
const environment = process.env.NEXT_PUBLIC_SILENTSWAP_ENVIRONMENT === 'PRODUCTION' 
  ? ENVIRONMENT.PRODUCTION 
  : ENVIRONMENT.STAGING;

const client = createSilentSwapClient({ environment });

export default function ObscuraSwapProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, connector } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { evmAddress, solAddress } = useUserAddress();

  // Use the built-in Solana adapter hook for Solana support
  const { solanaConnector, solanaConnectionAdapter } = useSolanaAdapter();

  return (
    <SilentSwapProvider
      client={client}
      environment={environment}
      evmAddress={evmAddress}
      solAddress={solAddress}
      isConnected={isConnected}
      connector={connector}
      walletClient={walletClient}
      solanaConnector={solanaConnector}
      solanaConnection={solanaConnectionAdapter}
      solanaRpcUrl={process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"}
      baseUrl={undefined} // Optional: override base URL for API calls
    >
      {children}
    </SilentSwapProvider>
  );
}
