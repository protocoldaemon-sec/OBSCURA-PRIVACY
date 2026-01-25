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
/** cSPL program IDs */
export const CSPL_PROGRAM_IDS = {
    mainnet: 'cSPL1111111111111111111111111111111111111111',
    devnet: 'cSPLdev111111111111111111111111111111111111',
};
/** cSPL instruction types */
export var CSPLInstruction;
(function (CSPLInstruction) {
    CSPLInstruction[CSPLInstruction["InitializeAccount"] = 0] = "InitializeAccount";
    CSPLInstruction[CSPLInstruction["ConfigureAccount"] = 1] = "ConfigureAccount";
    CSPLInstruction[CSPLInstruction["ApproveAccount"] = 2] = "ApproveAccount";
    CSPLInstruction[CSPLInstruction["EmptyAccount"] = 3] = "EmptyAccount";
    CSPLInstruction[CSPLInstruction["Deposit"] = 4] = "Deposit";
    CSPLInstruction[CSPLInstruction["Withdraw"] = 5] = "Withdraw";
    CSPLInstruction[CSPLInstruction["Transfer"] = 6] = "Transfer";
    CSPLInstruction[CSPLInstruction["ApplyPendingBalance"] = 7] = "ApplyPendingBalance";
    CSPLInstruction[CSPLInstruction["EnableConfidentialCredits"] = 8] = "EnableConfidentialCredits";
    CSPLInstruction[CSPLInstruction["DisableConfidentialCredits"] = 9] = "DisableConfidentialCredits";
    CSPLInstruction[CSPLInstruction["EnableNonConfidentialCredits"] = 10] = "EnableNonConfidentialCredits";
    CSPLInstruction[CSPLInstruction["DisableNonConfidentialCredits"] = 11] = "DisableNonConfidentialCredits";
})(CSPLInstruction || (CSPLInstruction = {}));
/**
 * cSPL Client for confidential token operations
 */
