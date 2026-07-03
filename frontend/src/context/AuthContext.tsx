import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchCurrentUser, loginUser, registerUser, type AuthUser } from '../lib/api'

const TOKEN_STORAGE_KEY = 'nails_auth_token'

export interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() =>
    window.localStorage.getItem(TOKEN_STORAGE_KEY),
  )
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let isCancelled = false

    async function hydrateUser(currentToken: string) {
      try {
        const currentUser = await fetchCurrentUser(currentToken)
        if (!isCancelled) {
          setUser(currentUser)
        }
      } catch {
        if (!isCancelled) {
          window.localStorage.removeItem(TOKEN_STORAGE_KEY)
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    if (token) {
      void hydrateUser(token)
    } else {
      setIsLoading(false)
    }

    return () => {
      isCancelled = true
    }
    // Only re-run when the token identity changes (e.g. login/logout).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const login = useCallback(async (email: string, password: string) => {
    const { access_token: accessToken } = await loginUser(email, password)
    const currentUser = await fetchCurrentUser(accessToken)
    window.localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
    setToken(accessToken)
    setUser(currentUser)
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    await registerUser(email, password)
    await login(email, password)
  }, [login])

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, login, register, logout }),
    [user, token, isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
