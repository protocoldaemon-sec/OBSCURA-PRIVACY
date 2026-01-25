/**
 * EVM Settlement Service
 * 
 * Handles real on-chain transactions for Ethereum/EVM chains (Sepolia testnet)
 * Implements proper Obscura flow: Deposit → Vault → Settlement → Withdrawal
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther, encodeFunctionData, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import type { Hash, Address } from 'viem';

// Contract ABIs (minimal for our needs)
const VAULT_ABI = parseAbi([
  'function depositNative() external payable returns (bytes32 commitment)',
  'function depositToken(address token, uint256 amount) external returns (bytes32 commitment)',
  'function executeAuthorizedWithdrawal(bytes32 commitment, address token, address recipient, uint256 amount) external',
  'function getBalance(address token) external view returns (uint256)',
  'function isCommitmentUsed(bytes32 commitment) external view returns (bool)',
  'function computeWithdrawalCommitment(address token, address recipient, uint256 amount) external view returns (bytes32)',
  'function owner() external view returns (address)',
  'function settlementContract() external view returns (address)',
  'function setSettlementContract(address newSettlementContract) external',
  'event Deposited(address indexed depositor, address indexed token, uint256 amount, bytes32 indexed depositCommitment)',
  'event Withdrawn(bytes32 indexed commitment, address indexed token, address indexed recipient, uint256 amount)',
]);

const SETTLEMENT_ABI = parseAbi([
  'function updateRoot(bytes32 newRoot) external returns (uint256 batchId)',
  'function settle(bytes32 commitment, bytes32[] calldata proof, uint256 leafIndex) external',
  'function isCommitmentUsed(bytes32 commitment) external view returns (bool)',
  'function currentRoot() external view returns (bytes32)',
  'function currentBatchId() external view returns (uint256)',
  'event RootUpdated(bytes32 indexed newRoot, uint256 indexed batchId, uint256 timestamp)',
  'event CommitmentSettled(bytes32 indexed commitment, uint256 indexed batchId, address executor)',
]);

export interface EVMSettlementConfig {
  rpcUrl: string;
  privateKey: string;
  vaultAddress?: string;
  settlementAddress?: string;
}

export interface TransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
  blockNumber?: bigint;
  depositCommitment?: string;
}

export interface DepositResult {
  success: boolean;
  txHash?: string;
  commitment?: string;
  error?: string;
}

export interface WithdrawalResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * EVM Settlement Service - Proper Obscura Implementation
 */
export class EVMSettlementService {
  private publicClient;
  private walletClient;
  private account;
  private rpcUrl: string;
  private vaultAddress: Address | null;
  private settlementAddress: Address | null;

