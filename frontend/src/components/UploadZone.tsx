import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiError, segmentImage, type SegmentationResponse } from '../lib/api'
import { fade } from '../lib/motion'

type Status = 'idle' | 'ready' | 'processing' | 'done' | 'error'

/** Shared wrapper so every UploadZone state shares position/sizing and can crossfade smoothly. */
function UploadZoneShell({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={fade}
      initial="hidden"
      animate="visible"
      exit="hidden"
      id="upload"
      className="glass-card mx-auto max-w-2xl rounded-3xl border border-gray-200/80 p-8 shadow-lg shadow-gray-200/50"
    >
      {children}
    </motion.div>
  )
}

function LoadingUploadZone() {
  return (
    <UploadZoneShell>
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        <motion.span
          className="h-8 w-8 rounded-full border-2 border-brand-300 border-t-brand-600"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
          aria-hidden="true"
        />
        <p className="text-sm text-gray-500">Checking your session…</p>
      </div>
    </UploadZoneShell>
  )
}

function GatedUploadZone() {
  return (
    <UploadZoneShell>
      <div className="text-center">
        <span className="mb-3 inline-block text-4xl">🔒</span>
        <h3 className="text-lg font-semibold text-gray-900">Sign in to categorize your nails</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
          Create a free account or log in to upload a photo and get instant nail categorization.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/login"
              className="inline-block rounded-full bg-gradient-to-r from-brand-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 transition-shadow hover:shadow-lg hover:shadow-brand-500/30"
            >
              Log in
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/register"
              className="inline-block rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
            >
              Sign up
            </Link>
          </motion.div>
        </div>
      </div>
    </UploadZoneShell>
  )
}

function nailCountMessage(nailCount: number): string {
  if (nailCount === 0) return 'No nails detected — try a clearer photo.'
  return `${nailCount} ${nailCount === 1 ? 'nail' : 'nails'} detected`
}

function segmentErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return "That doesn't look like a readable image — try a different photo."
      case 413:
        return 'That file is too large — please upload an image under 10MB.'
      case 401:
        return 'Your session has expired — please log in again.'
      default:
        return 'Something went wrong while analyzing your photo. Please try again.'
    }
  }
  return 'Something went wrong while analyzing your photo. Please try again.'
}

function UploadZone() {
  const { user, isLoading, token } = useAuth()
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<SegmentationResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Revoke the previous object URL whenever it's replaced, and on unmount,
  // so blob URLs don't accumulate across uploads.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const handleFile = useCallback((nextFile: File | undefined) => {
    if (!nextFile || !nextFile.type.startsWith('image/')) return
    setPreview(URL.createObjectURL(nextFile))
    setFile(nextFile)
    setResult(null)
    setErrorMessage(null)
    setStatus('ready')
  }, [])

  const handleCategorize = async () => {
    if (!file || !token) return
    setStatus('processing')
    setErrorMessage(null)
    try {
      const response = await segmentImage(token, file)
      setResult(response)
      setStatus('done')
    } catch (error) {
      setErrorMessage(segmentErrorMessage(error))
      setStatus('error')
    }
  }

  const handleReset = () => {
    setPreview(null)
    setFile(null)
    setResult(null)
    setErrorMessage(null)
    setStatus('idle')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isLoading ? (
        <LoadingUploadZone key="loading" />
      ) : !user ? (
        <GatedUploadZone key="gated" />
      ) : (
        <UploadZoneShell key="ready">
          <motion.div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              handleFile(e.dataTransfer.files[0])
            }}
            onClick={() => inputRef.current?.click()}
            animate={isDragging ? { scale: 1.015 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
              isDragging
                ? 'border-brand-400 bg-brand-50'
                : 'border-gray-300 bg-gray-50 hover:border-brand-300 hover:bg-brand-50/40'
            }`}
          >
            <AnimatePresence mode="wait">
              {status === 'done' && result ? (
                <motion.img
                  key="annotated"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  src={result.annotated_image}
                  alt="Nail segmentation result with detected nails outlined"
                  className="max-h-56 rounded-xl object-contain shadow-md"
                />
              ) : preview ? (
                <motion.img
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  src={preview}
                  alt="Uploaded nail preview"
                  className="max-h-56 rounded-xl object-contain shadow-md"
                />
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="mb-3 block text-4xl">📸</span>
                  <p className="font-medium text-gray-700">Drag & drop a photo of your nails</p>
                  <p className="mt-1 text-sm text-gray-500">or click to browse (PNG, JPG)</p>
                </motion.div>
              )}
            </AnimatePresence>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </motion.div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <motion.button
              type="button"
              disabled={status === 'idle' || status === 'processing'}
              onClick={() => void handleCategorize()}
              whileHover={status === 'idle' || status === 'processing' ? undefined : { scale: 1.04 }}
              whileTap={status === 'idle' || status === 'processing' ? undefined : { scale: 0.97 }}
              className="rounded-full bg-gradient-to-r from-brand-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 transition-shadow hover:shadow-lg hover:shadow-brand-500/30 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none"
            >
              {status === 'processing'
                ? 'Analyzing…'
                : status === 'error'
                  ? 'Try again'
                  : 'Categorize my nails'}
            </motion.button>
            <AnimatePresence>
              {preview && (
                <motion.button
                  type="button"
                  onClick={handleReset}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
                >
                  Reset
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {status === 'done' && result && (
              <motion.p
                key="result"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-4 text-center text-sm font-medium text-gray-700"
              >
                {nailCountMessage(result.nail_count)}
              </motion.p>
            )}
            {status === 'error' && errorMessage && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-4 text-center text-sm font-medium text-red-600"
                role="alert"
              >
                {errorMessage}
              </motion.p>
            )}
          </AnimatePresence>
        </UploadZoneShell>
      )}
    </AnimatePresence>
  )
}

export default UploadZone
