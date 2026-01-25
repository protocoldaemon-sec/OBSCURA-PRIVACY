import EndpointHeader from '../../components/docs/EndpointHeader'
import RequestBody from '../../components/docs/RequestBody'
import ResponseExample from '../../components/docs/ResponseExample'
import CodeBlock from '../../components/ui/CodeBlock'
import Table from '../../components/ui/Table'

export default function Withdraw() {
  const fields = [
    { name: 'commitment', type: 'string', required: true, description: 'Commitment from deposit note' },
    { name: 'nullifierHash', type: 'string', required: true, description: 'Nullifier hash from deposit note' },
    { name: 'recipient', type: 'string', required: true, description: 'Destination wallet address' },
    { name: 'amount', type: 'string', required: true, description: 'Amount to withdraw' },
    { name: 'chainId', type: 'string', required: true, description: 'Chain: solana-devnet, sepolia' },
  ]

  const exampleRequest = `{
  "commitment": "0x7a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
  "nullifierHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "recipient": "ECYks1hYG3xVRyYpwaesqGrkpj9ZQh1R6S3T3KXDrhrA",
  "amount": "5000000",
  "chainId": "solana-devnet"
}`

  const pendingResponse = {
    success: true,
    requestId: "3ae33176109d737e",
    estimatedFee: "15000",
    status: "pending"
  }

  const completedResponse = {
    success: true,
    requestId: "3ae33176109d737e",
    txHash: "5fmG66Xz8Uyv5Sfu6QfPUYYzcNaLPfgWVSZV5rijKmJKQ2UEu77hRoCdJBcZ9VoZyQxHP5DMsYb5VG77DhAGoSpS",
    status: "completed",
    zkCompressed: true,
    compressionSignature: "3Ag8rUJB6tswcHubJ62aspEkJFf3QvShwCJPa4jgUsX2Pj3uTTzE6u27wDuAdLZnTJt2nBCkheGcrECnoFJMoCXb"
  }

  const ethResponse = {
    success: true,
    requestId: "7bc44287210e848f",
    txHash: "0x123abc...",
    status: "completed",
    zkCompressed: false
  }

  const tieredFeeData = [
    { amount: '0-10 SOL/ETH', rate: '0.10%', example: '10 SOL → 0.01 SOL fee' },
    { amount: '10-100 SOL/ETH', rate: '0.08%', example: '100 SOL → 0.08 SOL fee' },
    { amount: '100-1000 SOL/ETH', rate: '0.06%', example: '1000 SOL → 0.6 SOL fee' },
    { amount: '1000+ SOL/ETH', rate: '0.05%', example: '10000 SOL → 5 SOL fee' },
  ]

  const minFeeData = [
    { chain: 'SOL', minFee: '0.0001 SOL (100,000 lamports)' },
    { chain: 'ETH', minFee: '0.00001 ETH' },
  ]

  return (
    <div>
      <EndpointHeader
        method="POST"
        path="/api/v1/withdraw"
        description="Submit withdrawal request to relayer for private execution. The relayer executes the withdrawal on-chain, hiding your identity."
      />

      <div className="mb-8 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
        <p className="text-green-400 font-semibold mb-2">True Privacy via Relayer</p>
        <p className="text-[var(--text-secondary)] text-sm">
          Withdrawals are executed by the relayer, not your wallet. On-chain, only the relayer address appears - 
          your original deposit address is never linked to the withdrawal.
        </p>
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
            <p className="text-sm text-[var(--text-secondary)] mb-2">Initial Response (Pending)</p>
            <ResponseExample status={201} statusText="Created" body={pendingResponse} />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">Solana Completed (with ZK Compression)</p>
            <ResponseExample status={200} statusText="OK" body={completedResponse} />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">ETH Completed (no ZK Compression)</p>
            <ResponseExample status={200} statusText="OK" body={ethResponse} />
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">ZK Compression (Solana Only)</h3>
        <p className="text-[var(--text-secondary)] mb-4">
          Solana withdrawals use Light Protocol ZK Compression for ~1000x cheaper state storage.
          ETH withdrawals do NOT use ZK Compression to prevent cross-chain data correlation.
        </p>
        <ul className="space-y-2 text-[var(--text-secondary)]">
          <li><code className="text-[var(--accent-secondary)]">zkCompressed</code> - true if settlement used ZK Compression</li>
          <li><code className="text-[var(--accent-secondary)]">compressionSignature</code> - Transaction signature for compressed storage</li>
        </ul>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Relayer Fee Structure (Tiered Pricing)</h3>
        <Table
          columns={[
            { key: 'amount', header: 'Amount' },
            { key: 'rate', header: 'Fee Rate' },
            { key: 'example', header: 'Example' },
          ]}
          data={tieredFeeData}
        />
        <div className="mt-4">
          <h4 className="text-md font-semibold text-[var(--text-primary)] mb-2">Minimum Fee</h4>
          <Table
            columns={[
              { key: 'chain', header: 'Chain' },
              { key: 'minFee', header: 'Minimum Fee' },
            ]}
            data={minFeeData}
          />
        </div>
        <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <p className="text-[var(--text-secondary)] text-sm">
            Fee is automatically deducted from withdrawal amount. User receives: <code className="text-[var(--accent-secondary)]">depositAmount - fee</code>
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Privacy Flow</h3>
        <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          <ol className="list-decimal list-inside text-[var(--text-secondary)] space-y-2">
            <li>User deposits to vault → gets deposit note with secrets</li>
            <li>User sends withdrawal request with <code className="text-[var(--accent-secondary)]">nullifierHash</code> (not nullifier!)</li>
            <li>Relayer verifies and executes withdrawal on-chain</li>
            <li>On-chain shows: <code className="text-[var(--accent-secondary)]">Relayer → Vault → Recipient</code></li>
            <li>Original depositor address is NOT visible in withdrawal tx</li>
          </ol>
        </div>
      </section>
    </div>
  )
}
