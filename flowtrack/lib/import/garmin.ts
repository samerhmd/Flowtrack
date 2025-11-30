export interface GarminDailySnapshot {
  date: string
  sleep_duration_min?: number | null
  sleep_score?: number | null
  hrv_ms?: number | null
  resting_hr_bpm?: number | null
  training_minutes?: number | null
}

export interface GarminImportFiles {
  sleepCsv?: string
  hrvCsv?: string
  heartRateCsv?: string
  activitiesCsv?: string
}

function normalizeGarminDate(raw: string | null | undefined): string | null {
  if (!raw) return null
  const s = raw.trim()
  if (!s) return null
  const yearMatch = s.match(/(\d{4})/)
  if (!yearMatch) {
    console.warn('normalizeGarminDate: no 4-digit year in', s)
    return null
  }
  const year = parseInt(yearMatch[1], 10)
  if (!Number.isFinite(year) || year < 2010 || year > 2100) {
    console.warn('normalizeGarminDate: suspicious year', year, 'from', s)
    return null
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s)
    if (Number.isNaN(d.getTime())) {
      console.warn('normalizeGarminDate: invalid ISO date', s)
      return null
    }
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [p1, p2, p3] = s.split('/')
    const d1 = parseInt(p1, 10)
    const d2 = parseInt(p2, 10)
    const y = parseInt(p3, 10)
    let day: number
    let month: number
    if (d1 > 12) { day = d1; month = d2 } else { month = d1; day = d2 }
    const d = new Date(y, month - 1, day)
    if (Number.isNaN(d.getTime())) {
      console.warn('normalizeGarminDate: invalid dd/mm/yyyy date', s)
      return null
    }
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(s)) {
    const [yStr, mStr, dStr] = s.split('/')
    const y = parseInt(yStr, 10)
    const m = parseInt(mStr, 10)
    const dn = parseInt(dStr, 10)
    const d = new Date(y, m - 1, dn)
    if (Number.isNaN(d.getTime())) {
      console.warn('normalizeGarminDate: invalid yyyy/mm/dd date', s)
      return null
    }
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }
  console.warn('normalizeGarminDate: unsupported date format', s)
  return null
}

export function parseSimpleCsv(csvText: string): Array<Record<string, string>> {
  const lines = csvText.split(/\r?\n/).filter(l => l.length > 0)
  if (lines.length === 0) return []
  const splitCsvLine = (line: string): string[] => {
    const result: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { // escaped quote
          cur += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(cur.trim())
        cur = ''
      } else {
        cur += ch
      }
    }
    result.push(cur.trim())
    return result
  }
  const headers = splitCsvLine(lines[0]).map(h => h.toLowerCase().trim())
  const rows: Array<Record<string, string>> = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (cells[j] ?? '').trim()
    }
    rows.push(row)
  }
  return rows
}

function findKey(keys: string[], includes: string[]): string | null {
  const lc = keys.map(k => k.toLowerCase())
  for (const k of lc) {
    let ok = true
    for (const inc of includes) {
      if (!k.includes(inc)) ok = false
    }
    if (ok) return keys[lc.indexOf(k)]
  }
  return null
}

function selectDateKey(row: Record<string, string>): string | null {
  const keys = Object.keys(row)
  const lcKeys = keys.map(k => k.toLowerCase())
  // Prefer 'calendar date'
  const calIdx = lcKeys.findIndex(k => k.includes('calendar') && k.includes('date'))
  if (calIdx >= 0) return keys[calIdx]
  // Otherwise any '*date*' with a 4-digit year in the value
  const candidates = lcKeys.map((k, i) => ({ k, i, v: row[keys[i]] || '' }))
  const withYear = candidates.find(c => /\b\d{4}\b/.test(c.v))
  if (withYear) return keys[withYear.i]
  // Otherwise ISO-looking value (contains 'T')
  const withIso = candidates.find(c => c.v.includes('T'))
  if (withIso) return keys[withIso.i]
  // Otherwise any key containing 'date'
  const anyDate = lcKeys.findIndex(k => k.includes('date'))
  if (anyDate >= 0) return keys[anyDate]
  return null
}

