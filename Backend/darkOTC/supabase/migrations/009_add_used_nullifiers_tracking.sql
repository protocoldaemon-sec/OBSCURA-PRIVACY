-- Track used nullifier hashes to prevent double-spend attacks
-- CRITICAL: This prevents attackers from reusing nullifiers via API bypass

CREATE TABLE used_nullifiers (
  nullifier_hash TEXT PRIMARY KEY,
  quote_id TEXT REFERENCES quotes(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  entity_type VARCHAR(50) NOT NULL, -- 'market_maker' or 'taker'
  CONSTRAINT valid_status CHECK (status IN ('pending', 'settled', 'expired', 'cancelled'))
);

-- Index for faster lookups
CREATE INDEX idx_used_nullifiers_status ON used_nullifiers(status);
CREATE INDEX idx_used_nullifiers_quote_id ON used_nullifiers(quote_id);
CREATE INDEX idx_used_nullifiers_entity_type ON used_nullifiers(entity_type);

-- Track used commitments to prevent reuse in active quotes
CREATE TABLE used_commitments (
  commitment TEXT NOT NULL,
  quote_id TEXT REFERENCES quotes(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'market_maker' or 'taker'
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (commitment, quote_id),
  CONSTRAINT valid_commitment_status CHECK (status IN ('active', 'settled', 'expired', 'cancelled'))
);

-- Index for faster lookups
CREATE INDEX idx_used_commitments_status ON used_commitments(status);
CREATE INDEX idx_used_commitments_commitment ON used_commitments(commitment);

-- Comments
COMMENT ON TABLE used_nullifiers IS 'Tracks used nullifier hashes to prevent double-spend attacks';
COMMENT ON TABLE used_commitments IS 'Tracks used commitments to prevent reuse in active quotes';
COMMENT ON COLUMN used_nullifiers.entity_type IS 'Whether nullifier is from market_maker or taker';
COMMENT ON COLUMN used_commitments.entity_type IS 'Whether commitment is from market_maker or taker';
