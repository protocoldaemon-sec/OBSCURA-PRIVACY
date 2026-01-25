import Table from '../../components/ui/Table'
import CodeBlock from '../../components/ui/CodeBlock'

export default function ErrorCodes() {
  const errorCodes = [
    { http: '400', error: 'Missing required fields', description: 'Request validation failed' },
    { http: '400', error: 'Nullifier already used', description: 'Double-spend attempt detected' },
    { http: '400', error: 'Request expired', description: 'Withdrawal deadline passed' },
    { http: '400', error: 'Invalid chain', description: 'Unsupported chain ID' },
    { http: '404', error: 'Not found', description: 'Resource not found' },
    { http: '500', error: 'Relayer execution failed', description: 'On-chain transaction failed' },
    { http: '500', error: 'Internal error', description: 'Unexpected server error' },
  ]

  const errorFormat = `{
  "error": "Error message",
  "details": "Additional error details"
}`

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Error Codes</h1>
      <p className="text-[var(--text-secondary)] mb-8">
        Reference for all error codes returned by the Obscura API.
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">HTTP Error Codes</h2>
        <Table
          columns={[
            { key: 'http', header: 'HTTP' },
            { key: 'error', header: 'Error' },
            { key: 'description', header: 'Description' },
          ]}
          data={errorCodes}
        />
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Error Response Format</h2>
        <p className="text-[var(--text-secondary)] mb-4">
          All error responses follow this format:
        </p>
        <CodeBlock code={errorFormat} language="json" title="Error Response" />
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Common Errors</h2>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Missing Required Fields</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Ensure all required fields are included in your request body. Check the endpoint documentation for required fields.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Nullifier Already Used</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Each nullifier can only be used once. This error indicates a double-spend attempt or that the deposit has already been withdrawn.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Invalid Chain</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Use one of the supported chain IDs: <code className="text-[var(--accent-secondary)]">solana-devnet</code>, <code className="text-[var(--accent-secondary)]">sepolia</code>.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Invalid Amount Format</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Amounts must be strings representing the token amount in its smallest unit (lamports for SOL, wei for ETH).
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Relayer Execution Failed</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              The on-chain transaction failed. This could be due to insufficient vault balance, network issues, or invalid parameters.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
