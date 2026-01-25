/**
 * Light Protocol Integration
 * 
 * ZK Compression infrastructure for Solana:
 * - Compressed accounts (~1000x cheaper storage)
 * - Concurrent Merkle trees for state
 * - ZK proofs for state transitions
 * - Photon indexer for compressed account queries
 */

export * from './types.js';
export * from './client.js';
export * from './compressed-pda.js';
export * from './photon.js';
