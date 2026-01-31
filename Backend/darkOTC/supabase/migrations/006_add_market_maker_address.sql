-- Add market_maker_address column to quotes table
-- This stores the Solana wallet address for settlement (base58 format)
-- Different from market_maker_public_key which is the signature public key (hex format)

ALTER TABLE quotes
ADD COLUMN market_maker_address TEXT;

-- Add comment
COMMENT ON COLUMN quotes.market_maker_address IS 'Market maker Solana wallet address for settlement (base58 format)';

-- Create index for faster lookups
CREATE INDEX idx_quotes_market_maker_address ON quotes(market_maker_address);
