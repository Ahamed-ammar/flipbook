export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-space-xl px-space-lg text-center">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-space-md">
          <span
            className="material-symbols-outlined text-on-surface-variant"
            style={{ fontSize: 32 }}
          >
            {icon}
          </span>
        </div>
      )}
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs">{title}</h3>
      {description && (
        <p className="font-ui-body-md text-ui-body-md text-on-surface-variant max-w-sm mb-space-lg">
          {description}
        </p>
      )}
      {action}
    </div>
  )
}

export default EmptyState
