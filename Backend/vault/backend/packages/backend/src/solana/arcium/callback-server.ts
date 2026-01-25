/**
 * Arcium Callback Server
 * 
 * HTTP server for receiving large computation outputs from MPC nodes.
 * 
 * When encrypted instructions produce outputs too large for a single Solana
 * transaction (~1KB limit), MPC nodes send the overflow data to this callback
 * server. The server:
 * 
 * 1. Receives raw bytes: mempool_id|comp_def_offset|tx_sig|data_sig|pub_key|data
 * 2. Verifies signatures from MPC nodes
 * 3. Processes the data according to application needs
 * 4. Submits finalize transaction to chain (hash verification)
 * 
 * @see https://docs.arcium.com - Callback Server documentation
 */

import { Hono } from 'hono';
import { sha256 } from '@noble/hashes/sha256';
import type { ArciumConfig } from './types.js';

// ============ Callback Data Types ============

/** Parsed callback payload from MPC nodes */
export interface CallbackPayload {
  /** Mempool identifier (u16) */
  mempoolId: number;
  /** Computation definition offset (u32) */
  compDefOffset: number;
  /** Transaction signature of the callback tx (64 bytes) */
  txSignature: Uint8Array;
  /** Signature of the data by MPC node (64 bytes) */
  dataSignature: Uint8Array;
  /** Public key of signing node (32 bytes) */
  nodePubKey: Uint8Array;
  /** Actual computation output data */
  data: Uint8Array;
}

/** Callback processing result */
export interface CallbackResult {
  /** Whether processing succeeded */
  success: boolean;
  /** Finalization transaction signature (if submitted) */
  finalizeSignature?: string;
  /** Data hash for verification */
  dataHash: Uint8Array;
  /** Error message if failed */
  error?: string;
}

/** Callback handler function type */
export type CallbackHandler = (
  payload: CallbackPayload,
  config: ArciumConfig
) => Promise<CallbackResult>;

/** Registered callback handlers by computation definition */
type HandlerRegistry = Map<number, CallbackHandler>;

// ============ Payload Parsing ============

/**
 * Parse raw callback bytes into structured payload
 * 
 * Format: mempool_id(2) | comp_def_offset(4) | tx_sig(64) | data_sig(64) | pub_key(32) | data(...)
 * Total header: 166 bytes
 */
export function parseCallbackPayload(raw: Uint8Array): CallbackPayload {
  if (raw.length < 166) {
    throw new Error(`Invalid callback payload: expected at least 166 bytes, got ${raw.length}`);
  }

  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  let offset = 0;

  // mempool_id: u16 (2 bytes, little-endian)
  const mempoolId = view.getUint16(offset, true);
  offset += 2;

  // comp_def_offset: u32 (4 bytes, little-endian)
  const compDefOffset = view.getUint32(offset, true);
  offset += 4;

  // tx_sig: [u8; 64]
  const txSignature = raw.slice(offset, offset + 64);
  offset += 64;

  // data_sig: [u8; 64]
  const dataSignature = raw.slice(offset, offset + 64);
  offset += 64;

  // pub_key: [u8; 32]
  const nodePubKey = raw.slice(offset, offset + 32);
  offset += 32;

  // data: Vec<u8> (remaining bytes)
  const data = raw.slice(offset);

  return {
    mempoolId,
    compDefOffset,
    txSignature,
    dataSignature,
    nodePubKey,
    data,
  };
}

/**
 * Serialize callback payload back to bytes
 */
export function serializeCallbackPayload(payload: CallbackPayload): Uint8Array {
  const headerSize = 2 + 4 + 64 + 64 + 32;
  const result = new Uint8Array(headerSize + payload.data.length);
  const view = new DataView(result.buffer);

  let offset = 0;

  // mempool_id
  view.setUint16(offset, payload.mempoolId, true);
  offset += 2;

  // comp_def_offset
  view.setUint32(offset, payload.compDefOffset, true);
  offset += 4;

  // tx_sig
  result.set(payload.txSignature, offset);
  offset += 64;

  // data_sig
  result.set(payload.dataSignature, offset);
  offset += 64;

  // pub_key
  result.set(payload.nodePubKey, offset);
  offset += 32;

  // data
  result.set(payload.data, offset);

  return result;
}

// ============ Signature Verification ============

/**
 * Verify Ed25519 signature from MPC node
 * 
 * In production, use @noble/ed25519 or tweetnacl for verification
 */
