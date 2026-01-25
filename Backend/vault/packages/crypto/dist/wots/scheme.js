/**
 * WOTS+ Scheme Implementation
 *
 * Core cryptographic operations for Winternitz One-Time Signatures
 */
import { hash, hashWithDomain, randomBytes, HASH_SIZE } from '../hash.js';
import { computeWOTSParams } from './params.js';
/**
 * WOTS+ Scheme class
 */
export class WOTSScheme {
    params;
    constructor(params) {
        this.params = params ?? computeWOTSParams(16, 32);
    }
    /**
     * Generate a new WOTS private key
     *
     * Private key is len random n-byte values
     */
    generatePrivateKey() {
        const sk = [];
        for (let i = 0; i < this.params.len; i++) {
            sk.push(randomBytes(this.params.n));
        }
        return sk;
    }
    /**
     * Derive private key from seed (deterministic)
     *
     * Useful for HD-wallet style derivation
     */
    derivePrivateKey(seed, index) {
        const sk = [];
        const indexBytes = new Uint8Array(4);
        new DataView(indexBytes.buffer).setUint32(0, index, false);
        for (let i = 0; i < this.params.len; i++) {
            const chainIndexBytes = new Uint8Array(4);
            new DataView(chainIndexBytes.buffer).setUint32(0, i, false);
            const combined = new Uint8Array(seed.length + 8);
            combined.set(seed, 0);
            combined.set(indexBytes, seed.length);
            combined.set(chainIndexBytes, seed.length + 4);
            sk.push(hashWithDomain('WOTS_SK', combined));
        }
        return sk;
    }
    /**
     * Compute public key from private key
     *
     * Each chain: apply hash (w-1) times
     */
    computePublicKey(privateKey) {
        if (privateKey.length !== this.params.len) {
            throw new Error(`Invalid private key length: expected ${this.params.len}, got ${privateKey.length}`);
        }
        const pk = [];
        for (let i = 0; i < this.params.len; i++) {
            pk.push(this.chain(privateKey[i], 0, this.params.w - 1, i));
        }
        return pk;
    }
    /**
     * Sign a message hash
     *
     * @param privateKey - WOTS private key (one-time use!)
     * @param messageHash - Hash of the message to sign
     */
    sign(privateKey, messageHash) {
        if (privateKey.length !== this.params.len) {
            throw new Error(`Invalid private key length: expected ${this.params.len}, got ${privateKey.length}`);
        }
        if (messageHash.length !== this.params.n) {
            throw new Error(`Invalid message hash length: expected ${this.params.n}, got ${messageHash.length}`);
        }
        // Convert message to base-w representation
        const msgBaseW = this.baseW(messageHash, this.params.len1);
        // Compute checksum
        const checksum = this.computeChecksum(msgBaseW);
        // Combine message digits and checksum digits
        const allDigits = [...msgBaseW, ...checksum];
        // Generate signature
        const sig = [];
        for (let i = 0; i < this.params.len; i++) {
            sig.push(this.chain(privateKey[i], 0, allDigits[i], i));
        }
        return sig;
    }
    /**
     * Verify a signature and recover public key
     *
     * @param signature - WOTS signature
     * @param messageHash - Hash of the signed message
     * @returns Recovered public key
     */
    verify(signature, messageHash) {
        if (signature.length !== this.params.len) {
            throw new Error(`Invalid signature length: expected ${this.params.len}, got ${signature.length}`);
        }
        if (messageHash.length !== this.params.n) {
            throw new Error(`Invalid message hash length: expected ${this.params.n}, got ${messageHash.length}`);
        }
        // Convert message to base-w representation
        const msgBaseW = this.baseW(messageHash, this.params.len1);
        // Compute checksum
        const checksum = this.computeChecksum(msgBaseW);
        // Combine message digits and checksum digits
        const allDigits = [...msgBaseW, ...checksum];
        // Recover public key by completing the chains
        const recoveredPk = [];
        for (let i = 0; i < this.params.len; i++) {
            const remaining = this.params.w - 1 - allDigits[i];
            recoveredPk.push(this.chain(signature[i], allDigits[i], remaining, i));
        }
        return recoveredPk;
    }
    /**
     * Check if signature is valid for a message given expected public key
     */
    verifyWithPublicKey(signature, messageHash, publicKey) {
        try {
            const recoveredPk = this.verify(signature, messageHash);
            return this.publicKeysEqual(recoveredPk, publicKey);
        }
        catch {
            return false;
        }
    }
    /**
     * Compute hash of public key (for Merkle tree leaf)
     */
    hashPublicKey(publicKey) {
        // Concatenate all public key elements and hash
        const totalLength = publicKey.reduce((acc, pk) => acc + pk.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const pk of publicKey) {
            combined.set(pk, offset);
            offset += pk.length;
        }
        return hashWithDomain('WOTS_PK', combined);
    }
    /**
     * Compare two public keys for equality
     */
    publicKeysEqual(a, b) {
        if (a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i].length !== b[i].length)
                return false;
            for (let j = 0; j < a[i].length; j++) {
                if (a[i][j] !== b[i][j])
                    return false;
            }
        }
        return true;
    }
    /**
     * Serialize public key to bytes
     */
    serializePublicKey(publicKey) {
        const result = new Uint8Array(this.params.len * this.params.n);
        for (let i = 0; i < publicKey.length; i++) {
            result.set(publicKey[i], i * this.params.n);
        }
        return result;
    }
    /**
     * Deserialize bytes to public key
     */
    deserializePublicKey(bytes) {
        if (bytes.length !== this.params.len * this.params.n) {
            throw new Error(`Invalid serialized public key length`);
        }
        const pk = [];
        for (let i = 0; i < this.params.len; i++) {
            pk.push(bytes.slice(i * this.params.n, (i + 1) * this.params.n));
        }
        return pk;
    }
    /**
     * Serialize signature to bytes
     */
    serializeSignature(signature) {
        const result = new Uint8Array(this.params.len * this.params.n);
        for (let i = 0; i < signature.length; i++) {
            result.set(signature[i], i * this.params.n);
        }
        return result;
    }
    /**
     * Deserialize bytes to signature
     */
    deserializeSignature(bytes) {
        if (bytes.length !== this.params.len * this.params.n) {
            throw new Error(`Invalid serialized signature length`);
        }
        const sig = [];
        for (let i = 0; i < this.params.len; i++) {
            sig.push(bytes.slice(i * this.params.n, (i + 1) * this.params.n));
        }
        return sig;
    }
    // ============ Private Methods ============
    /**
     * Hash chain function F
     *
     * Chain(x, start, steps, chainIndex)
     * Applies hash `steps` times starting from position `start`
     */
    chain(x, start, steps, chainIndex) {
        if (steps === 0) {
            return new Uint8Array(x);
        }
        let result = new Uint8Array(x);
        const chainIndexBytes = new Uint8Array(4);
        new DataView(chainIndexBytes.buffer).setUint32(0, chainIndex, false);
        for (let i = start; i < start + steps; i++) {
            const posBytes = new Uint8Array(4);
            new DataView(posBytes.buffer).setUint32(0, i, false);
            // Domain-separated hash: H(chainIndex || position || value)
            const combined = new Uint8Array(8 + result.length);
            combined.set(chainIndexBytes, 0);
            combined.set(posBytes, 4);
            combined.set(result, 8);
            result = new Uint8Array(hash(combined));
        }
        return result;
    }
    /**
     * Convert bytes to base-w representation
     */
    baseW(input, outLen) {
        const log2w = Math.log2(this.params.w);
        const result = [];
        let bits = 0;
        let total = 0;
        let consumed = 0;
        for (let i = 0; i < outLen; i++) {
            // Get more bits if needed
            while (bits < log2w) {
                if (consumed < input.length) {
                    total = (total << 8) | input[consumed];
                    consumed++;
                    bits += 8;
                }
                else {
                    // Pad with zeros if we run out of input
                    total = total << (log2w - bits);
                    bits = log2w;
                }
            }
            // Extract one base-w digit
            bits -= log2w;
            result.push((total >> bits) & (this.params.w - 1));
        }
        return result;
    }
    /**
     * Compute checksum for base-w message
     */
    computeChecksum(msgBaseW) {
        // Sum of (w-1 - digit) for each message digit
        let checksum = 0;
        for (const digit of msgBaseW) {
            checksum += (this.params.w - 1) - digit;
        }
        // Shift checksum left by padding bits
        const log2w = Math.log2(this.params.w);
        const neededBits = this.params.len2 * log2w;
        const checksumBits = Math.ceil(Math.log2(this.params.len1 * (this.params.w - 1) + 1));
        const shift = neededBits - checksumBits;
        if (shift > 0) {
            checksum = checksum << shift;
        }
        // Convert checksum to bytes then to base-w
        const checksumBytes = new Uint8Array(Math.ceil(neededBits / 8));
        let temp = checksum;
        for (let i = checksumBytes.length - 1; i >= 0; i--) {
            checksumBytes[i] = temp & 0xff;
            temp = temp >> 8;
        }
        return this.baseW(checksumBytes, this.params.len2);
    }
}
/**
 * Create a new WOTS scheme with specified w parameter
 */
export function createWOTS(w = 16) {
    return new WOTSScheme(computeWOTSParams(w, HASH_SIZE));
}
//# sourceMappingURL=scheme.js.map