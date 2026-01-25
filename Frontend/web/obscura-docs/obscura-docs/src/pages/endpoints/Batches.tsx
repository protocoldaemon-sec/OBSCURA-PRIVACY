import ResponseExample from '../../components/docs/ResponseExample'
import Badge from '../../components/ui/Badge'

export default function Batches() {
  const getBatchesResponse = {
    batches: [
      {
        batchId: "batch-123",
        intentCount: 5,
        status: "pending",
        createdAt: 1768491234567
      },
      {
        batchId: "batch-124",
        intentCount: 8,
        status: "pending",
        createdAt: 1768491234600
      }
    ]
  }

  const flushResponse = {
    success: true,
    flushedBatches: 3,
    totalIntents: 15
  }

  const getBatchResponse = {
    batchId: "batch-123",
    merkleRoot: "0x7a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
    intentCount: 5,
    status: "settled",
    txHash: "5fmG66Xz8Uyv5Sfu6QfPUYYzcNaLPfgWVSZV5rijKmJKQ2UEu77hRoCdJBcZ9VoZyQxHP5DMsYb5VG77DhAGoSpS"
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Batches</h1>
      <p className="text-[var(--text-secondary)] mb-8">
        Intents are grouped into batches for gas-efficient settlement. Batches are automatically flushed when they reach a certain size or age.
      </p>

      <div className="space-y-12">
        <div>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="get">GET</Badge>
              <code className="text-lg font-mono text-[var(--text-primary)]">/api/v1/batches</code>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Get pending batches waiting for settlement.
            </p>
          </div>
          <ResponseExample status={200} statusText="OK" body={getBatchesResponse} />
        </div>

        <hr className="border-[var(--border-color)]" />

        <div>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="post">POST</Badge>
              <code className="text-lg font-mono text-[var(--text-primary)]">/api/v1/batches/flush</code>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Force flush all pending batches for immediate settlement.
            </p>
          </div>
          <ResponseExample status={200} statusText="OK" body={flushResponse} />
        </div>

        <hr className="border-[var(--border-color)]" />

        <div>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="get">GET</Badge>
              <code className="text-lg font-mono text-[var(--text-primary)]">/api/v1/batches/:batchId</code>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Get batch details by ID.
            </p>
          </div>

          <section className="mb-8">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Path Parameters</h3>
            <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <code className="text-[var(--accent-secondary)]">batchId</code>
              <span className="text-[var(--text-muted)] ml-2">- The unique batch identifier</span>
            </div>
          </section>

          <ResponseExample status={200} statusText="OK" body={getBatchResponse} />

          <section className="mt-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Response Fields</h3>
            <ul className="space-y-2 text-[var(--text-secondary)]">
              <li><code className="text-[var(--accent-secondary)]">batchId</code> - Unique batch identifier</li>
              <li><code className="text-[var(--accent-secondary)]">merkleRoot</code> - Merkle root of all intents in batch</li>
              <li><code className="text-[var(--accent-secondary)]">intentCount</code> - Number of intents in batch</li>
              <li><code className="text-[var(--accent-secondary)]">status</code> - pending, settled</li>
              <li><code className="text-[var(--accent-secondary)]">txHash</code> - Settlement transaction hash (when settled)</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
