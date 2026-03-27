import { useState } from 'react'
import { formatDate } from '../../lib/gestation'
import type { Exam } from '../../types'
import { AlertDialog } from '../ui/AlertDialog'

interface Props {
  exam: Exam
  isLast?: boolean
  onEdit?: (e: Exam) => void
  onDelete?: (id: string) => void
}

const statusConfig = {
  normal: { label: 'Normal', className: 'bg-success/10 text-success' },
  altered: { label: 'Alterado', className: 'bg-danger/10 text-danger' },
  pending: { label: 'Pendente', className: 'bg-warning/10 text-warning' },
}

export function ExamEvent({ exam: e, isLast = false, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const status = statusConfig[e.status]

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-accent/15 border-2 border-accent flex items-center justify-center flex-shrink-0 mt-0.5 z-10">
          <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
      </div>

      <div className="flex-1 pb-6">
        <div className="bg-surface rounded-card shadow-card p-4 hover:shadow-card-hover transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-accent uppercase tracking-wide">Exame Laboratorial</span>
                <span className={`text-xs px-2 py-0.5 rounded-pill font-medium ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{e.type}</p>
              <p className="text-xs text-muted">{formatDate(e.date)} · {e.lab ?? 'Laboratório'}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block bg-accent/10 text-accent text-xs font-bold px-2.5 py-1 rounded-pill">
                {e.gestationalWeeks}s {e.gestationalDays > 0 ? `+ ${e.gestationalDays}d` : ''}
              </span>
              {onEdit && (
                <button
                  onClick={() => onEdit(e)}
                  title="Editar exame"
                  className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => setDeleteOpen(true)}
                  title="Excluir exame"
                  className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/8 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="bg-bg rounded-xl px-3 py-2.5 mt-2">
            <p className="text-xs text-muted mb-0.5">Resultado</p>
            <p className="text-sm font-medium text-gray-800">{e.result}</p>
          </div>

          {e.notes && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-accent font-medium hover:opacity-75 transition-opacity mt-2"
              >
                {expanded ? 'Ocultar observações' : 'Ver observações'}
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expanded && (
                <p className="text-sm text-gray-600 leading-relaxed border-t border-border pt-3 mt-2">
                  {e.notes}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <AlertDialog
        open={deleteOpen}
        title="Excluir exame"
        message="Esta ação é permanente e não pode ser desfeita."
        confirmLabel="Excluir"
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => onDelete!(e.id)}
      />
    </div>
  )
}
