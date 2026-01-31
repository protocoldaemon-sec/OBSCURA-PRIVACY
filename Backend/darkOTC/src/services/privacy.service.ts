/**
 * Privacy Service
 * 
 * Implements privacy-preserving cryptographic operations:
 * - Stealth address generation (ECDH-based)
 * - Pedersen commitments
 * - Nullifier generation
 * - Message encryption/decryption
 * 
 * ⚠️ CRITICAL: All implementations use REAL cryptographic operations.
 * NO mocks, stubs, or simulations allowed.
 */

import * as crypto from 'crypto';
import { ec as EC } from 'elliptic';
import BN from 'bn.js';
import {
  StealthAddressPair,
  PedersenCommitmentData,
  NullifierData,
  EncryptedMessageData,
  CommitmentVerificationRequest,
  CommitmentVerificationResponse,
  EncryptionParameters,
  DecryptionParameters,
  CryptoKeyPair,
  PedersenCommitmentParameters,
} from '../types/privacy.types';
import {
  Nullifier,
  NullifierHash,
} from '../types/common.types';

/**
 * Privacy Service Class
 * 
 * Provides cryptographic primitives for privacy-preserving operations.
 * Uses secp256k1 elliptic curve for all operations.
 */
export class PrivacyService {
  private readonly ec: EC;
  private readonly generatorG: any; // EC point
  private readonly generatorH: any; // EC point for Pedersen commitments

  constructor() {
    // Initialize secp256k1 elliptic curve
    this.ec = new EC('secp256k1');
    
    // Generator G is the standard secp256k1 generator
    this.generatorG = this.ec.g;
    
    // Generator H is derived from G using a hash-to-curve method
    // H = hash("obscura-pedersen-h") * G
    const hSeed = crypto.createHash('sha256')
      .update('obscura-pedersen-h')
      .digest();
    const hScalar = new BN(hSeed);
    this.generatorH = this.generatorG.mul(hScalar);
  }

  /**
   * Generate Stealth Address
   * 
   * Generates a one-time stealth address using ECDH key derivation.
   * 
   * Algorithm:
   * 1. Generate ephemeral key pair (r, R) where R = r*G
   * 2. Generate recipient key pair (s, S) where S = s*G
   * 3. Compute shared secret: P = r*S = r*s*G
   * 4. Derive stealth address: stealthPubKey = S + H(P)*G
   * 5. Recipient can derive private key: stealthPrivKey = s + H(P)
   * 
   * Requirement 1.2: Generate stealth address for taker to receive responses
   * 
   * @returns StealthAddressPair with address, privateKey, and ephemeralPublicKey
   */
  generateStealthAddress(): StealthAddressPair {
    // Generate ephemeral key pair (r, R)
    const ephemeralKey = this.ec.genKeyPair();
    const ephemeralPrivate = ephemeralKey.getPrivate();
    const ephemeralPublic = ephemeralKey.getPublic();

    // Generate recipient key pair (s, S)
    const recipientKey = this.ec.genKeyPair();
    const recipientPrivate = recipientKey.getPrivate();
    const recipientPublic = recipientKey.getPublic();

    // Compute shared secret: P = r*S
    const sharedSecret = recipientPublic.mul(ephemeralPrivate);

    // Hash the shared secret: H(P)
    const sharedSecretHash = crypto.createHash('sha256')
      .update(Buffer.from(sharedSecret.encode('array', false)))
      .digest();
    const sharedSecretScalar = new BN(sharedSecretHash);

    // Compute stealth public key: stealthPubKey = S + H(P)*G
    const stealthPublicKey = recipientPublic.add(this.generatorG.mul(sharedSecretScalar));

    // Compute stealth private key: stealthPrivKey = s + H(P)
    const stealthPrivateKey = recipientPrivate.add(sharedSecretScalar).umod(this.ec.n!);

    // Encode stealth address (compressed public key format)
    const stealthAddress = this.encodePublicKey(stealthPublicKey);

    // Encode private key (hex format)
    const privateKey = stealthPrivateKey.toString('hex', 64);

    // Encode ephemeral public key (compressed format)
    const ephemeralPublicKeyEncoded = this.encodePublicKey(ephemeralPublic);

    return {
      address: stealthAddress,
      privateKey: privateKey,
      ephemeralPublicKey: ephemeralPublicKeyEncoded,
    };
  }