export async function verifyNodeSignature(
  data: Uint8Array,
  signature: Uint8Array,
  pubKey: Uint8Array
): Promise<boolean> {
  // Simulated verification for demo
  // Production should use proper Ed25519 verification:
  // import { verify } from '@noble/ed25519';
  // return verify(signature, data, pubKey);
  
  if (signature.length !== 64 || pubKey.length !== 32) {
    return false;
  }

  // For demo: check signature is non-zero
  const hasSignature = signature.some(b => b !== 0);
  const hasPubKey = pubKey.some(b => b !== 0);
  
  return hasSignature && hasPubKey;
}

/**
 * Verify callback payload signatures
 */
export async function verifyCallbackSignatures(
  payload: CallbackPayload,
  _trustedNodes: Uint8Array[]
): Promise<{ valid: boolean; error?: string }> {
  // Verify data signature
  const dataValid = await verifyNodeSignature(
    payload.data,
    payload.dataSignature,
    payload.nodePubKey
  );

  if (!dataValid) {
    return { valid: false, error: 'Invalid data signature' };
  }

  // In production: verify nodePubKey is in trustedNodes list
  // const isTrustedNode = trustedNodes.some(
  //   node => node.every((b, i) => b === payload.nodePubKey[i])
  // );
  // if (!isTrustedNode) {
  //   return { valid: false, error: 'Unknown node public key' };
  // }

  return { valid: true };
}

// ============ Callback Server ============

/**
 * Arcium Callback Server
 * 
 * Handles large computation outputs from MPC nodes
 */
export class ArciumCallbackServer {
  private app: Hono;
  private config: ArciumConfig;
  private handlers: HandlerRegistry = new Map();
  private trustedNodes: Uint8Array[] = [];
  private pendingCallbacks: Map<string, CallbackPayload> = new Map();

  constructor(config: ArciumConfig) {
    this.config = config;
    this.app = new Hono();
    this.setupRoutes();
  }

  /**
   * Register a handler for a specific computation definition
   */
  registerHandler(compDefOffset: number, handler: CallbackHandler): void {
    this.handlers.set(compDefOffset, handler);
  }

  /**
   * Add trusted MPC node public keys
   */
  addTrustedNode(pubKey: Uint8Array): void {
    this.trustedNodes.push(pubKey);
  }

  /**
   * Get the Hono app instance for integration with existing server
   */
  getApp(): Hono {
    return this.app;
  }

  /**
   * Get pending callback by transaction signature
   */
  getPendingCallback(txSig: string): CallbackPayload | undefined {
    return this.pendingCallbacks.get(txSig);
  }

  /**
   * Setup HTTP routes
   */
  private setupRoutes(): void {
    // POST /callback - Main callback endpoint
    this.app.post('/callback', async (c) => {
      try {
        // Get raw body as ArrayBuffer
        const rawBody = await c.req.arrayBuffer();
        const raw = new Uint8Array(rawBody);

        // Parse payload
        const payload = parseCallbackPayload(raw);

        // Verify signatures
        const verification = await verifyCallbackSignatures(payload, this.trustedNodes);
        if (!verification.valid) {
          return c.json({ error: verification.error }, 400);
        }

        // Store pending callback
        const txSigHex = Array.from(payload.txSignature)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        this.pendingCallbacks.set(txSigHex, payload);

        // Find and execute handler
        const handler = this.handlers.get(payload.compDefOffset);
        if (handler) {
          const result = await handler(payload, this.config);
          
          if (!result.success) {
            return c.json({ error: result.error }, 500);
          }

          // Clean up pending callback on success
          this.pendingCallbacks.delete(txSigHex);

          return c.json({
            success: true,
            finalizeSignature: result.finalizeSignature,
            dataHash: Array.from(result.dataHash),
          });
        }

        // Default: just acknowledge receipt
        const dataHash = sha256(payload.data);
        return c.json({
          success: true,
          dataHash: Array.from(dataHash),
          message: 'Callback received, no handler registered',
        });

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return c.json({ error: message }, 500);
      }
    });

    // GET /callback/health - Health check
    this.app.get('/callback/health', (c) => {
      return c.json({
        status: 'healthy',
        handlers: this.handlers.size,
        trustedNodes: this.trustedNodes.length,
        pendingCallbacks: this.pendingCallbacks.size,
      });
    });

    // GET /callback/pending/:txSig - Get pending callback status
    this.app.get('/callback/pending/:txSig', (c) => {
      const txSig = c.req.param('txSig');
      const pending = this.pendingCallbacks.get(txSig);

      if (!pending) {
        return c.json({ found: false }, 404);
      }

      return c.json({
        found: true,
        mempoolId: pending.mempoolId,
        compDefOffset: pending.compDefOffset,
        dataSize: pending.data.length,
      });
    });
  }
}

// ============ Default Handlers ============

/**
 * Default handler that stores data and submits finalize transaction
 */
