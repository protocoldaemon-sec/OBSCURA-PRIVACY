import ResponseExample from '../../components/docs/ResponseExample'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'

export default function Relayer() {
  const statsResponse = {
    totalDeposits: 42,
    totalWithdrawals: 38,
    totalVolume: "1500000000",
    pendingRequests: 3,
    usedNullifiers: 38
  }

  const requestResponse = {
    requestId: "3ae33176109d737e",
    status: "completed",
    commitment: "0x7a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
    recipient: "ECYks1hYG3xVRyYpwaesqGrkpj9ZQh1R6S3T3KXDrhrA",
    amount: "5000000",
    chainId: "solana-devnet",
    txHash: "5fmG66Xz8Uyv5Sfu6QfPUYYzcNaLPfgWVSZV5rijKmJKQ2UEu77hRoCdJBcZ9VoZyQxHP5DMsYb5VG77DhAGoSpS",
    completedAt: 1768491234567
  }

  const statusValues = [
    { status: 'pending', description: 'Request received, waiting for processing' },
    { status: 'processing', description: 'Relayer is executing the withdrawal' },
    { status: 'completed', description: 'Withdrawal successfully executed' },
    { status: 'failed', description: 'Withdrawal failed (check error)' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Relayer Service</h1>
      <p className="text-[var(--text-secondary)] mb-8">
        The relayer service executes withdrawals on behalf of users, providing true privacy by hiding the original depositor's address.
      </p>

      <div className="mb-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <p className="text-blue-400 font-semibold mb-2">🔄 How Relayer Works</p>
        <div className="text-[var(--text-secondary)] text-sm space-y-2">
          <p>1. User deposits to vault → gets deposit note</p>
          <p>2. User sends withdrawal request to relayer with nullifierHash</p>
          <p>3. Relayer verifies request and executes on-chain</p>
          <p>4. On-chain shows: <code className="text-[var(--accent-secondary)]">Relayer → Vault → Recipient</code></p>
          <p>5. Original depositor is NOT visible in withdrawal tx</p>
        </div>
      </div>

      <div className="space-y-12">
        <div>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="get">GET</Badge>
              <code className="text-lg font-mono text-[var(--text-primary)]">/api/v1/relayer/stats</code>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Get relayer service statistics including total deposits, withdrawals, and volume.
            </p>
          </div>
          <ResponseExample status={200} statusText="OK" body={statsResponse} />
          
          <section className="mt-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Response Fields</h3>
            <ul className="space-y-2 text-[var(--text-secondary)]">
              <li><code className="text-[var(--accent-secondary)]">totalDeposits</code> - Total number of deposits processed</li>
              <li><code className="text-[var(--accent-secondary)]">totalWithdrawals</code> - Total number of withdrawals executed</li>
              <li><code className="text-[var(--accent-secondary)]">totalVolume</code> - Total volume in smallest unit</li>
              <li><code className="text-[var(--accent-secondary)]">pendingRequests</code> - Number of pending withdrawal requests</li>
              <li><code className="text-[var(--accent-secondary)]">usedNullifiers</code> - Number of nullifiers used (prevents double-spend)</li>
            </ul>
          </section>
        </div>

        <hr className="border-[var(--border-color)]" />

        <div>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="get">GET</Badge>
              <code className="text-lg font-mono text-[var(--text-primary)]">/api/v1/relayer/request/:requestId</code>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Get withdrawal request status by request ID.
            </p>
          </div>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Path Parameters</h3>
            <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <code className="text-[var(--accent-secondary)]">requestId</code>
              <span className="text-[var(--text-muted)] ml-2">- The unique request identifier from withdraw response</span>
            </div>
          </section>

          <ResponseExample status={200} statusText="OK" body={requestResponse} />

          <section className="mt-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Status Values</h3>
            <Table
              columns={[
                { key: 'status', header: 'Status' },
                { key: 'description', header: 'Description' },
              ]}
              data={statusValues}
            />
          </section>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Fee Structure (Tiered Pricing)</h2>
        <Table
          columns={[
            { key: 'amount', header: 'Amount' },
            { key: 'rate', header: 'Fee Rate' },
            { key: 'example', header: 'Example' },
          ]}
          data={[
            { amount: '0-10 SOL/ETH', rate: '0.10%', example: '10 SOL → 0.01 SOL fee' },
            { amount: '10-100 SOL/ETH', rate: '0.08%', example: '100 SOL → 0.08 SOL fee' },
            { amount: '100-1000 SOL/ETH', rate: '0.06%', example: '1000 SOL → 0.6 SOL fee' },
            { amount: '1000+ SOL/ETH', rate: '0.05%', example: '10000 SOL → 5 SOL fee' },
          ]}
        />
        <div className="mt-4 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          <p className="text-[var(--text-secondary)] text-sm mb-2">Minimum Fee:</p>
          <ul className="space-y-1 text-[var(--text-secondary)] text-sm">
            <li>• SOL: <code className="text-[var(--accent-secondary)]">0.0001 SOL</code> (100,000 lamports)</li>
            <li>• ETH: <code className="text-[var(--accent-secondary)]">0.00001 ETH</code></li>
          </ul>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Nullifier Tracking</h2>
        <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          <ul className="space-y-2 text-[var(--text-secondary)]">
            <li>• Each nullifier can only be used <span className="text-[var(--accent-secondary)]">ONCE</span></li>
            <li>• Prevents double-spend attacks</li>
            <li>• Tracked per-chain (same nullifier can be used on different chains)</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
