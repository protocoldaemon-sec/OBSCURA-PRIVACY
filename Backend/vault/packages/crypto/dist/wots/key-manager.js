/**
 * WOTS Key Manager
 *
 * Manages pre-generated WOTS key pools with:
 * - Key generation and storage
 * - Index tracking and burn enforcement
 * - Merkle tree commitment
 * - State persistence
 */
import { WOTSScheme, createWOTS } from './scheme.js';
import { MerkleTree } from '../merkle/tree.js';
import { randomBytes, toHex } from '../hash.js';
/**
 * WOTS Key Manager class
 *
 * Handles pre-generated key pools with XMSS-style Merkle commitment
 */
export class WOTSKeyManager {
    pool;
    scheme;
    merkleTree;
    constructor(pool, scheme, merkleTree) {
        this.pool = pool;
        this.scheme = scheme;
        this.merkleTree = merkleTree;
    }
    /**
     * Create a new key pool with pre-generated keys
     */
    static async create(options) {
        const { keyCount, w = 16, seed, id = toHex(randomBytes(16)) } = options;
        if (keyCount <= 0) {
            throw new Error('keyCount must be positive');
        }
        if (keyCount > 1024 * 1024) {
            throw new Error('keyCount too large (max 1M keys)');
        }
        // Ensure key count is power of 2 for Merkle tree
        const actualKeyCount = nextPowerOf2(keyCount);
        const scheme = createWOTS(w);
        const keys = [];
        // Generate all keys
        for (let i = 0; i < actualKeyCount; i++) {
            const privateKey = seed
                ? scheme.derivePrivateKey(seed, i)
                : scheme.generatePrivateKey();
            const publicKey = scheme.computePublicKey(privateKey);
            const publicKeyHash = scheme.hashPublicKey(publicKey);
            keys.push({
                index: i,
                privateKey,
                publicKey,
                publicKeyHash,
                used: false
            });
        }
        // Build Merkle tree from public key hashes
        const leaves = keys.map(k => k.publicKeyHash);
        const merkleTree = MerkleTree.fromLeaves(leaves);
        const pool = {
            id,
            createdAt: Date.now(),
            params: scheme.params,
            keys,
            merkleRoot: merkleTree.root,
            nextIndex: 0,
            totalKeys: actualKeyCount,
            usedKeys: 0
        };
        return new WOTSKeyManager(pool, scheme, merkleTree);
    }
    /**
     * Restore a key manager from serialized pool state
     */
    static fromState(state) {
        const scheme = new WOTSScheme(state.params);
        const leaves = state.keys.map(k => k.publicKeyHash);
        const merkleTree = MerkleTree.fromLeaves(leaves);
        return new WOTSKeyManager(state, scheme, merkleTree);
    }
    /**
     * Get the Merkle root of all public keys
     *
     * This is what gets registered on-chain or with the SIP backend
     */
    getMerkleRoot() {
        return this.pool.merkleRoot;
    }
    /**
     * Get pool statistics
     */
    getStats() {
        return {
            total: this.pool.totalKeys,
            used: this.pool.usedKeys,
            available: this.pool.totalKeys - this.pool.usedKeys
        };
    }
    /**
     * Get the next available key index
     */
    getNextIndex() {
        return this.pool.nextIndex;
    }
    /**
     * Check if a key index has been used
     */
    isKeyUsed(index) {
        if (index < 0 || index >= this.pool.totalKeys) {
            throw new Error(`Key index out of range: ${index}`);
        }
        return this.pool.keys[index].used;
    }
    /**
     * Get available key count
     */
    availableKeys() {
        return this.pool.totalKeys - this.pool.usedKeys;
    }
    /**
     * Sign an intent hash using the next available key
     *
     * This will:
     * 1. Get next unused key
     * 2. Sign the intent hash
     * 3. Mark the key as burned
     * 4. Generate Merkle proof
     *
     * @returns Signed intent with signature and Merkle proof
     */
    signIntent(intentHash) {
        if (intentHash.length !== 32) {
            throw new Error('Intent hash must be 32 bytes');
        }
        // Find next available key
        const keyEntry = this.getNextUnusedKey();
        if (!keyEntry) {
            throw new Error('No available keys in pool');
        }
        // Sign the intent
        const signature = this.scheme.sign(keyEntry.privateKey, intentHash);
        // Mark key as used
        this.burnKey(keyEntry.index, intentHash);
        // Generate Merkle proof
        const merkleProof = this.merkleTree.getProof(keyEntry.index);
        return {
            intentHash,
            keyIndex: keyEntry.index,
            signature,
            publicKey: keyEntry.publicKey,
            merkleProof,
            merkleRoot: this.pool.merkleRoot
        };
    }
    /**
     * Sign with a specific key index (advanced use)
     *
     * WARNING: Make sure you know what you're doing!
     * This bypasses the sequential key usage pattern.
     */
    signWithKey(keyIndex, intentHash) {
        if (keyIndex < 0 || keyIndex >= this.pool.totalKeys) {
            throw new Error(`Key index out of range: ${keyIndex}`);
        }
        const keyEntry = this.pool.keys[keyIndex];
        if (keyEntry.used) {
            throw new Error(`Key ${keyIndex} has already been used (burned)`);
        }
        if (intentHash.length !== 32) {
            throw new Error('Intent hash must be 32 bytes');
        }
        // Sign the intent
        const signature = this.scheme.sign(keyEntry.privateKey, intentHash);
        // Mark key as used
        this.burnKey(keyIndex, intentHash);
        // Generate Merkle proof
        const merkleProof = this.merkleTree.getProof(keyIndex);
        return {
            intentHash,
            keyIndex,
            signature,
            publicKey: keyEntry.publicKey,
            merkleProof,
            merkleRoot: this.pool.merkleRoot
        };
    }
    /**
     * Verify a signed intent
     *
     * Checks:
     * 1. WOTS signature is valid
     * 2. Public key matches Merkle proof
     * 3. Merkle proof leads to expected root
     */
    verifySignedIntent(signedIntent, expectedRoot) {
        try {
            // Verify WOTS signature
            const isValidSig = this.scheme.verifyWithPublicKey(signedIntent.signature, signedIntent.intentHash, signedIntent.publicKey);
            if (!isValidSig) {
                return false;
            }
            // Verify public key hash matches the leaf in Merkle proof
            const publicKeyHash = this.scheme.hashPublicKey(signedIntent.publicKey);
            // Verify Merkle proof
            const root = expectedRoot ?? this.pool.merkleRoot;
            return this.merkleTree.verifyProof(signedIntent.merkleProof, publicKeyHash, root);
        }
        catch {
            return false;
        }
    }
    /**
     * Export pool state for persistence
     *
     * WARNING: Contains private keys! Handle with extreme care.
     */
    exportState() {
        return { ...this.pool };
    }
    /**
     * Export public pool info (safe to share)
     *
     * Contains only public keys and Merkle root
     */
    exportPublicInfo() {
        return {
            id: this.pool.id,
            merkleRoot: this.pool.merkleRoot,
            totalKeys: this.pool.totalKeys,
            usedKeys: this.pool.usedKeys,
            params: this.pool.params
        };
    }
    /**
     * Get Merkle proof for a key index
     */
    getKeyProof(keyIndex) {
        if (keyIndex < 0 || keyIndex >= this.pool.totalKeys) {
            throw new Error(`Key index out of range: ${keyIndex}`);
        }
        return this.merkleTree.getProof(keyIndex);
    }
    /**
     * Get public key for an index
     */
    getPublicKey(keyIndex) {
        if (keyIndex < 0 || keyIndex >= this.pool.totalKeys) {
            throw new Error(`Key index out of range: ${keyIndex}`);
        }
        return this.pool.keys[keyIndex].publicKey;
    }
    // ============ Private Methods ============
    getNextUnusedKey() {
        // First try the nextIndex hint
        if (this.pool.nextIndex < this.pool.totalKeys) {
            const key = this.pool.keys[this.pool.nextIndex];
            if (!key.used) {
                return key;
            }
        }
        // Otherwise scan for first unused key
        for (let i = 0; i < this.pool.totalKeys; i++) {
            if (!this.pool.keys[i].used) {
                this.pool.nextIndex = i;
                return this.pool.keys[i];
            }
        }
        return null;
    }
    burnKey(index, intentHash) {
        const key = this.pool.keys[index];
        key.used = true;
        key.usedAt = Date.now();
        key.usedFor = intentHash;
        this.pool.usedKeys++;
        // Update nextIndex hint
        if (index === this.pool.nextIndex) {
            this.pool.nextIndex = index + 1;
        }
        // Clear private key from memory (security measure)
        for (const sk of key.privateKey) {
            sk.fill(0);
        }
        key.privateKey = [];
    }
}
/**
 * Helper: Get next power of 2
 */
function nextPowerOf2(n) {
    if (n <= 1)
        return 1;
    return Math.pow(2, Math.ceil(Math.log2(n)));
}
//# sourceMappingURL=key-manager.js.map