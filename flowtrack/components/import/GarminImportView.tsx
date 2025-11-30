"use client"
import { useState } from 'react'

export default function GarminImportView() {
  const [sleepFile, setSleepFile] = useState<File | null>(null)
  const [hrvFile, setHrvFile] = useState<File | null>(null)
  const [heartFile, setHeartFile] = useState<File | null>(null)
  const [actFile, setActFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ daysProcessed: number; dates: string[] } | null>(null)

  const submit = async () => {
    setError(null)
    setResult(null)
    if (!sleepFile && !hrvFile && !heartFile && !actFile) {
      setError('Select at least one CSV file')
      return
    }
    setIsSubmitting(true)
    try {
      const fd = new FormData()
      if (sleepFile) fd.append('sleep', sleepFile)
      if (hrvFile) fd.append('hrv', hrvFile)
      if (heartFile) fd.append('heartRate', heartFile)
      if (actFile) fd.append('activities', actFile)
      const res = await fetch('/api/import/garmin', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Import failed')
      const dates: string[] = Array.isArray(json?.snapshots) ? json.snapshots.slice(0, 5).map((s: any) => s?.date).filter(Boolean) : []
      setResult({ daysProcessed: json?.daysProcessed ?? 0, dates })
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white dark:bg-black dark:border-gray-700 p-4">
        <h2 className="text-sm font-semibold mb-3 dark:text-gray-200">Select CSV files</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border p-3 dark:border-gray-700">
            <label className="block text-sm font-medium dark:text-gray-200">Sleep CSV (optional)</label>
            <input id="sleep-csv" type="file" accept=".csv" onChange={e => setSleepFile(e.target.files?.[0] ?? null)} className="sr-only" />
            <label htmlFor="sleep-csv" className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium mt-2 cursor-pointer hover:bg-blue-700">
              Choose file
            </label>
            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">{sleepFile ? sleepFile.name : 'No file chosen'}</span>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">Export from Garmin → Reports → Sleep → Export CSV</p>
          </div>
          <div className="rounded-md border p-3 dark:border-gray-700">
            <label className="block text-sm font-medium dark:text-gray-200">HRV Status CSV (optional)</label>
            <input id="hrv-csv" type="file" accept=".csv" onChange={e => setHrvFile(e.target.files?.[0] ?? null)} className="sr-only" />
            <label htmlFor="hrv-csv" className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium mt-2 cursor-pointer hover:bg-blue-700">
              Choose file
            </label>
            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">{hrvFile ? hrvFile.name : 'No file chosen'}</span>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">Export HRV status CSV</p>
          </div>
          <div className="rounded-md border p-3 dark:border-gray-700">
            <label className="block text-sm font-medium dark:text-gray-200">Heart Rate CSV (optional)</label>
            <input id="heart-csv" type="file" accept=".csv" onChange={e => setHeartFile(e.target.files?.[0] ?? null)} className="sr-only" />
            <label htmlFor="heart-csv" className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium mt-2 cursor-pointer hover:bg-blue-700">
              Choose file
            </label>
            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">{heartFile ? heartFile.name : 'No file chosen'}</span>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">Export daily resting HR CSV</p>
          </div>
          <div className="rounded-md border p-3 dark:border-gray-700">
            <label className="block text-sm font-medium dark:text-gray-200">Activities CSV (optional)</label>
            <input id="act-csv" type="file" accept=".csv" onChange={e => setActFile(e.target.files?.[0] ?? null)} className="sr-only" />
            <label htmlFor="act-csv" className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium mt-2 cursor-pointer hover:bg-blue-700">
              Choose file
            </label>
            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">{actFile ? actFile.name : 'No file chosen'}</span>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">Export activities/workouts CSV</p>
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

      <div className="rounded-lg border-2 border-blue-600 p-4 bg-blue-50 dark:bg-transparent">
        <h3 className="text-sm font-semibold mb-2 text-blue-700 dark:text-blue-400">Ready to import</h3>
        <p className="text-xs mb-3 text-blue-700/80 dark:text-blue-300">Click the button below to process selected CSVs into daily snapshots.</p>
        <button onClick={submit} disabled={isSubmitting} className="w-full px-4 py-3 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
          {isSubmitting ? 'Importing…' : 'Import Garmin CSV'}
        </button>
      </div>

      {result && (
        <div className="border rounded p-3 dark:border-gray-700 dark:bg-black">
          <div className="text-sm dark:text-gray-200">Days processed: {result.daysProcessed}</div>
          {result.dates.length > 0 && (
            <div className="text-xs mt-1 dark:text-gray-300">Example dates: {result.dates.join(', ')}</div>
          )}
        </div>
      )}
    </div>
  )
}
