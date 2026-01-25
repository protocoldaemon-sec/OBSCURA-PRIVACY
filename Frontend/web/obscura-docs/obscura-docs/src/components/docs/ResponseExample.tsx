import CodeBlock from '../ui/CodeBlock'

interface ResponseExampleProps {
  status: number
  statusText: string
  body: object
}

export default function ResponseExample({ status, statusText, body }: ResponseExampleProps) {
  const isSuccess = status >= 200 && status < 300
  const statusColor = isSuccess ? 'text-[var(--success)]' : 'text-[var(--error)]'

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className={`font-mono font-semibold ${statusColor}`}>{status}</span>
        <span className="text-[var(--text-secondary)]">{statusText}</span>
      </div>
      <CodeBlock
        code={JSON.stringify(body, null, 2)}
        language="json"
        title={isSuccess ? 'Success Response' : 'Error Response'}
      />
    </div>
  )
}
