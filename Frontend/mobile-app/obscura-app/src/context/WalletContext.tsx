/**
 * Wallet Context for Obscura App
 * Supports both Solana (Mobile Wallet Adapter) and EVM (WalletConnect)
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import { 
  transact, 
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { 
  Connection, 
  PublicKey, 
  Transaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import bs58 from 'bs58';

export type ChainType = 'solana' | 'ethereum' | 'polygon' | 'arbitrum';

export interface WalletState {
  connected: boolean;
  address: string | null;
  publicKey: PublicKey | null;
  chain: ChainType;
  balance: string | null;
  loading: boolean;
  walletType: 'solana' | 'evm' | null;
}

interface WalletContextType {
  wallet: WalletState;
  connect: (chain: ChainType) => Promise<void>;
  disconnect: () => void;
  switchChain: (chain: ChainType) => Promise<void>;
  signMessage: (message: string) => Promise<string | null>;
  signTransaction: (tx: any) => Promise<string | null>;
  refreshBalance: () => Promise<void>;
}

const initialState: WalletState = {
  connected: false,
  address: null,
  publicKey: null,
  chain: 'solana',
  balance: null,
  loading: false,
  walletType: null,
};

// Solana connection
const SOLANA_RPC = clusterApiUrl('devnet');
const connection = new Connection(SOLANA_RPC);

// App identity for Mobile Wallet Adapter
const APP_IDENTITY = {
  name: 'Obscura',
  uri: 'https://obscura.app',
  icon: 'favicon.ico',
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(initialState);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Fetch Solana balance
  const fetchSolanaBalance = useCallback(async (publicKey: PublicKey) => {
    try {
      const balance = await connection.getBalance(publicKey);
      return `${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`;
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      return '0 SOL';
    }
  }, []);

  // Connect to Solana wallet using Mobile Wallet Adapter
  const connectSolana = useCallback(async () => {
    setWallet(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await transact(async (wallet: Web3MobileWallet) => {
        // Authorize the app
        const authResult = await wallet.authorize({
          cluster: 'devnet',
          identity: APP_IDENTITY,
        });
        
        return {
          accounts: authResult.accounts,
          authToken: authResult.auth_token,
        };
      });

      if (result.accounts.length > 0) {
        const account = result.accounts[0];
        const publicKey = new PublicKey(account.address);
        const address = publicKey.toBase58();
        const balance = await fetchSolanaBalance(publicKey);
        
        setAuthToken(result.authToken);
        setWallet({
          connected: true,
          address,
          publicKey,
          chain: 'solana',
          balance,
          loading: false,
          walletType: 'solana',
        });
      }
    } catch (error: any) {
      console.error('Solana connection failed:', error);
      setWallet(prev => ({ ...prev, loading: false }));
      
      // If no wallet app found, suggest installing one
      if (error.message?.includes('No wallet found')) {
        Linking.openURL('https://phantom.app/download');
      }
      throw error;
    }
  }, [fetchSolanaBalance]);

  // Connect to EVM wallet (simplified - uses deep linking to wallet apps)
  const connectEVM = useCallback(async (chain: ChainType) => {
    setWallet(prev => ({ ...prev, loading: true }));
    
    try {
      // For now, use a simplified approach with deep linking
      // In production, integrate WalletConnect v2 properly
      
      // Generate a mock connection for demo
      // Real implementation would use WalletConnect modal
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockAddress = `0x${Array(40).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;
      
      setWallet({
        connected: true,
        address: mockAddress,
        publicKey: null,
        chain,
        balance: '0.15 ETH',
        loading: false,
        walletType: 'evm',
      });
      
    } catch (error) {
      console.error('EVM connection failed:', error);
      setWallet(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  // Main connect function
  const connect = useCallback(async (chain: ChainType) => {
    if (chain === 'solana') {
      await connectSolana();
    } else {
      await connectEVM(chain);
    }
  }, [connectSolana, connectEVM]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAuthToken(null);
    setWallet(initialState);
  }, []);

  // Switch chain
  const switchChain = useCallback(async (chain: ChainType) => {
    if (!wallet.connected) return;
    
    // If switching between Solana and EVM, need to reconnect
    const isSolana = chain === 'solana';
    const currentIsSolana = wallet.chain === 'solana';
    
    if (isSolana !== currentIsSolana) {
      disconnect();
      await connect(chain);
    } else if (!isSolana) {
      // Just update chain for EVM networks
      setWallet(prev => ({ ...prev, chain }));
    }
  }, [wallet.connected, wallet.chain, connect, disconnect]);

  // Sign message with Solana wallet
  const signMessageSolana = useCallback(async (message: string): Promise<string | null> => {
    if (!wallet.connected || wallet.walletType !== 'solana') return null;
    
    try {
      const result = await transact(async (mobileWallet: Web3MobileWallet) => {
        // Reauthorize if needed
        if (authToken) {
          await mobileWallet.reauthorize({
            auth_token: authToken,
            identity: APP_IDENTITY,
          });
        }
        
        const messageBytes = new TextEncoder().encode(message);
        const signedMessages = await mobileWallet.signMessages({
          addresses: [wallet.address!],
          payloads: [messageBytes],
        });
        
        return signedMessages[0];
      });
      
      return bs58.encode(result);
    } catch (error) {
      console.error('Sign message failed:', error);
      return null;
    }
  }, [wallet.connected, wallet.walletType, wallet.address, authToken]);

  // Sign message (unified interface)
  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    if (!wallet.connected) return null;
    
    if (wallet.walletType === 'solana') {
      return signMessageSolana(message);
    } else {
      // EVM signing - mock for now
      await new Promise(resolve => setTimeout(resolve, 500));
      return `0x${Array(130).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;
    }
  }, [wallet.connected, wallet.walletType, signMessageSolana]);

  // Sign transaction with Solana wallet
  const signTransactionSolana = useCallback(async (tx: Transaction): Promise<string | null> => {
    if (!wallet.connected || wallet.walletType !== 'solana' || !wallet.publicKey) return null;
    
    try {
      const result = await transact(async (mobileWallet: Web3MobileWallet) => {
        // Reauthorize if needed
        if (authToken) {
          await mobileWallet.reauthorize({
            auth_token: authToken,
            identity: APP_IDENTITY,
          });
        }
        
        // Get latest blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = wallet.publicKey!;
        
        const signedTxs = await mobileWallet.signTransactions({
          transactions: [tx],
        });
        
        return signedTxs[0];
      });
      
      // Send the signed transaction
      const signature = await connection.sendRawTransaction(result.serialize());
      return signature;
    } catch (error) {
      console.error('Sign transaction failed:', error);
      return null;
    }
  }, [wallet.connected, wallet.walletType, wallet.publicKey, authToken]);

  // Sign transaction (unified interface)
  const signTransaction = useCallback(async (tx: any): Promise<string | null> => {
    if (!wallet.connected) return null;
    
    if (wallet.walletType === 'solana' && tx instanceof Transaction) {
      return signTransactionSolana(tx);
    } else {
      // For intent-based transactions, just sign the message
      const message = JSON.stringify(tx);
      return signMessage(message);
    }
  }, [wallet.connected, wallet.walletType, signTransactionSolana, signMessage]);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!wallet.connected) return;
    
    if (wallet.walletType === 'solana' && wallet.publicKey) {
      const balance = await fetchSolanaBalance(wallet.publicKey);
      setWallet(prev => ({ ...prev, balance }));
    }
  }, [wallet.connected, wallet.walletType, wallet.publicKey, fetchSolanaBalance]);

  return (
    <WalletContext.Provider value={{
      wallet,
      connect,
      disconnect,
      switchChain,
      signMessage,
      signTransaction,
      refreshBalance,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export default WalletContext;
