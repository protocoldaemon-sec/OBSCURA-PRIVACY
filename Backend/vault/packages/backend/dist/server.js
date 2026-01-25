/**
 * Winternitz-SIP API Server
 *
 * REST API endpoints for privacy-preserving intent settlement
 * Built with Hono for lightweight, high-performance routing
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { SIPClient, PrivacyLevel } from './sip/index.js';
import { PQAuthService } from './auth/index.js';
import { Aggregator } from './executor/index.js';
// ============ BigInt JSON Serialization ============
// Add BigInt serialization support to prevent "Do not know how to serialize a BigInt" errors
BigInt.prototype.toJSON = function () {
    return this.toString();
};
// ============ Server Setup ============
const app = new Hono();
// Middleware
app.use('*', cors());
app.use('*', logger());
// Services (initialized on startup)
let authService;
let aggregator;
let sipClients = new Map();
// ============ Health & Info Endpoints ============
app.get('/', (c) => {
    return c.json({
        name: 'Winternitz-SIP API',
        version: '0.1.0',
        description: 'Post-quantum secure intent settlement API',
        endpoints: {
            health: '/health',
            intents: '/api/v1/intents',
            quotes: '/api/v1/quotes',
            transfer: '/api/v1/transfer',
            swap: '/api/v1/swap',
            batches: '/api/v1/batches',
            pools: '/api/v1/pools',
        }
    });
});
app.get('/health', (c) => {
    return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            auth: 'ready',
            aggregator: 'ready',
        }
    });
});
// ============ Intent Endpoints ============
/**
 * Create a new shielded intent
 * POST /api/v1/intents
 */
