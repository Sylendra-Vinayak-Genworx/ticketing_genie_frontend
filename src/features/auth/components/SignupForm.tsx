import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Zap } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function SignupForm() {
  const navigate = useNavigate()
  const { signup, isLoading } = useAuth()

  const [form, setForm] = useState({
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})

  function validate() {
    const e: Partial<Record<keyof typeof form, string>> = {}
    if (!form.email.trim()) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.full_name.trim()) e.full_name = 'Required'
    if (!form.password) e.password = 'Required'
    else if (form.password.length < 8) e.password = 'Min 8 chars'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const result = await signup({ email: form.email, password: form.password, role: 'user' })
    if ((result as any).payload?.user) {
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } else {
      toast.error((result as any).payload || 'Signup failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 mt-2 text-sm">Join Ticketing Genie today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                className={`input-field ${errors.full_name ? 'input-error' : ''}`}
                placeholder="John Doe"
              />
              {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={`input-field ${errors.email ? 'input-error' : ''}`}
                placeholder="you@company.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={`input-field ${errors.password ? 'input-error' : ''}`}
                placeholder="Min. 8 characters"
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                className={`input-field ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Repeat password"
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-2.5">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-blue-400 hover:text-blue-300 font-medium">
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
