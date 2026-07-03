function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50/60 px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-gray-500 md:flex-row">
        <p className="flex items-center gap-1.5">
          <span aria-hidden="true">💅</span>© {new Date().getFullYear()} NailsSegmentationAI
        </p>
        <p>Built with React, TypeScript &amp; Tailwind</p>
      </div>
    </footer>
  )
}

export default Footer
