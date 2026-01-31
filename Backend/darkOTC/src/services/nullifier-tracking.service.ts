/**
 * Nullifier Tracking Service
 * 
 * CRITICAL SECURITY: Prevents double-spend attacks by tracking used nullifiers
 * 
 * Attackers can bypass frontend validation by:
 * - Editing localStorage
 * - Using curl/Postman to call API directly
 * - Reusing same nullifier/commitment multiple times
 * 
 * This service provides backend validation to prevent such attacks.
 */

import { supabaseConfig } from '../config/supabase.config';

export interface NullifierCheckResult {
  isUsed: boolean;
  usedForQuoteId?: string;
  usedAt?: Date;
  status?: string;
  entityType?: string;
}

export interface CommitmentCheckResult {
  isUsed: boolean;
  existingQuoteId?: string;
  status?: string;
}

export class NullifierTrackingService {
  /**
   * Check if nullifier hash has been used
   * 
   * @param nullifierHash - Nullifier hash to check
   * @returns Check result with usage details
   */
  async checkNullifierUsed(nullifierHash: string): Promise<NullifierCheckResult> {
    const { data, error } = await supabaseConfig.adminClient
      .from('used_nullifiers')
      .select('*')
      .eq('nullifier_hash', nullifierHash)
      .maybeSingle();

    if (error) {
      console.error('[NullifierTracking] Error checking nullifier:', error);
      throw new Error(`Failed to check nullifier: ${error.message}`);
    }

    if (!data) {
      return { isUsed: false };
    }

    return {
      isUsed: true,
      usedForQuoteId: data.quote_id,
      usedAt: new Date(data.used_at),
      status: data.status,
      entityType: data.entity_type,
    };
  }

  /**
   * Mark nullifier as used
   * 
   * @param nullifierHash - Nullifier hash to mark as used
   * @param quoteId - Quote ID that uses this nullifier
   * @param entityType - 'market_maker' or 'taker'
   * @param status - Status ('pending', 'settled', 'expired', 'cancelled')
   */
  async markNullifierUsed(
    nullifierHash: string,
    quoteId: string,
    entityType: 'market_maker' | 'taker',
    status: 'pending' | 'settled' | 'expired' | 'cancelled' = 'pending'
  ): Promise<void> {
    const { error } = await supabaseConfig.adminClient
      .from('used_nullifiers')
      .insert({
        nullifier_hash: nullifierHash,
        quote_id: quoteId,
        entity_type: entityType,
        status,
      });

    if (error) {
      console.error('[NullifierTracking] Error marking nullifier as used:', error);
      throw new Error(`Failed to mark nullifier as used: ${error.message}`);
    }

    console.log(
      `[NullifierTracking] Marked nullifier as used: ${nullifierHash.substring(0, 16)}... ` +
      `(quote: ${quoteId}, entity: ${entityType}, status: ${status})`
    );
  }

  /**
   * Update nullifier status
   * 
   * @param nullifierHash - Nullifier hash to update
   * @param status - New status
   */
  async updateNullifierStatus(
    nullifierHash: string,
    status: 'pending' | 'settled' | 'expired' | 'cancelled'
  ): Promise<void> {
    const { error } = await supabaseConfig.adminClient
      .from('used_nullifiers')
      .update({ status })
      .eq('nullifier_hash', nullifierHash);

    if (error) {
      console.error('[NullifierTracking] Error updating nullifier status:', error);
      throw new Error(`Failed to update nullifier status: ${error.message}`);
    }
  }

  /**
   * Check if commitment is used in active quotes
   * 
   * @param commitment - Commitment to check
   * @returns Check result with usage details
   */
  async checkCommitmentUsed(commitment: string): Promise<CommitmentCheckResult> {
    const { data, error } = await supabaseConfig.adminClient
      .from('used_commitments')
      .select('*')
      .eq('commitment', commitment)
      .in('status', ['active', 'pending'])
      .maybeSingle();

    if (error) {
      console.error('[NullifierTracking] Error checking commitment:', error);
      throw new Error(`Failed to check commitment: ${error.message}`);
    }

    if (!data) {
      return { isUsed: false };
    }

    return {
      isUsed: true,
      existingQuoteId: data.quote_id,
      status: data.status,
    };
  }

