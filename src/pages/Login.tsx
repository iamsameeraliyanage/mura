import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useLogin, useMe } from '../api/auth'

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
      ? 'Invalid email or password'
      : login.isError
        ? 'Something went wrong — try again'
        : null

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-semibold tracking-tight">mura</h1>
        <p className="mt-1 text-sm text-ink-soft">Hospital roster</p>

        <form
          onSubmit={onSubmit}
          className="mt-8 rounded-lg border border-grid bg-sheet p-6 shadow-sm"
        >
          <label className="block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-grid bg-paper px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scrub-500"
          />

          <label className="mt-4 block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-grid bg-paper px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scrub-500"
          />

          {errorMessage && (
            <p className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={login.isPending}
            className="mt-6 w-full rounded-md bg-scrub-600 px-4 py-2 text-sm font-semibold text-white hover:bg-scrub-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scrub-500 disabled:opacity-60"
          >
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}
