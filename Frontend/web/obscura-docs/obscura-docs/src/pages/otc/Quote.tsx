import EndpointHeader from '../../components/docs/EndpointHeader'
import RequestBody from '../../components/docs/RequestBody'
import ResponseExample from '../../components/docs/ResponseExample'

export default function Quote() {
  const submitResponse = {
    success: true,
    data: {
      quoteId: "660e8400-e29b-41d4-a716-446655440001",
      priceCommitment: "150000000",
      expiresAt: 1737648000000
    }
  }

  const listResponse = {
    success: true,
    data: {
      quotes: [
        {
          quoteId: "660e8400-e29b-41d4-a716-446655440001",
          priceCommitment: "150000000",
          marketMakerPublicKey: "0x...",
          expiresAt: 1737648000000,
          status: "active"
        }
      ]
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">Submit Quote</h1>
        <p className="text-lg text-[var(--text-secondary)]">
          Market makers submit quotes in response to quote requests. Prices are visible to takers for comparison.
        </p>
      </div>

      <div>
        <EndpointHeader
          method="POST"
          path="/api/v1/rfq/quote"
          description="Submit a quote (market makers only)"
        />

        <div className="space-y-6">
          <RequestBody
            fields={[
              { name: 'quoteRequestId', type: 'string', required: true, description: 'Quote request ID to respond to' },
              { name: 'price', type: 'string', required: true, description: 'Price per unit in base units (e.g., USDC per SOL). Visible to taker.' },
              { name: 'expirationTime', type: 'number', required: true, description: 'Quote expiration timestamp (cannot exceed request expiration)' },
              { name: 'signature', type: 'string', required: true, description: 'WOTS+ signature (4288 hex characters)' },
              { name: 'publicKey', type: 'string', required: true, description: 'WOTS+ public key (4416 hex characters)' },
            ]}
          />

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Responses</h3>
            <ResponseExample status={201} statusText="Created" body={submitResponse} />
          </div>

          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-[var(--text-secondary)] text-sm">
              <strong>Whitelist Mode:</strong> Backend supports permissionless (default) and permissioned modes. 
              In permissionless mode, anyone can be a market maker. In permissioned mode, admin approval required.
            </p>
          </div>
        </div>
      </div>

      <div>
        <EndpointHeader
          method="GET"
          path="/api/v1/rfq/quote-request/:id/quotes"
          description="Get all quotes for a quote request"
        />

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Responses</h3>
            <ResponseExample status={200} statusText="OK" body={listResponse} />
          </div>
        </div>
      </div>
    </div>
  )
}