export class CSPLClient {
    config;
    programId;
    constructor(config) {
        this.config = config;
        this.programId = config.solanaCluster === 'mainnet-beta'
            ? CSPL_PROGRAM_IDS.mainnet
            : CSPL_PROGRAM_IDS.devnet;
    }
    /**
     * Initialize a confidential token account
     *
     * Creates an account that can hold encrypted token balances
     */
    async initializeAccount(mint, owner, decryptionKeyHandle) {
        // Build the initialize instruction
        const instructionData = this.encodeInstruction(CSPLInstruction.InitializeAccount, {
            mint,
            owner,
            decryptionKeyHandle,
        });
        // Derive the account PDA
        const account = await this.deriveConfidentialAccount(mint, owner);
        return {
            account,
            instruction: instructionData,
        };
    }
    /**
     * Deposit tokens into confidential account
     *
     * Converts regular SPL tokens to encrypted balance
     */
    async deposit(account, amount, sourceTokenAccount) {
        // Encrypt the amount using the account's encryption key
        const encryptedAmount = await this.encryptAmount(account, amount);
        const instructionData = this.encodeInstruction(CSPLInstruction.Deposit, {
            account,
            amount: amount.toString(),
            sourceTokenAccount,
            encryptedAmount: this.serializeEncryptedValue(encryptedAmount),
        });
        return {
            instruction: instructionData,
            encryptedAmount,
        };
    }
    /**
     * Withdraw tokens from confidential account
     *
     * Converts encrypted balance back to regular SPL tokens
     * Requires proof that withdrawal amount <= encrypted balance
     */
    async withdraw(account, amount, destinationTokenAccount, decryptionProof) {
        const instructionData = this.encodeInstruction(CSPLInstruction.Withdraw, {
            account,
            amount: amount.toString(),
            destinationTokenAccount,
            decryptionProof: Buffer.from(decryptionProof).toString('base64'),
        });
        return { instruction: instructionData };
    }
    /**
     * Transfer tokens confidentially
     *
     * Transfers encrypted amounts between confidential accounts
     * without revealing the transfer amount
     */
    async transfer(source, destination, encryptedAmount, proofs) {
        return {
            source,
            destination,
            encryptedAmount,
            rangeProof: proofs.rangeProof,
            equalityProof: proofs.equalityProof,
            feePayer: source, // Default to source as fee payer
        };
    }
    /**
     * Build transfer instruction with proofs
     */
    async buildTransferInstruction(transfer) {
        return this.encodeInstruction(CSPLInstruction.Transfer, {
            source: transfer.source,
            destination: transfer.destination,
            encryptedAmount: this.serializeEncryptedValue(transfer.encryptedAmount),
            rangeProof: Buffer.from(transfer.rangeProof).toString('base64'),
            equalityProof: Buffer.from(transfer.equalityProof).toString('base64'),
        });
    }
    /**
     * Apply pending balance to available balance
     *
     * After receiving a transfer, the recipient must apply
     * the pending balance to make it spendable
     */
    async applyPendingBalance(account, expectedPendingBalance, decryptionProof) {
        const instructionData = this.encodeInstruction(CSPLInstruction.ApplyPendingBalance, {
            account,
            expectedPendingBalance: this.serializeEncryptedValue(expectedPendingBalance),
            decryptionProof: Buffer.from(decryptionProof).toString('base64'),
        });
        return { instruction: instructionData };
    }
    /**
     * Get confidential account info
     */
    async getAccount(address) {
        const response = await fetch(`${this.config.rpcUrl}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'get-cspl-account',
                method: 'getAccountInfo',
                params: [address, { encoding: 'base64' }],
            }),
        });
        const result = await response.json();
        if (!result.result?.value) {
            return null;
        }
        return this.parseAccountData(address, result.result.value.data[0]);
    }
    /**
     * Create a viewing key for selective disclosure
     */
    async createViewingKey(account, viewerPubKey, permissions, expiresAt) {
        // Generate viewing key via MXE
        const response = await fetch(`${this.config.mxeEndpoint}/v1/viewing-key`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clusterId: this.config.clusterId,
                account,
                viewerPubKey: Buffer.from(viewerPubKey).toString('base64'),
                permissions,
                expiresAt,
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to create viewing key: ${response.statusText}`);
        }
        const result = await response.json();
        return {
            keyId: result.keyId,
            encryptedKey: new Uint8Array(Buffer.from(result.encryptedKey, 'base64')),
            viewerPubKey,
            permissions,
            expiresAt,
        };
    }
    /**
     * Decrypt balance using viewing key
     */
    async decryptBalance(account, viewingKey) {
        const response = await fetch(`${this.config.mxeEndpoint}/v1/decrypt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clusterId: this.config.clusterId,
                account,
                viewingKeyId: viewingKey.keyId,
                encryptedKey: Buffer.from(viewingKey.encryptedKey).toString('base64'),
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to decrypt balance: ${response.statusText}`);
        }
        const result = await response.json();
        return BigInt(result.balance);
    }
    /**
     * Generate range proof for a transfer
     *
     * Proves that the transfer amount is:
     * 1. Non-negative
     * 2. Less than or equal to the sender's balance
     */
    async generateRangeProof(account, amount, encryptedBalance) {
        const response = await fetch(`${this.config.mxeEndpoint}/v1/proofs/range`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clusterId: this.config.clusterId,
                account,
                amount: amount.toString(),
                encryptedBalance: this.serializeEncryptedValue(encryptedBalance),
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to generate range proof: ${response.statusText}`);
        }
        const result = await response.json();
        return new Uint8Array(Buffer.from(result.proof, 'base64'));
    }
    /**
     * Generate equality proof for transfer
     *
     * Proves that the encrypted amount sent equals the encrypted amount received
     */
    async generateEqualityProof(sourceEncrypted, destEncrypted) {
        const response = await fetch(`${this.config.mxeEndpoint}/v1/proofs/equality`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clusterId: this.config.clusterId,
                source: this.serializeEncryptedValue(sourceEncrypted),
                destination: this.serializeEncryptedValue(destEncrypted),
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to generate equality proof: ${response.statusText}`);
        }
        const result = await response.json();
        return new Uint8Array(Buffer.from(result.proof, 'base64'));
    }
    // ============ Private Methods ============
    async encryptAmount(account, amount) {
        const response = await fetch(`${this.config.mxeEndpoint}/v1/encrypt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clusterId: this.config.clusterId,
                account,
                plaintext: amount.toString(),
                type: 'amount',
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to encrypt amount: ${response.statusText}`);
        }
        const result = await response.json();
        return {
            ciphertext: new Uint8Array(Buffer.from(result.ciphertext, 'base64')),
            nonce: new Uint8Array(Buffer.from(result.nonce, 'base64')),
            ephemeralPubKey: new Uint8Array(Buffer.from(result.ephemeralPubKey, 'base64')),
            commitment: new Uint8Array(Buffer.from(result.commitment, 'base64')),
        };
    }
    async deriveConfidentialAccount(mint, owner) {
        // PDA derivation for confidential account
        // In production, use @solana/web3.js PublicKey.findProgramAddressSync
        const encoder = new TextEncoder();
        const seeds = encoder.encode(`cspl:${mint}:${owner}`);
        const hash = await crypto.subtle.digest('SHA-256', seeds);
        return Buffer.from(hash).toString('hex').slice(0, 44);
    }
    encodeInstruction(type, data) {
        const encoder = new TextEncoder();
        const json = JSON.stringify({ instruction: type, ...data });
        return encoder.encode(json);
    }
    serializeEncryptedValue(value) {
        return JSON.stringify({
            ciphertext: Buffer.from(value.ciphertext).toString('base64'),
            nonce: Buffer.from(value.nonce).toString('base64'),
            ephemeralPubKey: Buffer.from(value.ephemeralPubKey).toString('base64'),
            commitment: Buffer.from(value.commitment).toString('base64'),
        });
    }
    parseAccountData(address, data) {
        const decoded = Buffer.from(data, 'base64');
        // Parse account data structure
        // This is a simplified version - actual parsing depends on Arcium's account layout
        return {
            address,
            mint: decoded.slice(0, 32).toString('hex'),
            owner: decoded.slice(32, 64).toString('hex'),
            encryptedBalance: {
                ciphertext: decoded.slice(64, 128),
                nonce: decoded.slice(128, 152),
                ephemeralPubKey: decoded.slice(152, 184),
                commitment: decoded.slice(184, 216),
            },
            state: 'initialized',
        };
    }
}
/**
 * Create cSPL client from environment
 */
export function createCSPLClient(config) {
    return new CSPLClient(config);
}
//# sourceMappingURL=cspl.js.map