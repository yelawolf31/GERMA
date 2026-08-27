import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronRight } from 'lucide-react'
import { sortRows } from '../../utils/sort'

/**
 * Lightweight sortable data table used by the dashboard.
 * @param {Array<{key: string, label: string, sortable?: boolean, align?: string, render?: Function}>} columns
 * @param {Array} rows
 * @param {Function} getRowKey
 * @param {Function} onRowClick
 * @param {ReactNode} emptyState
 * @param {string} initialSort
 * @param {'asc'|'desc'} initialDir
 */
export default function DataTable({
  columns,
  rows,
  getRowKey,
  onRowClick,
  emptyState,
  initialSort,
  initialDir = 'desc',
}) {
  const [sortKey, setSortKey] = useState(initialSort)
  const [sortDir, setSortDir] = useState(initialDir)

  const sortedRows = useMemo(
    () => (sortKey ? sortRows(rows, sortKey, sortDir) : rows),
    [rows, sortKey, sortDir],
  )

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' }

  if (sortedRows.length === 0) {
    return <div className="px-5 py-4">{emptyState}</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-5 py-3 font-semibold text-slate-500 ${alignClass[col.align || 'left'] || ''}`}
              >
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => handleSort(col.key)}
                    className={`inline-flex items-center gap-1 uppercase tracking-wide text-xs transition-colors hover:text-brand-700 ${
                      sortKey === col.key ? 'text-brand-700' : ''
                    }`}
                  >
                    {col.label}
                    {sortKey === col.key &&
                      (sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)}
                  </button>
                ) : (
                  <span className="uppercase tracking-wide text-xs">{col.label}</span>
                )}
              </th>
            ))}
            {onRowClick && <th scope="col" className="w-8" />}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-slate-50 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-brand-50/50' : ''}`}
            >
              {columns.map((col) => {
                const raw = row[col.key]
                const value = col.render ? col.render(raw, row) : raw
                return (
                  <td key={col.key} className={`px-5 py-3 text-slate-700 ${alignClass[col.align || 'left'] || ''}`}>
                    {value}
                  </td>
                )
              })}
              {onRowClick && (
                <td className="px-2 py-3 text-slate-300">
                  <ChevronRight className="h-4 w-4" />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}