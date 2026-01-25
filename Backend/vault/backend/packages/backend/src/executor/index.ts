/**
 * Aggregator/Executor Service
 * 
 * Batches authorized intents with solver quote integration and 
 * submits to settlement contracts on multiple chains.
 */

// Main aggregator with quote support
export { Aggregator } from './aggregator.js';
export type { 
  AggregatorConfig, 
  IntentSubmissionResult,
} from './aggregator.js';

// Batch builder
export { BatchBuilder } from './batch.js';

// Multi-chain executor
export { MultiChainExecutor } from './multi-chain.js';
export type { 
  ChainConfig, 
  ExecutorConfig, 
  SubmissionResult,
} from './multi-chain.js';

// Re-export quote and settlement types
export type { 
  BatchCommitment, 
  SettlementRecord,
  SolverQuote,
  QuoteRequest,
  SelectedQuote,
} from '../types.js';

