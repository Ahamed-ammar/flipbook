import { useState } from 'react'

// Generates a deterministic color from title string
function titleToColor(title = '') {
  const colors = [
    { bg: '#3A1412', text: '#D8B48D' },
    { bg: '#354840', text: '#B1CDC0' },
    { bg: '#4A3D36', text: '#FFDCBD' },
    { bg: '#1E382B', text: '#B1CDC0' },
    { bg: '#F8F5EE', text: '#994522' },
    { bg: '#2C2442', text: '#FFDCBD' },
    { bg: '#1C2B3A', text: '#B1CDC0' },
  ]
  let hash = 0
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function BookCover({ book, className = '', size = 'md' }) {
  const [imgError, setImgError] = useState(false)
  const color = titleToColor(book?.title)

  const sizeClasses = {
    sm: 'w-20 aspect-[2/3]',
    md: 'w-full aspect-[2/3]',
    lg: 'w-36 sm:w-44 aspect-[2/3]',
  }

  if (book?.coverUrl && !imgError) {
    return (
      <div className={`relative overflow-hidden rounded-lg ${sizeClasses[size]} ${className}`}>
        <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 via-black/10 to-transparent z-20 pointer-events-none" />
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    )
  }

  // Generated cover
  return (
    <div
      className={`relative overflow-hidden rounded-lg ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: color.bg }}
    >
      <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/50 via-white/10 to-transparent z-20" />
      <div className="absolute inset-0 p-3 flex flex-col justify-between text-center z-10">
        <div className="text-[9px] tracking-widest uppercase" style={{ color: color.text, opacity: 0.7 }}>
          {book?.author?.split(' ').pop() || ''}
        </div>
        <div className="my-auto space-y-1">
          <span
            className="font-headline-sm text-headline-sm font-serif leading-tight block"
            style={{ color: color.text }}
          >
            {book?.title?.toUpperCase() || 'UNTITLED'}
          </span>
          <div className="w-6 h-px mx-auto my-1.5" style={{ backgroundColor: color.text, opacity: 0.4 }} />
          <span className="text-[10px] block" style={{ color: color.text, opacity: 0.8 }}>
            {book?.author || 'Unknown'}
          </span>
        </div>
        <div className="text-[8px] tracking-widest uppercase font-mono" style={{ color: color.text, opacity: 0.6 }}>
          {book?.totalPages ? `${book.totalPages} pp` : ''}
        </div>
      </div>
    </div>
  )
}

export default BookCover
