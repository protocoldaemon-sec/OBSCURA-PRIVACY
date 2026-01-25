import { FileText, Download, ExternalLink } from 'lucide-react'
import CodeBlock from '../../components/ui/CodeBlock'

export default function LlmDocs() {
  const exampleUsage = `# Using with AI assistants
curl https://docs.obscura.com/obscura-llms.txt
curl https://docs.obscura.com/obscura-dark-otc-rfq-llms.txt

# Or reference directly in your prompt:
"Read the API docs at /obscura-llms.txt and help me integrate Obscura Privacy Vault"
"Read the API docs at /obscura-dark-otc-rfq-llms.txt and help me integrate Dark OTC RFQ"`

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">LLM Documentation</h1>
      <p className="text-[var(--text-secondary)] mb-8">
        Machine-readable documentation optimized for AI assistants and LLMs. Two separate products with complete API references.
      </p>

      <section className="mb-8">
        <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-[var(--accent-secondary)]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">obscura-llms.txt</h2>
              <p className="text-sm text-[var(--text-muted)]">Privacy Vault API - Deposits, withdrawals, and relayer network</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <a
              href="/obscura-llms.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="w-4 h-4" />
              View File
            </a>
            <a
              href="/obscura-llms.txt"
              download="obscura-llms.txt"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--border-color)] transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">obscura-dark-otc-rfq-llms.txt</h2>
              <p className="text-sm text-[var(--text-muted)]">Dark OTC RFQ API - Privacy-preserving bilateral trading with WOTS+ signatures</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <a
              href="/obscura-dark-otc-rfq-llms.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="w-4 h-4" />
              View File
            </a>
            <a
              href="/obscura-dark-otc-rfq-llms.txt"
              download="obscura-dark-otc-rfq-llms.txt"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--border-color)] transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">What is llms.txt?</h2>
        <p className="text-[var(--text-secondary)] mb-4">
          The <code className="text-[var(--accent-secondary)]">llms.txt</code> files are standardized formats for providing 
          documentation to AI assistants and Large Language Models. Each file contains complete API endpoints, request/response formats, 
          and usage examples in a single, easy-to-parse text file.
        </p>
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <p className="text-[var(--text-secondary)] text-sm">
            Use these files when asking AI assistants to help you integrate with Obscura APIs. 
            Simply reference the URL or paste the contents into your conversation.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Usage</h2>
        <CodeBlock code={exampleUsage} language="bash" title="Example" />
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Privacy Vault Contents</h2>
        <ul className="space-y-2 text-[var(--text-secondary)]">
          <li>• Deposit and withdrawal endpoints</li>
          <li>• Relayer network integration</li>
          <li>• Batch management</li>
          <li>• Off-chain balance tracking with Arcium cSPL</li>
          <li>• ZK Compression via Light Protocol</li>
          <li>• Multi-chain support (Solana, EVM)</li>
          <li>• Tiered fee structure</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Dark OTC RFQ Contents</h2>
        <ul className="space-y-2 text-[var(--text-secondary)]">
          <li>• Quote request creation</li>
          <li>• Market maker quote submission</li>
          <li>• Quote acceptance with automatic settlement</li>
          <li>• Private messaging between takers and market makers</li>
          <li>• WOTS+ one-time signatures for unlinkability</li>
          <li>• Whitelist management (permissioned/permissionless modes)</li>
          <li>• Integration with Obscura Privacy Vault</li>
        </ul>
      </section>
    </div>
  )
}
