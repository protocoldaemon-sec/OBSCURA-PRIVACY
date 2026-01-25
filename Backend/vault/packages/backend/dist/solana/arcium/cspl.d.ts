/**
 * cSPL (Confidential SPL) Token Integration
 *
 * Enables confidential token operations on Solana:
 * - Encrypted balances that hide amounts
 * - Private transfers with range proofs
 * - Selective disclosure via viewing keys
 *
 * Based on Arcium's confidential token standard which extends
 * SPL Token with MPC-based encryption.
 */
import type { ArciumConfig, ConfidentialTokenAccount, ConfidentialTransfer, EncryptedValue, ViewingKey } from './types.js';
/** cSPL program IDs */
export declare const CSPL_PROGRAM_IDS: {
    readonly mainnet: "cSPL1111111111111111111111111111111111111111";
    readonly devnet: "cSPLdev111111111111111111111111111111111111";
};
/** cSPL instruction types */
export declare enum CSPLInstruction {
    InitializeAccount = 0,
    ConfigureAccount = 1,
    ApproveAccount = 2,
    EmptyAccount = 3,
    Deposit = 4,
    Withdraw = 5,
    Transfer = 6,
    ApplyPendingBalance = 7,
    EnableConfidentialCredits = 8,
    DisableConfidentialCredits = 9,
    EnableNonConfidentialCredits = 10,
    DisableNonConfidentialCredits = 11
}
/**
 * cSPL Client for confidential token operations
 */
export declare class CSPLClient {
    private config;
    private programId;
    constructor(config: ArciumConfig);
    /**
     * Initialize a confidential token account
     *
     * Creates an account that can hold encrypted token balances
     */
    initializeAccount(mint: string, owner: string, decryptionKeyHandle?: string): Promise<{
        account: string;
        instruction: Uint8Array;
    }>;
    /**
     * Deposit tokens into confidential account
     *
     * Converts regular SPL tokens to encrypted balance
     */
    deposit(account: string, amount: bigint, sourceTokenAccount: string): Promise<{
        instruction: Uint8Array;
        encryptedAmount: EncryptedValue;
    }>;
    /**
     * Withdraw tokens from confidential account
     *
     * Converts encrypted balance back to regular SPL tokens
     * Requires proof that withdrawal amount <= encrypted balance
     */
    withdraw(account: string, amount: bigint, destinationTokenAccount: string, decryptionProof: Uint8Array): Promise<{
        instruction: Uint8Array;
    }>;
    /**
     * Transfer tokens confidentially
     *
     * Transfers encrypted amounts between confidential accounts
     * without revealing the transfer amount
     */
    transfer(source: string, destination: string, encryptedAmount: EncryptedValue, proofs: {
        rangeProof: Uint8Array;
        equalityProof: Uint8Array;
    }): Promise<ConfidentialTransfer>;
    /**
     * Build transfer instruction with proofs
     */
    buildTransferInstruction(transfer: ConfidentialTransfer): Promise<Uint8Array>;
    /**
     * Apply pending balance to available balance
     *
     * After receiving a transfer, the recipient must apply
     * the pending balance to make it spendable
     */
    applyPendingBalance(account: string, expectedPendingBalance: EncryptedValue, decryptionProof: Uint8Array): Promise<{
        instruction: Uint8Array;
    }>;
    /**
     * Get confidential account info
     */
    getAccount(address: string): Promise<ConfidentialTokenAccount | null>;
    /**
     * Create a viewing key for selective disclosure
     */
    createViewingKey(account: string, viewerPubKey: Uint8Array, permissions: ViewingKey['permissions'], expiresAt?: number): Promise<ViewingKey>;
    /**
     * Decrypt balance using viewing key
     */
    decryptBalance(account: string, viewingKey: ViewingKey): Promise<bigint>;
    /**
     * Generate range proof for a transfer
     *
     * Proves that the transfer amount is:
     * 1. Non-negative
     * 2. Less than or equal to the sender's balance
     */
    generateRangeProof(account: string, amount: bigint, encryptedBalance: EncryptedValue): Promise<Uint8Array>;
    /**
     * Generate equality proof for transfer
     *
     * Proves that the encrypted amount sent equals the encrypted amount received
     */
    generateEqualityProof(sourceEncrypted: EncryptedValue, destEncrypted: EncryptedValue): Promise<Uint8Array>;
    private encryptAmount;
    private deriveConfidentialAccount;
    private encodeInstruction;
    private serializeEncryptedValue;
    private parseAccountData;
}
/**
 * Create cSPL client from environment
 */
export declare function createCSPLClient(config: ArciumConfig): CSPLClient;
//# sourceMappingURL=cspl.d.ts.map