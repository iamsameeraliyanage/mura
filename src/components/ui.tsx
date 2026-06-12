import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  useEffect,
  useRef,
} from 'react'

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scrub-500'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-scrub-600 text-white hover:bg-scrub-700 disabled:opacity-60',
    ghost: 'text-ink-soft hover:bg-paper hover:text-ink border border-grid',
    danger: 'bg-danger-bg text-danger hover:bg-danger hover:text-white',
  }[variant]
  return (
    <button
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${styles} ${focusRing} ${className}`}
      {...props}
    />
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-grid bg-paper px-3 py-2 text-sm ${focusRing} ${props.className ?? ''}`}
    />
  )
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-grid bg-paper px-3 py-2 text-sm ${focusRing} ${props.className ?? ''}`}
    />
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose() // backdrop click
      }}
      className="m-auto w-full max-w-md rounded-lg border border-grid bg-sheet p-0 shadow-lg backdrop:bg-ink/30"
    >
      <div className="p-5">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  )
}

/** Person chip in their pen color — the app's visual identity. */
export function PenChip({ colorKey, code }: { colorKey: string; code: string }) {
  return (
    <span
      className="rounded-md px-2 py-0.5 text-sm font-semibold"
      style={{
        color: `var(--color-${colorKey})`,
        backgroundColor: `var(--color-${colorKey}-bg)`,
      }}
    >
      {code}
    </span>
  )
}

export const PEN_KEYS = [
  'pen-black',
  'pen-violet',
  'pen-green',
  'pen-red',
  'pen-blue',
  'pen-teal',
  'pen-orange',
  'pen-pink',
] as const
