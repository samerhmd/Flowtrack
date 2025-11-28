"use client"
import React from 'react'

export function ExportView({
  physio,
  sessions,
  caffeine,
  water,
  external,
}: {
  physio: unknown[]
  sessions: unknown[]
  caffeine: unknown[]
  water: unknown[]
  external: unknown[]
}) {
  function toCsv(name: string, rows: unknown[]): string {
    if (!rows || rows.length === 0) {
      return ''
    }
    const objects = rows as Record<string, unknown>[]
    const headerSet = new Set<string>()
    for (const obj of objects) {
      Object.keys(obj || {}).forEach((k) => headerSet.add(k))
    }
    const headers = Array.from(headerSet)

    const escapeCell = (value: unknown): string => {
      if (value === null || value === undefined) return ''
      const s = String(value)
      const escaped = s.replace(/"/g, '""')
      if (/[",\n]/.test(escaped)) {
        return `"${escaped}"`
      }
      return escaped
    }

    const lines: string[] = []
    lines.push(headers.join(','))
    for (const obj of objects) {
      const row = headers.map((key) => escapeCell((obj as Record<string, unknown>)[key]))
      lines.push(row.join(','))
    }
    return lines.join('\n')
  }

  function downloadCsv(name: string, rows: unknown[]) {
    if (!rows || rows.length === 0) {
      return
    }
    try {
      const csv = toCsv(name, rows)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error creating CSV download', err)
      alert('Failed to generate CSV. Check console for details.')
    }
  }

  const cards = [
    { key: 'physio_logs', label: 'Physio logs', count: physio.length, data: physio },
    { key: 'sessions', label: 'Sessions', count: sessions.length, data: sessions },
    { key: 'caffeine_events', label: 'Caffeine events', count: caffeine.length, data: caffeine },
    { key: 'water_events', label: 'Water events', count: water.length, data: water },
    { key: 'external_daily_snapshots', label: 'External daily snapshots', count: external.length, data: external },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map(card => (
        <div key={card.key} className="rounded-2xl border bg-background p-4 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold dark:text-gray-200">{card.label}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{card.count} record{card.count === 1 ? '' : 's'}</div>
            </div>
          <button
            type="button"
            onClick={() => downloadCsv(card.key, card.data)}
            className="inline-flex items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            disabled={card.count === 0}
          >
            Download CSV
          </button>
          </div>
          {card.count === 0 && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">No records yet. Log data to see it here.</div>
          )}
        </div>
      ))}
    </div>
  )
}
