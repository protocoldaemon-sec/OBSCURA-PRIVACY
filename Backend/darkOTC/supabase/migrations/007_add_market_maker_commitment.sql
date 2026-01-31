-- Migration: Add market_maker_commitment column to quotes table
-- This stores the market maker's deposit commitment for atomic swap settlement

-- Add market_maker_commitment column (optional, for settlement)
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS market_maker_commitment VARCHAR(255);

-- Add comment
COMMENT ON COLUMN quotes.market_maker_commitment IS 'Market maker deposit commitment for atomic swap settlement (optional)';
