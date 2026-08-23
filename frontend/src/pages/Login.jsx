import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService.js'
import { useAuthStore } from '../store/authStore.js'

export default function Login() {
  const navigate  = useNavigate()
  const { setAuth } = useAuthStore()

  const [form, setForm]     = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }

    setLoading(true)
    try {
      const data = await authService.login(form.email, form.password)
      setAuth(data.token, data.user)
      navigate('/home')
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-primary)]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--color-secondary)]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-[var(--color-surface-container-lowest)] rounded-xl shadow-[0_20px_60px_-15px_rgba(29,27,24,0.15)] overflow-hidden fade-in">
        {/* Accent ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-tertiary-container)] to-[var(--color-secondary)]" />

        <div className="px-8 pt-8 pb-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontSize: 36, fontVariationSettings: "'FILL' 1" }}>
              auto_stories
            </span>
            <span className="text-headline-lg text-[var(--color-on-surface)] tracking-tight">Folio</span>
          </div>

          <h1 className="text-headline-md text-[var(--color-on-surface)] text-center mb-1">Welcome back</h1>
          <p className="text-ui-body-sm text-[var(--color-on-surface-variant)] text-center mb-6">
            Sign in to your personal reading sanctuary
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-label-sm text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full bg-[var(--color-surface-container-low)] text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] px-4 py-3 rounded-lg text-ui-body-md outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-label-sm text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-[var(--color-surface-container-low)] text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] px-4 py-3 rounded-lg text-ui-body-md outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[var(--color-error)] text-label-md bg-[var(--color-error-container)] px-3 py-2 rounded-lg">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-[var(--color-on-primary)] rounded-lg text-label-md font-semibold shadow-md transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>autorenew</span>
                  Signing in…
                </>
              ) : (
                'Sign in to Folio'
              )}
            </button>
          </form>

          <p className="text-center text-ui-body-sm text-[var(--color-on-surface-variant)] mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[var(--color-primary)] hover:text-[var(--color-primary-container)] font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
