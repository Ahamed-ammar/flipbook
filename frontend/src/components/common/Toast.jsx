import { useToastStore } from '../../store/toastStore'

const iconMap = {
  success: 'done_all',
  error: 'error',
  info: 'info',
}

const colorMap = {
  success: 'bg-secondary text-on-secondary',
  error: 'bg-error text-on-error',
  info: 'bg-primary-container text-on-primary-container',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-space-sm px-space-md py-space-sm bg-inverse-surface text-inverse-on-surface rounded-xl shadow-xl pointer-events-auto animate-slide-up"
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${colorMap[t.type] || colorMap.info}`}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{iconMap[t.type] || 'info'}</span>
          </div>
          <p className="font-ui-body-sm text-ui-body-sm font-medium">{t.message}</p>
          <button
            onClick={() => removeToast(t.id)}
            className="ml-space-xs text-inverse-on-surface opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
      ))}
    </div>
  )
}

// Imperative API — pages call toast.success('msg') etc.
export const toast = {
  success: (msg) => useToastStore.getState().success(msg),
  error:   (msg) => useToastStore.getState().error(msg),
  info:    (msg) => useToastStore.getState().info(msg),
}

// Also render as the top-level Toast in App.jsx
export default function Toast() {
  return <ToastContainer />
}