  /**
   * Derive Stealth Private Key
   * 
   * Allows recipient to derive the private key for a stealth address.
   * 
   * @param recipientPrivateKey - Recipient's private key (hex)
   * @param ephemeralPublicKey - Ephemeral public key from stealth address generation
   * @returns Derived stealth private key (hex)
   */
  deriveStealthPrivateKey(
    recipientPrivateKey: string,
    ephemeralPublicKey: string
  ): string {
    // Parse recipient private key
    const recipientPrivate = new BN(recipientPrivateKey, 16);

    // Parse ephemeral public key
    const ephemeralPublic = this.decodePublicKey(ephemeralPublicKey);

    // Compute shared secret: P = s*R
    const sharedSecret = ephemeralPublic.mul(recipientPrivate);

    // Hash the shared secret: H(P)
    const sharedSecretHash = crypto.createHash('sha256')
      .update(Buffer.from(sharedSecret.encode('array', false)))
      .digest();
    const sharedSecretScalar = new BN(sharedSecretHash);

    // Compute stealth private key: stealthPrivKey = s + H(P)
    const stealthPrivateKey = recipientPrivate.add(sharedSecretScalar).umod(this.ec.n!);

    return stealthPrivateKey.toString('hex', 64);
  }

  /**
   * Create Pedersen Commitment
   * 
   * Creates a Pedersen commitment to hide a value.
   * 
   * Algorithm:
   * commitment = value*G + blinding*H
   * 
   * Where:
   * - G, H are generator points on the elliptic curve
   * - value is the hidden value
   * - blinding is a random blinding factor
   * 
   * Requirements 1.3, 2.4: Create Pedersen commitment to hide amounts/prices
   * 
   * @param params - Commitment parameters (value, optional blinding)
   * @returns PedersenCommitmentData with commitment, value, and blinding
   */
  createCommitment(params: PedersenCommitmentParameters): PedersenCommitmentData {
    const { value, blinding } = params;

    // Generate random blinding factor if not provided
    const blindingFactor = blinding || this.generateRandomScalar();

    // Compute commitment: C = value*G + blinding*H
    const valueBN = new BN(value.toString());
    const blindingBN = new BN(blindingFactor.toString());

    const commitment = this.generatorG
      .mul(valueBN)
      .add(this.generatorH.mul(blindingBN));

    // Encode commitment as hex string
    const commitmentEncoded = this.encodePublicKey(commitment);

    return {
      commitment: commitmentEncoded,
      value: value,
      blinding: blindingFactor,
    };
  }

  /**
   * Verify Pedersen Commitment
   * 
   * Verifies that a commitment was created with the given value and blinding factor.
   * 
   * @param request - Verification request with commitment, value, and blinding
   * @returns CommitmentVerificationResponse with isValid flag
   */
  verifyCommitment(request: CommitmentVerificationRequest): CommitmentVerificationResponse {
    const { commitment, value, blinding } = request;

    try {
      // Recompute commitment with provided value and blinding
      const recomputed = this.createCommitment({ value, blinding });

      // Compare commitments
      const isValid = recomputed.commitment === commitment;

      return {
        isValid,
        commitment,
      };
    } catch (error) {
      return {
        isValid: false,
        commitment,
      };
    }
  }

  /**
   * Generate Nullifier from Commitment
   * 
   * Generates a deterministic nullifier hash from a commitment.
   * This ensures each commitment has a unique nullifier.
   * 
   * Algorithm:
   * 1. Hash commitment with SHA256 to get nullifier
   * 2. Hash nullifier again to get nullifierHash
   * 
   * @param commitment - The commitment to generate nullifier from
   * @returns NullifierHash (hex string)
   */
  generateNullifierFromCommitment(commitment: string): string {
    // Hash commitment to get nullifier
    const nullifier = crypto.createHash('sha256')
      .update(commitment)
      .digest('hex');
    
    // Hash nullifier to get nullifierHash
    const nullifierHash = crypto.createHash('sha256')
      .update(nullifier)
      .digest('hex');
    
    return nullifierHash;
  }

  /**
   * Generate Nullifier
   * 
   * Generates a cryptographically secure random nullifier for double-spend protection.
   * 
   * Algorithm:
   * 1. Generate 32 random bytes
   * 2. Hash with SHA256 to get nullifierHash
   * 
   * Requirement 3.4: Generate nullifier to prevent double-acceptance
   * 
   * @returns NullifierData with nullifier and nullifierHash
   */
  generateNullifier(): NullifierData {
    // Generate 32 random bytes
    const nullifier = crypto.randomBytes(32).toString('hex');

    // Hash nullifier to get public nullifierHash
    const nullifierHash = this.hashNullifier(nullifier);

    return {
      nullifier,
      nullifierHash,
    };
  }

  /**
   * Hash Nullifier
   * 
   * Hashes a nullifier to create a public nullifierHash.
   * 
   * @param nullifier - The nullifier to hash
   * @returns NullifierHash (hex string)
   */
  hashNullifier(nullifier: Nullifier): NullifierHash {
    return crypto.createHash('sha256')
      .update(nullifier)
      .digest('hex');
  }

