import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'

// ── Buttons ──

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
}) {
  const styles = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 active:translate-y-px',
    outline:
      'border border-grid bg-surface text-teal-700 hover:bg-teal-50 shadow-(--shadow-xs) disabled:opacity-60',
    ghost: 'border border-grid bg-surface text-ink hover:bg-sunken disabled:opacity-60',
    danger: 'bg-danger-bg text-danger hover:bg-danger hover:text-white',
  }[variant]
  return (
    <button
      className={`h-9 rounded-md px-4 text-[13px] font-semibold transition-colors ${styles} ${className}`}
      {...props}
    />
  )
}

// ── Form bits ──

export function MiniLabel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`mr-label text-ink-2 ${className}`}>{children}</div>
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-9 w-full rounded border border-grid-strong bg-surface px-3 text-sm text-ink outline-none focus:border-teal-600 focus:shadow-[0_0_0_2px_var(--color-teal-50)] ${props.className ?? ''}`}
    />
  )
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-9 w-full rounded border border-grid-strong bg-surface px-2 text-sm text-ink outline-none focus:border-teal-600 ${props.className ?? ''}`}
    />
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <MiniLabel className="mb-1.5">{label}</MiniLabel>
      {children}
    </label>
  )
}

// ── Cards / badges ──

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-grid bg-surface shadow-(--shadow-xs) ${className}`}>
      {children}
    </div>
  )
}

export function StatusBadge({ status, version }: { status: string; version?: number }) {
  const published = status === 'PUBLISHED'
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 rounded px-2 text-[10.5px] font-semibold tracking-[0.04em] ${
        published ? 'bg-published-bg text-published' : 'bg-draft-bg text-draft'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${published ? 'bg-published' : 'bg-draft'}`} />
      {status}
      {version ? ` · v${version}` : ''}
    </span>
  )
}

/** Person chip in their pen color — the product's signature element. */
export function PenChip({
  colorKey,
  code,
  size = 'md',
  className = '',
  title,
}: {
  colorKey: string
  code: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  title?: string
}) {
  const sizes = {
    sm: 'min-w-[26px] h-[22px] px-1.5 text-xs',
    md: 'min-w-[32px] h-7 px-2 text-sm',
    lg: 'min-w-9 h-[30px] px-2.5 text-[15px]',
  }[size]
  return (
    <span
      title={title}
      className={`inline-flex items-center justify-center rounded-md leading-none font-semibold ${sizes} ${className}`}
      style={{
        color: `var(--color-${colorKey})`,
        backgroundColor: `var(--color-${colorKey}-bg)`,
      }}
    >
      {code}
    </span>
  )
}

export function PenDot({ colorKey, className = '' }: { colorKey: string; className?: string }) {
  return (
    <span
      className={`inline-block h-[9px] w-[9px] shrink-0 rounded-full ${className}`}
      style={{ backgroundColor: `var(--color-${colorKey}-dot)` }}
    />
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

// ── Modal (scrim + centered card, Fraunces title) ──

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'w-[400px]',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: string
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
        if (e.target === ref.current) onClose()
      }}
      className={`m-auto max-w-[calc(100vw-32px)] rounded-lg border border-grid bg-surface p-0 shadow-(--shadow-lift) backdrop:bg-[rgba(27,39,51,0.18)] ${width}`}
    >
      <div className="p-5">
        <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </dialog>
  )
}

// ── Toast (dark pill, bottom center) ──

const ToastContext = createContext<(text: string) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const show = useCallback((text: string) => {
    clearTimeout(timer.current)
    setToast(text)
    timer.current = setTimeout(() => setToast(null), 3200)
  }, [])
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div
          role="status"
          className="mr-toast fixed bottom-[26px] left-1/2 z-70 max-w-[calc(100vw-32px)] -translate-x-1/2 truncate rounded-md bg-ink px-4 py-2.5 text-[13px] font-medium whitespace-nowrap text-white shadow-(--shadow-lift) print:hidden"
        >
          {toast}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
