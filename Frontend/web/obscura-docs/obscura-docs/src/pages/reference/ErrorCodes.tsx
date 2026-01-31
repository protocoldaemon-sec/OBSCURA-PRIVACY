import Table from '../../components/ui/Table'
import CodeBlock from '../../components/ui/CodeBlock'

export default function ErrorCodes() {
  const errorCodes = [
    { http: '400', error: 'Missing required fields', description: 'Request validation failed' },
    { http: '400', error: 'Nullifier already used', description: 'Double-spend attempt detected' },
    { http: '400', error: 'Request expired', description: 'Withdrawal deadline passed' },
    { http: '400', error: 'Invalid chain', description: 'Unsupported chain ID' },
    { http: '400', error: 'Amount too low', description: 'Below minimum deposit (0.0003 SOL/ETH)' },
    { http: '404', error: 'Not found', description: 'Resource not found' },
    { http: '500', error: 'Relayer execution failed', description: 'On-chain transaction failed' },
    { http: '500', error: 'Internal error', description: 'Unexpected server error' },
  ]

  const otcErrorCodes = [
    { http: '400', code: 'VALIDATION_ERROR', description: 'Request validation failed (check signature/publicKey length)' },
    { http: '400', code: 'INVALID_TIMESTAMP', description: 'Timeout/expiration is invalid' },
    { http: '400', code: 'SIGNATURE_REUSED', description: 'WOTS+ signature already used (one-time use violated)' },
    { http: '401', code: 'SIGNATURE_VERIFICATION_FAILED', description: 'Invalid WOTS+ signature (check format: 4288 hex chars)' },
    { http: '402', code: 'INSUFFICIENT_BALANCE', description: 'Insufficient off-chain balance' },
    { http: '403', code: 'NOT_AUTHORIZED', description: 'Not authorized for this operation' },
    { http: '403', code: 'NOT_WHITELISTED', description: 'Market maker not whitelisted (permissioned mode only)' },
    { http: '403', code: 'NOT_OWNER', description: 'User does not own this resource' },
    { http: '404', code: 'QUOTE_REQUEST_NOT_FOUND', description: 'Quote request not found' },
    { http: '404', code: 'QUOTE_NOT_FOUND', description: 'Quote not found' },
    { http: '410', code: 'QUOTE_REQUEST_EXPIRED', description: 'Quote request has expired' },
    { http: '410', code: 'QUOTE_EXPIRED', description: 'Quote has expired' },
    { http: '410', code: 'QUOTE_REQUEST_CANCELLED', description: 'Quote request was cancelled' },
    { http: '410', code: 'QUOTE_REQUEST_FILLED', description: 'Quote request already filled' },
    { http: '500', code: 'INTERNAL_ERROR', description: 'Internal server error' },
    { http: '500', code: 'DATABASE_ERROR', description: 'Database operation failed' },
    { http: '500', code: 'SETTLEMENT_FAILED', description: 'Settlement via Obscura-LLMS failed' },
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
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Privacy Vault Error Codes</h2>
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
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Dark OTC RFQ Error Codes</h2>
        <Table
          columns={[
            { key: 'http', header: 'HTTP' },
            { key: 'code', header: 'Error Code' },
            { key: 'description', header: 'Description' },
          ]}
          data={otcErrorCodes}
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
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Amount Too Low</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Minimum deposit is 0.0003 SOL or 0.0003 ETH. This covers relayer fees and gas costs.
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

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">WOTS+ Signature Errors (Dark OTC)</h2>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Signature must be at least 4288 characters</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              <strong>Cause:</strong> Using Phantom/MetaMask signature instead of WOTS+<br/>
              <strong>Solution:</strong> Use <code className="text-[var(--accent-secondary)]">mochimo-wots-v2</code> library to generate WOTS+ signature
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Public key must be at least 4416 characters</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              <strong>Cause:</strong> Using wallet public key instead of WOTS+ public key<br/>
              <strong>Solution:</strong> Use <code className="text-[var(--accent-secondary)]">Buffer.from(wallet.wots).toString('hex')</code>
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Signature has already been used</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              <strong>Cause:</strong> Reusing WOTS+ wallet for multiple signatures<br/>
              <strong>Solution:</strong> Generate NEW WOTS+ wallet for EACH signature. WOTS+ = One-Time Signature!
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
