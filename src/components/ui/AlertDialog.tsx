import { useEffect } from 'react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onClose: () => void
  onConfirm: () => void
}

export function AlertDialog({
  open,
  title,
  message,
  confirmLabel = 'Excluir',
  onClose,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-surface rounded-card shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">{title}</h2>
        <p className="text-sm text-muted mb-6">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-border text-muted hover:bg-bg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-danger text-white hover:bg-danger/90 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
