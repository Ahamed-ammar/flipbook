import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar.jsx'
import { ToastContainer, toast } from '../components/common/Toast.jsx'
import { AnnotationCard } from '../components/annotations/AnnotationCard.jsx'
import { AnnotationSkeleton } from '../components/common/Skeleton.jsx'
import { EmptyState } from '../components/common/EmptyState.jsx'
import { ErrorMessage } from '../components/common/ErrorMessage.jsx'
import { useAllAnnotations, useDeleteHighlight, useDeleteBookmark } from '../hooks/useAnnotations.js'

const FILTERS = [
  { value: 'all',       label: 'All Notes',  icon: null },
  { value: 'highlight', label: 'Highlights', color: '#facc15' },
  { value: 'bookmark',  label: 'Bookmarks',  color: '#38bdf8' },
]

export default function Annotations() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const { data, isLoading, isError, error, refetch } = useAllAnnotations()
  const { mutate: deleteHighlight } = useDeleteHighlight()
  const { mutate: deleteBookmark  } = useDeleteBookmark()

  const allAnnotations = data?.content ?? data ?? []

  const filtered = filter === 'all'
    ? allAnnotations
    : allAnnotations.filter((a) => a.type === filter)

  const highlightCount = allAnnotations.filter((a) => a.type === 'highlight').length
  const bookmarkCount  = allAnnotations.filter((a) => a.type === 'bookmark').length

  function handleDelete(id, type) {
    if (type === 'highlight') {
      deleteHighlight(id, {
        onSuccess: () => toast.success('Highlight removed.'),
        onError:   () => toast.error('Failed to remove highlight.'),
      })
    } else {
      deleteBookmark(id, {
        onSuccess: () => toast.success('Bookmark removed.'),
        onError:   () => toast.error('Failed to remove bookmark.'),
      })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      <ToastContainer />

      <main className="w-full pt-16 md:pt-20 bg-[var(--color-surface)] min-h-screen">
        <div className="relative w-full px-5 md:px-8 lg:px-16 py-6 lg:py-12 max-w-7xl mx-auto">

          {/* Ambient glow */}
          <div className="absolute -top-16 right-12 w-96 h-96 bg-[var(--color-primary-container)]/5 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-1/3 -left-20 w-80 h-80 bg-[var(--color-secondary-container)]/10 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* ── Breadcrumb ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-3">
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] text-label-md">
              <button
                onClick={() => navigate('/home')}
                className="hover:text-[var(--color-primary)] transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
                <span>Annotations Codex</span>
              </button>
              <span className="text-[var(--color-outline-variant)] text-reading-body-sm">/</span>
              <span className="text-[var(--color-on-surface)] text-label-md">All Volumes</span>
            </div>
          </div>

          {/* ── Page header ── */}
          <div className="bg-[var(--color-surface-container-low)] rounded-xl p-4 sm:p-6 shadow-sm mb-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Icon */}
              <div className="w-20 h-28 sm:w-24 sm:h-36 bg-[var(--color-surface-container)] rounded-md shadow-md overflow-hidden relative shrink-0 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[var(--color-primary-container)]"
                  style={{ fontSize: 48, fontVariationSettings: "'FILL' 1" }}
                >
                  auto_stories
                </span>
              </div>

              {/* Meta */}
              <div className="flex-1 flex flex-col justify-between self-stretch min-w-0">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--color-secondary-fixed)] text-[var(--color-on-secondary-fixed)] text-label-sm mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]" />
                    Personal Annotations Archive
                  </div>
                  <h1 className="text-headline-lg text-[var(--color-on-surface)] tracking-tight leading-snug">
                    Your Marginalia &amp; Excerpts
                  </h1>
                  <p className="text-ui-body-md text-[var(--color-on-surface-variant)] mt-1">
                    All your highlights and bookmarks, across every volume in your library.
                  </p>
                </div>

                {/* Filter chips + actions */}
                <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {FILTERS.map(({ value, label, color }) => {
                      const count = value === 'all' ? allAnnotations.length
                                  : value === 'highlight' ? highlightCount
                                  : bookmarkCount
                      const active = filter === value
                      return (
                        <button
                          key={value}
                          onClick={() => setFilter(value)}
                          className={`px-3 py-1.5 rounded-lg text-label-md transition-colors flex items-center gap-1.5 ${
                            active
                              ? 'bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)]'
                              : 'bg-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
                          }`}
                        >
                          {color && (
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          )}
                          {label} ({count})
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 rounded-lg bg-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors"
                      title="Export annotations"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>file_download</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Annotations Feed ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main feed */}
            <div className="lg:col-span-8 space-y-4">
              {/* Feed header */}
              <div className="flex items-center justify-between px-1 pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-headline-sm text-[var(--color-on-surface)]">Marginalia &amp; Excerpts</span>
                  <span className="text-[var(--color-on-surface-variant)] text-label-sm bg-[var(--color-surface-container)] px-2 py-0.5 rounded-full">
                    Chronological
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] text-label-sm">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>sort</span>
                  <span>Newest First</span>
                </div>
              </div>

              {isError && <ErrorMessage error={error} onRetry={refetch} />}

              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <AnnotationSkeleton key={i} />)
                : filtered.length === 0
                ? (
                    <EmptyState
                      icon={filter === 'bookmark' ? 'bookmark' : 'ink_highlighter'}
                      title={filter === 'all' ? 'No annotations yet' : `No ${filter}s yet`}
                      description={
                        filter === 'all'
                          ? 'Open a book and highlight text or bookmark pages to see them here.'
                          : `Start reading to create your first ${filter}.`
                      }
                      action={
                        <button
                          onClick={() => navigate('/library')}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-lg text-label-md hover:bg-[var(--color-primary)] transition-colors"
                        >
                          Open Library
                        </button>
                      }
                    />
                  )
                : filtered.map((annotation) => (
                    <AnnotationCard
                      key={`${annotation.type}-${annotation.id}`}
                      annotation={annotation}
                      onDelete={handleDelete}
                    />
                  ))
              }
            </div>

            {/* Right sidebar — stats */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[var(--color-surface-container-low)] rounded-xl p-4 shadow-sm">
                <h3 className="text-headline-sm text-[var(--color-on-surface)] mb-4">Archive Summary</h3>
                <div className="space-y-3">
                  <StatRow
                    icon="ink_highlighter"
                    label="Highlights"
                    value={highlightCount}
                    color="#facc15"
                  />
                  <StatRow
                    icon="bookmark"
                    label="Bookmarks"
                    value={bookmarkCount}
                    color="#38bdf8"
                  />
                  <StatRow
                    icon="auto_stories"
                    label="Books annotated"
                    value={new Set(allAnnotations.map((a) => a.bookId)).size}
                    color="var(--color-primary-container)"
                  />
                </div>
              </div>

              <div className="bg-[var(--color-surface-container-low)] rounded-xl p-4 shadow-sm">
                <h3 className="text-headline-sm text-[var(--color-on-surface)] mb-3">Quick Tips</h3>
                <ul className="space-y-2 text-ui-body-sm text-[var(--color-on-surface-variant)]">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[var(--color-primary-container)] mt-0.5" style={{ fontSize: 16 }}>tips_and_updates</span>
                    Select text in the reader to create a highlight.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[var(--color-secondary)] mt-0.5" style={{ fontSize: 16 }}>bookmark</span>
                    Click the bookmark icon in the reader toolbar to bookmark a page.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[var(--color-tertiary)] mt-0.5" style={{ fontSize: 16 }}>open_in_new</span>
                    Click any annotation to jump directly to that page.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatRow({ icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}30` }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color, fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>
      <div className="flex-1">
        <span className="text-ui-body-sm text-[var(--color-on-surface-variant)]">{label}</span>
      </div>
      <span className="text-headline-sm text-[var(--color-on-surface)] font-semibold">{value}</span>
    </div>
  )
}
