/** Format a date for display, e.g. "Oct 25" or "Yesterday" */
export function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Format a full timestamp */
export function formatTimestamp(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

/** Calculate reading progress percentage */
export function calcProgress(currentPage, totalPages) {
  if (!totalPages || totalPages === 0) return 0
  return Math.min(100, Math.max(0, Math.round((currentPage / totalPages) * 100 * 10) / 10))
}

/** Estimate remaining reading time */
export function estimateRemaining(currentPage, totalPages, avgPagesPerHour = 40) {
  const remaining = totalPages - currentPage
  if (remaining <= 0) return 'Complete'
  const hours = remaining / avgPagesPerHour
  if (hours < 1) return `${Math.round(hours * 60)}m left`
  return `${Math.round(hours * 10) / 10}h left`
}

/** Truncate text to a max length */
export function truncate(text, max = 80) {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}…` : text
}

/** Generate a readable color class for highlight badges */
export function highlightColorClass(color) {
  const map = {
    yellow: 'bg-yellow-300',
    blue:   'bg-sky-300',
    green:  'bg-emerald-300',
    pink:   'bg-pink-300',
    orange: 'bg-orange-300',
  }
  return map[color] || map.yellow
}

/** Get greeting based on time of day */
export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
