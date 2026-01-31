import EndpointHeader from '../../components/docs/EndpointHeader'
import RequestBody from '../../components/docs/RequestBody'
import ResponseExample from '../../components/docs/ResponseExample'
import CodeBlock from '../../components/ui/CodeBlock'

export default function NullifierTracking() {
  const usedNullifiersResponse = {
    success: true,
    data: {
      usedNullifiers: [
        "0x123...",
        "0x456...",
        "0x789..."
      ]
    }
  }

  const checkNullifierUsedResponse = {
    success: true,
    data: {
      isUsed: true,
      quoteId: "660e8400-e29b-41d4-a716-446655440001",
      entityType: "taker",
      status: "settled",
      usedAt: 1737640000000
    }
  }

  const checkNullifierNotUsedResponse = {
    success: true,
    data: {
      isUsed: false
    }
  }

  const markNullifierResponse = {
    success: true,
    data: {
      nullifierHash: "0x123...",
      quoteId: "660e8400-e29b-41d4-a716-446655440001",
      entityType: "taker",
      status: "settled",
      markedAt: 1737640000000
    }
  }

  const autoCleanupExample = `// Auto-clean deposit notes on app load
const response = await fetch('/api/v1/rfq/used-nullifiers');
const { usedNullifiers } = (await response.json()).data;

// Remove deposit notes with used nullifiers
const depositNotes = JSON.parse(localStorage.getItem('depositNotes') || '[]');
const cleanedNotes = depositNotes.filter(note => 
  !usedNullifiers.includes(note.nullifierHash)
);
localStorage.setItem('depositNotes', JSON.stringify(cleanedNotes));`

  const checkBeforeWithdrawExample = `// Before withdraw, check if nullifier is used
const nullifierHash = depositNote.nullifierHash;
const response = await fetch(\`/api/v1/rfq/check-nullifier/\${nullifierHash}\`);
const { isUsed } = (await response.json()).data;

if (isUsed) {
  alert('This deposit has been used in a settlement and cannot be withdrawn');
  // Remove from localStorage
  removeDepositNote(nullifierHash);
  return;
}

// Proceed with withdraw
await withdrawFromVault(depositNote);`

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">Nullifier Tracking</h1>
        <p className="text-lg text-[var(--text-secondary)]">
          Track used nullifiers to prevent double-spend attacks and enable frontend sync across accounts.
        </p>
      </div>

      <div className="mb-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <p className="text-blue-400 font-semibold mb-2">Why Nullifier Tracking?</p>
        <div className="text-[var(--text-secondary)] text-sm space-y-1">
          <p>• <strong>Frontend Sync:</strong> Auto-cleanup deposit notes that have been used in settlements across all accounts</p>
          <p>• <strong>Withdraw Protection:</strong> Block withdrawals for deposits that have been used in settlements</p>
          <p>• <strong>Double-Spend Prevention:</strong> Backend tracks used nullifiers to prevent reuse</p>
          <p>• <strong>Cross-Account Sync:</strong> Market makers in different browsers can sync used deposits</p>
        </div>
      </div>

      {/* GET /api/v1/rfq/used-nullifiers */}
      <div>
        <EndpointHeader
          method="GET"
          path="/api/v1/rfq/used-nullifiers"
          description="Get all used nullifiers for deposit note cleanup"
        />

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Purpose</h3>
            <p className="text-[var(--text-secondary)]">
              Frontend uses this to auto-clean deposit notes that have been used in settlements across all accounts 
              (including market makers in different browsers).
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Responses</h3>
            <ResponseExample status={200} statusText="OK" body={usedNullifiersResponse} />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Frontend Usage</h3>
            <CodeBlock code={autoCleanupExample} language="typescript" title="Auto-Cleanup Example" />
          </div>
        </div>
      </div>

      {/* GET /api/v1/rfq/check-nullifier/:nullifierHash */}
      <div>
        <EndpointHeader
          method="GET"
          path="/api/v1/rfq/check-nullifier/:nullifierHash"
          description="Check if a specific nullifier has been used"
        />

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Purpose</h3>
            <p className="text-[var(--text-secondary)]">
              Frontend uses this before withdraw to prevent withdrawing deposits that have been used in settlements.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">URL Parameters</h3>
            <ul className="space-y-2 text-[var(--text-secondary)]">
              <li><code className="text-[var(--accent-secondary)]">nullifierHash</code> - Nullifier hash to check (hex string)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Responses</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">Nullifier Used</p>
                <ResponseExample status={200} statusText="OK" body={checkNullifierUsedResponse} />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">Nullifier Not Used</p>
                <ResponseExample status={200} statusText="OK" body={checkNullifierNotUsedResponse} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Frontend Usage</h3>
            <CodeBlock code={checkBeforeWithdrawExample} language="typescript" title="Check Before Withdraw" />
          </div>
        </div>
      </div>

      {/* POST /api/v1/rfq/mark-nullifier-used */}
      <div>
        <EndpointHeader
          method="POST"
          path="/api/v1/rfq/mark-nullifier-used"
          description="Mark a nullifier as used (admin only)"
        />

        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-yellow-400 font-semibold mb-2">Admin Only</p>
            <p className="text-[var(--text-secondary)] text-sm">
              This endpoint requires admin API key authentication. Internal services can manually mark nullifiers as used.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Authentication</h3>
            <p className="text-[var(--text-secondary)] mb-2">
              Requires <code className="text-[var(--accent-secondary)]">ADMIN_API_KEY</code> in Authorization header:
            </p>
            <CodeBlock 
              code="Authorization: Bearer your-admin-api-key-here" 
              language="plaintext" 
              title="Request Header" 
            />
          </div>

          <RequestBody
            fields={[
              { name: 'nullifierHash', type: 'string', required: true, description: 'Nullifier hash to mark as used (hex string)' },
              { name: 'quoteId', type: 'string', required: false, description: 'Associated quote ID (defaults to null)' },
              { name: 'entityType', type: 'string', required: false, description: 'Entity type: "taker", "market_maker", or "manual" (defaults to "manual")' },
              { name: 'status', type: 'string', required: false, description: 'Status: "pending" or "settled" (defaults to "settled")' },
            ]}
          />

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Responses</h3>
            <ResponseExample status={201} statusText="Created" body={markNullifierResponse} />
          </div>
        </div>
      </div>

      <section className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Integration Flow</h3>
        <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          <ol className="space-y-3 text-[var(--text-secondary)]">
            <li><strong>1. App Load:</strong> Call <code className="text-[var(--accent-secondary)]">/used-nullifiers</code> to get all used nullifiers</li>
            <li><strong>2. Auto-Cleanup:</strong> Remove deposit notes with used nullifiers from localStorage</li>
            <li><strong>3. Before Withdraw:</strong> Call <code className="text-[var(--accent-secondary)]">/check-nullifier/:hash</code> to verify deposit is not used</li>
            <li><strong>4. Block Withdraw:</strong> If nullifier is used, show error and remove from localStorage</li>
            <li><strong>5. Proceed:</strong> If nullifier is not used, allow withdrawal</li>
          </ol>
        </div>
      </section>
    </div>
  )
}
