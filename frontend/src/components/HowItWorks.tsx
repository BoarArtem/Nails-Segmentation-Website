import { motion } from 'framer-motion'
import { fadeUp, staggerContainer } from '../lib/motion'

type Step = {
  number: string
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    number: '1',
    title: 'Upload a photo',
    description: 'Take or upload a clear photo of your hand or nails.',
  },
  {
    number: '2',
    title: 'AI segmentation',
    description: 'Our model detects and isolates each individual nail.',
  },
  {
    number: '3',
    title: 'See the results',
    description: 'Get an annotated photo and a count of every nail detected.',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-gray-50 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center text-3xl font-bold tracking-tight text-gray-900 md:text-4xl"
        >
          How it works
        </motion.h2>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8"
        >
          {STEPS.map((step) => (
            <motion.div
              key={step.number}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-lg font-bold text-white shadow-md shadow-brand-500/25">
                {step.number}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default HowItWorks