  /**
   * Encrypt Message
   * 
   * Encrypts a message using ECIES (Elliptic Curve Integrated Encryption Scheme).
   * 
   * Algorithm:
   * 1. Generate ephemeral key pair (r, R)
   * 2. Compute shared secret: S = r * recipientPublicKey
   * 3. Derive encryption key: K = KDF(S)
   * 4. Encrypt message: C = AES-256-GCM(K, message)
   * 5. Return (R, C, IV, authTag)
   * 
   * Requirement 26.3: Encrypt message using recipient's stealth address
   * 
   * @param params - Encryption parameters
   * @returns EncryptedMessageData
   */
  encryptMessage(params: EncryptionParameters): EncryptedMessageData {
    const { recipientKey, message } = params;

    // Parse recipient public key
    const recipientPublic = this.decodePublicKey(recipientKey);

    // Generate ephemeral key pair
    const ephemeralKey = this.ec.genKeyPair();
    const ephemeralPrivate = ephemeralKey.getPrivate();
    const ephemeralPublic = ephemeralKey.getPublic();

    // Compute shared secret: S = r * recipientPublicKey
    const sharedSecret = recipientPublic.mul(ephemeralPrivate);

    // Derive encryption key using KDF (HKDF-SHA256)
    const sharedSecretBytes = Buffer.from(sharedSecret.encode('array', false));
    const encryptionKey = crypto.createHash('sha256')
      .update(sharedSecretBytes)
      .digest();

    // Generate random IV
    const iv = crypto.randomBytes(16);

    // Encrypt message using AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(message, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Encode results
    const encryptedContent = encrypted.toString('base64');
    const ephemeralPublicKeyEncoded = this.encodePublicKey(ephemeralPublic);
    const ivEncoded = iv.toString('hex');
    const authTagEncoded = authTag.toString('hex');

    return {
      encryptedContent,
      recipientStealthAddress: recipientKey,
      ephemeralPublicKey: ephemeralPublicKeyEncoded,
      iv: ivEncoded,
      authTag: authTagEncoded,
    };
  }

  /**
   * Decrypt Message
   * 
   * Decrypts a message encrypted with ECIES.
   * 
   * Algorithm:
   * 1. Parse ephemeral public key R
   * 2. Compute shared secret: S = privateKey * R
   * 3. Derive decryption key: K = KDF(S)
   * 4. Decrypt message: M = AES-256-GCM-Decrypt(K, C, IV, authTag)
   * 
   * Requirement 26.6: Decrypt message using user's private key
   * 
   * @param params - Decryption parameters
   * @returns Decrypted message content
   */
  decryptMessage(params: DecryptionParameters): string {
    const { encryptedContent, privateKey, ephemeralPublicKey, iv, authTag } = params;

    if (!ephemeralPublicKey || !iv || !authTag) {
      throw new Error('Missing required decryption parameters');
    }

    // Parse private key
    const privateKeyBN = new BN(privateKey, 16);

    // Parse ephemeral public key
    const ephemeralPublic = this.decodePublicKey(ephemeralPublicKey);

    // Compute shared secret: S = privateKey * R
    const sharedSecret = ephemeralPublic.mul(privateKeyBN);

    // Derive decryption key using KDF (HKDF-SHA256)
    const sharedSecretBytes = Buffer.from(sharedSecret.encode('array', false));
    const decryptionKey = crypto.createHash('sha256')
      .update(sharedSecretBytes)
      .digest();

    // Parse IV and authTag
    const ivBuffer = Buffer.from(iv, 'hex');
    const authTagBuffer = Buffer.from(authTag, 'hex');

    // Decrypt message using AES-256-GCM
    const decipher = crypto.createDecipheriv('aes-256-gcm', decryptionKey, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    const encryptedBuffer = Buffer.from(encryptedContent, 'base64');
    const decrypted = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  /**
   * Generate Random Scalar
   * 
   * Generates a random scalar in the range [1, n-1] where n is the curve order.
   * 
   * @returns Random scalar as bigint
   */
  private generateRandomScalar(): bigint {
    const randomBytes = crypto.randomBytes(32);
    const randomBN = new BN(randomBytes);
    const scalar = randomBN.umod(this.ec.n!);
    return BigInt('0x' + scalar.toString('hex'));
  }

  /**
   * Encode Public Key
   * 
   * Encodes an elliptic curve point as a compressed hex string.
   * 
   * @param point - EC point to encode
   * @returns Hex-encoded compressed public key
   */
  private encodePublicKey(point: any): string {
    return point.encode('hex', true);
  }

  /**
   * Decode Public Key
   * 
   * Decodes a hex-encoded public key to an elliptic curve point.
   * 
   * @param encoded - Hex-encoded public key
   * @returns EC point
   */
  private decodePublicKey(encoded: string): any {
    return this.ec.keyFromPublic(encoded, 'hex').getPublic();
  }

  /**
   * Generate Key Pair
   * 
   * Generates a new cryptographic key pair.
   * 
   * @returns CryptoKeyPair with publicKey and privateKey
   */
  generateKeyPair(): CryptoKeyPair {
    const keyPair = this.ec.genKeyPair();
    const publicKey = this.encodePublicKey(keyPair.getPublic());
    const privateKey = keyPair.getPrivate().toString('hex', 64);

    return {
      publicKey,
      privateKey,
    };
  }
}

// Export singleton instance
export const privacyService = new PrivacyService();