  constructor(config: EVMSettlementConfig) {
    this.rpcUrl = config.rpcUrl;
    
    // Create account from private key
    const privateKey = config.privateKey.startsWith('0x') 
      ? config.privateKey as `0x${string}`
      : `0x${config.privateKey}` as `0x${string}`;
    
    this.account = privateKeyToAccount(privateKey);
    
    // Create clients
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(config.rpcUrl),
    });
    
    this.walletClient = createWalletClient({
      account: this.account,
      chain: sepolia,
      transport: http(config.rpcUrl),
    });
    
    this.vaultAddress = config.vaultAddress as Address || null;
    this.settlementAddress = config.settlementAddress as Address || null;
    
    console.log(`[EVMSettlement] Initialized with account: ${this.account.address}`);
    if (this.vaultAddress) {
      console.log(`[EVMSettlement] Vault: ${this.vaultAddress}`);
    }
    if (this.settlementAddress) {
      console.log(`[EVMSettlement] Settlement: ${this.settlementAddress}`);
    }
  }

  /**
   * Get account address
   */
  getAccountAddress(): string {
    return this.account.address;
  }

  /**
   * Get account balance in ETH
   */
  async getBalance(): Promise<string> {
    const balance = await this.publicClient.getBalance({
      address: this.account.address,
    });
    return formatEther(balance);
  }

  /**
   * Get vault balance for a token
   */
  async getVaultBalance(token: Address = '0x0000000000000000000000000000000000000000'): Promise<string> {
    if (!this.vaultAddress) {
      throw new Error('Vault address not configured');
    }

    const balance = await this.publicClient.readContract({
      address: this.vaultAddress,
      abi: VAULT_ABI,
      functionName: 'getBalance',
      args: [token],
    });

    return formatEther(balance as bigint);
  }

  /**
   * Check if this account is authorized to execute withdrawals
   */
  async isAuthorizedOnVault(): Promise<{ isOwner: boolean; isSettlement: boolean; owner: string; settlement: string }> {
    if (!this.vaultAddress) {
      throw new Error('Vault address not configured');
    }

    const [owner, settlement] = await Promise.all([
      this.publicClient.readContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: 'owner',
      }),
      this.publicClient.readContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: 'settlementContract',
      }),
    ]);

    return {
      isOwner: (owner as string).toLowerCase() === this.account.address.toLowerCase(),
      isSettlement: (settlement as string).toLowerCase() === this.account.address.toLowerCase(),
      owner: owner as string,
      settlement: settlement as string,
    };
  }

  /**
   * Authorize this account on the vault (must be owner)
   */
  async authorizeOnVault(): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!this.vaultAddress) {
      return { success: false, error: 'Vault address not configured' };
    }

    try {
      // Check if already authorized
      const auth = await this.isAuthorizedOnVault();
      if (auth.isSettlement) {
        console.log('[EVMSettlement] Already authorized on vault');
        return { success: true };
      }

      if (!auth.isOwner) {
        return { success: false, error: `Not owner of vault. Owner: ${auth.owner}` };
      }

      // Set this account as settlement contract
      const hash = await this.walletClient.writeContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: 'setSettlementContract',
        args: [this.account.address],
      });

      console.log(`[EVMSettlement] Authorization tx sent: ${hash}`);

      await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      console.log('[EVMSettlement] Successfully authorized on vault');
      return { success: true, txHash: hash };
    } catch (error) {
      console.error('[EVMSettlement] Authorization failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Deposit ETH to vault (proper Obscura flow)
   */
  async depositToVault(amountETH: string): Promise<DepositResult> {
    if (!this.vaultAddress) {
      return { success: false, error: 'Vault address not configured' };
    }

    try {
      const value = parseEther(amountETH);

      // Call depositNative on vault
      const hash = await this.walletClient.writeContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: 'depositNative',
        value,
      });

      console.log(`[EVMSettlement] Deposit tx sent: ${hash}`);

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      // Extract commitment from logs
      let commitment: string | undefined;
      for (const log of receipt.logs) {
        // Deposited event topic
        if (log.topics[0] === '0x5548c837ab068cf56a2c2479df0882a4922fd203edb7517321831d95078c5f62') {
          commitment = log.topics[3]; // depositCommitment is indexed
        }
      }

      console.log(`[EVMSettlement] Deposit confirmed, commitment: ${commitment}`);
      
      return {
        success: true,
        txHash: hash,
        commitment,
      };
    } catch (error) {
      console.error('[EVMSettlement] Deposit failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute withdrawal from vault (proper Obscura flow)
   */
  async executeWithdrawal(
    commitment: `0x${string}`,
    token: Address,
    recipient: Address,
    amountWei: bigint
  ): Promise<WithdrawalResult> {
    if (!this.vaultAddress) {
      return { success: false, error: 'Vault address not configured' };
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: 'executeAuthorizedWithdrawal',
        args: [commitment, token, recipient, amountWei],
      });

      console.log(`[EVMSettlement] Withdrawal tx sent: ${hash}`);

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      console.log(`[EVMSettlement] Withdrawal confirmed in block ${receipt.blockNumber}`);
      
      return {
        success: true,
        txHash: hash,
      };
    } catch (error) {
      console.error('[EVMSettlement] Withdrawal failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update settlement root (batch commitment)
   */
  async updateSettlementRoot(newRoot: `0x${string}`): Promise<{ success: boolean; batchId?: bigint; txHash?: string; error?: string }> {
    if (!this.settlementAddress) {
      return { success: false, error: 'Settlement address not configured' };
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: this.settlementAddress,
        abi: SETTLEMENT_ABI,
        functionName: 'updateRoot',
        args: [newRoot],
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      // Extract batchId from logs
      let batchId: bigint | undefined;
      for (const log of receipt.logs) {
        if (log.topics[0] === '0x2cbc14f49c068133583f7cb530018af451c87c1cf1327cf2a4ff4698c4730aa4') {
          batchId = BigInt(log.topics[2] || '0');
        }
      }

      console.log(`[EVMSettlement] Root updated, batchId: ${batchId}`);
      
      return {
        success: true,
        txHash: hash,
        batchId,
      };
    } catch (error) {
      console.error('[EVMSettlement] Update root failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Legacy: Direct ETH transfer (NOT recommended - bypasses privacy)
   * @deprecated Use depositToVault + executeWithdrawal for proper privacy
   */
  async transferETH(recipient: string, amountETH: string): Promise<TransferResult> {
    try {
      const recipientAddress = recipient as Address;
      const value = parseEther(amountETH);

      // Send transaction
      const hash = await this.walletClient.sendTransaction({
        to: recipientAddress,
        value,
      });

      console.log(`[EVMSettlement] Transaction sent: ${hash}`);

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      console.log(`[EVMSettlement] Transfer confirmed in block ${receipt.blockNumber}`);
      
      return {
        success: true,
        txHash: hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('[EVMSettlement] Transfer failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if connected to network
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.publicClient.getBlockNumber();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Private withdrawal from vault using nullifier (relayer pattern)
   * This provides privacy - relayer executes, depositor identity hidden
   */
  async privateWithdrawalWithNullifier(
    recipient: string,
    amountETH: string,
    commitment: string,
    nullifierHash: string
  ): Promise<WithdrawalResult> {
    if (!this.vaultAddress) {
      return { success: false, error: 'Vault address not configured' };
    }

    try {
      const recipientAddress = recipient as Address;
      const amountWei = parseEther(amountETH);
      const commitmentBytes = commitment.startsWith('0x') ? commitment : `0x${commitment}`;
      
      // For now, use executeAuthorizedWithdrawal since contract doesn't have nullifier support yet
      // In production, contract would verify nullifier on-chain
      const hash = await this.walletClient.writeContract({
        address: this.vaultAddress,
        abi: VAULT_ABI,
        functionName: 'executeAuthorizedWithdrawal',
        args: [
          commitmentBytes as `0x${string}`,
          '0x0000000000000000000000000000000000000000' as Address, // Native ETH
          recipientAddress,
          amountWei,
        ],
      });

      console.log(`[EVMSettlement] Private withdrawal tx sent: ${hash}`);
      console.log(`[EVMSettlement] Nullifier hash: ${nullifierHash}`);
      console.log(`[EVMSettlement] Caller (relayer): ${this.account.address}`);

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      console.log(`[EVMSettlement] Private withdrawal confirmed in block ${receipt.blockNumber}`);
      
      return {
        success: true,
        txHash: hash,
      };
    } catch (error) {
      console.error('[EVMSettlement] Private withdrawal failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get balance of any address
   */
  async getAddressBalance(address: string): Promise<string> {
    const balance = await this.publicClient.getBalance({
      address: address as Address,
    });
    return formatEther(balance);
  }
}

/**
 * Create EVM settlement service from environment
 */
export function createEVMSettlementService(): EVMSettlementService | null {
  const rpcUrl = process.env.ETH_RPC_URL;
  const privateKey = process.env.ETH_PRIVATE_KEY;
  const vaultAddress = process.env.ETH_VAULT_CONTRACT;
  const settlementAddress = process.env.ETH_SETTLEMENT_CONTRACT;

  if (!rpcUrl || !privateKey) {
    console.warn('[EVMSettlement] Missing required env vars (ETH_RPC_URL, ETH_PRIVATE_KEY)');
    return null;
  }

  return new EVMSettlementService({
    rpcUrl,
    privateKey,
    vaultAddress,
    settlementAddress,
  });
}
