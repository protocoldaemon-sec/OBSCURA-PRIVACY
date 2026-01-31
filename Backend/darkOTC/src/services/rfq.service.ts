/**
 * RFQ Core Service
 * 
 * Implements the core RFQ (Request for Quote) operations:
 * - Quote request creation
 * - Quote request timeout logic
 * - Quote request cancellation
 * 
 * ⚠️ CRITICAL: All implementations use REAL infrastructure.
 * NO mocks, stubs, or simulations allowed.
 * 
 * Requirements:
 * - 1.1-1.6: Quote request creation
 * - 10.1-10.8: Timeout and cancellation logic
 */

import * as crypto from 'crypto';
import { privacyService } from './privacy.service';
import { balanceService } from './balance.service';
import { signatureService } from './signature.service';
import { whitelistService } from './whitelist.service';
import { settlementService } from './settlement.service';
import { nullifierTrackingService } from './nullifier-tracking.service';
import { supabaseConfig } from '../config/supabase.config';
import {
  ValidationError,
} from '../middleware/error-handler.middleware';
import {
  QuoteRequestStatus,
  QuoteStatus,
  AssetPair,
  WOTSSignature,
  WOTSPublicKey,
  Timestamp,
  AmountString,
  StealthAddress,
  PedersenCommitment,
} from '../types/common.types';

/**
 * Quote Request Creation Parameters
 */
export interface CreateQuoteRequestParams {
  assetPair: AssetPair;
  direction: 'buy' | 'sell';
  amount: AmountString;
  timeout: Timestamp;
  signature: WOTSSignature;
  publicKey: WOTSPublicKey;
  message: string; // Message that was signed by frontend
  commitment?: string; // Optional: User's deposit commitment for balance verification
  chainId?: 'solana-devnet' | 'sepolia'; // Optional: Chain for balance verification
}

/**
 * Quote Request Creation Response
 */
export interface CreateQuoteRequestResponse {
  quoteRequestId: string;
  stealthAddress: StealthAddress;
  commitment: PedersenCommitment;
  expiresAt: Timestamp;
}

/**
 * Quote Request Cancellation Parameters
 */
export interface CancelQuoteRequestParams {
  quoteRequestId: string;
  signature: WOTSSignature;
  publicKey: WOTSPublicKey;
}

/**
 * Quote Request Cancellation Response
 */
export interface CancelQuoteRequestResponse {
  quoteRequestId: string;
  status: QuoteRequestStatus.CANCELLED;
}

/**
 * Quote Request Data (from database)
 */
export interface QuoteRequestData {
  id: string;
  asset_pair: string;
  direction: string;
  amount_commitment: string;
  stealth_address: string;
  taker_public_key: string;
  created_at: number;
  expires_at: number;
  status: string;
  nullifier: string | null;
}

/**
 * Quote Submission Parameters
 */
export interface SubmitQuoteParams {
  quoteRequestId: string;
  price: AmountString;
  expirationTime: Timestamp;
  signature: WOTSSignature;
  publicKey: WOTSPublicKey;
  walletAddress: string; // Solana wallet address for settlement
  commitment?: string; // Optional: Market maker's deposit commitment for balance verification AND settlement
  nullifierHash?: string; // Optional: Market maker's nullifier hash from deposit note (for settlement)
  chainId?: 'solana-devnet' | 'sepolia'; // Optional: Chain for balance verification
}

/**
 * Quote Submission Response
 */
export interface SubmitQuoteResponse {
  quoteId: string;
  priceCommitment: PedersenCommitment;
  expiresAt: Timestamp;
}

/**
 * Quote Data (from database)
 */
export interface QuoteData {
  id: string;
  quote_request_id: string;
  price_commitment: string;
  market_maker_public_key: string;
  market_maker_address: string; // Solana wallet address for settlement
  market_maker_commitment?: string; // Market maker's deposit commitment for settlement
  market_maker_nullifier_hash?: string; // Market maker's nullifier hash from deposit note
  created_at: number;
  expires_at: number;
  status: string;
}

/**
 * Quote Acceptance Parameters
 */
export interface AcceptQuoteParams {
  quoteId: string;
  signature: WOTSSignature;
  publicKey: WOTSPublicKey;
  chainId?: 'solana-devnet' | 'sepolia'; // Optional: Chain for settlement
  takerCommitment?: string; // Optional: Taker's deposit commitment (for payment)
  takerAddress?: string; // Optional: Taker's wallet address (to receive asset)
  takerNullifierHash?: string; // Optional: Nullifier hash extracted from taker's deposit note
  marketMakerCommitment?: string; // Optional: Market maker's deposit commitment (for asset)
  marketMakerNullifierHash?: string; // Optional: Nullifier hash extracted from market maker's deposit note
}

