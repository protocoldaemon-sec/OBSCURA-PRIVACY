/**
 * RFQ API Routes
 * 
 * Implements REST API endpoints for RFQ operations:
 * - POST /api/v1/rfq/quote-request - Create quote request
 * - POST /api/v1/rfq/quote-request/:id/cancel - Cancel quote request
 * - GET /api/v1/rfq/quote-request/:id - Get quote request
 * 
 * Requirements: 1.1-1.7, 10.1-10.8
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { rfqService } from '../services/rfq.service';
import { supabaseConfig } from '../config/supabase.config';
import {
  AssetPairSchema,
  TradeDirectionSchema,
  AmountSchema,
  FutureTimestampSchema,
  WOTSSignatureSchema,
  WOTSPublicKeySchema,
  NetworkSchema,
} from '../types/common.types';
import {
  buildSuccessResponse,
  buildErrorResponse,
  ErrorCode,
  getHttpStatusForErrorCode,
} from '../types/api.types';

const router = Router();

/**
 * Create Quote Request Schema
 */
const CreateQuoteRequestSchema = z.object({
  assetPair: AssetPairSchema,
  direction: TradeDirectionSchema,
  amount: AmountSchema,
  timeout: FutureTimestampSchema,
  signature: WOTSSignatureSchema,
  publicKey: WOTSPublicKeySchema,
  message: z.string().min(1, 'Message is required'),
  commitment: z.string().optional(),
  chainId: NetworkSchema.optional(),
});

/**
 * Cancel Quote Request Schema
 */
const CancelQuoteRequestSchema = z.object({
  signature: WOTSSignatureSchema,
  publicKey: WOTSPublicKeySchema,
});

/**
 * POST /api/v1/rfq/quote-request
 * 
 * Create a new quote request.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */
router.post('/quote-request', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = CreateQuoteRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });
      
      const errorResponse = buildErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        validationResult.error.errors,
        fieldErrors
      );
      
      return res.status(getHttpStatusForErrorCode(ErrorCode.VALIDATION_ERROR)).json(errorResponse);
    }
    
    const params = validationResult.data;
    
    // Create quote request
    const result = await rfqService.createQuoteRequest(params);
    
    // Return success response
    const successResponse = buildSuccessResponse(result);
    return res.status(201).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Create quote request error:', error);
    
    // Categorize error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let errorCode = ErrorCode.INTERNAL_ERROR;
    
    if (errorMessage.includes('Signature verification failed')) {
      errorCode = ErrorCode.SIGNATURE_VERIFICATION_FAILED;
    } else if (errorMessage.includes('Signature has already been used')) {
      errorCode = ErrorCode.SIGNATURE_REUSED;
    } else if (errorMessage.includes('Insufficient balance')) {
      errorCode = ErrorCode.INSUFFICIENT_BALANCE;
    } else if (errorMessage.includes('Timeout')) {
      errorCode = ErrorCode.INVALID_TIMESTAMP;
    } else if (errorMessage.includes('Failed to store')) {
      errorCode = ErrorCode.DATABASE_ERROR;
    }
    
    const errorResponse = buildErrorResponse(errorCode, errorMessage);
    return res.status(getHttpStatusForErrorCode(errorCode)).json(errorResponse);
  }
});

/**
 * POST /api/v1/rfq/quote-request/:id/cancel
 * 
 * Cancel a quote request.
 * 
 * Requirements: 10.5, 10.6, 10.7, 10.8
 */
