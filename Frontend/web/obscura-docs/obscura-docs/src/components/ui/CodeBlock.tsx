import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CodeBlockProps {
  code: string
  language?: 'json' | 'bash' | 'typescript' | 'plaintext'
  title?: string
}

export default function CodeBlock({ code, language = 'json', title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const highlightJSON = (str: string): string => {
    return str
      .replace(/"([^"]+)":/g, '<span class="text-[#7dd3fc]">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="text-[#86efac]">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="text-[#fcd34d]">$1</span>')
      .replace(/: (true|false)/g, ': <span class="text-[#f472b6]">$1</span>')
      .replace(/: (null)/g, ': <span class="text-[#94a3b8]">$1</span>')
  }

  const formattedCode = language === 'json' ? highlightJSON(code) : code

  return (
    <div className="rounded-lg overflow-hidden border border-[var(--border-color)] bg-[#0d0d12]">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase">
            {title}
          </span>
          <span className="text-xs text-[var(--text-muted)]">{language}</span>
        </div>
      )}
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-[var(--success)]" />
          ) : (
            <Copy className="w-4 h-4 text-[var(--text-muted)]" />
          )}
        </button>
        <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
          <code
            className="text-[var(--text-primary)] font-mono"
            dangerouslySetInnerHTML={{ __html: formattedCode }}
          />
        </pre>
      </div>
    </div>
  )
}
