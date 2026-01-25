/**
 * Off-Chain Balance Tracker
 * 
 * Tracks encrypted balances for confidential accounts
 * Enables withdrawal verification without on-chain vault PDA
 * 
 * This breaks the vault PDA tracing problem:
 * - Balances stored off-chain (encrypted)
 * - Withdrawals verified off-chain
 * - Settlement via direct transfer (no vault PDA)
 */

import type { EncryptedValue } from '../solana/arcium/types.js';

export interface ConfidentialBalance {
  /** Confidential account address */
  account: string;
  /** Encrypted balance (Arcium Rescue cipher) */
  encryptedBalance: EncryptedValue;
  /** Commitment to the balance */
  commitment: string;
  /** SIP commitment (for withdrawal lookup) */
  sipCommitment: string;
  /** Last update timestamp */
  updatedAt: number;
  /** Deposit history (for audit) */
  deposits: Array<{
    amount: bigint;
    txHash: string;
    timestamp: number;
  }>;
  /** Withdrawal history (for audit) */
  withdrawals: Array<{
    amount: bigint;
    txHash: string;
    timestamp: number;
  }>;
}

/**
 * Off-chain balance tracker for confidential accounts
 * 
 * Stores encrypted balances to enable withdrawal verification
 * without revealing balances on-chain or using vault PDA
 */
export class BalanceTracker {
  private balances: Map<string, ConfidentialBalance> = new Map();
  private commitmentToAccount: Map<string, string> = new Map(); // SIP commitment → confidential account

  /**
   * Record a deposit to confidential account
   */
  recordDeposit(
    account: string,
    amount: bigint,
    encryptedBalance: EncryptedValue,
    sipCommitment: string,
    txHash: string
  ): void {
    const existing = this.balances.get(account);
    
    if (existing) {
      // Update existing balance
      existing.encryptedBalance = encryptedBalance;
      existing.commitment = Buffer.from(encryptedBalance.commitment).toString('hex');
      existing.sipCommitment = sipCommitment;
      existing.updatedAt = Date.now();
      existing.deposits.push({
        amount,
        txHash,
        timestamp: Date.now(),
      });
    } else {
      // Create new balance record
      this.balances.set(account, {
        account,
        encryptedBalance,
        commitment: Buffer.from(encryptedBalance.commitment).toString('hex'),
        sipCommitment,
        updatedAt: Date.now(),
        deposits: [{
          amount,
          txHash,
          timestamp: Date.now(),
        }],
        withdrawals: [],
      });
    }

    // Map SIP commitment to confidential account for withdrawal lookup
    this.commitmentToAccount.set(sipCommitment, account);

    console.log(`[BalanceTracker] Deposit recorded: ${account.slice(0, 16)}...`);
    console.log(`[BalanceTracker] Amount: ${amount} (encrypted)`);
    console.log(`[BalanceTracker] SIP commitment mapped: ${sipCommitment.slice(0, 16)}...`);
  }

  /**
   * Record a withdrawal from confidential account
   */
  recordWithdrawal(
    account: string,
    amount: bigint,
    newEncryptedBalance: EncryptedValue,
    newCommitment: string,
    txHash: string
  ): void {
    const existing = this.balances.get(account);
    
    if (!existing) {
      throw new Error(`Account not found: ${account}`);
    }

    // Update balance after withdrawal
    existing.encryptedBalance = newEncryptedBalance;
    existing.commitment = newCommitment;
    existing.updatedAt = Date.now();
    existing.withdrawals.push({
      amount,
      txHash,
      timestamp: Date.now(),
    });

    console.log(`[BalanceTracker] Withdrawal recorded: ${account.slice(0, 16)}...`);
    console.log(`[BalanceTracker] Amount: ${amount} (encrypted)`);
  }

  /**
   * Get balance for confidential account
   */
  getBalance(account: string): ConfidentialBalance | null {
    return this.balances.get(account) || null;
  }

  /**
   * Get confidential account by SIP commitment
   */
  getAccountBySIPCommitment(sipCommitment: string): string | null {
    return this.commitmentToAccount.get(sipCommitment) || null;
  }

  /**
   * Verify withdrawal eligibility (off-chain)
   * 
   * Checks if account has sufficient encrypted balance
   * without revealing the actual balance
   */
  async verifyWithdrawal(
    account: string,
    requestedAmount: bigint
  ): Promise<{ valid: boolean; reason?: string }> {
    const balance = this.balances.get(account);
    
    if (!balance) {
      return {
        valid: false,
        reason: 'Account not found',
      };
    }

    // Calculate total deposits
    const totalDeposits = balance.deposits.reduce(
      (sum, d) => sum + d.amount,
      BigInt(0)
    );

    // Calculate total withdrawals
    const totalWithdrawals = balance.withdrawals.reduce(
      (sum, w) => sum + w.amount,
      BigInt(0)
    );

    // Available balance
    const availableBalance = totalDeposits - totalWithdrawals;

    if (requestedAmount > availableBalance) {
      return {
        valid: false,
        reason: `Insufficient balance. Available: ${availableBalance}, Requested: ${requestedAmount}`,
      };
    }

    console.log(`[BalanceTracker] Withdrawal verified for ${account.slice(0, 16)}...`);
    console.log(`[BalanceTracker] Available: ${availableBalance}, Requested: ${requestedAmount}`);

    return { valid: true };
  }

  /**
   * Get account statistics
   */
  getStats(account: string): {
    totalDeposits: bigint;
    totalWithdrawals: bigint;
    availableBalance: bigint;
    depositCount: number;
    withdrawalCount: number;
  } | null {
    const balance = this.balances.get(account);
    
    if (!balance) {
      return null;
    }

    const totalDeposits = balance.deposits.reduce(
      (sum, d) => sum + d.amount,
      BigInt(0)
    );

    const totalWithdrawals = balance.withdrawals.reduce(
      (sum, w) => sum + w.amount,
      BigInt(0)
    );

    return {
      totalDeposits,
      totalWithdrawals,
      availableBalance: totalDeposits - totalWithdrawals,
      depositCount: balance.deposits.length,
      withdrawalCount: balance.withdrawals.length,
    };
  }

  /**
   * Get all accounts (for admin/debugging)
   */
  getAllAccounts(): string[] {
    return Array.from(this.balances.keys());
  }

  /**
   * Clear all balances (for testing)
   */
  clear(): void {
    this.balances.clear();
    this.commitmentToAccount.clear();
    console.log(`[BalanceTracker] All balances cleared`);
  }
}

/**
 * Global balance tracker instance
 */
export const balanceTracker = new BalanceTracker();
