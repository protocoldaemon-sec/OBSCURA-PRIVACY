/**
 * Compressed PDA (Program Derived Address) Operations
 *
 * Create and manage compressed accounts with PDAs:
 * - Derive compressed PDAs
 * - Create compressed accounts
 * - Update compressed account data
 * - Close compressed accounts
 */
/** Light Protocol program IDs */
export const LIGHT_PROGRAM_IDS = {
    /** Light System Program */
    systemProgram: 'SySTEM1eSU2p4BGQfQpimFEWWSC1XDFeun3Nqzz3rT7',
    /** Compressed Token Program */
    compressedToken: 'cTokenmWW8bLPjZEBAUgYy3zKxQZW6VKi7bqNFEVv3m',
    /** Account Compression Program */
    accountCompression: 'cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK',
    /** Noop Program (for logging) */
    noop: 'noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV',
};
/**
 * Compressed PDA Manager
 *
 * Handles creation and management of compressed accounts
 */
export class CompressedPDAManager {
    photon;
    stateTree = null;
    constructor(_config, photon) {
        this.photon = photon;
    }
    /**
     * Set the state tree to use for operations
     */
    setStateTree(tree) {
        this.stateTree = tree;
    }
    /**
     * Derive a compressed PDA
     */
    async deriveCompressedPDA(seeds, programId) {
        // Compressed PDA derivation uses Poseidon hash
        const seedsHash = await this.hashSeeds(seeds);
        const programIdBytes = this.decodeBase58(programId);
        // Find bump that produces valid address
        for (let bump = 255; bump >= 0; bump--) {
            const bumpSeed = new Uint8Array([bump]);
            const address = await this.poseidonHash([
                seedsHash,
                programIdBytes,
                bumpSeed,
            ]);
            // Check if address is valid (not on ed25519 curve)
            if (this.isValidPDA(address)) {
                return { address, bump };
            }
        }
        throw new Error('Failed to derive compressed PDA');
    }
    /**
     * Create a new compressed account
     */
    async createCompressedAccount(owner, data, lamports = 0n, seeds) {
        if (!this.stateTree) {
            throw new Error('State tree not configured');
        }
        // Derive address if seeds provided
        let address;
        if (seeds && seeds.length > 0) {
            const derived = await this.deriveCompressedPDA(seeds, owner);
            address = derived.address;
        }
        // Compute account hash
        const dataHash = await this.sha256(data);
        const accountHash = await this.computeAccountHash({
            owner,
            lamports,
            data,
            dataHash,
            address: address ? this.encodeBase58(address) : undefined,
        });
        // Build create instruction
        const instruction = this.encodeCreateInstruction({
            owner,
            lamports,
            data,
            dataHash,
            address,
            stateTree: this.stateTree.pubkey,
        });
        return { instruction, accountHash };
    }
    /**
     * Create a compressed token account
     */
    async createCompressedTokenAccount(mint, owner) {
        // Token account data layout
        const data = this.encodeTokenAccountData({
            mint,
            owner,
            amount: 0n,
            delegate: null,
            delegatedAmount: 0n,
            isFrozen: false,
            closeAuthority: null,
        });
        return this.createCompressedAccount(LIGHT_PROGRAM_IDS.compressedToken, data, 0n, [this.decodeBase58(mint), this.decodeBase58(owner)]);
    }
    /**
     * Update compressed account data
     */
    async updateCompressedAccount(accountWithProof, newData) {
        if (!this.stateTree) {
            throw new Error('State tree not configured');
        }
        const account = accountWithProof.account;
        const newDataHash = await this.sha256(newData);
        // Compute new account hash
        const newAccountHash = await this.computeAccountHash({
            owner: account.owner,
            lamports: account.lamports,
            data: newData,
            dataHash: newDataHash,
            address: account.address,
        });
        // Build update instruction with proof
        const instruction = this.encodeUpdateInstruction({
            inputAccount: account,
            inputProof: accountWithProof.proof,
            newData,
            newDataHash,
            stateTree: this.stateTree.pubkey,
        });
        return { instruction, newAccountHash };
    }
    /**
     * Close a compressed account
     */
    async closeCompressedAccount(accountWithProof, recipient) {
        if (!this.stateTree) {
            throw new Error('State tree not configured');
        }
        const instruction = this.encodeCloseInstruction({
            inputAccount: accountWithProof.account,
            inputProof: accountWithProof.proof,
            recipient,
            stateTree: this.stateTree.pubkey,
        });
        return { instruction };
    }
    /**
     * Transfer compressed tokens
     */
    async transferCompressedTokens(sourceAccountsWithProofs, destinationOwner, amount, mint) {
        if (!this.stateTree) {
            throw new Error('State tree not configured');
        }
        // Calculate total input amount
        let totalInput = 0n;
        for (const acc of sourceAccountsWithProofs) {
            const tokenData = this.decodeTokenAccountData(acc.account.data);
            totalInput += tokenData.amount;
        }
        if (totalInput < amount) {
            throw new Error(`Insufficient balance: have ${totalInput}, need ${amount}`);
        }
        // Build transfer instruction
        const instruction = this.encodeTokenTransferInstruction({
            sourceAccounts: sourceAccountsWithProofs,
            destinationOwner,
            amount,
            mint,
            stateTree: this.stateTree.pubkey,
        });
        return { instruction };
    }
    /**
     * Get validity proof for accounts
     */
    async getValidityProof(inputAccounts) {
        const hashes = inputAccounts.map(a => a.account.hash);
        const proofData = await this.photon.getValidityProof(hashes);
        return {
            compressedProof: proofData.compressedProof,
            rootIndices: proofData.rootIndices,
            leafIndices: proofData.leafIndices,
            newStateRoots: proofData.roots,
        };
    }
    // ============ Private Methods ============
    async computeAccountHash(account) {
        const ownerBytes = this.decodeBase58(account.owner);
        const lamportsBytes = this.encodeBigInt(account.lamports);
        const addressBytes = account.address
            ? this.decodeBase58(account.address)
            : new Uint8Array(32);
        return this.poseidonHash([
            ownerBytes,
            lamportsBytes,
            account.dataHash,
            addressBytes,
        ]);
    }
    async hashSeeds(seeds) {
        if (seeds.length === 0) {
            return new Uint8Array(32);
        }
        return this.poseidonHash(seeds);
    }
    async poseidonHash(inputs) {
        // Poseidon hash implementation
        // In production, use @lightprotocol/zk.js or similar
        // This is a placeholder using SHA-256
        const combined = new Uint8Array(inputs.reduce((acc, input) => acc + input.length, 0));
        let offset = 0;
        for (const input of inputs) {
            combined.set(input, offset);
            offset += input.length;
        }
        return this.sha256(combined);
    }
    async sha256(data) {
        const hash = await crypto.subtle.digest('SHA-256', data);
        return new Uint8Array(hash);
    }
    isValidPDA(address) {
        // Check if address is off the ed25519 curve
        // Simplified check - in production use proper curve check
        return address[31] < 128;
    }
    encodeCreateInstruction(params) {
        const encoder = new TextEncoder();
        return encoder.encode(JSON.stringify({
            instruction: 'createCompressedAccount',
            ...params,
            lamports: params.lamports.toString(),
            data: Buffer.from(params.data).toString('base64'),
            dataHash: Buffer.from(params.dataHash).toString('base64'),
            address: params.address ? Buffer.from(params.address).toString('base64') : null,
        }));
    }
    encodeUpdateInstruction(params) {
        const encoder = new TextEncoder();
        return encoder.encode(JSON.stringify({
            instruction: 'updateCompressedAccount',
            inputHash: Buffer.from(params.inputAccount.hash).toString('base64'),
            proof: params.inputProof.proof.map(p => Buffer.from(p).toString('base64')),
            newData: Buffer.from(params.newData).toString('base64'),
            newDataHash: Buffer.from(params.newDataHash).toString('base64'),
            stateTree: params.stateTree,
        }));
    }
    encodeCloseInstruction(params) {
        const encoder = new TextEncoder();
        return encoder.encode(JSON.stringify({
            instruction: 'closeCompressedAccount',
            inputHash: Buffer.from(params.inputAccount.hash).toString('base64'),
            proof: params.inputProof.proof.map(p => Buffer.from(p).toString('base64')),
            recipient: params.recipient,
            stateTree: params.stateTree,
        }));
    }
    encodeTokenTransferInstruction(params) {
        const encoder = new TextEncoder();
        return encoder.encode(JSON.stringify({
            instruction: 'transferCompressedTokens',
            sourceHashes: params.sourceAccounts.map(a => Buffer.from(a.account.hash).toString('base64')),
            proofs: params.sourceAccounts.map(a => a.proof.proof.map(p => Buffer.from(p).toString('base64'))),
            destinationOwner: params.destinationOwner,
            amount: params.amount.toString(),
            mint: params.mint,
            stateTree: params.stateTree,
        }));
    }
    encodeTokenAccountData(data) {
        const encoder = new TextEncoder();
        return encoder.encode(JSON.stringify({
            ...data,
            amount: data.amount.toString(),
            delegatedAmount: data.delegatedAmount.toString(),
        }));
    }
    decodeTokenAccountData(data) {
        const decoder = new TextDecoder();
        const parsed = JSON.parse(decoder.decode(data));
        return {
            ...parsed,
            amount: BigInt(parsed.amount),
            delegatedAmount: BigInt(parsed.delegatedAmount),
        };
    }
    encodeBigInt(value) {
        const buffer = new ArrayBuffer(8);
        new DataView(buffer).setBigUint64(0, value, true);
        return new Uint8Array(buffer);
    }
    decodeBase58(encoded) {
        // Simplified base58 decode - in production use bs58
        const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        const bytes = [];
        for (const char of encoded) {
            let carry = ALPHABET.indexOf(char);
            if (carry < 0)
                throw new Error('Invalid base58 character');
            for (let i = 0; i < bytes.length; i++) {
                carry += bytes[i] * 58;
                bytes[i] = carry & 0xff;
                carry >>= 8;
            }
            while (carry > 0) {
                bytes.push(carry & 0xff);
                carry >>= 8;
            }
        }
        // Add leading zeros
        for (const char of encoded) {
            if (char !== '1')
                break;
            bytes.push(0);
        }
        return new Uint8Array(bytes.reverse());
    }
    encodeBase58(bytes) {
        const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        const digits = [0];
        for (const byte of bytes) {
            let carry = byte;
            for (let i = 0; i < digits.length; i++) {
                carry += digits[i] << 8;
                digits[i] = carry % 58;
                carry = Math.floor(carry / 58);
            }
            while (carry > 0) {
                digits.push(carry % 58);
                carry = Math.floor(carry / 58);
            }
        }
        // Add leading '1's for leading zeros
        let result = '';
        for (const byte of bytes) {
            if (byte !== 0)
                break;
            result += '1';
        }
        for (let i = digits.length - 1; i >= 0; i--) {
            result += ALPHABET[digits[i]];
        }
        return result;
    }
}
/**
 * Create Compressed PDA Manager
 */
export function createCompressedPDAManager(config, photon) {
    return new CompressedPDAManager(config, photon);
}
//# sourceMappingURL=compressed-pda.js.map