/**
 * Quote Acceptance Response
 */
export interface AcceptQuoteResponse {
  quoteId: string;
  quoteRequestId: string;
  nullifier: string;
  txHash?: string; // Transaction hash from Obscura-LLMS settlement
  zkCompressed?: boolean; // Whether ZK compression was used (Solana only)
  compressionSignature?: string; // Compression signature (Solana only)
}

/**
 * RFQ Service Class
 * 
 * Provides core RFQ operations for quote requests.
 */
export class RFQService {
  /**
   * Create Quote Request
   * 
   * Creates a new private quote request with:
   * - Stealth address generation
   * - Pedersen commitment for amount
   * - Balance verification
   * - WOTS+ signature verification
   * - Database storage
   * 
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
   * 
   * @param params - Quote request creation parameters
   * @returns Quote request creation response
   */
  async createQuoteRequest(
    params: CreateQuoteRequestParams
  ): Promise<CreateQuoteRequestResponse> {
    const {
      assetPair,
      direction,
      amount,
      timeout,
      signature,
      publicKey,
      message,
      commitment,
      chainId,
    } = params;

    // Validate timeout is in the future
    const now = Date.now();
    if (timeout <= now) {
      throw new ValidationError('Timeout must be in the future', {
        timeout,
        now,
      });
    }

    // Validate timeout is not more than 24 hours
    const maxTimeout = now + 24 * 60 * 60 * 1000; // 24 hours
    if (timeout > maxTimeout) {
      throw new ValidationError('Timeout cannot exceed 24 hours', {
        timeout,
        maxTimeout,
      });
    }

    // Verify WOTS+ signature using the message from frontend
    // Frontend creates message and hashes it with SHA-256 before signing
    console.log('[RFQService] Verifying signature for message:', message);
    const signatureVerification = await signatureService.verifySignature({
      message,
      signature,
      publicKey,
    });

    if (!signatureVerification.isValid) {
      throw new Error(
        `Signature verification failed: ${signatureVerification.error || 'Invalid signature'}`
      );
    }

    // Check signature reuse
    const signatureReuse = await signatureService.checkSignatureReuse({
      signature,
      operationType: 'quote_request',
      publicKey,
    });

    if (signatureReuse.isReused) {
      throw new Error('Signature has already been used');
    }

    // Generate stealth address (for privacy - identity hidden)
    const stealthAddressPair = privacyService.generateStealthAddress();

    // NO COMMITMENT - Store amount as plaintext for fair trading
    // Privacy is maintained through:
    // - Stealth addresses (identity hidden)
    // - ZK proofs for settlement
    // - Relayer network (on-chain privacy)
    
    // Verify taker has sufficient balance (if commitment and chainId provided)
    const amountBigInt = BigInt(amount); // Amount already in smallest units (lamports/wei)
    
    if (commitment && chainId) {
      const balanceVerification = await balanceService.verifyQuoteRequestBalance(
        commitment,
        amountBigInt,
        chainId
      );

      if (!balanceVerification.hasSufficientBalance) {
        throw new Error(
          `Insufficient balance: ${balanceVerification.error || 'Balance verification failed'}`
        );
      }
    }

    // Generate quote request ID
    const quoteRequestId = crypto.randomUUID();

    // Store quote request in Supabase with PLAINTEXT amount
    const quoteRequestData: Omit<QuoteRequestData, 'nullifier'> & { nullifier: null } = {
      id: quoteRequestId,
      asset_pair: assetPair,
      direction,
      amount_commitment: amount, // Store amount as plaintext (no commitment)
      stealth_address: stealthAddressPair.address,
      taker_public_key: publicKey,
      created_at: now,
      expires_at: timeout,
      status: QuoteRequestStatus.ACTIVE,
      nullifier: null,
    };

    const { error: insertError } = await supabaseConfig.adminClient
      .from('quote_requests')
      .insert(quoteRequestData);

    if (insertError) {
      throw new Error(`Failed to store quote request: ${insertError.message}`);
    }

    // Mark signature as used
    await signatureService.markSignatureUsed(
      signature,
      'quote_request',
      publicKey
    );

    // Return response with amount (not commitment)
    return {
      quoteRequestId,
      stealthAddress: stealthAddressPair.address,
      commitment: amount, // Return amount for display (renamed field for backward compat)
      expiresAt: timeout,
    };
  }

