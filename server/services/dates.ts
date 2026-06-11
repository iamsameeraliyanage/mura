// Pure calendar helpers. All dates are "YYYY-MM-DD" strings in the roster's
// local calendar (Asia/Colombo) — conversion to real UTC instants happens at
// the DB boundary, never in here.

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

/** Sat+Sun pairs fully inside the month (a Sat whose Sun spills into the next
 *  month is covered as a normal day, not a weekend block). */
export function weekendPairs(month: string): { sat: string; sun: string }[] {
  return daysInMonth(month)
    .filter((d) => dayOfWeek(d) === 6)
    .map((sat) => ({ sat, sun: addDays(sat, 1) }))
    .filter((w) => w.sun.startsWith(month))
}

export function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}
