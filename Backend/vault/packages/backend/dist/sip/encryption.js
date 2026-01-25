/**
 * Intent Encryption - SDK Wrapper
 *
 * Secure encryption for solver intents using @sip-protocol/sdk
 * with Pedersen commitments for amount hiding
 */
import { commit, verifyOpening, addCommitments, generateViewingKey, encryptForViewing, decryptWithViewing, } from '@sip-protocol/sdk';
import { randomBytes, bytesToHex } from '@noble/hashes/utils';
/**
 * Intent Encryption class
 *
 * Uses @sip-protocol/sdk for:
 * - Pedersen commitments for amount hiding
 * - Viewing key encryption for compliance
 */
export class IntentEncryption {
    /**
     * Create Pedersen commitment using SDK
     */
    static createPedersenCommitment(value) {
        // Use SDK commit function (blinding is auto-generated if not provided)
        const result = commit(value);
        return {
            commitment: result.commitment,
            blindingFactor: result.blinding,
        };
    }
    /**
     * Verify Pedersen commitment opening
     */
    static verifyCommitment(commitment, value, blindingFactor) {
        return verifyOpening(commitment, value, blindingFactor);
    }
    /**
     * Add two commitments (homomorphic property)
     */
    static addCommitments(c1, c2) {
        const result = addCommitments(c1, c2);
        // CommitmentPoint may be a different type, convert to HexString
        return result;
    }
    /**
     * Generate viewing key pair for COMPLIANT mode
     */
    static generateViewingKeyPair(path) {
        return generateViewingKey(path);
    }
    /**
     * Encrypt data for viewing key holder (regulators)
     */
    static encryptForViewer(data, viewingKey) {
        return encryptForViewing(data, viewingKey);
    }
    /**
     * Decrypt data with viewing key (for compliance)
     */
    static decryptWithViewingKey(encrypted, viewingKey) {
        return decryptWithViewing(encrypted, viewingKey);
    }
    /**
     * Encrypt intent with privacy level support
     */
    static encryptIntent(intent, recipientPubKey, privacyLevel = 'SHIELDED', viewingKey) {
        const nonce = randomBytes(24);
        // Create amount commitment (placeholder value)
        const { commitment } = this.createPedersenCommitment(BigInt(0));
        // For COMPLIANT mode, add viewing key encryption layer
        if (privacyLevel === 'COMPLIANT' && viewingKey) {
            // Create TransactionData from intent
            const txData = {
                sender: '0x0000000000000000000000000000000000000000',
                recipient: '0x0000000000000000000000000000000000000000',
                amount: '0x' + bytesToHex(intent),
                timestamp: Date.now(),
            };
            const encrypted = this.encryptForViewer(txData, viewingKey);
            return {
                ciphertext: Buffer.from(encrypted.ciphertext.slice(2), 'hex'),
                ephemeralPubKey: recipientPubKey,
                nonce,
                commitment,
                privacyLevel,
            };
        }
        // Standard encryption (SHIELDED/TRANSPARENT)
        return {
            ciphertext: intent, // Placeholder - real impl uses SDK encryption
            ephemeralPubKey: recipientPubKey,
            nonce,
            commitment,
            privacyLevel,
        };
    }
}
// Re-export SDK functions and types
export { commit, verifyOpening, addCommitments, generateViewingKey, encryptForViewing, decryptWithViewing };
//# sourceMappingURL=encryption.js.map