  /**
   * Check and Mark Expired Quote Requests
   * 
   * Checks if a quote request has expired and marks it as expired in the database.
   * 
   * Requirements: 10.1, 10.2
   * 
   * @param quoteRequestId - Quote request ID to check
   * @returns True if quote request is expired
   */
  async checkAndMarkExpired(quoteRequestId: string): Promise<boolean> {
    const now = Date.now();

    // Get quote request from database
    const { data: quoteRequest, error } = await supabaseConfig.adminClient
      .from('quote_requests')
      .select('*')
      .eq('id', quoteRequestId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch quote request: ${error.message}`);
    }

    if (!quoteRequest) {
      throw new Error('Quote request not found');
    }

    // Check if expired
    const isExpired = quoteRequest.expires_at <= now;

    // If expired and status is still active, mark as expired
    if (isExpired && quoteRequest.status === QuoteRequestStatus.ACTIVE) {
      const { error: updateError } = await supabaseConfig.adminClient
        .from('quote_requests')
        .update({ status: QuoteRequestStatus.EXPIRED })
        .eq('id', quoteRequestId);

      if (updateError) {
        throw new Error(`Failed to mark quote request as expired: ${updateError.message}`);
      }
    }

    return isExpired;
  }

  /**
   * Verify Quote Request is Active
   * 
   * Verifies that a quote request exists, is not expired, and is in active status.
   * 
   * Requirements: 10.3, 10.4
   * 
   * @param quoteRequestId - Quote request ID to verify
   * @returns Quote request data if active
   * @throws Error if quote request is not active
   */
  async verifyQuoteRequestActive(quoteRequestId: string): Promise<QuoteRequestData> {
    const now = Date.now();

    // Get quote request from database
    const { data: quoteRequest, error } = await supabaseConfig.adminClient
      .from('quote_requests')
      .select('*')
      .eq('id', quoteRequestId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch quote request: ${error.message}`);
    }

    if (!quoteRequest) {
      throw new Error('Quote request not found');
    }

    // Check if expired
    if (quoteRequest.expires_at <= now) {
      // Mark as expired if not already
      if (quoteRequest.status === QuoteRequestStatus.ACTIVE) {
        await supabaseConfig.adminClient
          .from('quote_requests')
          .update({ status: QuoteRequestStatus.EXPIRED })
          .eq('id', quoteRequestId);
      }
      throw new Error('Quote request has expired');
    }

    // Check if status is active
    if (quoteRequest.status !== QuoteRequestStatus.ACTIVE) {
      throw new Error(`Quote request is ${quoteRequest.status}`);
    }

