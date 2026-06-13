// Lucide-style line icons (1.8px stroke, round caps) — paths from the
// MediRoster design system's nav spec.
export const ICON_PATHS = {
  dashboard: 'M3 3h7v9H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 16h7v5H3z',
  consultant: 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M3 9.5h18 M8 2v4 M16 2v4',
  sho: 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M3 9.5h18 M8 2v4 M16 2v4 M8 14h.01 M12 14h.01 M16 14h.01 M8 17.5h.01 M12 17.5h.01',
  fairness: 'M18 20V10 M12 20V4 M6 20v-6 M3 20h18',
  staff: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1 M17.5 3.3a4 4 0 0 1 0 7.4 M22 21v-1a6 6 0 0 0-4-5.6',
  unavail: 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M3 9.5h18 M8 2v4 M16 2v4 M10 13.5l4 4 M14 13.5l-4 4',
  audit: 'M3 12a9 9 0 1 0 2.8-6.5L3 8 M3 3v5h5 M12 7v5l3.5 2',
  share: 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7 M12 3v13 M8 7l4-4 4 4',
  lock: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
} as const

export function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  )
}

/** Brand mark: ruled-calendar glyph in scrub teal with two pen strokes. */
export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-teal-600)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 9.5h18" />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M7.5 13.5h5.5" stroke="var(--color-pen-red-dot)" />
      <path d="M7.5 17h8" stroke="var(--color-pen-blue-dot)" />
    </svg>
  )
}

export function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm5 13.9c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1a13 13 0 0 1-5.7-5 6.6 6.6 0 0 1-1.3-3.4c0-1 .5-1.5.9-1.9.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6-.3.4c-.1.2-.2.3-.1.5.5.9 1.2 1.7 2 2.4.6.5 1.3.9 2 1.2.2.1.4.1.5-.1l.7-.9c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.4 0 .1 0 .6-.2 1.1z" />
    </svg>
  )
}
