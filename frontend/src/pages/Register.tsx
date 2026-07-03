import { motion } from 'framer-motion'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { fadeUp } from '../lib/motion'

const MIN_PASSWORD_LENGTH = 8

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validationError = (): string | null => {
    if (email.trim().length === 0) return 'Please enter your email.'
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    }
    if (password !== confirmPassword) return 'Passwords do not match.'
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationMessage = validationError()
    if (validationMessage) {
      setError(validationMessage)
      return
    }
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)
    try {
      await register(email.trim(), password)
      navigate('/')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('Email already registered.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative overflow-hidden px-6 py-16 md:py-24">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-[-8rem] h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-300/40 to-brand-200/30 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="glass-card mx-auto max-w-md rounded-3xl border border-gray-200/80 p-8 shadow-xl shadow-gray-200/50"
      >
        <h1 className="text-center text-2xl font-bold tracking-tight text-gray-900">Sign up</h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create an account to start categorizing your nails.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="text-sm font-medium text-red-600"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={isSubmitting ? undefined : { scale: 1.02 }}
            whileTap={isSubmitting ? undefined : { scale: 0.98 }}
            className="w-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 transition-shadow hover:shadow-lg hover:shadow-brand-500/30 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none"
          >
            {isSubmitting ? 'Creating account…' : 'Sign up'}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Log in
          </Link>
        </p>
      </motion.div>
    </section>
  )
}

export default Register
