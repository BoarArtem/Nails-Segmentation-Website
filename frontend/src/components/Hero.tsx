import { motion } from 'framer-motion'
import { fadeUp, staggerContainer } from '../lib/motion'
import UploadZone from './UploadZone'

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-16 md:pt-28">
      {/* Soft blurred gradient blobs behind the hero content */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-[-12rem] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-300/40 via-brand-200/30 to-transparent blur-3xl" />
        <div className="absolute -left-24 top-32 h-80 w-80 rounded-full bg-violet-300/30 blur-3xl" />
        <div className="absolute -right-24 top-16 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white" />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-3xl text-center"
      >
        <motion.span
          variants={fadeUp}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600 shadow-sm backdrop-blur"
        >
          Powered by AI segmentation
        </motion.span>
        <motion.h1
          variants={fadeUp}
          className="text-4xl font-bold tracking-tight text-balance text-gray-900 md:text-6xl"
        >
          Detect and{' '}
          <span className="text-gradient-brand">segment every nail</span> — instantly.
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-gray-600"
        >
          Upload a photo and our AI locates and outlines each individual nail in seconds.
        </motion.p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="mt-12"
      >
        <UploadZone />
      </motion.div>
    </section>
  )
}

export default Hero
