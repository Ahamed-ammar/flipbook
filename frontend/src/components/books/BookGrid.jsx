import BookCard from './BookCard'
import { BookCardSkeleton } from '../common/Skeleton'
import EmptyState from '../common/EmptyState'

export default function BookGrid({ books, isLoading, onAddBook }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-gutter">
        {Array.from({ length: 8 }).map((_, i) => (
          <BookCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!books?.length) {
    return (
      <EmptyState
        icon="local_library"
        title="Your library is empty"
        description="Upload your first PDF to start building your personal reading archive."
        action={onAddBook ? { label: 'Add Book', icon: 'add', onClick: onAddBook } : undefined}
      />
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-gutter">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  )
}
