import EndpointHeader from '../../components/docs/EndpointHeader'
import RequestBody from '../../components/docs/RequestBody'
import ResponseExample from '../../components/docs/ResponseExample'

export default function QuoteRequest() {
  const createResponse = {
    success: true,
    data: {
      quoteRequestId: "550e8400-e29b-41d4-a716-446655440000",
      stealthAddress: "0x...",
      commitment: "5000000",
      expiresAt: 1737648000000
    }
  }

  const listResponse = {
    success: true,
    data: {
      quoteRequests: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          asset_pair: "SOL/USDC",
          direction: "buy",
          amount_commitment: "5000000",
          stealth_address: "0x...",
          created_at: 1737640000000,
          expires_at: 1737648000000,
          status: "active",
          quote_count: 3
        }
      ]
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">Quote Request</h1>
        <p className="text-lg text-[var(--text-secondary)]">
          Create a new quote request for Dark OTC RFQ trading. Takers post their trading intent and market makers respond with quotes.
        </p>
        <div className="mt-4 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          <p className="text-sm text-[var(--text-muted)] mb-1">Base URL</p>
          <code className="text-[var(--accent-secondary)] font-mono">
            https://otc-api.obscura-app.com
          </code>
        </div>
      </div>

      <div className="mb-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <p className="text-blue-400 font-semibold mb-2">Privacy-Preserving Trading</p>
        <p className="text-[var(--text-secondary)] text-sm">
          Uses WOTS+ one-time signatures for unlinkable transactions. Each action uses a different public key, preventing blockchain analysts from linking your trades.
        </p>
      </div>

      <div>
        <EndpointHeader
          method="POST"
          path="/api/v1/rfq/quote-request"
          description="Create a new quote request"
        />

        <div className="space-y-6">
          <RequestBody
            fields={[
              { name: 'assetPair', type: 'string', required: true, description: 'Trading pair (e.g., "SOL/USDC", "ETH/USDT")' },
              { name: 'direction', type: 'string', required: true, description: '"buy" or "sell"' },
              { name: 'amount', type: 'string', required: true, description: 'Amount in base units (lamports/wei). Visible to all for fair trading.' },
              { name: 'timeout', type: 'number', required: true, description: 'Expiration timestamp in milliseconds (max 24 hours)' },
              { name: 'signature', type: 'string', required: true, description: 'WOTS+ signature (4288 hex characters)' },
              { name: 'publicKey', type: 'string', required: true, description: 'WOTS+ public key (4416 hex characters)' },
              { name: 'message', type: 'string', required: true, description: 'Original signed message' },
              { name: 'commitment', type: 'string', required: false, description: 'SIP commitment from Obscura deposit' },
              { name: 'chainId', type: 'string', required: false, description: '"solana-devnet" or "sepolia"' },
            ]}
          />

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Responses</h3>
            <ResponseExample status={201} statusText="Created" body={createResponse} />
          </div>

          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-yellow-400 font-semibold mb-2">WOTS+ Signatures Required</p>
            <p className="text-[var(--text-secondary)] text-sm">
              Must use WOTS+ signatures (4288 hex chars), NOT Phantom/MetaMask signatures. 
              Phantom signatures (~88 chars) are too short and will be rejected.
            </p>
          </div>
        </div>
      </div>

      <div>
        <EndpointHeader
          method="GET"
          path="/api/v1/rfq/quote-requests"
          description="Get all active quote requests"
        />

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Query Parameters</h3>
            <ul className="space-y-2 text-[var(--text-secondary)]">
              <li><code className="text-[var(--accent-secondary)]">status</code> (optional): Filter by status ("active", "expired", "filled", "cancelled")</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Responses</h3>
            <ResponseExample status={200} statusText="OK" body={listResponse} />
          </div>
        </div>
      </div>
    </div>
  )
}