export function parseGarminSleep(csvText: string): Map<string, Partial<GarminDailySnapshot>> {
  const map = new Map<string, Partial<GarminDailySnapshot>>()
  const rows = parseSimpleCsv(csvText)
  const parseDurationToMinutes = (raw: string | undefined): number | null => {
    const val = (raw ?? '').trim()
    if (!val) return null
    if (/^\d+(\.\d+)?$/.test(val)) {
      const secs = Number(val)
      if (!Number.isFinite(secs)) return null
      return Math.round(secs / 60)
    }
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(val)) {
      const parts = val.split(':').map(Number)
      const sec = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1]
      return Math.round(sec / 60)
    }
    const hoursMatch = val.match(/(\d+(?:\.\d+)?)\s*h/i)
    if (hoursMatch) {
      const h = Number(hoursMatch[1])
      if (Number.isFinite(h)) return Math.round(h * 60)
    }
    const minutesMatch = val.match(/(\d+(?:\.\d+)?)\s*min/i)
    if (minutesMatch) {
      const m = Number(minutesMatch[1])
      if (Number.isFinite(m)) return Math.round(m)
    }
    return null
  }
  for (const r of rows) {
    const dateKey = selectDateKey(r)
    if (!dateKey) continue
    const iso = normalizeGarminDateWithRow(r[dateKey], r)
    if (!iso) continue
    const keys = Object.keys(r)
    const lkeys = keys.map(k => k.toLowerCase())
    const durationCandidates = [
      'sleep duration',
      'total sleep time',
      'time asleep',
      'duration',
      'asleep time',
      'minutes asleep',
      'hours asleep',
    ]
    let durKey: string | undefined
    for (const cand of durationCandidates) {
      const idx = lkeys.findIndex(k => k.includes(cand))
      if (idx >= 0) { durKey = keys[idx]; break }
    }
    if (!durKey) {
      const hasSleepKey = lkeys.some(k => k.includes('sleep'))
      const idx2 = hasSleepKey ? lkeys.findIndex(k => k.includes('duration') || k.includes('minutes')) : -1
      if (idx2 >= 0) durKey = keys[idx2]
    }
    const sleepMin = parseDurationToMinutes(durKey ? r[durKey] : undefined)
    const scoreKey = keys.find(k => k.includes('sleep') && k.includes('score')) ?? keys.find(k => k.includes('score'))
    const scoreVal = scoreKey ? Number(r[scoreKey]) : NaN
    const sleepScore = isNaN(scoreVal) ? null : scoreVal
    const cur = map.get(iso) || {}
    map.set(iso, { ...cur, sleep_duration_min: sleepMin, sleep_score: sleepScore })
  }
  return map
}

export function parseGarminHrv(csvText: string): Map<string, Partial<GarminDailySnapshot>> {
  const map = new Map<string, Partial<GarminDailySnapshot>>()
  const rows = parseSimpleCsv(csvText)
  for (const r of rows) {
    const dateKey = selectDateKey(r)
    if (!dateKey) continue
    const iso = normalizeGarminDateWithRow(r[dateKey], r)
    if (!iso) continue
    const keys = Object.keys(r)
    const hrvKey = keys.find(k => k.includes('hrv') && (k.includes('avg') || k.includes('average') || k.includes('last')))
    const val = hrvKey ? Number(r[hrvKey]) : NaN
    const hrv = isNaN(val) ? null : val
    const cur = map.get(iso) || {}
    map.set(iso, { ...cur, hrv_ms: hrv })
  }
  return map
}

export function parseGarminHeartRate(csvText: string): Map<string, Partial<GarminDailySnapshot>> {
  const map = new Map<string, Partial<GarminDailySnapshot>>()
  const rows = parseSimpleCsv(csvText)
  for (const r of rows) {
    const dateKey = selectDateKey(r)
    if (!dateKey) continue
    const iso = normalizeGarminDateWithRow(r[dateKey], r)
    if (!iso) continue
    const keys = Object.keys(r)
    const restKey = keys.find(k => k.includes('resting'))
    const val = restKey ? Number(r[restKey]) : NaN
    const resting = isNaN(val) ? null : val
    const cur = map.get(iso) || {}
    map.set(iso, { ...cur, resting_hr_bpm: resting })
  }
  return map
}

