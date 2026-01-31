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
              { name: 'takerCommitment', type: 'string', required: true, description: 'Taker deposit commitment (for payment)' },
              { name: 'takerNullifierHash', type: 'string', required: true, description: 'Nullifier hash from taker deposit note (CRITICAL!)' },
              { name: 'takerAddress', type: 'string', required: true, description: 'Taker wallet address to receive asset (Solana: base58, Ethereum: hex)' },
              { name: 'marketMakerCommitment', type: 'string', required: true, description: 'Market maker deposit commitment (for asset)' },
              { name: 'marketMakerNullifierHash', type: 'string', required: false, description: 'Nullifier hash from MM deposit (optional if provided in quote)' },
              { name: 'chainId', type: 'string', required: true, description: '"solana-devnet" or "sepolia"' },
            ]}
          />

          <div className="mt-6 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <p className="text-purple-400 font-semibold mb-2">Atomic Swap Settlement</p>
            <div className="text-[var(--text-secondary)] text-sm space-y-2">
              <p><strong>Transfer 1:</strong> Taker pays Market Maker (payment token, e.g., USDC)</p>
              <p><strong>Transfer 2:</strong> Market Maker sends Taker (asset token, e.g., SOL)</p>
              <p>Both transfers execute atomically (both succeed or both fail). Balances updated via Arcium cSPL (off-chain, encrypted).</p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-400 font-semibold mb-2">⚠️ CRITICAL: Nullifier hashes MUST be from deposit notes!</p>
            <p className="text-[var(--text-secondary)] text-sm">
              Each deposit note has a unique nullifierHash. Backend uses this to withdraw from Obscura-LLMS vault. 
              Frontend MUST extract nullifierHash from deposit note and send it to backend. 
              If backend generates nullifier from commitment, it will cause "NullifierAlreadyUsed" errors.
            </p>
          </div>

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
