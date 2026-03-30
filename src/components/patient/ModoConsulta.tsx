import type { Patient, Consultation, Exam } from '../../types'
import { gestationalAge, calculateEDD } from '../../lib/gestation'
import {
  deriveAlerts,
  deriveCondutas,
  deriveActions,
  getLastTwoConsultations,
  daysAgo,
  formatDaysAgo,
  type ConsultaAlert,
} from '../../lib/consultaMode'

interface Props {
  patient: Patient
  consultations: Consultation[]
  exams: Exam[]
}

export function ModoConsulta({ patient, consultations, exams }: Props) {
  const { weeks } = gestationalAge(patient.dum)
  const edd = calculateEDD(patient.dum)
  const daysRemaining = Math.max(
    0,
    Math.ceil((edd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  )
  const sorted = [...consultations].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
  const lastConsult = sorted[0]
  const lastConsultDays = lastConsult ? daysAgo(lastConsult.date) : null

  const alerts   = deriveAlerts(consultations, exams)
  const condutas = alerts.length > 0 ? deriveCondutas(alerts) : []
  const actions  = deriveActions(consultations, exams, weeks)
  const lastTwo  = getLastTwoConsultations(consultations)

  return (
    <section aria-label="Modo Consulta" className="mb-2 space-y-3">

      {/* Cabeçalho da seção */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">
          Modo Consulta
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* ── Zone 1 — Briefing para hoje ──────────────────────────────────── */}
      <div className="bg-surface rounded-card shadow-card px-4 py-3">
        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-3">
          Briefing para hoje
        </p>
        <div className="grid grid-cols-3 divide-x divide-border">
          {/* Última consulta */}
          <div className="pr-4">
            <p className={`text-sm font-semibold leading-snug ${
              lastConsultDays !== null && lastConsultDays > 30 ? 'text-warning' : 'text-gray-800'
            }`}>
              {lastConsultDays !== null ? formatDaysAgo(lastConsultDays) : '—'}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {lastConsultDays !== null ? 'última consulta' : 'primeira consulta'}
            </p>
          </div>

          {/* Dias até o parto */}
          <div className="px-4">
            <p className="text-sm font-semibold text-gray-800 leading-snug">
              {daysRemaining > 0 ? daysRemaining : '—'}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {daysRemaining > 0 ? 'dias p/ o parto' : 'data atingida'}
            </p>
          </div>

          {/* Situação */}
          <div className="pl-4">
            {(() => {
              const hasDanger = alerts.some(a => a.severity === 'danger')
              const alertColor = alerts.length === 0
                ? 'text-gray-800'
                : hasDanger ? 'text-danger' : 'text-warning'
              return (
                <>
                  <p className={`text-sm font-semibold leading-snug ${alertColor}`}>
                    {alerts.length === 0
                      ? 'sem alertas'
                      : `${alerts.length} alerta${alerts.length > 1 ? 's' : ''}`}
                  </p>
                  <p className="text-xs text-muted mt-0.5">situação hoje</p>
                </>
              )
            })()}
          </div>
        </div>
      </div>

      {/* ── Zone 2 — Alertas Ativos ────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="rounded-card overflow-hidden border border-border">
          <div className="bg-bg px-4 py-2 border-b border-border">
            <span className="text-xs font-bold text-muted uppercase tracking-widest">
              Alertas Ativos
            </span>
          </div>
          <div className="divide-y divide-border">
            {alerts.map((alert, i) => (
              <AlertRow key={i} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* ── Zone 2.5 — Conduta sugerida ───────────────────────────────────── */}
      {condutas.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-card px-4 py-3">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2.5">
            Conduta sugerida para hoje
          </p>
          <ul className="space-y-1.5">
            {condutas.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-primary font-bold flex-shrink-0 mt-px">→</span>
                <span>{c.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Zone 3 — O que mudou ──────────────────────────────────────────── */}
      <OQueMudou consultations={lastTwo} />

      {/* ── Zone 4 — Ações Necessárias ────────────────────────────────────── */}
      {actions.length > 0 && (
        <div className="bg-surface rounded-card shadow-card px-4 py-3">
          <p className="text-xs font-bold text-muted uppercase tracking-widest mb-3">
            Ações Necessárias
          </p>
          <ul className="space-y-2.5">
            {actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-800">
                <span className="w-4 h-4 rounded border-2 border-muted/30 flex-shrink-0 mt-0.5" />
                <span>{action.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

// ─── Componentes internos ─────────────────────────────────────────────────────

function AlertRow({ alert }: { alert: ConsultaAlert }) {
  const isDanger = alert.severity === 'danger'
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 ${
        isDanger ? 'bg-danger/5' : 'bg-warning/5'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          isDanger ? 'bg-danger' : 'bg-warning'
        }`}
      />
      <span
        className={`text-sm font-medium leading-snug ${
          isDanger ? 'text-danger' : 'text-warning'
        }`}
      >
        {alert.message}
      </span>
    </div>
  )
}

function OQueMudou({ consultations }: { consultations: Consultation[] }) {
  if (consultations.length === 0) {
    return (
      <div className="bg-surface rounded-card shadow-card px-4 py-4">
        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-2">
          O que mudou
        </p>
        <p className="text-sm text-muted">Primeira consulta — sem histórico anterior.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-card shadow-card px-4 py-3">
      <p className="text-xs font-bold text-muted uppercase tracking-widest mb-3">O que mudou</p>
      <div className="space-y-3">
        {consultations.map((c, i) => {
          const d    = daysAgo(c.date)
          const label = i === 0 ? 'Última consulta' : 'Consulta anterior'
          const bcf  = c.fetalHeartRate > 0 ? `${c.fetalHeartRate} bpm` : '—'
          const au   = c.uterineHeight   > 0 ? `${c.uterineHeight} cm` : '—'
          const bpDanger =
            c.vitalSigns.systolic >= 140 || c.vitalSigns.diastolic >= 90
          const bcfDanger =
            c.fetalHeartRate > 0 &&
            (c.fetalHeartRate < 120 || c.fetalHeartRate > 160)

          return (
            <div key={c.id} className={i > 0 ? 'pt-3 border-t border-border' : ''}>
              <p className="text-xs text-muted mb-2">
                <span className="font-semibold text-gray-700">{label}</span>
                {' '}— {formatDaysAgo(d)}{' '}
                <span className="text-muted/60">
                  ({c.gestationalWeeks}s+{c.gestationalDays}d)
                </span>
              </p>
              <div className="grid grid-cols-4 gap-2">
                <Signal
                  label="PA"
                  value={`${c.vitalSigns.systolic}/${c.vitalSigns.diastolic}`}
                  danger={bpDanger}
                />
                <Signal label="BCF"  value={bcf}                              danger={bcfDanger} />
                <Signal label="AU"   value={au} />
                <Signal label="Peso" value={`${c.vitalSigns.weight} kg`} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Signal({
  label,
  value,
  danger,
}: {
  label: string
  value: string
  danger?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-muted mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${danger ? 'text-danger' : 'text-gray-800'}`}>
        {value}
      </p>
    </div>
  )
}