  /**
   * Mark commitment as used
   * 
   * @param commitment - Commitment to mark as used
   * @param quoteId - Quote ID that uses this commitment
   * @param entityType - 'market_maker' or 'taker'
   * @param status - Status ('active', 'settled', 'expired', 'cancelled')
   */
  async markCommitmentUsed(
    commitment: string,
    quoteId: string,
    entityType: 'market_maker' | 'taker',
    status: 'active' | 'settled' | 'expired' | 'cancelled' = 'active'
  ): Promise<void> {
    const { error } = await supabaseConfig.adminClient
      .from('used_commitments')
      .insert({
        commitment,
        quote_id: quoteId,
        entity_type: entityType,
        status,
      });

    if (error) {
      console.error('[NullifierTracking] Error marking commitment as used:', error);
      throw new Error(`Failed to mark commitment as used: ${error.message}`);
    }

    console.log(
      `[NullifierTracking] Marked commitment as used: ${commitment.substring(0, 16)}... ` +
      `(quote: ${quoteId}, entity: ${entityType}, status: ${status})`
    );
  }

  /**
   * Update commitment status
   * 
   * @param commitment - Commitment to update
   * @param quoteId - Quote ID
   * @param status - New status
   */
  async updateCommitmentStatus(
    commitment: string,
    quoteId: string,
    status: 'active' | 'settled' | 'expired' | 'cancelled'
  ): Promise<void> {
    const { error } = await supabaseConfig.adminClient
      .from('used_commitments')
      .update({ status })
      .eq('commitment', commitment)
      .eq('quote_id', quoteId);

    if (error) {
      console.error('[NullifierTracking] Error updating commitment status:', error);
      throw new Error(`Failed to update commitment status: ${error.message}`);
    }
  }

  /**
   * Cleanup expired nullifiers and commitments
   * Should be called periodically (e.g., cron job)
   */
  async cleanupExpired(): Promise<{ nullifiersUpdated: number; commitmentsUpdated: number }> {
    const now = Date.now();

    // Find expired quotes
    const { data: expiredQuotes, error: quotesError } = await supabaseConfig.adminClient
      .from('quotes')
      .select('id')
      .eq('status', 'active')
      .lt('expires_at', now);

    if (quotesError) {
      throw new Error(`Failed to find expired quotes: ${quotesError.message}`);
    }

    if (!expiredQuotes || expiredQuotes.length === 0) {
      return { nullifiersUpdated: 0, commitmentsUpdated: 0 };
    }

    const expiredQuoteIds = expiredQuotes.map((q: any) => q.id);

    // Update nullifiers
    const { error: nullifiersError } = await supabaseConfig.adminClient
      .from('used_nullifiers')
      .update({ status: 'expired' })
      .in('quote_id', expiredQuoteIds)
      .eq('status', 'pending');

    if (nullifiersError) {
      console.error('[NullifierTracking] Error updating expired nullifiers:', nullifiersError);
    }

    // Update commitments
    const { error: commitmentsError } = await supabaseConfig.adminClient
      .from('used_commitments')
      .update({ status: 'expired' })
      .in('quote_id', expiredQuoteIds)
      .eq('status', 'active');

    if (commitmentsError) {
      console.error('[NullifierTracking] Error updating expired commitments:', commitmentsError);
    }

    console.log(
      `[NullifierTracking] Cleaned up ${expiredQuoteIds.length} expired quotes`
    );

    return {
      nullifiersUpdated: expiredQuoteIds.length,
      commitmentsUpdated: expiredQuoteIds.length,
    };
  }
}

// Export singleton instance
export const nullifierTrackingService = new NullifierTrackingService();
