// Client-side calendar helpers (mirror server/services/dates.ts semantics).

export const todayMonth = (): string => new Date().toISOString().slice(0, 7)

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number)
  const total = y * 12 + (m - 1) + n
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function daysInMonth(month: string): string[] {
  const [y, m] = month.split('-').map(Number)
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)
}

/** 0 = Sunday … 6 = Saturday */
export const dayOfWeek = (date: string): number => new Date(`${date}T00:00:00Z`).getUTCDay()

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Calendar rows for a Mon-first month grid: (string | null)[][] */
export function monthGridRows(month: string): (string | null)[][] {
  const days = daysInMonth(month)
  const lead = (dayOfWeek(days[0]) + 6) % 7 // Mon=0 … Sun=6
  const cells: (string | null)[] = [...Array(lead).fill(null), ...days]
  while (cells.length % 7 !== 0) cells.push(null)
  const rows: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
  return rows
}
