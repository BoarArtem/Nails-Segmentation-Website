import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Header() {
  const { user, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/70 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 text-base font-semibold tracking-tight text-gray-900 sm:text-lg"
        >
          <span className="text-xl">💅</span>
          <span className="hidden sm:inline">
            Nails<span className="text-gradient-brand">Segmentation</span>AI
          </span>
          <span className="sm:hidden">
            Nails<span className="text-gradient-brand">AI</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
          <a href="/#how-it-works" className="transition-colors hover:text-brand-600">
            How it works
          </a>
          <a href="/#features" className="transition-colors hover:text-brand-600">
            Features
          </a>
          <a href="/#upload" className="transition-colors hover:text-brand-600">
            Try it
          </a>
        </nav>

        {isLoading ? (
          <div className="h-9 w-20 shrink-0" aria-hidden="true" />
        ) : user ? (
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <span className="hidden text-sm text-gray-600 sm:inline">{user.email}</span>
            <motion.button
              type="button"
              onClick={handleLogout}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-full border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 sm:px-5 sm:py-2 sm:text-sm"
            >
              Log out
            </motion.button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="text-xs font-semibold text-gray-700 transition-colors hover:text-brand-600 sm:text-sm"
            >
              Log in
            </Link>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/register"
                className="inline-block rounded-full bg-gradient-to-r from-brand-500 to-violet-500 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-md shadow-brand-500/20 transition-shadow hover:shadow-lg hover:shadow-brand-500/30 sm:px-5 sm:py-2 sm:text-sm"
              >
                Sign up
              </Link>
            </motion.div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
