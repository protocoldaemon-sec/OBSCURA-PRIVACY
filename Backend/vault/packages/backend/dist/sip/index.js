/**
 * SIP (Shielded Intent Protocol) Privacy Layer
 *
 * SDK Integration with @sip-protocol/sdk providing:
 * - Multiple privacy levels (TRANSPARENT, SHIELDED, COMPLIANT)
 * - EIP-5564 stealth addressing via SDK
 * - Pedersen commitments for amount hiding
 * - Viewing keys for selective disclosure
 * - Solver quote integration
 */
// Main client
export { SIPClient, SIP, PrivacyLevel } from './client.js';
// Stealth addressing (SDK wrapper)
export { StealthAddressing, generateStealthMetaAddress, generateStealthAddress, encodeStealthMetaAddress, decodeStealthMetaAddress, } from './stealth.js';
// Encryption with Pedersen commitments
export { IntentEncryption, commit, verifyOpening, addCommitments, generateViewingKey, encryptForViewing, decryptWithViewing, } from './encryption.js';
//# sourceMappingURL=index.js.map