export function parseGarminActivities(csvText: string): Map<string, Partial<GarminDailySnapshot>> {
  const map = new Map<string, Partial<GarminDailySnapshot>>()
  const rows = parseSimpleCsv(csvText)
  for (const r of rows) {
    const keys = Object.keys(r)
    const lc = keys.map(k => k.toLowerCase())
    const startIdx = lc.findIndex(k => k.includes('start') && (k.includes('date') || k.includes('time')))
    const startKey = startIdx >= 0 ? keys[startIdx] : selectDateKey(r)
    if (!startKey) continue
    const iso = normalizeGarminDateWithRow(r[startKey], r)
    if (!iso) continue
    const durKey = keys.find(k => k.includes('duration'))
    const raw = durKey ? r[durKey] : ''
    let minutes = 0
    if (raw) {
      if (/^\d+(\.\d+)?$/.test(raw)) {
        minutes = Number(raw) / 60
      } else if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(raw)) {
        const parts = raw.split(':').map(Number)
        const sec = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1]
        minutes = sec / 60
      }
    }
    const prev = map.get(iso) || {}
    const total = (prev.training_minutes ?? 0) + minutes
    map.set(iso, { ...prev, training_minutes: total })
  }
  return map
}

export function mergeGarminSnapshots(parts: Array<Map<string, Partial<GarminDailySnapshot>>>): Map<string, GarminDailySnapshot> {
  const merged = new Map<string, GarminDailySnapshot>()
  for (const part of parts) {
    for (const [date, snap] of part.entries()) {
      const cur = merged.get(date) || { date }
      const next: GarminDailySnapshot = {
        date,
        sleep_duration_min: cur.sleep_duration_min ?? snap.sleep_duration_min ?? null,
        sleep_score: cur.sleep_score ?? snap.sleep_score ?? null,
        hrv_ms: cur.hrv_ms ?? snap.hrv_ms ?? null,
        resting_hr_bpm: cur.resting_hr_bpm ?? snap.resting_hr_bpm ?? null,
        training_minutes: cur.training_minutes ?? snap.training_minutes ?? null,
      }
      merged.set(date, next)
    }
  }
  return merged
}

export function buildGarminDailySnapshots(files: GarminImportFiles): GarminDailySnapshot[] {
  const parts: Array<Map<string, Partial<GarminDailySnapshot>>> = []
  if (files.sleepCsv) parts.push(parseGarminSleep(files.sleepCsv))
  if (files.hrvCsv) parts.push(parseGarminHrv(files.hrvCsv))
  if (files.heartRateCsv) parts.push(parseGarminHeartRate(files.heartRateCsv))
  if (files.activitiesCsv) parts.push(parseGarminActivities(files.activitiesCsv))
  const merged = mergeGarminSnapshots(parts)
  const rows = Array.from(merged.values())
  rows.sort((a, b) => a.date.localeCompare(b.date))
  return rows
}
function normalizeGarminDateWithRow(raw: string | null | undefined, row: Record<string, string>): string | null {
  let iso = normalizeGarminDate(raw)
  if (iso) return iso
  const s = (raw ?? '').trim()
  if (/^\d{1,2}[-\/]\d{1,2}$/.test(s)) {
    const yearKey = Object.keys(row).find(k => k.toLowerCase().includes('year'))
    const yraw = yearKey ? row[yearKey] : undefined
    const y = yraw ? parseInt(yraw, 10) : NaN
    if (Number.isFinite(y)) {
      const parts = s.split(/[-\/]/)
      const p1 = parseInt(parts[0], 10)
      const p2 = parseInt(parts[1], 10)
      let day: number
      let month: number
      if (p1 > 12) { day = p1; month = p2 } else { month = p1; day = p2 }
      const d = new Date(y, month - 1, day)
      if (!Number.isNaN(d.getTime())) {
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd}`
      }
    }
  }
  return null
}
