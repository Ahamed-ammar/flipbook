import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService.js'
import { useAuthStore } from '../store/authStore.js'

export default function Register() {
  const navigate    = useNavigate()
  const { setAuth } = useAuthStore()

  const [form, setForm]     = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { setError('Please fill in all fields.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      const data = await authService.register(form.name, form.email, form.password)
      setAuth(data.user, data.token)
      navigate('/home')
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[var(--color-primary)]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-[var(--color-surface-container-lowest)] rounded-xl shadow-[0_20px_60px_-15px_rgba(29,27,24,0.15)] overflow-hidden fade-in">
        <div className="h-1.5 w-full bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-tertiary-container)] to-[var(--color-secondary)]" />

        <div className="px-8 pt-8 pb-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontSize: 36, fontVariationSettings: "'FILL' 1" }}>
              auto_stories
            </span>
            <span className="text-headline-lg text-[var(--color-on-surface)] tracking-tight">Folio</span>
          </div>

          <h1 className="text-headline-md text-[var(--color-on-surface)] text-center mb-1">Create your library</h1>
          <p className="text-ui-body-sm text-[var(--color-on-surface-variant)] text-center mb-6">
            Your personal archival reading sanctuary awaits
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {[
              { id: 'name',     type: 'text',     label: 'Full Name',       placeholder: 'Your name',         auto: 'name' },
              { id: 'email',    type: 'email',    label: 'Email',           placeholder: 'you@example.com',   auto: 'email' },
              { id: 'password', type: 'password', label: 'Password',        placeholder: '8+ characters',     auto: 'new-password' },
              { id: 'confirm',  type: 'password', label: 'Confirm Password',placeholder: 'Repeat password',   auto: 'new-password' },
            ].map(({ id, type, label, placeholder, auto }) => (
              <div key={id}>
                <label htmlFor={id} className="block text-label-sm text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5">
                  {label}
                </label>
                <input
                  id={id}
                  name={id}
                  type={type}
                  autoComplete={auto}
                  value={form[id]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className="w-full bg-[var(--color-surface-container-low)] text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] px-4 py-3 rounded-lg text-ui-body-md outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                />
              </div>
            ))}

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
                  Creating account…
                </>
              ) : (
                'Create Folio Account'
              )}
            </button>
          </form>

          <p className="text-center text-ui-body-sm text-[var(--color-on-surface-variant)] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--color-primary)] hover:text-[var(--color-primary-container)] font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
