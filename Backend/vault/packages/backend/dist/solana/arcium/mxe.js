/**
 * MXE (Multi-Party Execution Environment) Client
 *
 * Handles MPC computations on encrypted data:
 * - Confidential auctions for solver selection
 * - Private batch optimization
 * - Encrypted quote comparison
 * - Threshold decryption for settlement
 */
/** Supported MPC computation types */
export var MPCComputationType;
(function (MPCComputationType) {
    /** Compare encrypted values, return index of max */
    MPCComputationType["MAX_COMPARISON"] = "max_comparison";
    /** Compare encrypted values, return index of min */
    MPCComputationType["MIN_COMPARISON"] = "min_comparison";
    /** Sum encrypted values */
    MPCComputationType["SUM"] = "sum";
    /** Multiply encrypted values */
    MPCComputationType["MULTIPLY"] = "multiply";
    /** Confidential auction - find winner without revealing bids */
    MPCComputationType["AUCTION"] = "auction";
    /** Batch optimization - order intents for gas efficiency */
    MPCComputationType["BATCH_OPTIMIZE"] = "batch_optimize";
    /** Threshold decryption - decrypt with t-of-n nodes */
    MPCComputationType["THRESHOLD_DECRYPT"] = "threshold_decrypt";
    /** Private set intersection */
    MPCComputationType["PSI"] = "psi";
    /** Confidential swap matching */
    MPCComputationType["SWAP_MATCH"] = "swap_match";
})(MPCComputationType || (MPCComputationType = {}));
/**
 * MXE Client for Multi-Party Computation
 */
