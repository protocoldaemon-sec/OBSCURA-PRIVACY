/**
 * Photon Indexer Client
 *
 * Query interface for compressed accounts on Solana:
 * - Get compressed accounts by owner
 * - Get compressed token accounts
 * - Get account proofs for transactions
 * - Subscribe to account changes
 */
/** Photon RPC methods */
export var PhotonMethod;
(function (PhotonMethod) {
    PhotonMethod["GetCompressedAccount"] = "getCompressedAccount";
    PhotonMethod["GetCompressedAccountsByOwner"] = "getCompressedAccountsByOwner";
    PhotonMethod["GetCompressedTokenAccountsByOwner"] = "getCompressedTokenAccountsByOwner";
    PhotonMethod["GetCompressedTokenAccountsByDelegate"] = "getCompressedTokenAccountsByDelegate";
    PhotonMethod["GetCompressedAccountProof"] = "getCompressedAccountProof";
    PhotonMethod["GetMultipleCompressedAccountProofs"] = "getMultipleCompressedAccountProofs";
    PhotonMethod["GetValidityProof"] = "getValidityProof";
    PhotonMethod["GetLatestSignatures"] = "getLatestSignatures";
    PhotonMethod["GetIndexerHealth"] = "getIndexerHealth";
    PhotonMethod["GetStateTree"] = "getStateTree";
})(PhotonMethod || (PhotonMethod = {}));
/**
 * Photon Indexer Client
 *
 * Provides read access to compressed account state
 */
export class PhotonClient {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Get a compressed account by hash
     */
    async getCompressedAccount(hash) {
        const response = await this.rpc(PhotonMethod.GetCompressedAccount, {
            hash: this.encodeBytes(hash),
        });
        if (!response.result) {
            return null;
        }
        return this.parseCompressedAccount(response.result);
    }
    /**
     * Get compressed accounts by owner
     */
    async getCompressedAccountsByOwner(owner, params) {
        const response = await this.rpc(PhotonMethod.GetCompressedAccountsByOwner, {
            owner,
            cursor: params?.cursor,
            limit: params?.limit ?? 100,
        });
        const result = response.result;
        return {
            items: (result?.items ?? []).map((item) => this.parseCompressedAccount(item)),
            cursor: result?.cursor,
            total: result?.total,
        };
    }
    /**
     * Get compressed token accounts by owner
     */
    async getCompressedTokenAccountsByOwner(owner, mint, params) {
        const response = await this.rpc(PhotonMethod.GetCompressedTokenAccountsByOwner, {
            owner,
            mint,
            cursor: params?.cursor,
            limit: params?.limit ?? 100,
        });
        const result = response.result;
        return {
            items: (result?.items ?? []).map((item) => this.parseCompressedTokenAccount(item)),
            cursor: result?.cursor,
            total: result?.total,
        };
    }
    /**
     * Get proof for a compressed account
     */
    async getCompressedAccountProof(hash) {
        const response = await this.rpc(PhotonMethod.GetCompressedAccountProof, {
            hash: this.encodeBytes(hash),
        });
        if (!response.result) {
            return null;
        }
        return this.parseCompressedAccountWithProof(response.result);
    }
    /**
     * Get proofs for multiple compressed accounts
     */
    async getMultipleCompressedAccountProofs(hashes) {
        const response = await this.rpc(PhotonMethod.GetMultipleCompressedAccountProofs, {
            hashes: hashes.map(h => this.encodeBytes(h)),
        });
        const result = response.result;
        return (result ?? []).map((item) => item ? this.parseCompressedAccountWithProof(item) : null);
    }
    /**
     * Get validity proof for a state transition
     */
    async getValidityProof(inputHashes, newAddresses) {
        const response = await this.rpc(PhotonMethod.GetValidityProof, {
            hashes: inputHashes.map(h => this.encodeBytes(h)),
            newAddresses,
        });
        const result = response.result;
        return {
            compressedProof: this.decodeBytes(result.compressedProof),
            rootIndices: result.rootIndices,
            leafIndices: result.leafIndices,
            roots: result.roots.map((r) => this.decodeBytes(r)),
        };
    }
    /**
     * Get state tree information
     */
    async getStateTree(pubkey) {
        const response = await this.rpc(PhotonMethod.GetStateTree, { pubkey });
        if (!response.result) {
            return null;
        }
        const result = response.result;
        return {
            pubkey: result.pubkey,
            treeType: result.treeType,
            root: this.decodeBytes(result.root),
            seq: BigInt(result.seq),
            height: result.height,
            leafCount: BigInt(result.leafCount),
            canopyDepth: result.canopyDepth,
        };
    }
    /**
     * Get indexer health status
     */
    async getHealth() {
        const response = await this.rpc(PhotonMethod.GetIndexerHealth, {});
        const result = response.result;
        return {
            status: result.status,
            latestSlot: BigInt(result.latestSlot),
            indexedSlot: BigInt(result.indexedSlot),
            lag: result.lag,
        };
    }
    /**
     * Get latest signatures for compressed transactions
     */
    async getLatestSignatures(limit = 100) {
        const response = await this.rpc(PhotonMethod.GetLatestSignatures, { limit });
        const result = response.result;
        return (result ?? []).map((item) => ({
            signature: item.signature,
            slot: BigInt(item.slot),
            timestamp: item.timestamp,
        }));
    }
    // ============ Private Methods ============
    async rpc(method, params) {
        const response = await fetch(this.config.photonUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: `photon-${Date.now()}`,
                method,
                params,
            }),
        });
        if (!response.ok) {
            throw new Error(`Photon RPC error: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(`Photon error: ${data.error.message}`);
        }
        return data;
    }
    encodeBytes(bytes) {
        return Buffer.from(bytes).toString('base64');
    }
    decodeBytes(encoded) {
        return new Uint8Array(Buffer.from(encoded, 'base64'));
    }
    parseCompressedAccount(data) {
        const d = data;
        return {
            hash: this.decodeBytes(d.hash),
            owner: d.owner,
            lamports: BigInt(d.lamports),
            data: this.decodeBytes(d.data),
            dataHash: this.decodeBytes(d.dataHash),
            address: d.address,
        };
    }
    parseCompressedTokenAccount(data) {
        const d = data;
        return {
            hash: this.decodeBytes(d.hash),
            mint: d.mint,
            owner: d.owner,
            amount: BigInt(d.amount),
            delegate: d.delegate,
            delegatedAmount: d.delegatedAmount ? BigInt(d.delegatedAmount) : undefined,
            isFrozen: d.isFrozen,
            closeAuthority: d.closeAuthority,
        };
    }
    parseCompressedAccountWithProof(data) {
        const d = data;
        return {
            account: this.parseCompressedAccount(d.account),
            proof: {
                proof: d.proof.proof.map(p => this.decodeBytes(p)),
                root: this.decodeBytes(d.proof.root),
                leaf: this.decodeBytes(d.proof.leaf),
                leafIndex: d.proof.leafIndex,
            },
            rootIndex: d.rootIndex,
            leafIndex: d.leafIndex,
        };
    }
}
/**
 * Create Photon client from config
 */
export function createPhotonClient(config) {
    return new PhotonClient(config);
}
//# sourceMappingURL=photon.js.map