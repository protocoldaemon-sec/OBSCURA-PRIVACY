import EndpointHeader from '../../components/docs/EndpointHeader'
import RequestBody from '../../components/docs/RequestBody'
import ResponseExample from '../../components/docs/ResponseExample'
import CodeBlock from '../../components/ui/CodeBlock'

export default function Balance() {
  const fields = [
    { name: 'commitment', type: 'string', required: true, description: 'Commitment from deposit note' },
    { name: 'chainId', type: 'string', required: true, description: 'solana-devnet (only Solana supported)' },
  ]

  const exampleRequest = `{
  "commitment": "b4083a81a64f7bf5...",
  "chainId": "solana-devnet"
}`

  const successResponse = {
    success: true,
    balance: "1200000000",
    pendingBalance: "0",
    confidentialAccount: "5599a875...",
    encrypted: true,
    token: "native",
    deposits: 1,
    withdrawals: 0
  }

  const notFoundResponse = {
    success: false,
    error: "No vault balance found for this commitment",
    details: "Please deposit first to create a vault balance"
  }

  const wrongChainResponse = {
    success: false,
    error: "Balance query only supported on Solana (Arcium cSPL)",
    details: "EVM chains do not support off-chain balance tracking yet"
  }

  const usageExample = `// Query vault balance after deposit or settlement
const response = await fetch('https://api.obscura-app.com/api/v1/balance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    commitment: 'b4083a81a64f7bf5...',
    chainId: 'solana-devnet'
  })
});

const result = await response.json();
console.log('Vault balance:', result.balance / 1e9, 'SOL');
console.log('Confidential account:', result.confidentialAccount);`

  return (
    <div>
      <EndpointHeader
        method="POST"
        path="/api/v1/balance"
        description="Query vault balance from Arcium cSPL off-chain balance tracker. Get current vault balance after deposits/withdrawals."
      />

      <div className="mb-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <p className="text-blue-400 font-semibold mb-2">Why This Endpoint?</p>
        <div className="text-[var(--text-secondary)] text-sm space-y-1">
          <p>• After settlement, vault balance updates in Arcium cSPL (off-chain)</p>
          <p>• Frontend needs to query actual vault balance, not just localStorage</p>
          <p>• Enables real-time balance display after Dark OTC trades</p>
        </div>
      </div>

      <RequestBody fields={fields} />

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Example Request</h3>
        <CodeBlock code={exampleRequest} language="json" title="Request" />
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Responses</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">Success Response</p>
            <ResponseExample status={200} statusText="OK" body={successResponse} />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">Error: No Balance Found</p>
            <ResponseExample status={404} statusText="Not Found" body={notFoundResponse} />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">Error: Wrong Chain</p>
            <ResponseExample status={400} statusText="Bad Request" body={wrongChainResponse} />
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Response Fields</h3>
        <ul className="space-y-2 text-[var(--text-secondary)]">
          <li><code className="text-[var(--accent-secondary)]">balance</code> - Available balance in base units (lamports)</li>
          <li><code className="text-[var(--accent-secondary)]">pendingBalance</code> - Pending withdrawals</li>
          <li><code className="text-[var(--accent-secondary)]">confidentialAccount</code> - Arcium cSPL account address</li>
          <li><code className="text-[var(--accent-secondary)]">encrypted</code> - Balance is encrypted on-chain</li>
          <li><code className="text-[var(--accent-secondary)]">token</code> - Token type (native = SOL)</li>
          <li><code className="text-[var(--accent-secondary)]">deposits</code> - Number of deposits</li>
          <li><code className="text-[var(--accent-secondary)]">withdrawals</code> - Number of withdrawals</li>
        </ul>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Usage Example</h3>
        <CodeBlock code={usageExample} language="typescript" title="TypeScript" />
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Important Notes</h3>
        <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          <ul className="space-y-2 text-[var(--text-secondary)]">
            <li>• Balance is stored off-chain in Arcium cSPL (encrypted)</li>
            <li>• Updates automatically after deposits/withdrawals/settlements</li>
            <li>• Only Solana supported (Arcium cSPL is Solana-only)</li>
            <li>• Returns balance in base units (lamports for SOL, divide by 1e9 for display)</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