export class MXEClient {
    config;
    cluster = null;
    constructor(config) {
        this.config = config;
    }
    /**
     * Initialize and connect to MXE cluster
     */
    async connect() {
        const response = await fetch(`${this.config.mxeEndpoint}/v1/clusters/${this.config.clusterId}`);
        if (!response.ok) {
            throw new Error(`Failed to connect to MXE cluster: ${response.statusText}`);
        }
        const data = await response.json();
        this.cluster = {
            id: data.id,
            name: data.name,
            nodeCount: data.nodeCount,
            threshold: data.threshold,
            publicKey: new Uint8Array(Buffer.from(data.publicKey, 'base64')),
            supportedComputations: data.supportedComputations,
            status: data.status,
        };
        return this.cluster;
    }
    /**
     * Get cluster public key for encryption
     */
    getClusterPublicKey() {
        if (!this.cluster) {
            throw new Error('Not connected to MXE cluster');
        }
        return this.cluster.publicKey;
    }
    /**
     * Encrypt data for MPC computation
     */
    async encrypt(plaintext) {
        const response = await fetch(`${this.config.mxeEndpoint}/v1/encrypt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clusterId: this.config.clusterId,
                plaintext: Buffer.from(plaintext).toString('base64'),
            }),
        });
        if (!response.ok) {
            throw new Error(`Encryption failed: ${response.statusText}`);
        }
        const result = await response.json();
        return {
            ciphertext: new Uint8Array(Buffer.from(result.ciphertext, 'base64')),
            nonce: new Uint8Array(Buffer.from(result.nonce, 'base64')),
            ephemeralPubKey: new Uint8Array(Buffer.from(result.ephemeralPubKey, 'base64')),
            commitment: new Uint8Array(Buffer.from(result.commitment, 'base64')),
        };
    }
    /**
     * Encrypt a bigint amount
     */
    async encryptAmount(amount) {
        const buffer = new ArrayBuffer(8);
        new DataView(buffer).setBigUint64(0, amount, false);
        return this.encrypt(new Uint8Array(buffer));
    }
    /**
     * Submit MPC computation request
     */
    async compute(request) {
        const response = await fetch(`${this.config.mxeEndpoint}/v1/compute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clusterId: this.config.clusterId,
                appId: this.config.appId,
                computationType: request.computationType,
                inputs: request.inputs.map(input => ({
                    partyId: input.partyId,
                    data: this.serializeEncryptedValue(input.data),
                    schema: input.schema,
                })),
                params: request.params,
                callbackUrl: request.callbackUrl,
                timeout: request.timeout ?? 30000,
            }),
        });
        if (!response.ok) {
            throw new Error(`MPC computation failed: ${response.statusText}`);
        }
        return this.parseComputationResult(await response.json());
    }
    /**
     * Get computation status
     */
    async getComputationStatus(computationId) {
        const response = await fetch(`${this.config.mxeEndpoint}/v1/computations/${computationId}`);
        if (!response.ok) {
            throw new Error(`Failed to get computation status: ${response.statusText}`);
        }
        return this.parseComputationResult(await response.json());
    }
    /**
     * Run confidential auction for solver selection
     *
     * Solvers submit encrypted bids, MXE determines winner
     * without revealing individual bid amounts
     */
    async runConfidentialAuction(bids) {
        const inputs = bids.map(bid => ({
            partyId: bid.bidderId,
            data: bid.encryptedAmount,
            schema: 'auction_bid',
        }));
        const result = await this.compute({
            computationType: MPCComputationType.AUCTION,
            inputs,
            params: {
                auctionType: 'first_price_sealed',
                tieBreaker: 'first_submitted',
            },
        });
        if (result.status !== 'completed') {
            throw new Error(`Auction computation failed: ${result.status}`);
        }
        const output = result.publicResult;
        return {
            winnerId: output.winnerId,
            winningAmount: output.winningAmount ? BigInt(output.winningAmount) : undefined,
            fairnessProof: result.proof,
            bidCommitments: bids.map(b => b.commitment),
        };
    }
    /**
     * Compare encrypted quotes and return best one
     *
     * Used for solver quote comparison without revealing amounts
     */
    async compareQuotes(quotes) {
        const inputs = quotes.map(q => ({
            partyId: q.solverId,
            data: q.encryptedOutput,
            schema: 'quote_output',
        }));
        const result = await this.compute({
            computationType: MPCComputationType.MAX_COMPARISON,
            inputs,
        });
        if (result.status !== 'completed') {
            throw new Error(`Quote comparison failed: ${result.status}`);
        }
        const output = result.publicResult;
        return {
            winnerId: quotes[output.winnerIndex].solverId,
            proof: result.proof,
        };
    }
    /**
     * Optimize batch ordering confidentially
     *
     * Computes optimal ordering of intents without revealing
     * individual intent details
     */
    async optimizeBatch(encryptedIntents) {
        const inputs = encryptedIntents.map(intent => ({
            partyId: intent.intentId,
            data: intent.encryptedData,
            schema: 'intent_data',
        }));
        const result = await this.compute({
            computationType: MPCComputationType.BATCH_OPTIMIZE,
            inputs,
            params: {
                optimizationTarget: 'gas',
                maxBatchSize: 50,
            },
        });
        if (result.status !== 'completed') {
            throw new Error(`Batch optimization failed: ${result.status}`);
        }
        const output = result.publicResult;
        return {
            ordering: output.ordering.map(i => encryptedIntents[i].intentId),
            gasSavings: BigInt(output.gasSavings),
            proof: result.proof,
        };
    }
    /**
     * Match confidential swap orders
     *
     * Finds matching buy/sell orders without revealing amounts
     */
    async matchSwaps(swaps) {
        const inputs = swaps.map(swap => ({
            partyId: swap.orderId,
            data: swap.params.encryptedInputAmount,
            schema: 'swap_order',
        }));
        const result = await this.compute({
            computationType: MPCComputationType.SWAP_MATCH,
            inputs,
            params: {
                matchingAlgorithm: 'price_time_priority',
            },
        });
        if (result.status !== 'completed') {
            throw new Error(`Swap matching failed: ${result.status}`);
        }
        const output = result.publicResult;
        return output.map(match => ({
            ...match,
            proof: result.proof,
        }));
    }
    /**
     * Threshold decryption
     *
     * Decrypt a value using t-of-n MXE nodes
     * Only works if caller has authorization
     */
    async thresholdDecrypt(encrypted, authorizationProof) {
        const response = await fetch(`${this.config.mxeEndpoint}/v1/decrypt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clusterId: this.config.clusterId,
                encrypted: this.serializeEncryptedValue(encrypted),
                authorizationProof: Buffer.from(authorizationProof).toString('base64'),
            }),
        });
        if (!response.ok) {
            throw new Error(`Threshold decryption failed: ${response.statusText}`);
        }
        const result = await response.json();
        return new Uint8Array(Buffer.from(result.plaintext, 'base64'));
    }
    /**
     * Verify computation proof
     */
    async verifyProof(computationId, proof) {
        const response = await fetch(`${this.config.mxeEndpoint}/v1/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                computationId,
                proof: Buffer.from(proof).toString('base64'),
            }),
        });
        if (!response.ok) {
            return false;
        }
        const result = await response.json();
        return result.valid;
    }
    // ============ Private Methods ============
    serializeEncryptedValue(value) {
        return JSON.stringify({
            ciphertext: Buffer.from(value.ciphertext).toString('base64'),
            nonce: Buffer.from(value.nonce).toString('base64'),
            ephemeralPubKey: Buffer.from(value.ephemeralPubKey).toString('base64'),
            commitment: Buffer.from(value.commitment).toString('base64'),
        });
    }
    parseComputationResult(data) {
        const result = data;
        return {
            computationId: result.computationId,
            status: result.status,
            encryptedResult: result.encryptedResult ? {
                ciphertext: new Uint8Array(Buffer.from(result.encryptedResult.ciphertext, 'base64')),
                nonce: new Uint8Array(Buffer.from(result.encryptedResult.nonce, 'base64')),
                ephemeralPubKey: new Uint8Array(Buffer.from(result.encryptedResult.ephemeralPubKey, 'base64')),
                commitment: new Uint8Array(Buffer.from(result.encryptedResult.commitment, 'base64')),
            } : undefined,
            publicResult: result.publicResult,
            proof: new Uint8Array(Buffer.from(result.proof, 'base64')),
            metadata: {
                startTime: result.metadata.startTime,
                endTime: result.metadata.endTime,
                nodesParticipated: result.metadata.nodesParticipated,
                gasUsed: result.metadata.gasUsed ? BigInt(result.metadata.gasUsed) : undefined,
            },
        };
    }
}
/**
 * Create MXE client from config
 */
export function createMXEClient(config) {
    return new MXEClient(config);
}
//# sourceMappingURL=mxe.js.map