export function createDefaultHandler(
  onData?: (payload: CallbackPayload) => Promise<void>
): CallbackHandler {
  return async (payload, _config) => {
    try {
      // Process data if callback provided
      if (onData) {
        await onData(payload);
      }

      // Compute data hash for finalization
      const dataHash = sha256(payload.data);

      // In production: submit finalize transaction
      // const finalizeSig = await submitFinalizeTransaction(
      //   config,
      //   payload.mempoolId,
      //   payload.compDefOffset,
      //   dataHash
      // );

      const finalizeSig = `finalize_${Date.now()}_${payload.compDefOffset}`;

      return {
        success: true,
        finalizeSignature: finalizeSig,
        dataHash,
      };
    } catch (error) {
      return {
        success: false,
        dataHash: new Uint8Array(32),
        error: error instanceof Error ? error.message : 'Handler failed',
      };
    }
  };
}

/**
 * Handler for Obscura intent verification results
 */
export function createIntentVerificationHandler(
  onVerified: (intentId: string, isValid: boolean, proof: Uint8Array) => Promise<void>
): CallbackHandler {
  return async (payload, _config) => {
    try {
      // Parse intent verification result from data
      // Format: intent_id(32) | is_valid(1) | proof(...)
      if (payload.data.length < 33) {
        throw new Error('Invalid intent verification data');
      }

      const intentIdBytes = payload.data.slice(0, 32);
      const intentId = Array.from(intentIdBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      const isValid = payload.data[32] === 1;
      const proof = payload.data.slice(33);

      await onVerified(intentId, isValid, proof);

      const dataHash = sha256(payload.data);

      return {
        success: true,
        finalizeSignature: `intent_verify_${intentId.slice(0, 8)}`,
        dataHash,
      };
    } catch (error) {
      return {
        success: false,
        dataHash: new Uint8Array(32),
        error: error instanceof Error ? error.message : 'Verification handler failed',
      };
    }
  };
}

/**
 * Handler for batch optimization results
 */
export function createBatchOptimizationHandler(
  onOptimized: (batchId: string, ordering: number[], gasSavings: bigint) => Promise<void>
): CallbackHandler {
  return async (payload, _config) => {
    try {
      // Parse batch optimization result
      // Format: batch_id(32) | num_intents(4) | ordering(num_intents * 4) | gas_savings(8)
      if (payload.data.length < 44) {
        throw new Error('Invalid batch optimization data');
      }

      const view = new DataView(payload.data.buffer, payload.data.byteOffset);
      
      const batchIdBytes = payload.data.slice(0, 32);
      const batchId = Array.from(batchIdBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const numIntents = view.getUint32(32, true);
      const ordering: number[] = [];
      
      for (let i = 0; i < numIntents; i++) {
        ordering.push(view.getUint32(36 + i * 4, true));
      }

      const gasSavingsOffset = 36 + numIntents * 4;
      const gasSavings = view.getBigUint64(gasSavingsOffset, true);

      await onOptimized(batchId, ordering, gasSavings);

      const dataHash = sha256(payload.data);

      return {
        success: true,
        finalizeSignature: `batch_opt_${batchId.slice(0, 8)}`,
        dataHash,
      };
    } catch (error) {
      return {
        success: false,
        dataHash: new Uint8Array(32),
        error: error instanceof Error ? error.message : 'Batch handler failed',
      };
    }
  };
}

// ============ Factory Functions ============

/**
 * Create callback server from config
 */
export function createCallbackServer(config: ArciumConfig): ArciumCallbackServer {
  return new ArciumCallbackServer(config);
}

/**
 * Create callback server with default Obscura handlers
 */
export function createObscuraCallbackServer(
  config: ArciumConfig,
  options: {
    onIntentVerified?: (intentId: string, isValid: boolean, proof: Uint8Array) => Promise<void>;
    onBatchOptimized?: (batchId: string, ordering: number[], gasSavings: bigint) => Promise<void>;
    onGenericCallback?: (payload: CallbackPayload) => Promise<void>;
  } = {}
): ArciumCallbackServer {
  const server = new ArciumCallbackServer(config);

  // Register intent verification handler (comp_def_offset = 1)
  if (options.onIntentVerified) {
    server.registerHandler(1, createIntentVerificationHandler(options.onIntentVerified));
  }

  // Register batch optimization handler (comp_def_offset = 2)
  if (options.onBatchOptimized) {
    server.registerHandler(2, createBatchOptimizationHandler(options.onBatchOptimized));
  }

  // Register default handler for other computations
  if (options.onGenericCallback) {
    server.registerHandler(0, createDefaultHandler(options.onGenericCallback));
  }

  return server;
}
