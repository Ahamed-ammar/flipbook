export function ErrorMessage({ error, onRetry }) {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong. Please try again.'

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-14 h-14 rounded-full bg-[var(--color-error-container)] flex items-center justify-center mb-4">
        <span
          className="material-symbols-outlined text-[var(--color-error)]"
          style={{ fontSize: 28 }}
        >
          error
        </span>
      </div>
      <p className="text-ui-body-md text-[var(--color-on-surface-variant)] max-w-sm mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-lg text-label-md hover:bg-[var(--color-primary)] transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}
