import { useNavigate } from 'react-router-dom'
import { useToastStore } from '../../store/toastStore'
import { annotationService } from '../../services/annotationService'
import { useQueryClient } from '@tanstack/react-query'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'numeric', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
  })
}

function useDeleteAnnotation() {
  const qc = useQueryClient()
  const toast = useToastStore()
  return async (annotation, onDelete) => {
    try {
      if (annotation.type === 'highlight') {
        await annotationService.deleteHighlight(annotation.id)
      } else {
        await annotationService.deleteBookmark(annotation.id)
      }
      qc.invalidateQueries({ queryKey: ['annotations'] })
      qc.invalidateQueries({ queryKey: ['highlights', annotation.bookId] })
      qc.invalidateQueries({ queryKey: ['bookmarks', annotation.bookId] })
      onDelete?.(annotation.id, annotation.type)
    } catch {
      toast.error('Failed to delete annotation')
    }
  }
}

export function AnnotationCard({ annotation, onDelete }) {
  const navigate = useNavigate()
  const deleteAnnotation = useDeleteAnnotation()
  const isHighlight = annotation.type === 'highlight'

  const goToPage = () => {
    const route = isHighlight
      ? `/reader/${annotation.bookId}?page=${annotation.pageNumber}&highlight=${annotation.id}`
      : `/reader/${annotation.bookId}?page=${annotation.pageNumber}`
    navigate(route)
  }

  const highlightBg = {
    '#facc15': 'bg-[#fde047]',
    '#4ade80': 'bg-[#86efac]',
    '#60a5fa': 'bg-[#93c5fd]',
    '#f87171': 'bg-[#fca5a5]',
  }[annotation.color] || 'bg-[#fde047]'

  return (
    <div className="group relative p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-space-md">

        {/* Badge */}
        {isHighlight ? (
          <div className={`shrink-0 w-11 h-11 rounded-full ${highlightBg} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
            <span className="material-symbols-outlined text-[#713f12]" style={{ fontSize: 22 }}>ink_highlighter</span>
          </div>
        ) : (
          <div className="shrink-0 w-11 h-11 rounded-full bg-[#7dd3fc] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[#0369a1]" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>bookmark</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-space-sm">
            <div>
              <h2
                className="font-ui-body-md text-ui-body-md font-medium text-on-surface hover:text-primary transition-colors cursor-pointer"
                onClick={goToPage}
              >
                {annotation.bookTitle && <span className="text-on-surface-variant">{annotation.bookTitle} — </span>}
                {annotation.chapterTitle || `Page ${annotation.pageNumber}`}
              </h2>
              <p className="font-ui-body-sm text-ui-body-sm text-on-surface-variant mt-0.5">
                {formatDate(annotation.createdAt)}
              </p>
            </div>

            {/* Hover actions */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
              <button
                onClick={goToPage}
                className="p-1 text-on-surface-variant hover:text-primary rounded hover:bg-surface-container transition-colors"
                title="Jump to page"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>open_in_new</span>
              </button>
              <button
                onClick={() => deleteAnnotation(annotation, onDelete)}
                className="p-1 text-on-surface-variant hover:text-error rounded hover:bg-surface-container transition-colors"
                title="Delete"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
              </button>
            </div>
          </div>

          {/* Quote / label */}
          {isHighlight ? (
            <blockquote
              className="mt-space-sm font-reading-body-md text-reading-body-md text-on-surface leading-relaxed relative pl-3 border-l-2 cursor-pointer"
              style={{ borderColor: annotation.color || '#facc15' }}
              onClick={goToPage}
            >
              "{annotation.selectedText}"
            </blockquote>
          ) : (
            <div
              className="mt-space-sm font-reading-body-md text-reading-body-md text-on-surface leading-relaxed relative pl-3 border-l-2 border-[#38bdf8]/60 cursor-pointer"
              onClick={goToPage}
            >
              {annotation.label || 'Bookmarked page'}
            </div>
          )}

          <div className="mt-space-sm flex items-center gap-space-sm font-label-sm text-label-sm text-on-surface-variant">
            <span>Page {annotation.pageNumber}</span>
            {annotation.chapterTitle && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-secondary">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>sell</span>
                  {annotation.chapterTitle}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnnotationCard
