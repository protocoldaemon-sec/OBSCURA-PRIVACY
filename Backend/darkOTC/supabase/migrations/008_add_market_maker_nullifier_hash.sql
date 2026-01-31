-- Add market_maker_nullifier_hash column to quotes table
-- This stores the nullifier hash from market maker's deposit note
-- Required for settlement to use correct nullifier (not generate from commitment)

ALTER TABLE quotes
ADD COLUMN market_maker_nullifier_hash TEXT;

-- Add index for faster lookups
CREATE INDEX idx_quotes_mm_nullifier_hash ON quotes(market_maker_nullifier_hash);

-- Add comment
COMMENT ON COLUMN quotes.market_maker_nullifier_hash IS 'Nullifier hash from market maker deposit note (for settlement)';