router.post('/quote-request/:id/cancel', async (req: Request, res: Response) => {
  try {
    const quoteRequestId = req.params.id;
    
    // Validate request body
    const validationResult = CancelQuoteRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });
      
      const errorResponse = buildErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        validationResult.error.errors,
        fieldErrors
      );
      
      return res.status(getHttpStatusForErrorCode(ErrorCode.VALIDATION_ERROR)).json(errorResponse);
    }
    
    const { signature, publicKey } = validationResult.data;
    
    // Cancel quote request
    const result = await rfqService.cancelQuoteRequest({
      quoteRequestId,
      signature,
      publicKey,
    });
    
    // Return success response
    const successResponse = buildSuccessResponse(result);
    return res.status(200).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Cancel quote request error:', error);
    
    // Categorize error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let errorCode = ErrorCode.INTERNAL_ERROR;
    
    if (errorMessage.includes('not found')) {
      errorCode = ErrorCode.QUOTE_REQUEST_NOT_FOUND;
    } else if (errorMessage.includes('Only the taker')) {
      errorCode = ErrorCode.NOT_OWNER;
    } else if (errorMessage.includes('Signature verification failed')) {
      errorCode = ErrorCode.SIGNATURE_VERIFICATION_FAILED;
    } else if (errorMessage.includes('Signature has already been used')) {
      errorCode = ErrorCode.SIGNATURE_REUSED;
    } else if (errorMessage.includes('already cancelled')) {
      errorCode = ErrorCode.QUOTE_REQUEST_CANCELLED;
    } else if (errorMessage.includes('filled')) {
      errorCode = ErrorCode.QUOTE_REQUEST_FILLED;
    } else if (errorMessage.includes('Failed to cancel')) {
      errorCode = ErrorCode.DATABASE_ERROR;
    }
    
    const errorResponse = buildErrorResponse(errorCode, errorMessage);
    return res.status(getHttpStatusForErrorCode(errorCode)).json(errorResponse);
  }
});

/**
 * GET /api/v1/rfq/quote-requests
 * 
 * Get all active quote requests (for public board).
 * Includes quote_count for each request.
 */
