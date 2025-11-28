"use client"
import { useMemo, useState } from 'react'

export interface DailyInsightRow {
  date: string
  avg_flow: number | null
  session_count: number
  sleep_hours: number | null
  sleep_quality: number | null
  caffeine_total_mg: number | null
  hrv_score: number | null
  has_partner_sleepover: boolean
  has_sick_tag: boolean
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function InsightsView({ data }: { data: DailyInsightRow[] }) {
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30)
  const [excludeSick, setExcludeSick] = useState(false)
  const [excludePartnerSleepover, setExcludePartnerSleepover] = useState(false)

  const filtered = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() - (rangeDays - 1))
    return data.filter(row => {
      const d = new Date(row.date + 'T00:00:00')
      if (d < cutoff) return false
      if (excludeSick && row.has_sick_tag) return false
      if (excludePartnerSleepover && row.has_partner_sleepover) return false
      return true
    })
  }, [data, rangeDays, excludeSick, excludePartnerSleepover])

  const chartData = useMemo(() => filtered.map(row => ({
    ...row,
    caffeine_scaled: row.caffeine_total_mg != null ? Math.min(10, Number(row.caffeine_total_mg) / 50) : null,
  })), [filtered])

  return (
    <div className="rounded-2xl border bg-background p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="mr-1 text-gray-500 dark:text-gray-400">Range:</span>
          {[7, 30, 90].map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setRangeDays(d as 7 | 30 | 90)}
              className={cn(
                'rounded-full px-3 py-1 border text-xs',
                rangeDays === d ? 'bg-sky-600 text-white border-sky-600' : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700'
              )}
            >
              {d}d
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExcludeSick(v => !v)}
            className={cn(
              'rounded-full px-3 py-1 border text-xs',
              excludeSick ? 'bg-rose-600 text-white border-rose-600' : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700'
            )}
          >
            Exclude sick days
          </button>
          <button
            type="button"
            onClick={() => setExcludePartnerSleepover(v => !v)}
            className={cn(
              'rounded-full px-3 py-1 border text-xs',
              excludePartnerSleepover ? 'bg-amber-600 text-white border-amber-600' : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700'
            )}
          >
            Exclude partner nights
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div>
          <h2 className="text-sm font-semibold mb-1 dark:text-gray-200">Daily trends</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Not enough data for the selected range/filters. Log more days or relax your filters.</p>
        </div>
      ) : (
        <div className="text-xs">
          <h2 className="text-sm font-semibold mb-2 dark:text-gray-200">Daily trends (avg flow vs sleep/caffeine)</h2>
          <div className="space-y-1">
            {chartData.map(r => (
              <div key={r.date} className="flex justify-between">
                <span className="dark:text-gray-300">{r.date}</span>
                <span className="dark:text-gray-200">flow {r.avg_flow ?? '–'} · sleep {r.sleep_hours ?? '–'}h · caf {r.caffeine_total_mg ?? '–'}mg</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
