import { useState, useCallback } from 'react';
import { WOTS } from 'mochimo-wots-v2'

// Helper function to convert Uint8Array to hex string
function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function useWOTSWallet() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signMessage = useCallback(async (message: string, tagString: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[WOTS] Starting signature process with mochimo-wots-v2...');
      
      // Dynamically import mochimo-wots-v2
      const { WOTS } = await import('mochimo-wots-v2');
      
      // Generate random seeds
      const secret = new Uint8Array(32);
      crypto.getRandomValues(secret);
      
      const pubSeed = new Uint8Array(32);
      crypto.getRandomValues(pubSeed);
      
      const rnd2 = new Uint8Array(32);
      crypto.getRandomValues(rnd2);
      
      console.log('[WOTS] Generating public key...');
      
      // Generate public key (2144 bytes)
      const publicKey = new Uint8Array(2144);
      WOTS.wots_pkgen(publicKey, secret, pubSeed, 0, rnd2);
      
      // Create full address (2208 bytes: 2144 PK + 32 pubSeed + 32 rnd2)
      const address = new Uint8Array(2208);
      address.set(publicKey, 0);      // bytes 0-2143: public key
      address.set(pubSeed, 2144);     // bytes 2144-2175: pubSeed
      address.set(rnd2, 2176);        // bytes 2176-2207: rnd2
      
      console.log('[WOTS] Public key generated, length:', address.length);
      
      // Hash message first (WOTS+ signs the hash, not the raw message)
      console.log('[WOTS] Hashing message...');
      const messageBytes = new TextEncoder().encode(message);
      const messageHash = await crypto.subtle.digest('SHA-256', messageBytes as BufferSource);
      const messageHashArray = new Uint8Array(messageHash);
      
      console.log('[WOTS] Message hash length:', messageHashArray.length, 'bytes');
      
      // Sign the hash
      console.log('[WOTS] Signing message hash...');
      const signature = new Uint8Array(2144);
      WOTS.wots_sign(signature, messageHashArray, secret, pubSeed, 0, rnd2);
      
      console.log('[WOTS] Signature generated, length:', signature.length);
      
      // Convert to hex using our helper function
      const signatureHex = uint8ArrayToHex(signature);
      const publicKeyHex = uint8ArrayToHex(address);
      
      console.log('[WOTS] Conversion complete:', {
        signatureHexLength: signatureHex.length,
        publicKeyHexLength: publicKeyHex.length
      });
      
      // Validate lengths
      if (signatureHex.length !== 4288) {
        throw new Error(`Invalid signature length: ${signatureHex.length}, expected 4288`);
      }
      
      if (publicKeyHex.length !== 4416) {
        throw new Error(`Invalid public key length: ${publicKeyHex.length}, expected 4416`);
      }
      
      console.log('[WOTS] Successfully created signature:', {
        signatureLength: signatureHex.length,
        publicKeyLength: publicKeyHex.length,
        tagString
      });
      
      return {
        signature: signatureHex, // 4288 hex chars (2144 bytes)
        publicKey: publicKeyHex, // 4416 hex chars (2208 bytes)
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown WOTS error';
      setError(errorMessage);
      
      console.error('[WOTS] Detailed error:', {
        error: err,
        message: errorMessage,
        tagString,
        errorName: err instanceof Error ? err.name : 'Unknown',
        errorStack: err instanceof Error ? err.stack : 'No stack'
      });
      
      throw new Error(`WOTS+ signature failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { signMessage, isLoading, error };
}
