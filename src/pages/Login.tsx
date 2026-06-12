import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useLogin, useMe } from '../api/auth'
import { LogoMark } from '../components/icons'

export default function Login() {
  const { data: me, isLoading } = useMe()
  const login = useLogin()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (!isLoading && me) return <Navigate to="/" replace />

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    login.mutate({ email, password }, { onSuccess: () => navigate('/', { replace: true }) })
  }

  const errorMessage =
    login.isError && isAxiosError(login.error) && login.error.response?.status === 401
      ? 'That email and password do not match.'
      : login.isError
        ? 'Something went wrong — try again.'
        : null

  return (
    <main
      className="flex min-h-dvh items-center justify-center px-4"
      style={{
        backgroundImage:
          'linear-gradient(var(--color-grid) 1px, transparent 1px), linear-gradient(90deg, var(--color-grid) 1px, transparent 1px)',
        backgroundSize: '96px 96px',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-[380px]">
        <div className="mb-[22px] flex flex-col items-center">
          <LogoMark size={40} />
          <h1 className="mt-2.5 font-display text-[30px] font-semibold tracking-tight">
            MediRoster
          </h1>
          <p className="mt-1 text-[13px] text-ink-2">
            Duty rosters for Lady Ridgeway Hospital · Paediatrics
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-lg border border-grid bg-surface p-[26px] shadow-(--shadow-sm)"
        >
          <label className="mr-label block text-ink-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="name@health.gov.lk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 h-10 w-full rounded border border-grid-strong bg-surface px-3 text-sm text-ink outline-none focus:border-teal-600 focus:shadow-[0_0_0_2px_var(--color-teal-50)]"
          />

          <label className="mr-label mt-4 block text-ink-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 h-10 w-full rounded border border-grid-strong bg-surface px-3 text-sm text-ink outline-none focus:border-teal-600 focus:shadow-[0_0_0_2px_var(--color-teal-50)]"
          />

          {errorMessage && (
            <p className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-[12.5px] text-danger">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={login.isPending}
            className="mt-[18px] h-10 w-full rounded-md bg-teal-600 text-sm font-semibold text-white transition-colors hover:bg-teal-700 active:translate-y-px disabled:opacity-60"
          >
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="mt-3.5 text-center text-xs leading-normal text-ink-2">
            Account created by your department admin.
            <br />
            No self-signup.
          </p>
        </form>
      </div>
    </main>
  )
}
