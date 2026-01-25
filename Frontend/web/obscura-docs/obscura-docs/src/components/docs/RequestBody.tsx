import Badge from '../ui/Badge'

export interface FieldSchema {
  name: string
  type: string
  required: boolean
  description: string
}

interface RequestBodyProps {
  fields: FieldSchema[]
}

export default function RequestBody({ fields }: RequestBodyProps) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Request Body</h3>
      <div className="overflow-x-auto rounded-lg border border-[var(--border-color)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--bg-tertiary)]">
              <th className="px-4 py-3 text-left font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)]">
                Field
              </th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)]">
                Type
              </th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)]">
                Required
              </th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)]">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr
                key={field.name}
                className={`${
                  index % 2 === 0 ? 'bg-[var(--bg-secondary)]' : 'bg-[var(--bg-primary)]'
                } hover:bg-[var(--bg-tertiary)] transition-colors`}
              >
                <td className="px-4 py-3 border-b border-[var(--border-color)]">
                  <code className="text-[var(--accent-secondary)] font-mono text-sm">
                    {field.name}
                  </code>
                </td>
                <td className="px-4 py-3 border-b border-[var(--border-color)]">
                  <code className="text-[var(--text-muted)] font-mono text-sm">
                    {field.type}
                  </code>
                </td>
                <td className="px-4 py-3 border-b border-[var(--border-color)]">
                  <Badge variant={field.required ? 'required' : 'optional'}>
                    {field.required ? 'Required' : 'Optional'}
                  </Badge>
                </td>
                <td className="px-4 py-3 border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                  {field.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
