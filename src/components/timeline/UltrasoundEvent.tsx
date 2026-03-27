import { useState } from 'react'
import { formatDate } from '../../lib/gestation'
import type { Ultrasound } from '../../types'
import { AlertDialog } from '../ui/AlertDialog'

interface Props {
  ultrasound: Ultrasound
  isLast?: boolean
  onEdit?: (u: Ultrasound) => void
  onDelete?: (id: string) => void
}

const typeLabels: Record<Ultrasound['type'], string> = {
  morphological: 'Morfológica',
  obstetric: 'Obstétrica',
  doppler: 'Doppler',
  transvaginal: 'Transvaginal',
}

export function UltrasoundEvent({ ultrasound: u, isLast = false, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const showBiometry = u.biometry.bpd > 0

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-purple-100 border-2 border-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5 z-10">
          <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
          </svg>
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
      </div>

      <div className="flex-1 pb-6">
        <div className="bg-surface rounded-card shadow-card p-4 hover:shadow-card-hover transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-purple-500 uppercase tracking-wide">
                  Ultrassonografia
                </span>
                <span className="text-xs bg-purple-50 text-purple-500 px-2 py-0.5 rounded-pill font-medium border border-purple-100">
                  {typeLabels[u.type]}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{formatDate(u.date)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block bg-purple-50 text-purple-500 text-xs font-bold px-2.5 py-1 rounded-pill border border-purple-100">
                {u.gestationalWeeks}s {u.gestationalDays > 0 ? `+ ${u.gestationalDays}d` : ''}
              </span>
              {onEdit && (
                <button
                  onClick={() => onEdit(u)}
                  title="Editar ultrassonografia"
                  className="p-1.5 rounded-lg text-muted hover:text-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => setDeleteOpen(true)}
                  title="Excluir ultrassonografia"
                  className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/8 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Métricas principais — sempre visíveis */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <BiomCard label="BCF" value={`${u.fetalHeartRate}`} unit="bpm" />
            {showBiometry && (
              <>
                <BiomCard label="DBP" value={`${u.biometry.bpd}`} unit="mm" />
                <BiomCard label="Peso est." value={`${u.estimatedWeight}`} unit="g" />
                <BiomCard label="CF" value={`${u.biometry.fl}`} unit="mm" />
              </>
            )}
          </div>

          {/* Biometria completa + detalhes — expandíveis */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-purple-500 font-medium hover:opacity-75 transition-opacity mb-2"
          >
            {expanded ? 'Ocultar detalhes' : 'Ver detalhes completos'}
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
            <>
              {showBiometry && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <BiomCard label="PC" value={`${u.biometry.hc}`} unit="mm" />
                  <BiomCard label="CA" value={`${u.biometry.ac}`} unit="mm" />
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-3">
                <InfoPill label="Placenta" value={u.placentaLocation} />
                <InfoPill label="LA" value={u.amnioticFluid} />
                <InfoPill label="Apresentação" value={u.fetalPresentation} />
              </div>
              {u.notes && (
                <p className="text-sm text-gray-600 leading-relaxed border-t border-border pt-3">
                  {u.notes}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <AlertDialog
        open={deleteOpen}
        title="Excluir ultrassonografia"
        message="Esta ação é permanente e não pode ser desfeita."
        confirmLabel="Excluir"
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => onDelete!(u.id)}
      />
    </div>
  )
}

function BiomCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-bg rounded-xl px-3 py-2">
      <p className="text-xs text-muted mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-800">
        {value} <span className="text-xs font-normal text-muted">{unit}</span>
      </p>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  if (!value || value === 'N/A') return null
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-bg border border-border text-gray-600 px-2.5 py-1 rounded-pill">
      <span className="text-muted font-medium">{label}:</span> {value}
    </span>
  )
}
