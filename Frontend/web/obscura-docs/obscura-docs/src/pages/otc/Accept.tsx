import EndpointHeader from '../../components/docs/EndpointHeader'
import RequestBody from '../../components/docs/RequestBody'
import ResponseExample from '../../components/docs/ResponseExample'

export default function Accept() {
  const acceptResponse = {
    success: true,
    data: {
      quoteId: "660e8400-e29b-41d4-a716-446655440001",
      quoteRequestId: "550e8400-e29b-41d4-a716-446655440000",
      nullifier: "0x...",
      txHash: "5fmG66Xz...",
      zkCompressed: true,
      compressionSignature: "3Ag8rUJB..."
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">Accept Quote</h1>
        <p className="text-lg text-[var(--text-secondary)]">
          Takers accept the best quote to execute the trade. Settlement is automatic via Obscura privacy infrastructure.
        </p>
      </div>

      <div className="mb-8 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
        <p className="text-green-400 font-semibold mb-2">Automatic Settlement</p>
        <p className="text-[var(--text-secondary)] text-sm">
          When you accept a quote, the backend automatically executes atomic settlement between taker and market maker using Obscura's privacy layer. 
          You'll receive a nullifier for the transaction.
        </p>
      </div>

      <div>
        <EndpointHeader
          method="POST"
          path="/api/v1/rfq/quote/:id/accept"
          description="Accept a quote"
        />

        <div className="space-y-6">
          <RequestBody
            fields={[
              { name: 'signature', type: 'string', required: true, description: 'WOTS+ signature (4288 hex characters). Must use NEW wallet.' },
              { name: 'publicKey', type: 'string', required: true, description: 'WOTS+ public key (4416 hex characters)' },
              { name: 'message', type: 'string', required: true, description: 'Original signed message' },
              { name: 'commitment', type: 'string', required: true, description: 'SIP commitment for settlement' },
            ]}
          />

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Responses</h3>
            <ResponseExample status={200} statusText="OK" body={acceptResponse} />
          </div>

          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-yellow-400 font-semibold mb-2">Save Your Nullifier</p>
            <p className="text-[var(--text-secondary)] text-sm">
              The nullifier is a secret needed for future withdrawals. Store it securely - it cannot be recovered if lost.
            </p>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Response Fields</h3>
            <ul className="space-y-2 text-[var(--text-secondary)]">
              <li><code className="text-[var(--accent-secondary)]">nullifier</code>: Secret for this acceptance (keep safe!)</li>
              <li><code className="text-[var(--accent-secondary)]">txHash</code>: Settlement transaction hash</li>
              <li><code className="text-[var(--accent-secondary)]">zkCompressed</code>: true if stored via Light Protocol (Solana only)</li>
              <li><code className="text-[var(--accent-secondary)]">compressionSignature</code>: ZK compression signature (Solana only)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