router.get('/quote-requests', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const now = Date.now();
    
    // Build base query
    let query = supabaseConfig.adminClient
      .from('quote_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Filter by status if provided
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    } else {
      // Default: only show active requests
      query = query.eq('status', 'active');
    }
    
    const { data: quoteRequests, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch quote requests: ${error.message}`);
    }
    
    // Add quote_count to each request
    // Optimized: Single query to get all counts at once
    const quoteRequestIds = (quoteRequests || []).map((qr: any) => qr.id);
    
    let quoteCounts: Record<string, number> = {};
    
    if (quoteRequestIds.length > 0) {
      // Get all active, non-expired quotes for these requests
      const { data: quotes, error: quotesError } = await supabaseConfig.adminClient
        .from('quotes')
        .select('quote_request_id')
        .in('quote_request_id', quoteRequestIds)
        .eq('status', 'active')
        .gt('expires_at', now);
      
      if (quotesError) {
        console.error('[RFQ Routes] Failed to fetch quote counts:', quotesError);
        // Continue without counts rather than failing
      } else if (quotes) {
        // Count quotes per request
        quotes.forEach((quote: any) => {
          quoteCounts[quote.quote_request_id] = (quoteCounts[quote.quote_request_id] || 0) + 1;
        });
      }
    }
    
    // Add quote_count to each request
    const quoteRequestsWithCount = (quoteRequests || []).map((qr: any) => ({
      ...qr,
      quote_count: quoteCounts[qr.id] || 0,
    }));
    
    // Return success response
    const successResponse = buildSuccessResponse({ quoteRequests: quoteRequestsWithCount });
    return res.status(200).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Get quote requests error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = buildErrorResponse(ErrorCode.INTERNAL_ERROR, errorMessage);
    return res.status(getHttpStatusForErrorCode(ErrorCode.INTERNAL_ERROR)).json(errorResponse);
  }
});

/**
 * GET /api/v1/rfq/quote-request/:id
 * 
 * Get a quote request by ID.
 * Includes quote_count.
 */
router.get('/quote-request/:id', async (req: Request, res: Response) => {
  try {
    const quoteRequestId = req.params.id;
    const now = Date.now();
    
    // Get quote request
    const quoteRequest = await rfqService.getQuoteRequest(quoteRequestId);
    
    if (!quoteRequest) {
      const errorResponse = buildErrorResponse(
        ErrorCode.QUOTE_REQUEST_NOT_FOUND,
        'Quote request not found'
      );
      return res.status(getHttpStatusForErrorCode(ErrorCode.QUOTE_REQUEST_NOT_FOUND)).json(errorResponse);
    }
    
    // Get quote count (active, non-expired quotes only)
    const { count, error: countError } = await supabaseConfig.adminClient
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('quote_request_id', quoteRequestId)
      .eq('status', 'active')
      .gt('expires_at', now);
    
    const quoteCount = countError ? 0 : (count || 0);
    
    // Add quote_count to response
    const quoteRequestWithCount = {
      ...quoteRequest,
      quote_count: quoteCount,
    };
    
    // Return success response
    const successResponse = buildSuccessResponse(quoteRequestWithCount);
    return res.status(200).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Get quote request error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = buildErrorResponse(ErrorCode.INTERNAL_ERROR, errorMessage);
    return res.status(getHttpStatusForErrorCode(ErrorCode.INTERNAL_ERROR)).json(errorResponse);
  }
});

export default router;

/**
 * Quote Submission Schema
 */
const SubmitQuoteSchema = z.object({
  quoteRequestId: z.string().uuid(),
  price: AmountSchema,
  expirationTime: FutureTimestampSchema,
  signature: WOTSSignatureSchema,
  publicKey: WOTSPublicKeySchema,
  walletAddress: z.string().min(32, 'Wallet address must be valid Solana address'),
  commitment: z.string().optional(), // Market maker's deposit commitment for settlement
  nullifierHash: z.string().optional(), // Market maker's nullifier hash from deposit note
  chainId: z.enum(['solana-devnet', 'sepolia']).optional(),
});

/**
 * Quote Acceptance Schema
 */
const AcceptQuoteSchema = z.object({
  signature: WOTSSignatureSchema,
  publicKey: WOTSPublicKeySchema,
  takerCommitment: z.string().optional(),
  takerAddress: z.string().min(32).optional(), // Wallet address (base58 for Solana, hex for EVM)
  takerNullifierHash: z.string().optional(), // Nullifier hash extracted from taker's deposit note
  marketMakerCommitment: z.string().optional(),
  marketMakerNullifierHash: z.string().optional(), // Nullifier hash extracted from market maker's deposit note
  chainId: z.enum(['solana-devnet', 'sepolia']).optional(),
});

/**
 * Message Sending Schema
 */
const SendMessageSchema = z.object({
  quoteRequestId: z.string().uuid(),
  recipientStealthAddress: z.string(),
  encryptedContent: z.string(),
  signature: WOTSSignatureSchema,
  publicKey: WOTSPublicKeySchema,
});

/**
 * POST /api/v1/rfq/quote
 * 
 * Submit a quote for a quote request.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */
router.post('/quote', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = SubmitQuoteSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });
      
      const errorResponse = buildErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        validationResult.error.errors,
        fieldErrors
      );
      
      return res.status(getHttpStatusForErrorCode(ErrorCode.VALIDATION_ERROR)).json(errorResponse);
    }
    
    const params = validationResult.data;
    
    // Submit quote
    const result = await rfqService.submitQuote(params);
    
    // Return success response
    const successResponse = buildSuccessResponse(result);
    return res.status(201).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Submit quote error:', error);
    
    // Categorize error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let errorCode = ErrorCode.INTERNAL_ERROR;
    
    if (errorMessage.includes('not whitelisted')) {
      errorCode = ErrorCode.NOT_WHITELISTED;
    } else if (errorMessage.includes('not found')) {
      errorCode = ErrorCode.QUOTE_REQUEST_NOT_FOUND;
    } else if (errorMessage.includes('expired')) {
      errorCode = ErrorCode.QUOTE_REQUEST_EXPIRED;
    } else if (errorMessage.includes('Signature verification failed')) {
      errorCode = ErrorCode.SIGNATURE_VERIFICATION_FAILED;
    } else if (errorMessage.includes('Signature has already been used')) {
      errorCode = ErrorCode.SIGNATURE_REUSED;
    } else if (errorMessage.includes('Insufficient balance')) {
      errorCode = ErrorCode.INSUFFICIENT_BALANCE;
    } else if (errorMessage.includes('expiration')) {
      errorCode = ErrorCode.INVALID_TIMESTAMP;
    }
    
    const errorResponse = buildErrorResponse(errorCode, errorMessage);
    return res.status(getHttpStatusForErrorCode(errorCode)).json(errorResponse);
  }
});

/**
 * GET /api/v1/rfq/quote-request/:id/quotes
 * 
 * Get all quotes for a quote request.
 * 
 * Requirements: 3.1
 */
router.get('/quote-request/:id/quotes', async (req: Request, res: Response) => {
  try {
    const quoteRequestId = req.params.id;
    
    // Get quotes
    const quotes = await rfqService.getQuotesByRequestId(quoteRequestId);
    
    // Transform response to use clear field names
    // price_commitment field contains PLAINTEXT price (not hash)
    const transformedQuotes = quotes.map((quote: any) => ({
      quoteId: quote.id,
      price: quote.price_commitment, // PLAINTEXT price (e.g., "150000000")
      priceCommitment: quote.price_commitment, // Backward compatibility
      marketMakerPublicKey: quote.market_maker_public_key,
      marketMakerAddress: quote.market_maker_address,
      marketMakerCommitment: quote.market_maker_commitment,
      marketMakerNullifierHash: quote.market_maker_nullifier_hash,
      expiresAt: quote.expires_at,
      status: quote.status,
      createdAt: quote.created_at,
    }));
    
    // Return success response
    const successResponse = buildSuccessResponse({ quotes: transformedQuotes });
    return res.status(200).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Get quotes error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let errorCode = ErrorCode.INTERNAL_ERROR;
    
    if (errorMessage.includes('not found')) {
      errorCode = ErrorCode.QUOTE_REQUEST_NOT_FOUND;
    }
    
    const errorResponse = buildErrorResponse(errorCode, errorMessage);
    return res.status(getHttpStatusForErrorCode(errorCode)).json(errorResponse);
  }
});

/**
 * POST /api/v1/rfq/quote/:id/accept
 * 
 * Accept a quote.
 * 
 * Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */
router.post('/quote/:id/accept', async (req: Request, res: Response) => {
  try {
    const quoteId = req.params.id;
    
    // Validate request body
    const validationResult = AcceptQuoteSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });
      
      const errorResponse = buildErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        validationResult.error.errors,
        fieldErrors
      );
      
      return res.status(getHttpStatusForErrorCode(ErrorCode.VALIDATION_ERROR)).json(errorResponse);
    }
    
    const { signature, publicKey, takerCommitment, takerAddress, takerNullifierHash, marketMakerCommitment, marketMakerNullifierHash, chainId } = validationResult.data;
    
    // Accept quote
    const result = await rfqService.acceptQuote({
      quoteId,
      signature,
      publicKey,
      takerCommitment,
      takerAddress,
      takerNullifierHash,
      marketMakerCommitment,
      marketMakerNullifierHash,
      chainId,
    });
    
    // Return success response
    const successResponse = buildSuccessResponse(result);
    return res.status(200).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Accept quote error:', error);
    
    // Categorize error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let errorCode = ErrorCode.INTERNAL_ERROR;
    
    if (errorMessage.includes('Quote not found')) {
      errorCode = ErrorCode.QUOTE_NOT_FOUND;
    } else if (errorMessage.includes('Quote request not found')) {
      errorCode = ErrorCode.QUOTE_REQUEST_NOT_FOUND;
    } else if (errorMessage.includes('Only the taker')) {
      errorCode = ErrorCode.NOT_OWNER;
    } else if (errorMessage.includes('expired')) {
      errorCode = ErrorCode.QUOTE_EXPIRED;
    } else if (errorMessage.includes('filled')) {
      errorCode = ErrorCode.QUOTE_REQUEST_FILLED;
    } else if (errorMessage.includes('cancelled')) {
      errorCode = ErrorCode.QUOTE_REQUEST_CANCELLED;
    } else if (errorMessage.includes('Signature verification failed')) {
      errorCode = ErrorCode.SIGNATURE_VERIFICATION_FAILED;
    } else if (errorMessage.includes('Signature has already been used')) {
      errorCode = ErrorCode.SIGNATURE_REUSED;
    } else if (errorMessage.includes('Settlement failed')) {
      errorCode = ErrorCode.SETTLEMENT_FAILED;
    }
    
    const errorResponse = buildErrorResponse(errorCode, errorMessage);
    return res.status(getHttpStatusForErrorCode(errorCode)).json(errorResponse);
  }
});

/**
 * POST /api/v1/rfq/message
 * 
 * Send a private message.
 * 
 * Requirements: 26.1, 26.2, 26.3, 26.4
 */
router.post('/message', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = SendMessageSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });
      
      const errorResponse = buildErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        validationResult.error.errors,
        fieldErrors
      );
      
      return res.status(getHttpStatusForErrorCode(ErrorCode.VALIDATION_ERROR)).json(errorResponse);
    }
    
    const params = validationResult.data;
    
    // Send message
    const { messageService } = await import('../services/message.service');
    const result = await messageService.sendMessage(params);
    
    // Return success response
    const successResponse = buildSuccessResponse(result);
    return res.status(201).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Send message error:', error);
    
    // Categorize error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let errorCode = ErrorCode.INTERNAL_ERROR;
    
    if (errorMessage.includes('not found')) {
      errorCode = ErrorCode.QUOTE_REQUEST_NOT_FOUND;
    } else if (errorMessage.includes('Unauthorized')) {
      errorCode = ErrorCode.NOT_AUTHORIZED;
    } else if (errorMessage.includes('Signature verification failed')) {
      errorCode = ErrorCode.SIGNATURE_VERIFICATION_FAILED;
    } else if (errorMessage.includes('Signature has already been used')) {
      errorCode = ErrorCode.SIGNATURE_REUSED;
    } else if (errorMessage.includes('empty')) {
      errorCode = ErrorCode.VALIDATION_ERROR;
    }
    
    const errorResponse = buildErrorResponse(errorCode, errorMessage);
    return res.status(getHttpStatusForErrorCode(errorCode)).json(errorResponse);
  }
});

/**
 * GET /api/v1/rfq/quote-request/:id/messages
 * 
 * Get messages for a quote request.
 * 
 * Requirements: 26.5, 26.6
 */
router.get('/quote-request/:id/messages', async (req: Request, res: Response) => {
  try {
    const quoteRequestId = req.params.id;
    const { publicKey } = req.query;
    
    if (!publicKey || typeof publicKey !== 'string') {
      const errorResponse = buildErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Public key is required'
      );
      return res.status(getHttpStatusForErrorCode(ErrorCode.VALIDATION_ERROR)).json(errorResponse);
    }
    
    // Get messages
    const { messageService } = await import('../services/message.service');
    const messages = await messageService.getMessages(
      quoteRequestId,
      publicKey
    );
    
    // Return success response
    const successResponse = buildSuccessResponse({ messages });
    return res.status(200).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Get messages error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let errorCode = ErrorCode.INTERNAL_ERROR;
    
    if (errorMessage.includes('not found')) {
      errorCode = ErrorCode.QUOTE_REQUEST_NOT_FOUND;
    } else if (errorMessage.includes('Unauthorized')) {
      errorCode = ErrorCode.NOT_AUTHORIZED;
    }
    
    const errorResponse = buildErrorResponse(errorCode, errorMessage);
    return res.status(getHttpStatusForErrorCode(errorCode)).json(errorResponse);
  }
});

/**
 * GET /api/v1/rfq/used-nullifiers
 * 
 * Get all used nullifiers for deposit note cleanup.
 * Frontend uses this to auto-clean deposit notes that have been used in settlements.
 */
router.get('/used-nullifiers', async (_req: Request, res: Response) => {
  try {
    // Get all used nullifiers from database
    const { data: nullifiers, error } = await supabaseConfig.adminClient
      .from('used_nullifiers')
      .select('nullifier_hash')
      .in('status', ['pending', 'settled']); // Include both pending and settled
    
    if (error) {
      throw new Error(`Failed to fetch used nullifiers: ${error.message}`);
    }
    
    // Extract nullifier hashes
    const usedNullifiers = (nullifiers || []).map((n: any) => n.nullifier_hash);
    
    // Return success response
    const successResponse = buildSuccessResponse({ usedNullifiers });
    return res.status(200).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Get used nullifiers error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = buildErrorResponse(ErrorCode.INTERNAL_ERROR, errorMessage);
    return res.status(getHttpStatusForErrorCode(ErrorCode.INTERNAL_ERROR)).json(errorResponse);
  }
});

/**
 * GET /api/v1/rfq/check-nullifier/:nullifierHash
 * 
 * Check if a specific nullifier has been used.
 * Frontend uses this before withdraw to prevent withdrawing deposits used in settlements.
 */
router.get('/check-nullifier/:nullifierHash', async (req: Request, res: Response) => {
  try {
    const { nullifierHash } = req.params;
    
    // Check if nullifier exists in database
    const { data: nullifier, error } = await supabaseConfig.adminClient
      .from('used_nullifiers')
      .select('*')
      .eq('nullifier_hash', nullifierHash)
      .maybeSingle();
    
    if (error) {
      throw new Error(`Failed to check nullifier: ${error.message}`);
    }
    
    // Return result
    if (nullifier) {
      const successResponse = buildSuccessResponse({
        isUsed: true,
        quoteId: nullifier.quote_id,
        entityType: nullifier.entity_type,
        status: nullifier.status,
        usedAt: nullifier.used_at,
      });
      return res.status(200).json(successResponse);
    } else {
      const successResponse = buildSuccessResponse({
        isUsed: false,
      });
      return res.status(200).json(successResponse);
    }
    
  } catch (error) {
    console.error('[RFQ Routes] Check nullifier error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = buildErrorResponse(ErrorCode.INTERNAL_ERROR, errorMessage);
    return res.status(getHttpStatusForErrorCode(ErrorCode.INTERNAL_ERROR)).json(errorResponse);
  }
});

/**
 * POST /api/v1/rfq/mark-nullifier-used
 * 
 * Mark a nullifier as used (admin only).
 * Requires ADMIN_API_KEY in Authorization header.
 * Used by internal services to manually mark nullifiers as used.
 */
router.post('/mark-nullifier-used', async (req: Request, res: Response) => {
  try {
    // Check admin API key
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    const { config } = await import('../config');
    
    if (!apiKey || apiKey !== config.admin.apiKey) {
      const errorResponse = buildErrorResponse(
        ErrorCode.NOT_AUTHORIZED,
        'Invalid or missing admin API key'
      );
      return res.status(getHttpStatusForErrorCode(ErrorCode.NOT_AUTHORIZED)).json(errorResponse);
    }
    
    // Validate request body
    const { nullifierHash, quoteId, entityType, status } = req.body;
    
    if (!nullifierHash || typeof nullifierHash !== 'string') {
      const errorResponse = buildErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'nullifierHash is required and must be a string'
      );
      return res.status(getHttpStatusForErrorCode(ErrorCode.VALIDATION_ERROR)).json(errorResponse);
    }
    
    // Optional fields with defaults
    const finalQuoteId = quoteId || null;
    const finalEntityType = entityType || 'manual';
    const finalStatus = status || 'settled';
    
    // Check if nullifier already exists
    const { data: existing } = await supabaseConfig.adminClient
      .from('used_nullifiers')
      .select('*')
      .eq('nullifier_hash', nullifierHash)
      .maybeSingle();
    
    if (existing) {
      const errorResponse = buildErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Nullifier already marked as used',
        undefined,
        {
          existingQuoteId: existing.quote_id,
          existingStatus: existing.status,
          existingEntityType: existing.entity_type,
        }
      );
      return res.status(getHttpStatusForErrorCode(ErrorCode.VALIDATION_ERROR)).json(errorResponse);
    }
    
    // Insert nullifier (used_at will use DEFAULT NOW() from database)
    const { error: insertError } = await supabaseConfig.adminClient
      .from('used_nullifiers')
      .insert({
        nullifier_hash: nullifierHash,
        quote_id: finalQuoteId,
        entity_type: finalEntityType,
        status: finalStatus,
      });
    
    if (insertError) {
      throw new Error(`Failed to mark nullifier as used: ${insertError.message}`);
    }
    
    // Return success
    const successResponse = buildSuccessResponse({
      nullifierHash,
      quoteId: finalQuoteId,
      entityType: finalEntityType,
      status: finalStatus,
    });
    return res.status(201).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Mark nullifier used error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = buildErrorResponse(ErrorCode.INTERNAL_ERROR, errorMessage);
    return res.status(getHttpStatusForErrorCode(ErrorCode.INTERNAL_ERROR)).json(errorResponse);
  }
});
