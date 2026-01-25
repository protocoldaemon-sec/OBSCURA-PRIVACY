interface TableColumn {
  key: string
  header: string
  width?: string
}

interface TableProps {
  columns: TableColumn[]
  data: Record<string, string | number | React.ReactNode>[]
}

export default function Table({ columns, data }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border-color)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--bg-tertiary)]">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)]"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`${
                rowIndex % 2 === 0 ? 'bg-[var(--bg-secondary)]' : 'bg-[var(--bg-primary)]'
              } hover:bg-[var(--bg-tertiary)] transition-colors`}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-4 py-3 text-[var(--text-secondary)] border-b border-[var(--border-color)]"
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
