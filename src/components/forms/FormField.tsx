interface FieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

export function Field({ label, error, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

export function inputCls(hasError = false): string {
  return [
    'w-full px-3 py-2.5 rounded-xl border text-sm text-gray-900 bg-white',
    'transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
    hasError ? 'border-danger bg-danger/5' : 'border-border',
  ].join(' ')
}

export function FormSection({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-semibold text-muted uppercase tracking-wide whitespace-nowrap">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

export function DrawerFooter({ onClose, onSubmit, submitLabel = 'Salvar' }: {
  onClose: () => void
  onSubmit: () => void
  submitLabel?: string
}) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:bg-bg transition-colors"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
      >
        {submitLabel}
      </button>
    </div>
  )
}
