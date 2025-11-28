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
  function downloadJson(name: string, data: unknown[]) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
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
              onClick={() => downloadJson(card.key, card.data)}
              className="inline-flex items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              disabled={card.count === 0}
            >
              Download JSON
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

