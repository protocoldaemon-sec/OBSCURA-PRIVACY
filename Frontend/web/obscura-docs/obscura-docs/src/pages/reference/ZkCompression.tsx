import Table from '../../components/ui/Table'
import CodeBlock from '../../components/ui/CodeBlock'
import Badge from '../../components/ui/Badge'

export default function ZkCompression() {
  const chainSupport = [
    { chain: 'Solana Devnet', support: <Badge variant="get">Enabled</Badge>, reason: 'Native integration, cost savings' },
    { chain: 'Sepolia (ETH)', support: <Badge variant="delete">Disabled</Badge>, reason: 'Privacy - prevents cross-chain data correlation' },
  ]

  const costComparison = [
    { type: 'Traditional', records: '1000 accounts', cost: '~2 SOL' },
    { type: 'ZK Compressed', records: '1 Merkle tree', cost: '~0.002 SOL' },
  ]

  const responseExample = `// Solana withdrawal (ZK Compressed)
{
  "success": true,
  "txHash": "5fmG66Xz...",
  "zkCompressed": true,
  "compressionSignature": "3Ag8rUJB..."
}

// ETH withdrawal (No ZK Compression)
{
  "success": true,
  "txHash": "0x123abc...",
  "zkCompressed": false
}`

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">ZK Compression</h1>
      <p className="text-[var(--text-secondary)] mb-8">
        Obscura uses Light Protocol ZK Compression for Solana settlements, providing ~1000x cheaper state storage.
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Chain Support</h2>
        <Table
          columns={[
            { key: 'chain', header: 'Chain' },
            { key: 'support', header: 'ZK Compression' },
            { key: 'reason', header: 'Reason' },
          ]}
          data={chainSupport}
        />
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Why ETH Doesn't Use ZK Compression</h2>
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-[var(--text-secondary)]">
            Storing ETH transaction hashes on Solana would create a cross-chain link that could be used to 
            correlate deposits and withdrawals across chains, <span className="text-yellow-400">breaking privacy guarantees</span>.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Response Fields</h2>
        <CodeBlock code={responseExample} language="json" title="Withdraw Response Examples" />
        <ul className="mt-4 space-y-2 text-[var(--text-secondary)]">
          <li><code className="text-[var(--accent-secondary)]">zkCompressed</code> - true if settlement used ZK Compression</li>
          <li><code className="text-[var(--accent-secondary)]">compressionSignature</code> - Transaction signature for compressed storage (Solana only)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Cost Savings</h2>
        <Table
          columns={[
            { key: 'type', header: 'Storage Type' },
            { key: 'records', header: '1000 Records' },
            { key: 'cost', header: 'Cost' },
          ]}
          data={costComparison}
        />
        <p className="mt-4 text-[var(--text-secondary)]">
          ZK Compression reduces storage costs by approximately <span className="text-green-400 font-semibold">1000x</span>.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Viewing Compressed Records</h2>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Photon Explorer</h3>
            <code className="text-[var(--accent-secondary)] text-sm break-all">
              https://photon.helius.dev/tx/&lt;signature&gt;?cluster=devnet
            </code>
          </div>
          <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Solana Explorer</h3>
            <code className="text-[var(--accent-secondary)] text-sm break-all">
              https://explorer.solana.com/tx/&lt;signature&gt;?cluster=devnet
            </code>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Light Protocol Integration</h2>
        <p className="text-[var(--text-secondary)] mb-4">
          Obscura integrates with Light Protocol for ZK Compression on Solana:
        </p>
        <ul className="space-y-2 text-[var(--text-secondary)]">
          <li>• Settlement records stored in compressed Merkle trees</li>
          <li>• Photon indexer for querying compressed state</li>
          <li>• Automatic compression for all Solana withdrawals</li>
          <li>• Fallback to traditional storage if compression fails</li>
        </ul>
      </section>
    </div>
  )
}
