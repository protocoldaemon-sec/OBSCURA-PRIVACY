import EndpointHeader from '../../components/docs/EndpointHeader'
import RequestBody from '../../components/docs/RequestBody'
import ResponseExample from '../../components/docs/ResponseExample'
import CodeBlock from '../../components/ui/CodeBlock'

export default function Deposit() {
  const fields = [
    { name: 'network', type: 'string', required: true, description: 'Network: solana-devnet, sepolia' },
    { name: 'token', type: 'string', required: true, description: 'Token type: native, usdc, usdt' },
    { name: 'amount', type: 'string', required: true, description: 'Amount as string (in smallest unit)' },
  ]

  const solanaExample = `{
  "network": "solana-devnet",
  "token": "native",
  "amount": "5000000"
}`

  const sepoliaExample = `{
  "network": "sepolia",
  "token": "native",
  "amount": "1000000000000000"
}`

  const successResponse = {
    success: true,
    depositNote: {
      commitment: "0x7a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
      nullifier: "abc123def456...",
      nullifierHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      secret: "def456abc789...",
      amount: "5000000",
      token: "native",
      chainId: "solana-devnet",
      timestamp: 1768491234567
    },
    txHash: "5YiJ1SCm3CYoPhDp9VSunn1TAAvn6emDcpUCwTFyQXH6f4dBaZuuKALpDU7bv9Lm11AFfMoS1f56wUrknrvuaE55",
    vaultAddress: "6owJu2yXoPvTbM67XwmRguVRQhCADaswHkAVhVHSvoH7"
  }

  const errorResponse = {
    error: "Missing required fields: network, token, amount"
  }

  return (
    <div>
      <EndpointHeader
        method="POST"
        path="/api/v1/deposit"
        description="Create a deposit to the privacy vault. Returns a deposit note containing secrets needed for withdrawal."
      />

      <div className="mb-8 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
        <p className="text-yellow-400 font-semibold mb-2">Important: Save Your Deposit Note</p>
        <p className="text-[var(--text-secondary)] text-sm">
          The <code className="text-[var(--accent-secondary)]">nullifier</code> and <code className="text-[var(--accent-secondary)]">secret</code> in the response are required for withdrawal. 
          Store them securely - they cannot be recovered if lost!
        </p>
      </div>

      <RequestBody fields={fields} />

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Example Requests</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">Solana Devnet Deposit</p>
            <CodeBlock code={solanaExample} language="json" title="Request" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">Sepolia ETH Deposit</p>
            <CodeBlock code={sepoliaExample} language="json" title="Request" />
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Responses</h3>
        <ResponseExample status={201} statusText="Created" body={successResponse} />
        <ResponseExample status={400} statusText="Bad Request" body={errorResponse} />
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Deposit Note Fields</h3>
        <ul className="space-y-2 text-[var(--text-secondary)]">
          <li><code className="text-[var(--accent-secondary)]">commitment</code> - Public hash stored on-chain</li>
          <li><code className="text-red-400">nullifier</code> - SECRET: Random 32 bytes, proves ownership</li>
          <li><code className="text-[var(--accent-secondary)]">nullifierHash</code> - Public hash for replay protection</li>
          <li><code className="text-red-400">secret</code> - SECRET: Random 32 bytes, part of commitment</li>
          <li><code className="text-[var(--accent-secondary)]">amount</code> - Amount deposited</li>
          <li><code className="text-[var(--accent-secondary)]">token</code> - Token type</li>
          <li><code className="text-[var(--accent-secondary)]">chainId</code> - Chain identifier</li>
          <li><code className="text-[var(--accent-secondary)]">timestamp</code> - Deposit timestamp</li>
        </ul>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Commitment Scheme</h3>
        <CodeBlock 
          code={`commitment = SHA256(secret || nullifier || amount || token || chainId)
nullifierHash = SHA256(nullifier)`} 
          language="plaintext" 
          title="Cryptographic Formula" 
        />
      </section>
    </div>
  )
}
