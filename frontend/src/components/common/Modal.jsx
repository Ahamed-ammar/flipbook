import { useEffect } from 'react'

export default function Modal({ onClose, children, className = '' }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-space-sm sm:p-space-md bg-on-background/25 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className={`relative w-full max-w-4xl bg-surface-container-lowest rounded-xl shadow-[0_20px_60px_-15px_rgba(29,27,24,0.18)] animate-fade-in overflow-hidden ${className}`}>
        {/* Top accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-tertiary-container to-secondary" />
        {children}
      </div>
    </div>
  )
}