app.post('/api/v1/intents', async (c) => {
    try {
        const body = await c.req.json();
        // Validate required fields
        if (!body.action || !body.sourceChain || !body.asset || !body.amount || !body.recipient) {
            return c.json({
                error: 'Missing required fields: action, sourceChain, asset, amount, recipient'
            }, 400);
        }
        // Get or create SIP client for this chain
        const clientKey = `${body.sourceChain}-${body.privacyLevel || 'shielded'}`;
        let client = sipClients.get(clientKey);
        if (!client) {
            client = new SIPClient({
                network: 'testnet',
                chain: body.sourceChain,
                privacyLevel: mapPrivacyLevel(body.privacyLevel),
                solverApiUrl: process.env.SOLVER_API_URL || 'https://solver.sip-protocol.org',
            });
            await client.initialize();
            sipClients.set(clientKey, client);
        }
        // Create intent based on action type
        const deadline = body.deadline || Math.floor(Date.now() / 1000) + 3600;
        const intent = await client.createIntent({
            tokenIn: body.asset,
            tokenOut: body.asset, // Same for transfers
            amountIn: BigInt(body.amount),
            minAmountOut: BigInt(body.amount),
            deadline,
            recipient: body.recipient,
        });
        return c.json({
            success: true,
            intentId: intent.id,
            stealthAddress: Buffer.from(intent.stealthAddress).toString('hex'),
            commitment: Buffer.from(intent.pubKeyHash).toString('hex'),
            expiresAt: deadline,
        }, 201);
    }
    catch (error) {
        console.error('Create intent error:', error);
        return c.json({
            error: 'Failed to create intent',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
/**
 * Submit a signed intent for settlement
 * POST /api/v1/intents/submit
 */
app.post('/api/v1/intents/submit', async (c) => {
    try {
        const body = await c.req.json();
        // Validate required fields
        if (!body.encryptedIntent || !body.wotsSignature || !body.merkleRoot) {
            return c.json({
                error: 'Missing required fields: encryptedIntent, wotsSignature, merkleRoot'
            }, 400);
        }
        // Reconstruct shielded intent
        const shielded = {
            encryptedIntent: Buffer.from(body.encryptedIntent, 'base64'),
            ephemeralPubKey: Buffer.from(body.ephemeralPubKey, 'base64'),
            commitment: hexToBytes(body.commitment),
        };
        // Reconstruct WOTS signed intent
        const proofDepth = body.merkleProof.length;
        const pathIndices = computePathIndices(body.keyIndex, proofDepth);
        const wotsAuth = {
            signature: decodeSignature(body.wotsSignature),
            publicKey: decodePublicKey(body.publicKey),
            merkleRoot: hexToBytes(body.merkleRoot),
            merkleProof: {
                siblings: body.merkleProof.map(hexToBytes),
                pathIndices,
                leafIndex: body.keyIndex,
            },
            keyIndex: body.keyIndex,
            intentHash: hexToBytes(body.commitment),
        };
        // Submit to aggregator
        const result = aggregator.submitIntent(shielded, wotsAuth);
        if (!result.success) {
            return c.json({
                error: result.error
            }, 400);
        }
        return c.json({
            success: true,
            intentId: result.intentId,
            batchId: result.batchId,
            position: result.position,
            status: 'pending',
        });
    }
    catch (error) {
        console.error('Submit intent error:', error);
        return c.json({
            error: 'Failed to submit intent',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
/**
 * Get intent status
 * GET /api/v1/intents/:intentId
 */
app.get('/api/v1/intents/:intentId', async (c) => {
    const intentId = c.req.param('intentId');
    // Check pending intents
    const status = aggregator.getIntentStatus(intentId);
    if (!status) {
        return c.json({ error: 'Intent not found' }, 404);
    }
    return c.json(status);
});
// ============ Transfer Endpoints ============
/**
 * Create a private transfer
 * POST /api/v1/transfer
 */
app.post('/api/v1/transfer', async (c) => {
    try {
        const body = await c.req.json();
        if (!body.recipient || !body.asset || !body.amount || !body.sourceChain) {
            return c.json({
                error: 'Missing required fields: recipient, asset, amount, sourceChain'
            }, 400);
        }
        // Get or create client
        const clientKey = `${body.sourceChain}-${body.privacyLevel || 'shielded'}`;
        let client = sipClients.get(clientKey);
        if (!client) {
            client = new SIPClient({
                network: 'testnet',
                chain: body.sourceChain,
                privacyLevel: mapPrivacyLevel(body.privacyLevel),
                solverApiUrl: process.env.SOLVER_API_URL || 'https://solver.sip-protocol.org',
            });
            await client.initialize();
            sipClients.set(clientKey, client);
        }
        const deadline = Math.floor(Date.now() / 1000) + 3600;
        const intent = await client.createIntent({
            tokenIn: body.asset,
            tokenOut: body.asset,
            amountIn: BigInt(body.amount),
            minAmountOut: BigInt(body.amount),
            deadline,
            recipient: body.recipient,
        });
        return c.json({
            success: true,
            intentId: intent.id,
            type: 'transfer',
            stealthAddress: Buffer.from(intent.stealthAddress).toString('hex'),
            commitment: Buffer.from(intent.pubKeyHash).toString('hex'),
            sourceChain: body.sourceChain,
            targetChain: body.targetChain || body.sourceChain,
            expiresAt: deadline,
        }, 201);
    }
    catch (error) {
        console.error('Transfer error:', error);
        return c.json({
            error: 'Failed to create transfer',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
// ============ Swap Endpoints ============
/**
 * Create a private swap
 * POST /api/v1/swap
 */
app.post('/api/v1/swap', async (c) => {
    try {
        const body = await c.req.json();
        if (!body.tokenIn || !body.tokenOut || !body.amountIn || !body.minAmountOut) {
            return c.json({
                error: 'Missing required fields: tokenIn, tokenOut, amountIn, minAmountOut'
            }, 400);
        }
        // Default to ethereum mainnet for swaps
        const clientKey = `ethereum-${body.privacyLevel || 'shielded'}`;
        let client = sipClients.get(clientKey);
        if (!client) {
            client = new SIPClient({
                network: 'testnet',
                chain: 'ethereum',
                privacyLevel: mapPrivacyLevel(body.privacyLevel),
                solverApiUrl: process.env.SOLVER_API_URL || 'https://solver.sip-protocol.org',
            });
            await client.initialize();
            sipClients.set(clientKey, client);
        }
        const deadline = body.deadline || Math.floor(Date.now() / 1000) + 3600;
        const intent = await client.createIntent({
            tokenIn: body.tokenIn,
            tokenOut: body.tokenOut,
            amountIn: BigInt(body.amountIn),
            minAmountOut: BigInt(body.minAmountOut),
            deadline,
        });
        return c.json({
            success: true,
            intentId: intent.id,
            type: 'swap',
            stealthAddress: Buffer.from(intent.stealthAddress).toString('hex'),
            commitment: Buffer.from(intent.pubKeyHash).toString('hex'),
            expiresAt: deadline,
        }, 201);
    }
    catch (error) {
        console.error('Swap error:', error);
        return c.json({
            error: 'Failed to create swap',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
// ============ Quote Endpoints ============
/**
 * Get quotes for an intent
 * POST /api/v1/quotes
 */
app.post('/api/v1/quotes', async (c) => {
    try {
        const body = await c.req.json();
        if (!body.sourceChain || !body.targetChain || !body.inputAsset || !body.outputAsset || !body.amount) {
            return c.json({
                error: 'Missing required fields: sourceChain, targetChain, inputAsset, outputAsset, amount'
            }, 400);
        }
        const quoteRequest = {
            sourceChain: body.sourceChain,
            targetChain: body.targetChain,
            inputAsset: body.inputAsset,
            outputAsset: body.outputAsset,
            amount: BigInt(body.amount),
            slippageBps: body.slippageBps || 50, // 0.5% default
        };
        const quotes = await aggregator.getQuotes(quoteRequest);
        return c.json({
            success: true,
            quotes: quotes.map(q => ({
                id: q.id,
                solverId: q.solverId,
                inputAmount: q.inputAmount.toString(),
                outputAmount: q.outputAmount.toString(),
                fee: q.fee.toString(),
                gasEstimate: q.gasEstimate.toString(),
                expiresAt: q.expiresAt,
                estimatedTime: q.estimatedTime,
                solverReputation: q.solverReputation,
            })),
        });
    }
    catch (error) {
        console.error('Quote error:', error);
        return c.json({
            error: 'Failed to fetch quotes',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
// ============ Batch Endpoints ============
/**
 * Get pending batches
 * GET /api/v1/batches
 */
app.get('/api/v1/batches', async (c) => {
    const batches = aggregator.getPendingBatches();
    return c.json({
        count: batches.length,
        batches: batches.map(b => ({
            batchId: b.batchId,
            chain: b.targetChain,
            intentCount: b.count,
            createdAt: b.createdAt,
        })),
    });
});
/**
 * Force flush all pending batches
 * POST /api/v1/batches/flush
 */
app.post('/api/v1/batches/flush', async (c) => {
    try {
        const records = await aggregator.flushBatches();
        return c.json({
            success: true,
            settledBatches: records.length,
            records: records.map(r => ({
                batchId: r.batchId,
                chain: r.chain,
                txHash: r.txHash,
                status: r.status,
                gasUsed: r.gasUsed.toString(),
            })),
        });
    }
    catch (error) {
        console.error('Flush error:', error);
        return c.json({
            error: 'Failed to flush batches',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
/**
 * Get batch details
 * GET /api/v1/batches/:batchId
 */
app.get('/api/v1/batches/:batchId', async (c) => {
    const batchId = c.req.param('batchId');
    const batch = aggregator.getBatch(batchId);
    if (!batch) {
        return c.json({ error: 'Batch not found' }, 404);
    }
    return c.json(batch);
});
// ============ Pool Management Endpoints ============
/**
 * Register a WOTS key pool
 * POST /api/v1/pools
 */
app.post('/api/v1/pools', async (c) => {
    try {
        const body = await c.req.json();
        if (!body.merkleRoot || !body.totalKeys) {
            return c.json({
                error: 'Missing required fields: merkleRoot, totalKeys'
            }, 400);
        }
        // Create full WOTS params
        const w = body.params?.w ?? 16;
        const n = body.params?.n ?? 32;
        const len1 = Math.ceil((8 * n) / Math.log2(w));
        const len2 = Math.floor(Math.log2(len1 * (w - 1)) / Math.log2(w)) + 1;
        const params = { w, n, len1, len2, len: len1 + len2 };
        authService.registerPool(hexToBytes(body.merkleRoot), params, body.totalKeys, body.owner);
        return c.json({
            success: true,
            merkleRoot: body.merkleRoot,
            totalKeys: body.totalKeys,
            registeredAt: Date.now(),
        }, 201);
    }
    catch (error) {
        console.error('Register pool error:', error);
        return c.json({
            error: 'Failed to register pool',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
/**
 * Get pool info
 * GET /api/v1/pools/:merkleRoot
 */
app.get('/api/v1/pools/:merkleRoot', async (c) => {
    const merkleRoot = c.req.param('merkleRoot');
    const pool = authService.getPool(hexToBytes(merkleRoot));
    if (!pool) {
        return c.json({ error: 'Pool not found' }, 404);
    }
    return c.json(pool);
});
// ============ Helper Functions ============
function mapPrivacyLevel(mode) {
    switch (mode) {
        case 'transparent':
            return PrivacyLevel.TRANSPARENT;
        case 'compliant':
            return PrivacyLevel.COMPLIANT;
        case 'shielded':
        default:
            return PrivacyLevel.SHIELDED;
    }
}
function hexToBytes(hex) {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
    }
    return bytes;
}
function decodeSignature(base64) {
    const data = Buffer.from(base64, 'base64');
    // WOTS signature is 67 chunks of 32 bytes each
    const chunks = [];
    for (let i = 0; i < 67; i++) {
        chunks.push(new Uint8Array(data.subarray(i * 32, (i + 1) * 32)));
    }
    return chunks;
}
function decodePublicKey(base64) {
    const data = Buffer.from(base64, 'base64');
    // WOTS public key is 67 chunks of 32 bytes each
    const chunks = [];
    for (let i = 0; i < 67; i++) {
        chunks.push(new Uint8Array(data.subarray(i * 32, (i + 1) * 32)));
    }
    return chunks;
}
function computePathIndices(leafIndex, depth) {
    // Path indices are derived from binary representation of leaf index
    // Each bit indicates whether the node is a right child (true) or left child (false)
    const pathIndices = [];
    for (let i = 0; i < depth; i++) {
        pathIndices.push(((leafIndex >> i) & 1) === 1);
    }
    return pathIndices;
}
// ============ Server Initialization ============
async function initializeServices() {
    console.log('Initializing services...');
    // Initialize auth service
    authService = new PQAuthService();
    // Initialize aggregator with default config
    const aggregatorConfig = {
        executor: {
            chains: [
                {
                    chainId: 'ethereum',
                    rpcUrl: process.env.ETH_RPC_URL || 'https://eth.llamarpc.com',
                    contractAddress: process.env.ETH_SETTLEMENT_CONTRACT || '0x0000000000000000000000000000000000000000',
                    type: 'evm',
                    confirmations: 2,
                },
            ],
        },
        batch: {
            maxBatchSize: 50,
            maxWaitTime: 30000, // 30 seconds
            minBatchSize: 1,
        },
        autoSubmit: false,
        network: 'testnet',
        enableQuotes: true,
    };
    aggregator = new Aggregator(aggregatorConfig, authService);
    console.log('Services initialized');
}
// Start server
const PORT = parseInt(process.env.PORT || '3000', 10);
initializeServices().then(() => {
    serve({
        fetch: app.fetch,
        port: PORT,
    });
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║           Winternitz-SIP API Server                       ║
╠═══════════════════════════════════════════════════════════╣
║  Status:  Running                                         ║
║  Port:    ${PORT}                                            ║
║  Docs:    http://localhost:${PORT}/                          ║
╚═══════════════════════════════════════════════════════════╝
  `);
}).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
export { app };
//# sourceMappingURL=server.js.map