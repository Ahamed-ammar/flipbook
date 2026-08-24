import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'
import { useHomeData } from '../hooks/useBooks.js'
import { Navbar } from '../components/layout/Navbar.jsx'
import { ToastContainer } from '../components/common/Toast.jsx'
import { BookCover } from '../components/books/BookCover.jsx'
import { EmptyState } from '../components/common/EmptyState.jsx'
import { ErrorMessage } from '../components/common/ErrorMessage.jsx'
import { HomeHeroSkeleton, BookCardSkeleton, Skeleton } from '../components/common/Skeleton.jsx'
import { calcProgress, formatDate, estimateRemaining, getGreeting } from '../utils/helpers.js'

export default function Home() {
  const { user }              = useAuthStore()
  const { data, isLoading, isError, error, refetch } = useHomeData()
  const navigate              = useNavigate()

  const recentReading  = data?.recentReading  ?? []
  const recentlyAdded  = data?.recentlyAdded  ?? []
  const featuredNote   = data?.featuredNote   ?? null
  const todayStats     = data?.todayStats     ?? null

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <ToastContainer />

      <main className="w-full pt-16 md:pt-20 bg-[var(--color-surface)] min-h-screen">
        <div className="relative w-full overflow-hidden px-5 md:px-8 lg:px-16 py-12">

          {/* Ambient glow */}
          <div className="absolute -top-32 right-1/4 w-96 h-96 bg-[var(--color-primary)]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -left-20 w-80 h-80 bg-[var(--color-secondary)]/5 rounded-full blur-3xl pointer-events-none" />

          {/* ── Greeting Section ── */}
          <section className="relative z-10 max-w-7xl mx-auto mb-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-7">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] text-label-sm uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-container)] inline-block" />
                  <span>Archival Sanctuary</span>
                  <span>•</span>
                  <span>{today}</span>
                </div>
                <h1 className="text-display-lg text-[var(--color-on-surface)] tracking-tight hidden md:block">
                  {getGreeting()}, {user?.name?.split(' ')[0] ?? 'Reader'}.
                </h1>
                <h1 className="text-display-lg-mobile text-[var(--color-on-surface)] tracking-tight md:hidden">
                  {getGreeting()}, {user?.name?.split(' ')[0] ?? 'Reader'}.
                </h1>
                <p className="text-reading-body-md text-[var(--color-on-surface-variant)] italic pt-1">
                  "A room without books is like a body without a soul."
                  <span className="text-label-md not-italic text-[var(--color-on-surface)] ml-2 font-medium">— Cicero</span>
                </p>
              </div>

              {/* Reading velocity card */}
              {todayStats && (
                <div className="bg-[var(--color-surface-container-low)] p-4 rounded-xl shadow-sm flex items-center gap-4 shrink-0 self-start lg:self-auto">
                  <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
                      <circle className="text-[var(--color-surface-variant)]" cx="22" cy="22" fill="none" r="18" stroke="currentColor" strokeWidth="3" />
                      <circle
                        className="text-[var(--color-primary-container)]"
                        cx="22" cy="22" fill="none" r="18" stroke="currentColor"
                        strokeDasharray="113.1"
                        strokeDashoffset={113.1 - (113.1 * (todayStats.goalPct ?? 0)) / 100}
                        strokeLinecap="round" strokeWidth="3.2"
                      />
                    </svg>
                    <span className="absolute text-label-sm text-[var(--color-on-surface)] font-semibold">{todayStats.goalPct ?? 0}%</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-headline-sm text-[var(--color-on-surface)] font-semibold">{todayStats.minutesRead ?? 0}</span>
                      <span className="text-ui-body-sm text-[var(--color-on-surface-variant)]}">/ {todayStats.goalMinutes ?? 30} mins read</span>
                    </div>
                    <p className="text-ui-body-sm text-[var(--color-on-surface-variant)]">{todayStats.pagesRead ?? 0} pages absorbed today</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {isError && <ErrorMessage error={error} onRetry={refetch} />}

          {/* ── In Recent Rotation ── */}
          <section className="relative z-10 max-w-7xl mx-auto mb-12">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-baseline gap-3">
                <h2 className="text-headline-lg text-[var(--color-on-surface)]">In Recent Rotation</h2>
                {!isLoading && (
                  <span className="text-label-sm text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                    {recentReading.length} Active {recentReading.length === 1 ? 'Volume' : 'Volumes'}
                  </span>
                )}
              </div>
              <Link
                to="/library"
                className="text-label-md text-[var(--color-primary-container)] hover:text-[var(--color-primary)] transition-colors flex items-center gap-1"
              >
                <span>Complete Shelf</span>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-7"><HomeHeroSkeleton /></div>
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <Skeleton className="h-36 rounded-xl" />
                  <Skeleton className="h-36 rounded-xl" />
                </div>
              </div>
            ) : recentReading.length === 0 ? (
              <EmptyState
                icon="auto_stories"
                title="Nothing in rotation yet"
                description="Open a book from your library to start reading."
                action={
                  <Link to="/library" className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-lg text-label-md hover:bg-[var(--color-primary)] transition-colors">
                    Browse Library
                  </Link>
                }
              />
            ) : (
              <RecentRotationGrid books={recentReading} navigate={navigate} />
            )}
          </section>

          {/* ── Featured Note ── */}
          {featuredNote && (
            <section className="relative z-10 max-w-7xl mx-auto mb-12">
              <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex gap-4 items-start max-w-3xl">
                  <span
                    className="material-symbols-outlined text-[var(--color-primary-container)] shrink-0 mt-1"
                    style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}
                  >
                    format_quote
                  </span>
                  <div>
                    <blockquote className="text-reading-body-md text-[var(--color-on-surface)] font-literata italic">
                      "{featuredNote.text}"
                    </blockquote>
                    <div className="flex items-center gap-2 mt-2 text-label-md text-[var(--color-on-surface-variant)]">
                      <span className="font-medium text-[var(--color-on-surface)]">{featuredNote.bookTitle}</span>
                      <span>•</span>
                      <span>Page {featuredNote.pageNumber}</span>
                    </div>
                  </div>
                </div>
                <Link
                  to="/annotations"
                  className="shrink-0 inline-flex items-center gap-2 text-[var(--color-primary)] text-label-md hover:text-[var(--color-primary-container)] transition-colors bg-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-high)] px-4 py-2 rounded-lg"
                >
                  <span>Open Annotations Codex</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                </Link>
              </div>
            </section>
          )}

          {/* ── Recently Added ── */}
          <section className="relative z-10 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
              <div>
                <span className="text-label-sm text-[var(--color-primary)] uppercase tracking-widest font-bold block mb-1">
                  Curated Library Shelves
                </span>
                <h2 className="text-headline-lg text-[var(--color-on-surface)] tracking-tight">
                  Important Volumes &amp; Archival Editions
                </h2>
                <p className="text-ui-body-md text-[var(--color-on-surface-variant)] mt-1">
                  Your most recently added books.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <BookCardSkeleton key={i} />
                ))}
              </div>
            ) : recentlyAdded.length === 0 ? (
              <EmptyState
                icon="library_add"
                title="Your library is empty"
                description="Upload your first PDF book to get started."
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {recentlyAdded.map((book) => (
                  <RecentlyAddedCard key={book.id} book={book} navigate={navigate} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

/* ── Sub-components ── */

function RecentRotationGrid({ books, navigate }) {
  const [hero, ...rest] = books

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Hero card */}
      <div className="lg:col-span-7 bg-[var(--color-surface-container)] rounded-xl p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row gap-7">
          {/* Dimensional cover */}
          <div
            className="relative shrink-0 w-36 sm:w-44 aspect-[2/3] rounded-lg overflow-hidden shadow-[0_10px_24px_-4px_rgba(28,26,23,0.18)] cursor-pointer group bg-[var(--color-surface-container-highest)]"
            onClick={() => navigate(`/reader/${hero.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/reader/${hero.id}`)}
          >
            <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/25 via-white/10 to-transparent z-20" />
            <BookCover book={hero} />
            <div className="absolute inset-0 bg-[var(--color-primary)]/0 group-hover:bg-[var(--color-primary)]/10 transition-colors z-20 pointer-events-none" />
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col justify-between py-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="px-2 py-0.5 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] text-label-sm font-medium">
                  Currently Reading
                </span>
                <span className="text-label-sm text-[var(--color-on-surface-variant)]">
                  {estimateRemaining(hero.progress?.currentPage, hero.totalPages)} left
                </span>
              </div>
              <h3 className="text-headline-md text-[var(--color-on-surface)] mt-1">{hero.title}</h3>
              <p className="text-ui-body-md text-[var(--color-on-surface-variant)]">{hero.author}</p>
              <div className="mt-4 p-3 bg-[var(--color-surface-container-lowest)] rounded-lg">
                <span className="text-label-sm text-[var(--color-primary)] uppercase font-bold tracking-wider block">
                  Reading Progress
                </span>
                <p className="text-ui-body-sm text-[var(--color-on-surface-variant)] mt-1">
                  Page {hero.progress?.currentPage ?? 1} of {hero.totalPages ?? '?'}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div>
                <div className="flex justify-between text-label-sm text-[var(--color-on-surface-variant)] mb-1">
                  <span>Progress</span>
                  <span className="font-medium text-[var(--color-on-surface)]">
                    {calcProgress(hero.progress?.currentPage, hero.totalPages)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[var(--color-surface-container-highest)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-primary-container)] rounded-full"
                    style={{ width: `${calcProgress(hero.progress?.currentPage, hero.totalPages)}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => navigate(`/reader/${hero.id}`)}
                  className="flex-1 bg-[var(--color-primary-container)] hover:bg-[var(--color-primary)] text-[var(--color-on-primary-container)] py-2.5 px-4 rounded-lg text-label-md flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
                  <span>Resume Reading</span>
                </button>
                <button
                  onClick={() => navigate('/annotations')}
                  className="bg-[var(--color-surface-container-lowest)] hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] py-2.5 px-4 rounded-lg text-label-md flex items-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>stylus_note</span>
                  <span>Notes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary stack */}
      <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
        {rest.slice(0, 2).map((book) => (
          <SmallRotationCard key={book.id} book={book} navigate={navigate} />
        ))}
      </div>
    </div>
  )
}

function SmallRotationCard({ book, navigate }) {
  const pct = calcProgress(book.progress?.currentPage, book.totalPages)
  return (
    <div
      className="bg-[var(--color-surface-container)] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex gap-4 items-center group cursor-pointer"
      onClick={() => navigate(`/reader/${book.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/reader/${book.id}`)}
    >
      <div className="relative shrink-0 w-20 aspect-[2/3] rounded overflow-hidden shadow-[0_4px_12px_rgba(28,26,23,0.12)] bg-[var(--color-surface-container-high)]">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/40 to-transparent z-10" />
        <BookCover book={book} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-[var(--color-secondary)] font-medium truncate">{book.author}</span>
          <span className="text-label-sm text-[var(--color-on-surface-variant)] shrink-0 ml-2">
            {formatDate(book.progress?.lastReadAt)}
          </span>
        </div>
        <h4 className="text-headline-sm text-[var(--color-on-surface)] truncate">{book.title}</h4>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1 h-1 bg-[var(--color-surface-container-highest)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-secondary)] rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-label-sm text-[var(--color-on-surface-variant)] font-medium shrink-0">{pct}%</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-ui-body-sm text-[var(--color-on-surface-variant)]">
            p. {book.progress?.currentPage ?? 0} / {book.totalPages ?? '?'}
          </span>
          <button className="text-[var(--color-primary)] hover:text-[var(--color-on-surface)] text-label-md flex items-center gap-0.5 transition-colors">
            <span>Continue</span>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function RecentlyAddedCard({ book, navigate }) {
  return (
    <div
      className="group flex flex-col cursor-pointer"
      onClick={() => navigate(`/reader/${book.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/reader/${book.id}`)}
    >
      <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-[0_8px_20px_rgba(28,26,23,0.12)] group-hover:shadow-[0_16px_32px_rgba(28,26,23,0.18)] group-hover:-translate-y-1 transition-all duration-300 bg-[var(--color-surface-container-highest)]">
        <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/50 via-white/10 to-transparent z-20" />
        <BookCover book={book} />
        {/* Bookmark hover action */}
        <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/reader/${book.id}`) }}
            className="w-8 h-8 rounded-full bg-[var(--color-surface)]/90 text-[var(--color-on-surface)] flex items-center justify-center shadow-md hover:bg-[var(--color-surface)]"
            aria-label="Open book"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
          </button>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="text-headline-sm text-[var(--color-on-surface)] truncate group-hover:text-[var(--color-primary)] transition-colors">
          {book.title}
        </h3>
        <p className="text-ui-body-sm text-[var(--color-on-surface-variant)] truncate">{book.author}</p>
      </div>
    </div>
  )
}
