import Badge from '../ui/Badge'

interface EndpointHeaderProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
}

export default function EndpointHeader({ method, path, description }: EndpointHeaderProps) {
  const methodVariant = method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Badge variant={methodVariant}>{method}</Badge>
        <code className="text-lg font-mono text-[var(--text-primary)]">{path}</code>
      </div>
      <p className="text-[var(--text-secondary)] leading-relaxed">{description}</p>
    </div>
  )
}
