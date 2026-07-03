import { motion } from 'framer-motion'
import { fadeUp, staggerContainer } from '../lib/motion'

type Feature = {
  icon: string
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: '✂️',
    title: 'Precise segmentation',
    description: 'Our model isolates each nail from your photo for accurate analysis.',
  },
  {
    icon: '🏷️',
    title: 'Instance detection',
    description: 'Every nail is detected and outlined on its own, even side by side.',
  },
  {
    icon: '⚡',
    title: 'Fast results',
    description: 'Get an annotated photo and nail count in seconds, right in your browser.',
  },
]

function Features() {
  return (
    <section id="features" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center text-3xl font-bold tracking-tight text-gray-900 md:text-4xl"
        >
          Why NailsSegmentationAI
        </motion.h2>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mt-14 grid gap-8 md:grid-cols-3"
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm shadow-gray-200/60 transition-shadow hover:shadow-xl hover:shadow-brand-500/10"
            >
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-violet-50 text-3xl">
                {feature.icon}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Features
