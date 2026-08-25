import { useState } from 'react'
import { Navbar } from '../components/layout/Navbar.jsx'
import { ToastContainer, toast } from '../components/common/Toast.jsx'
import { BookCard } from '../components/books/BookCard.jsx'
import { BookCardSkeleton } from '../components/common/Skeleton.jsx'
import { EmptyState } from '../components/common/EmptyState.jsx'
import { ErrorMessage } from '../components/common/ErrorMessage.jsx'
import { useBooks, useDeleteBook } from '../hooks/useBooks.js'
import { useAuthStore } from '../store/authStore.js'
import { AddBookModal } from '../components/books/AddBookModal.jsx'

const SORT_OPTIONS = [
  { value: 'lastRead',   label: 'Recently Opened' },
  { value: 'createdAt',  label: 'Recently Added' },
  { value: 'title',      label: 'Title A–Z' },
  { value: 'author',     label: 'Author' },
]

export default function Library() {
  const { user }          = useAuthStore()
  const [search, setSearch] = useState('')
  const [sort, setSort]   = useState('lastRead')
  const [view, setView]   = useState('grid')  // grid | list
  const [addOpen, setAddOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null) // bookId

  const { data, isLoading, isError, error, refetch } = useBooks({ search, sort })
  const { mutate: deleteBook, isPending: deleting } = useDeleteBook()

  const books = data?.content ?? data ?? []
  const total = data?.totalElements ?? books.length

  function handleDelete(bookId) {
    setConfirmDelete(bookId)
  }

  function confirmDeletion() {
    deleteBook(confirmDelete, {
      onSuccess: () => {
        toast.success('Book removed from your library.')
        setConfirmDelete(null)
      },
      onError: (e) => {
        toast.error(e?.response?.data?.message ?? 'Failed to delete book.')
        setConfirmDelete(null)
      },
    })
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <ToastContainer />

      <main className="w-full pt-16 md:pt-20 bg-[var(--color-surface)] min-h-screen">
        <div className="flex flex-col w-full">

          {/* ── Header & Controls ── */}
          <section className="w-full px-5 md:px-8 lg:px-16 py-4 md:py-6 flex flex-col gap-4">
            {/* Breadcrumb row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-label-sm uppercase tracking-wider text-[var(--color-outline)]">EX LIBRIS</span>
                <span className="text-[var(--color-outline-variant)] text-ui-body-sm">/</span>
                <h1 className="text-headline-md text-[var(--color-on-surface)]">
                  Personal Archive · {user?.name ?? 'My'} Library
                </h1>
                <div className="flex items-center gap-2 ml-0 md:ml-2">
                  <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] text-label-sm">
                    {total} Volumes
                  </span>
                </div>
              </div>

              {/* View + Sort controls */}
              <div className="flex items-center gap-3 self-start md:self-auto">
                <div className="inline-flex p-1 bg-[var(--color-surface-container)] rounded-lg">
                  <button
                    onClick={() => setView('grid')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-label-md transition-colors ${
                      view === 'grid'
                        ? 'bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm'
                        : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
                    }`}
                    aria-label="Grid view"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>grid_view</span>
                    <span className="hidden sm:inline">Shelves</span>
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-label-md transition-colors ${
                      view === 'list'
                        ? 'bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm'
                        : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
                    }`}
                    aria-label="List view"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>view_agenda</span>
                    <span className="hidden sm:inline">Index</span>
                  </button>
                </div>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="flex items-center gap-2 bg-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] px-3 py-1.5 rounded-lg text-label-md transition-colors cursor-pointer outline-none border border-[var(--color-outline-variant)]"
                  aria-label="Sort books"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter bar */}
            <div className="w-full bg-[var(--color-surface-container-low)] rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
              <div className="relative flex-1 max-w-sm">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[var(--color-on-surface-variant)]" style={{ fontSize: 18 }}>
                  filter_list
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by title or author…"
                  className="w-full bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] placeholder:italic pl-10 pr-4 py-2 rounded-lg text-ui-body-sm outline-none focus:ring-1 focus:ring-[var(--color-primary)] shadow-sm"
                />
              </div>
              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-container)] hover:bg-[var(--color-primary)] text-[var(--color-on-primary-container)] rounded-lg text-label-md transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                Add Book
              </button>
            </div>
          </section>

          {/* ── Book Grid / List ── */}
          <section className="w-full px-5 md:px-8 lg:px-16 pb-12">
            {isError && <ErrorMessage error={error} onRetry={refetch} />}

            {isLoading ? (
              <div className={view === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
                : 'flex flex-col gap-4'
              }>
                {Array.from({ length: 10 }).map((_, i) => (
                  view === 'grid'
                    ? <BookCardSkeleton key={i} />
                    : <div key={i} className="h-28 skeleton rounded-xl" />
                ))}
              </div>
            ) : books.length === 0 ? (
              <EmptyState
                icon="library_books"
                title="Your library is empty"
                description="Upload your first PDF book to start reading."
                action={
                  <button
                    onClick={() => setAddOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-lg text-label-md hover:bg-[var(--color-primary)] transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                    Add Your First Book
                  </button>
                }
              />
            ) : view === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {books.map((book) => (
                  <BookCard key={book.id} book={book} onDelete={handleDelete} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {books.map((book) => (
                  <BookListRow key={book.id} book={book} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <AddBookModal open={addOpen} onClose={() => setAddOpen(false)} />

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-6 shadow-xl max-w-sm w-full fade-in">
            <h3 className="text-headline-sm text-[var(--color-on-surface)] mb-2">Remove this book?</h3>
            <p className="text-ui-body-sm text-[var(--color-on-surface-variant)] mb-6">
              This will permanently delete the book, all highlights, bookmarks, and reading progress.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg text-label-md text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletion}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-label-md bg-[var(--color-error)] text-[var(--color-on-error)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleting ? 'Removing…' : 'Remove Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BookListRow({ book, onDelete }) {
  const { id, title, author, totalPages, progress } = book
  const pct = Math.round((progress?.currentPage ?? 0) / (totalPages || 1) * 100)
  return (
    <div className="flex items-center gap-4 bg-[var(--color-surface-container-lowest)] rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
      <div className="relative w-14 aspect-[2/3] rounded overflow-hidden bg-[var(--color-surface-container-high)] shadow shrink-0">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/25 to-transparent z-10" />
        <img
          src={book.coverUrl}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-headline-sm text-[var(--color-on-surface)] truncate group-hover:text-[var(--color-primary)] transition-colors">
          {title}
        </h3>
        <p className="text-ui-body-sm text-[var(--color-on-surface-variant)]">{author}</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1 max-w-xs h-1 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--color-primary-container)] rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-label-sm text-[var(--color-outline)]">{pct}%</span>
          <span className="text-label-sm text-[var(--color-outline)]">p. {progress?.currentPage ?? 0}/{totalPages}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => window.location.href = `/reader/${id}`}
          className="p-2 rounded-lg bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] hover:bg-[var(--color-primary)] transition-colors"
          aria-label="Open reader"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>menu_book</span>
        </button>
        <button
          onClick={() => onDelete?.(id)}
          className="p-2 rounded-lg text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-container)] transition-colors"
          aria-label="Delete book"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
        </button>
      </div>
    </div>
  )
}
