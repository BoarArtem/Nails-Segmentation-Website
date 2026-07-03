import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import type { ReactNode } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import Features from './components/Features'
import Footer from './components/Footer'
import Login from './pages/Login'
import Register from './pages/Register'
import { pageTransition } from './lib/motion'

function Landing() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <Features />
    </main>
  )
}

/** Wraps each routed page so route changes get a subtle fade/slide transition. */
function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Landing />
            </PageTransition>
          }
        />
        <Route
          path="/login"
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          }
        />
        <Route
          path="/register"
          element={
            <PageTransition>
              <Register />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-white text-gray-900">
        <Header />
        <AnimatedRoutes />
        <Footer />
      </div>
    </MotionConfig>
  )
}

export default App