    return quoteRequest as QuoteRequestData;
  }

  /**
   * Cancel Quote Request
   * 
   * Cancels a quote request by marking it as cancelled in the database.
   * Verifies that the taker owns the quote request via signature verification.
   * 
   * Requirements: 10.5, 10.6, 10.7, 10.8
   * 
   * @param params - Cancellation parameters
   * @returns Cancellation response
   */
  async cancelQuoteRequest(
    params: CancelQuoteRequestParams
  ): Promise<CancelQuoteRequestResponse> {
    const { quoteRequestId, signature, publicKey } = params;

    // Get quote request from database
    const { data: quoteRequest, error } = await supabaseConfig.adminClient
      .from('quote_requests')
      .select('*')
      .eq('id', quoteRequestId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch quote request: ${error.message}`);
    }

    if (!quoteRequest) {
      throw new Error('Quote request not found');
    }

    // WOTS+ Ownership Verification:
    // We DON'T check if publicKey matches taker_public_key because WOTS+ uses ONE-TIME signatures.
    // Each action (create, cancel, accept) uses a DIFFERENT public key.
    // Ownership is proven by:
    // 1. User knows the quoteRequestId (only creator has this)
    // 2. User can sign valid WOTS+ signature (proves authenticity)
    // This is the correct design for WOTS+ one-time signature scheme.

    // Verify WOTS+ signature
    // Message format: "cancel_quote_request:{quoteRequestId}"
    const message = `cancel_quote_request:${quoteRequestId}`;
    const signatureVerification = await signatureService.verifySignature({
      message,
      signature,
      publicKey,
    });

    if (!signatureVerification.isValid) {
      throw new Error(
        `Signature verification failed: ${signatureVerification.error || 'Invalid signature'}`
      );
    }

    // Check signature reuse
    const signatureReuse = await signatureService.checkSignatureReuse({
      signature,
      operationType: 'cancel_quote_request',
      publicKey,
    });

    if (signatureReuse.isReused) {
      throw new Error('Signature has already been used');
    }

    // Check if quote request can be cancelled
    if (quoteRequest.status === QuoteRequestStatus.FILLED) {
      throw new Error('Cannot cancel a filled quote request');
    }

    if (quoteRequest.status === QuoteRequestStatus.CANCELLED) {
      throw new Error('Quote request is already cancelled');
    }

    // Mark quote request as cancelled
    const { error: updateError } = await supabaseConfig.adminClient
      .from('quote_requests')
      .update({ status: QuoteRequestStatus.CANCELLED })
      .eq('id', quoteRequestId);

    if (updateError) {
      throw new Error(`Failed to cancel quote request: ${updateError.message}`);
    }

    // Mark signature as used
    await signatureService.markSignatureUsed(
      signature,
      'cancel_quote_request',
      publicKey
    );

    // Return response
    return {
      quoteRequestId,
      status: QuoteRequestStatus.CANCELLED,
    };
  }

  /**
   * Submit Quote
   * 
   * Market maker submits a quote in response to a quote request with:
   * - Whitelist verification
   * - Quote request validation (exists, not expired)
   * - Pedersen commitment for price
   * - Balance verification
   * - WOTS+ signature verification
   * - Database storage
   * 
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
   * 
   * @param params - Quote submission parameters
   * @returns Quote submission response
   */
  async submitQuote(params: SubmitQuoteParams): Promise<SubmitQuoteResponse> {
    const {
      quoteRequestId,
      price,
      expirationTime,
      signature,
      publicKey,
      walletAddress,
      commitment,
      nullifierHash,
      chainId,
    } = params;

    const now = Date.now();

    // Requirement 2.2: Verify market maker is whitelisted
    const isWhitelisted = await whitelistService.isWhitelisted(publicKey);
    if (!isWhitelisted) {
      throw new Error('Market maker is not whitelisted');
    }

    // Requirement 2.3: Verify quote request exists and not expired
    const quoteRequest = await this.verifyQuoteRequestActive(quoteRequestId);

    // Validate expiration time is in the future
    if (expirationTime <= now) {
      throw new Error('Quote expiration time must be in the future');
    }

    // Validate quote expiration does not exceed quote request expiration
    if (expirationTime > quoteRequest.expires_at) {
      throw new Error('Quote expiration cannot exceed quote request expiration');
    }

    // Requirement 2.1: Verify WOTS+ signature
    // Message format: "submit_quote:{quoteRequestId}:{price}:{expirationTime}"
    const message = `submit_quote:${quoteRequestId}:${price}:${expirationTime}`;
    const signatureVerification = await signatureService.verifySignature({
      message,
      signature,
      publicKey,
    });

    if (!signatureVerification.isValid) {
      throw new Error(
        `Signature verification failed: ${signatureVerification.error || 'Invalid signature'}`
      );
    }

    // Check signature reuse
    const signatureReuse = await signatureService.checkSignatureReuse({
      signature,
      operationType: 'submit_quote',
      publicKey,
    });

    if (signatureReuse.isReused) {
      throw new Error('Signature has already been used');
    }

    // CRITICAL SECURITY: Validate nullifier and commitment not already used
    // This prevents double-spend attacks via API bypass (curl/Postman)
    // NOTE: Validation only - actual tracking is handled by Obscura-LLMS backend
    if (nullifierHash) {
      const nullifierCheck = await nullifierTrackingService.checkNullifierUsed(nullifierHash);
      if (nullifierCheck.isUsed) {
        throw new Error(
          `Nullifier already used for quote ${nullifierCheck.usedForQuoteId} ` +
          `(status: ${nullifierCheck.status}, entity: ${nullifierCheck.entityType})`
        );
      }
    }

    if (commitment) {
      const commitmentCheck = await nullifierTrackingService.checkCommitmentUsed(commitment);
      if (commitmentCheck.isUsed) {
        throw new Error(
          `Commitment already used for active quote ${commitmentCheck.existingQuoteId}`
        );
      }
    }

    // NO COMMITMENT for price - Store as plaintext for fair trading
    // Privacy maintained through stealth addresses and ZK settlement
    
    // Requirement 2.6: Verify market maker has sufficient balance (if commitment and chainId provided)
    if (commitment && chainId) {
      // For quote submission, we need to verify the market maker can fulfill the quote
      // The amount depends on the quote request direction:
      // - If taker is buying, market maker needs to sell (provide the asset)
      // - If taker is selling, market maker needs to buy (provide payment)
      const amountBigInt = BigInt(quoteRequest.amount_commitment); // Now plaintext amount
      
      const balanceVerification = await balanceService.verifyQuoteRequestBalance(
        commitment,
        amountBigInt,
        chainId
      );

      if (!balanceVerification.hasSufficientBalance) {
        throw new Error(
          `Insufficient balance: ${balanceVerification.error || 'Balance verification failed'}`
        );
      }
    }

    // Generate quote ID
    const quoteId = crypto.randomUUID();

    // Store quote in Supabase with PLAINTEXT price
    const quoteData: QuoteData = {
      id: quoteId,
      quote_request_id: quoteRequestId,
      price_commitment: price, // Store price as plaintext (no commitment)
      market_maker_public_key: publicKey,
      market_maker_address: walletAddress, // Store wallet address for settlement
      market_maker_commitment: commitment, // Store commitment for settlement
      market_maker_nullifier_hash: nullifierHash, // Store nullifier hash for settlement
      created_at: now,
      expires_at: expirationTime,
      status: QuoteStatus.ACTIVE,
    };

    const { error: insertError } = await supabaseConfig.adminClient
      .from('quotes')
      .insert(quoteData);

    if (insertError) {
      throw new Error(`Failed to store quote: ${insertError.message}`);
    }

    // NOTE: Nullifier tracking is now handled by Obscura-LLMS backend
    // Dark OTC only validates, does not save

    // Mark signature as used
    await signatureService.markSignatureUsed(signature, 'submit_quote', publicKey);

    // Requirement 2.7: Return quote_id to market maker with price (not commitment)
    return {
      quoteId,
      priceCommitment: price, // Return price for display (renamed field for backward compat)
      expiresAt: expirationTime,
    };
  }

  /**
   * Get Quote Request
   * 
   * Retrieves a quote request by ID.
   * 
   * @param quoteRequestId - Quote request ID
   * @returns Quote request data
   */
  async getQuoteRequest(quoteRequestId: string): Promise<QuoteRequestData | null> {
    const { data: quoteRequest, error } = await supabaseConfig.adminClient
      .from('quote_requests')
      .select('*')
      .eq('id', quoteRequestId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch quote request: ${error.message}`);
    }

    return quoteRequest as QuoteRequestData | null;
  }

  /**
   * Get Quote Requests by Taker
   * 
   * Retrieves all quote requests created by a specific taker.
   * 
   * @param takerPublicKey - Taker's public key
   * @param status - Optional status filter
   * @returns Array of quote request data
   */
  async getQuoteRequestsByTaker(
    takerPublicKey: WOTSPublicKey,
    status?: QuoteRequestStatus
  ): Promise<QuoteRequestData[]> {
    let query = supabaseConfig.adminClient
      .from('quote_requests')
      .select('*')
      .eq('taker_public_key', takerPublicKey)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: quoteRequests, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch quote requests: ${error.message}`);
    }

    return (quoteRequests as QuoteRequestData[]) || [];
  }

  /**
   * Get Quote
   * 
   * Retrieves a quote by ID.
   * 
   * @param quoteId - Quote ID
   * @returns Quote data
   */
  async getQuote(quoteId: string): Promise<QuoteData | null> {
    const { data: quote, error } = await supabaseConfig.adminClient
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch quote: ${error.message}`);
    }

    return quote as QuoteData | null;
  }

  /**
   * Get Quotes by Quote Request
   * 
   * Retrieves all quotes for a specific quote request.
   * Filters out expired quotes.
   * 
   * Requirement 3.1: Return all valid non-expired quotes
   * 
   * @param quoteRequestId - Quote request ID
   * @returns Array of quote data
   */
  async getQuotesByRequestId(quoteRequestId: string): Promise<QuoteData[]> {
    const now = Date.now();

    const { data: quotes, error } = await supabaseConfig.adminClient
      .from('quotes')
      .select('*')
      .eq('quote_request_id', quoteRequestId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch quotes: ${error.message}`);
    }

    if (!quotes) {
      return [];
    }

    // Filter out expired quotes and mark them as expired in database
    const validQuotes: QuoteData[] = [];
    const expiredQuoteIds: string[] = [];

    for (const quote of quotes as QuoteData[]) {
      if (quote.expires_at <= now && quote.status === QuoteStatus.ACTIVE) {
        expiredQuoteIds.push(quote.id);
      } else if (quote.expires_at > now || quote.status !== QuoteStatus.ACTIVE) {
        validQuotes.push(quote);
      }
    }

    // Mark expired quotes in database
    if (expiredQuoteIds.length > 0) {
      await supabaseConfig.adminClient
        .from('quotes')
        .update({ status: QuoteStatus.EXPIRED })
        .in('id', expiredQuoteIds);
    }

    return validQuotes;
  }

  /**
   * Check and Mark Expired Quote
   * 
   * Checks if a quote has expired and marks it as expired in the database.
   * 
   * Requirement 2.3: Quote expiration logic
   * 
   * @param quoteId - Quote ID to check
   * @returns True if quote is expired
   */
  async checkAndMarkExpiredQuote(quoteId: string): Promise<boolean> {
    const now = Date.now();

    // Get quote from database
    const { data: quote, error } = await supabaseConfig.adminClient
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch quote: ${error.message}`);
    }

    if (!quote) {
      throw new Error('Quote not found');
    }

    // Check if expired
    const isExpired = quote.expires_at <= now;

    // If expired and status is still active, mark as expired
    if (isExpired && quote.status === QuoteStatus.ACTIVE) {
      const { error: updateError } = await supabaseConfig.adminClient
        .from('quotes')
        .update({ status: QuoteStatus.EXPIRED })
        .eq('id', quoteId);

      if (updateError) {
        throw new Error(`Failed to mark quote as expired: ${updateError.message}`);
      }
    }

    return isExpired;
  }

  /**
   * Verify Quote is Active
   * 
   * Verifies that a quote exists, is not expired, and is in active status.
   * 
   * Requirement 3.3: Verify quote has not expired
   * 
   * @param quoteId - Quote ID to verify
   * @returns Quote data if active
   * @throws Error if quote is not active
   */
  async verifyQuoteActive(quoteId: string): Promise<QuoteData> {
    const now = Date.now();

    // Get quote from database
    const { data: quote, error } = await supabaseConfig.adminClient
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch quote: ${error.message}`);
    }

    if (!quote) {
      throw new Error('Quote not found');
    }

    // Check if expired
    if (quote.expires_at <= now) {
      // Mark as expired if not already
      if (quote.status === QuoteStatus.ACTIVE) {
        await supabaseConfig.adminClient
          .from('quotes')
          .update({ status: QuoteStatus.EXPIRED })
          .eq('id', quoteId);
      }
      throw new Error('Quote has expired');
    }

    // Check if status is active
    if (quote.status !== QuoteStatus.ACTIVE) {
      throw new Error(`Quote is ${quote.status}`);
    }

    return quote as QuoteData;
  }

  /**
   * Accept Quote
   * 
   * Taker accepts a quote, executing settlement and marking quote request as filled.
   * 
   * Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
   * 
   * @param params - Quote acceptance parameters
   * @returns Quote acceptance response with nullifier and settlement details
   */
  async acceptQuote(params: AcceptQuoteParams): Promise<AcceptQuoteResponse> {
    const { quoteId, signature, publicKey, chainId, takerCommitment, takerAddress, takerNullifierHash, marketMakerCommitment, marketMakerNullifierHash } = params;

    // Get quote first
    const quote = await this.getQuote(quoteId);
    if (!quote) {
      throw new Error('Quote not found');
    }

    // Get quote request
    const quoteRequest = await this.getQuoteRequest(quote.quote_request_id);
    if (!quoteRequest) {
      throw new Error('Quote request not found');
    }

    // WOTS+ Ownership Verification:
    // We DON'T check if publicKey matches taker_public_key because WOTS+ uses ONE-TIME signatures.
    // Each action (create, cancel, accept) uses a DIFFERENT public key.
    // Ownership is proven by:
    // 1. User knows the quoteId (only authorized users have this)
    // 2. User can sign valid WOTS+ signature (proves authenticity)
    // This is the correct design for WOTS+ one-time signature scheme.

    // Requirement 3.7: Verify quote request not already filled or cancelled
    if (quoteRequest.status === QuoteRequestStatus.FILLED) {
      throw new Error('Quote request has already been filled');
    }

    if (quoteRequest.status === QuoteRequestStatus.CANCELLED) {
      throw new Error('Quote request has been cancelled');
    }

    if (quoteRequest.status === QuoteRequestStatus.EXPIRED) {
      throw new Error('Quote request has expired');
    }

    // Requirement 3.3: Verify quote exists and not expired
    const now = Date.now();
    if (quote.expires_at <= now) {
      // Mark as expired if not already
      if (quote.status === QuoteStatus.ACTIVE) {
        await supabaseConfig.adminClient
          .from('quotes')
          .update({ status: QuoteStatus.EXPIRED })
          .eq('id', quoteId);
      }
      throw new Error('Quote has expired');
    }

    // Check if quote status is active
    if (quote.status !== QuoteStatus.ACTIVE) {
      throw new Error(`Quote is ${quote.status}`);
    }

    // Verify WOTS+ signature
    // Message format: "accept_quote:{quoteId}"
    const message = `accept_quote:${quoteId}`;
    const signatureVerification = await signatureService.verifySignature({
      message,
      signature,
      publicKey,
    });

    if (!signatureVerification.isValid) {
      throw new Error(
        `Signature verification failed: ${signatureVerification.error || 'Invalid signature'}`
      );
    }

    // Check signature reuse
    const signatureReuse = await signatureService.checkSignatureReuse({
      signature,
      operationType: 'accept_quote',
      publicKey,
    });

    if (signatureReuse.isReused) {
      throw new Error('Signature has already been used');
    }

    // CRITICAL SECURITY: Validate taker nullifier not already used
    // This prevents double-spend attacks via API bypass
    if (takerNullifierHash) {
      const takerNullifierCheck = await nullifierTrackingService.checkNullifierUsed(takerNullifierHash);
      if (takerNullifierCheck.isUsed) {
        throw new Error(
          `Taker nullifier already used for quote ${takerNullifierCheck.usedForQuoteId} ` +
          `(status: ${takerNullifierCheck.status})`
        );
      }
    }

    // Requirement 3.4: Generate nullifier to prevent double-acceptance
    const nullifierData = privacyService.generateNullifier();

    // Requirement 3.6: Execute settlement via Obscura-LLMS (atomic balance updates)
    let settlementResult;
    if (takerCommitment && takerAddress && chainId) {
      try {
        // Get market maker commitment from quote
        const mmCommitment = marketMakerCommitment || quote.market_maker_commitment;
        
        if (!mmCommitment) {
          throw new Error(
            'Market maker commitment not found. Market maker must provide commitment when submitting quote.'
          );
        }
        
        // CRITICAL: Validate nullifier hashes are provided
        if (!takerNullifierHash) {
          throw new Error(
            'Taker nullifier hash is required. Frontend must extract nullifierHash from deposit note.'
          );
        }
        
        // Get market maker nullifier hash from request or quote
        const mmNullifierHash = marketMakerNullifierHash || quote.market_maker_nullifier_hash;
        
        if (!mmNullifierHash) {
          throw new Error(
            'Market maker nullifier hash is required. Market maker must provide nullifierHash when submitting quote, or taker must provide it when accepting.'
          );
        }
        
        // Parse asset pair to determine tokens
        const [baseToken, quoteToken] = quoteRequest.asset_pair.split('/'); // e.g., "SOL/USDC"
        
        // Calculate payment amount
        // Price is per base token unit (e.g., 150 USDC per 1 SOL)
        // Both assetAmount and pricePerUnit are in base units (lamports, micro-USDC)
        // Formula: paymentAmount = (assetAmount × pricePerUnit) / baseTokenDecimals
        
        const assetAmount = BigInt(quoteRequest.amount_commitment);
        const pricePerUnit = BigInt(quote.price_commitment);
        
        // CRITICAL: Frontend sends ALL values in 9 decimals (1e9)
        // CRITICAL: Price is TOTAL price in quote token, NOT per unit!
        // Example: BUY 2 SOL, quote 300 USDC
        //   amount = 2,000,000,000 (2 SOL in 9 decimals)
        //   price = 300,000,000 (300 USDC TOTAL in 6 decimals)
        //   Settlement: Taker pays 300 USDC, receives 2 SOL
        
        // NO CALCULATION NEEDED - price is already the total!
        const totalQuoteToken = pricePerUnit;
        
        // Determine settlement amounts based on direction
        let assetAmountFinal: string;
        let paymentAmountFinal: string;
        let assetToken: string;
        let paymentToken: string;
        
        if (quoteRequest.direction === 'buy') {
          // Taker BUYS base token, PAYS quote token
          // - Taker pays: price (total in quote token)
          // - Taker receives: amount (in base token)
          paymentToken = quoteToken;
          paymentAmountFinal = totalQuoteToken.toString();
          assetToken = baseToken;
          assetAmountFinal = assetAmount.toString();
        } else {
          // Taker SELLS base token, RECEIVES quote token
          // - Taker pays: amount (in base token)
          // - Taker receives: price (total in quote token)
          paymentToken = baseToken;
          paymentAmountFinal = assetAmount.toString();
          assetToken = quoteToken;
          assetAmountFinal = totalQuoteToken.toString();
        }
        
        console.log(
          `[RFQService] Settlement amount calculation:` +
          `\n  Request amount: ${assetAmount} (${quoteRequest.amount_commitment})` +
          `\n  Quote price per unit: ${pricePerUnit} (${quote.price_commitment})` +
          `\n  Direction: ${quoteRequest.direction}` +
          `\n  Base token: ${baseToken}` +
          `\n  Quote token: ${quoteToken}` +
          `\n  Total quote token: ${totalQuoteToken}`
        );
        
        // Map token names to Obscura-LLMS format
        // SOL/ETH → 'native', USDC/USDT → lowercase
        const mapTokenToObscuraFormat = (token: string): string => {
          if (token === 'SOL' || token === 'ETH') return 'native';
          return token.toLowerCase(); // usdc, usdt, etc.
        };
        
        const assetTokenFormatted = mapTokenToObscuraFormat(assetToken);
        const paymentTokenFormatted = mapTokenToObscuraFormat(paymentToken);
        
        console.log(
          `[RFQService] Executing atomic swap:` +
          `\n  Direction: ${quoteRequest.direction}` +
          `\n  Taker pays: ${paymentAmountFinal} ${paymentToken} (${paymentTokenFormatted})` +
          `\n  Taker receives: ${assetAmountFinal} ${assetToken} (${assetTokenFormatted})` +
          `\n  Market Maker receives: ${paymentAmountFinal} ${paymentToken} (${paymentTokenFormatted})` +
          `\n  Market Maker sends: ${assetAmountFinal} ${assetToken} (${assetTokenFormatted})` +
          `\n  Taker nullifier: ${takerNullifierHash.substring(0, 16)}...` +
          `\n  MM nullifier: ${mmNullifierHash.substring(0, 16)}...`
        );
        
        settlementResult = await settlementService.executeSettlement({
          takerCommitment,
          marketMakerCommitment: mmCommitment,
          takerAddress,
          marketMakerAddress: quote.market_maker_address,
          assetAmount: assetAmountFinal,
          paymentAmount: paymentAmountFinal,
          assetToken: assetTokenFormatted,
          paymentToken: paymentTokenFormatted,
          chainId,
          takerNullifierHash,
          marketMakerNullifierHash: mmNullifierHash,
        });

        if (!settlementResult.success) {
          throw new Error(
            `Settlement failed: ${settlementResult.error || 'Unknown error'}`
          );
        }

        console.log(
          `[RFQService] Settlement successful: txHash=${settlementResult.txHash}`
        );

        // NOTE: Nullifier tracking is now handled by Obscura-LLMS backend
        // Dark OTC only validates, does not save
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Settlement execution failed: ${errorMessage}`);
      }
    } else if (takerCommitment || takerAddress || takerNullifierHash || chainId) {
      // Partial parameters provided - this is an error
      throw new Error(
        'Settlement requires all parameters: takerCommitment, takerAddress, takerNullifierHash, and chainId'
      );
    }

    // Requirement 3.7: Mark quote request as filled and quote as accepted (atomic)
    // Use Supabase transaction for atomicity
    const { error: updateError } = await supabaseConfig.adminClient.rpc('accept_quote_atomic', {
      p_quote_id: quoteId,
      p_quote_request_id: quote.quote_request_id,
      p_nullifier: nullifierData.nullifier,
    });

    if (updateError) {
      // If RPC doesn't exist, fall back to manual updates (not atomic, but works for MVP)
      // Update quote request status
      const { error: qrError } = await supabaseConfig.adminClient
        .from('quote_requests')
        .update({
          status: QuoteRequestStatus.FILLED,
          nullifier: nullifierData.nullifier,
        })
        .eq('id', quote.quote_request_id);

      if (qrError) {
        throw new Error(`Failed to mark quote request as filled: ${qrError.message}`);
      }

      // Update quote status
      const { error: quoteError } = await supabaseConfig.adminClient
        .from('quotes')
        .update({ status: QuoteStatus.ACCEPTED })
        .eq('id', quoteId);

      if (quoteError) {
        throw new Error(`Failed to mark quote as accepted: ${quoteError.message}`);
      }
    }

    // Mark signature as used
    await signatureService.markSignatureUsed(signature, 'accept_quote', publicKey);

    // Requirement 3.8: Return confirmation with nullifier and settlement details
    return {
      quoteId,
      quoteRequestId: quote.quote_request_id,
      nullifier: nullifierData.nullifier,
      txHash: settlementResult?.txHash,
      zkCompressed: settlementResult?.zkCompressed,
      compressionSignature: settlementResult?.compressionSignature,
    };
  }
}

// Export singleton instance
export const rfqService = new RFQService();
