import { useState } from 'react'
import { formatDate } from '../../lib/gestation'
import type { Consultation } from '../../types'

interface Props {
  consultation: Consultation
  isLast?: boolean
  onEdit?: (c: Consultation) => void
  onDelete?: (id: string) => void
}

const edemaLabels: Record<string, string> = {
  absent: 'Sem edema',
  trace: 'Edema discreto',
  '1+': 'Edema 1+',
  '2+': 'Edema 2+',
  '3+': 'Edema 3+',
}

const typeLabels: Record<string, string> = {
  urgent: 'Urgência',
  specialist: 'Especialista',
}

export function ConsultationEvent({ consultation: c, isLast = false, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const bpAlert = c.vitalSigns.systolic >= 140 || c.vitalSigns.diastolic >= 90

  return (
    <div className="flex gap-4">
      {/* Linha do tempo */}
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center flex-shrink-0 mt-0.5 z-10">
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
      </div>

      {/* Card */}
      <div className="flex-1 pb-6">
        <div className="bg-surface rounded-card shadow-card p-4 hover:shadow-card-hover transition-shadow">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Consulta
                </span>
                {c.type !== 'routine' && (
                  <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-pill font-medium">
                    {typeLabels[c.type] ?? c.type}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-900">{formatDate(c.date)}</p>
              <p className="text-xs text-muted">{c.provider}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block bg-primary/8 text-primary text-xs font-bold px-2.5 py-1 rounded-pill">
                {c.gestationalWeeks}s {c.gestationalDays > 0 ? `+ ${c.gestationalDays}d` : ''}
              </span>
              {onEdit && (
                <button
                  onClick={() => { setConfirmingDelete(false); onEdit(c) }}
                  title="Editar consulta"
                  className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/8 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  title="Excluir consulta"
                  className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/8 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Grade de sinais vitais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <Metric
              label="Pressão Arterial"
              value={`${c.vitalSigns.systolic}/${c.vitalSigns.diastolic}`}
              unit="mmHg"
              status={bpAlert ? 'warning' : 'ok'}
            />
            <Metric label="Peso" value={`${c.vitalSigns.weight}`} unit="kg" />
            <Metric label="Altura Uterina" value={`${c.uterineHeight}`} unit="cm" />
            <Metric label="BCF" value={`${c.fetalHeartRate}`} unit="bpm" />
          </div>

          {/* Tags extras */}
          {(c.fetalPresentation || (c.edema && c.edema !== 'absent')) && (
            <div className="flex flex-wrap gap-2 mb-2">
              {c.fetalPresentation && <Tag label={c.fetalPresentation} />}
              {c.edema && c.edema !== 'absent' && (
                <Tag label={edemaLabels[c.edema] ?? c.edema} color="warning" />
              )}
            </div>
          )}

          {/* Anotações expandíveis */}
          {c.notes && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-primary font-medium hover:opacity-75 transition-opacity mt-1"
              >
                {expanded ? 'Ocultar anotações' : 'Ver anotações'}
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
                  {c.notes}
                </p>
              )}
            </>
          )}

          {/* Confirmação de exclusão inline */}
          {confirmingDelete && (
            <div className="mt-3 pt-3 border-t border-danger/20 flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-danger">Excluir esta consulta permanentemente?</p>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted hover:bg-bg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => onDelete!(c.id)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-danger text-white hover:bg-danger/90 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, unit, status = 'ok' }: { label: string; value: string; unit?: string; status?: 'ok' | 'warning' }) {
  return (
    <div className="bg-bg rounded-xl px-3 py-2">
      <p className="text-xs text-muted mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${status === 'warning' ? 'text-warning' : 'text-gray-800'}`}>
        {value} {unit && <span className="text-xs font-normal text-muted">{unit}</span>}
      </p>
    </div>
  )
}

function Tag({ label, color = 'default' }: { label: string; color?: 'default' | 'warning' }) {
  return (
    <span
      className={`inline-flex items-center text-xs px-2.5 py-1 rounded-pill font-medium ${
        color === 'warning' ? 'bg-warning/10 text-warning' : 'bg-primary/8 text-primary'
      }`}
    >
      {label}
    </span>
  )
}
