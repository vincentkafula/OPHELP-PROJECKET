import { useState, useMemo, ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[]
  data: T[]
  pageSize?: number
  searchable?: boolean
  searchPlaceholder?: string
  searchFn?: (item: T, query: string) => boolean
  emptyMessage?: string
  actions?: (row: T) => ReactNode
}

export function DataTable<T extends { id: string }>({
  columns, data, pageSize = 10, searchable = false, searchPlaceholder = 'Search…',
  searchFn, emptyMessage = 'No records found.', actions,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const filtered = useMemo(() => {
    let items = data
    if (searchable && query.trim() && searchFn) {
      items = items.filter(item => searchFn(item, query.toLowerCase()))
    }
    if (sortKey) {
      items = [...items].sort((a, b) => {
        const av = (a as Record<string, unknown>)[sortKey]
        const bv = (b as Record<string, unknown>)[sortKey]
        const cmp = String(av ?? '').localeCompare(String(bv ?? ''))
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return items
  }, [data, query, sortKey, sortDir, searchable, searchFn])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function toggleSort(key: string) {
    if (sortKey === key) { setSortDir(d => d === 'asc' ? 'desc' : 'asc') }
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  function handleSearch(q: string) { setQuery(q); setPage(1) }

  return (
    <div className="flex flex-col gap-3">
      {searchable && (
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${col.width ?? ''} ${col.sortable ? 'cursor-pointer select-none hover:text-gray-800' : ''}`}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        {sortDir === 'asc' ? <path d="M12 4l8 16H4z" /> : <path d="M12 20 4 4h16z" />}
                      </svg>
                    )}
                  </span>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center text-sm text-gray-400">{emptyMessage}</td>
              </tr>
            ) : paged.map((row, i) => (
              <tr key={row.id} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-green-50/30 transition-colors`}>
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-gray-700">
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
                {actions && <td className="px-4 py-3 text-right">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">← Prev</button>
            <span className="px-3">{currentPage} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
