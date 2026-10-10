import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import BookCover from './BookCover'
import { useDeleteBook } from '../../hooks/useBooks'

function ProgressBadge({ progress }) {
  if (!progress) return <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm shadow-md">Unread</span>
  if (progress.percentage >= 100) return <span className="px-2 py-0.5 rounded bg-secondary text-on-secondary font-label-sm text-label-sm shadow-md">Completed</span>
  return <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm shadow-md">Reading · {Math.round(progress.percentage)}%</span>
}

export function BookCard({ book, onDelete }) {
  const navigate = useNavigate()
  const deleteBook = useDeleteBook()
  const [showMenu, setShowMenu] = useState(false)
  const progress = book.progress

  const openReader = () => navigate(`/reader/${book.id}`)

  const handleDelete = (e) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(book.id)
    } else if (window.confirm(`Remove "${book.title}" from your library?`)) {
      deleteBook.mutate(book.id)
    }
    setShowMenu(false)
  }

  return (
    <article className="group relative flex flex-col bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-xl transition-all duration-300">
      {/* Cover */}
      <div
        className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-surface-container-high shadow-md group-hover:-translate-y-1.5 transition-transform duration-300 cursor-pointer"
        onClick={openReader}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && openReader()}
        aria-label={`Open ${book.title}`}
      >
        <BookCover book={book} />

        {/* Progress badge */}
        <div className="absolute top-2.5 right-2.5 z-20">
          <ProgressBadge progress={progress} />
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-inverse-surface/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 flex flex-col items-center justify-center gap-2.5 p-4 text-center">
          <button
            onClick={openReader}
            className="w-full py-2 px-3 rounded-lg bg-primary-container hover:bg-primary text-on-primary-container font-label-md text-label-md shadow-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">menu_book</span>
            <span>{progress ? 'Continue Reading' : 'Open Reader'}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/annotations?book=${book.id}`) }}
            className="w-full py-2 px-3 rounded-lg bg-surface-container-lowest/90 hover:bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow flex items-center justify-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">rate_review</span>
            <span>{book.annotationCount ? `${book.annotationCount} Notes` : 'Annotations'}</span>
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-col gap-1.5 mt-space-sm">
        <div className="flex items-baseline justify-between gap-1">
          <h3
            className="font-headline-sm text-headline-sm text-on-surface truncate group-hover:text-primary transition-colors cursor-pointer"
            onClick={openReader}
          >
            {book.title}
          </h3>
          <div className="relative">
            <button
              className="text-on-surface-variant hover:text-on-surface p-0.5 rounded"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Book options"
            >
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-surface-container-lowest rounded-xl shadow-xl p-space-xs z-40 animate-fade-in">
                <button
                  onClick={openReader}
                  className="w-full text-left px-space-sm py-space-xs rounded-lg hover:bg-surface-container font-label-md text-label-md text-on-surface transition-colors flex items-center gap-space-xs"
                >
                  <span className="material-symbols-outlined text-ui-body-sm">menu_book</span>
                  Open Reader
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-space-sm py-space-xs rounded-lg hover:bg-error-container font-label-md text-label-md text-error transition-colors flex items-center gap-space-xs"
                >
                  <span className="material-symbols-outlined text-ui-body-sm">delete</span>
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="font-ui-body-sm text-ui-body-sm text-on-surface-variant">
          {book.author}
          {book.publishedYear && <span className="italic font-reading-body-sm"> · {book.publishedYear}</span>}
        </p>

        {/* Progress bar */}
        <div className="w-full mt-2 flex flex-col gap-1">
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary-container h-full rounded-full transition-all"
              style={{ width: `${progress?.percentage || 0}%` }}
            />
          </div>
          <div className="flex justify-between items-center font-label-sm text-label-sm text-outline">
            <span>
              {progress
                ? `p. ${progress.currentPage} of ${book.totalPages}`
                : `${book.totalPages || '?'} pp`}
            </span>
            {book.bookmarkCount > 0 && (
              <span className="flex items-center gap-0.5 text-secondary font-medium">
                <span className="material-symbols-outlined text-[14px]">bookmark</span>
                {book.bookmarkCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export default BookCard
