import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Drawer({ open, onClose, title, subtitle, children, footer }: Props) {
  // Bloqueia scroll do body quando aberto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Fecha ao pressionar Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Painel lateral */}
      <div
        className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-surface z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
        }}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg text-muted hover:text-gray-700 transition-colors flex-shrink-0 -mr-1 -mt-0.5"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Rodapé fixo */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-surface">
            {footer}
          </div>
        )}
      </div>
    </>
  )
}
