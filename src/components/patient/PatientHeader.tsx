import { Link } from 'react-router-dom'
import type { Patient } from '../../types'
import { RiskBadge } from '../ui/RiskBadge'
import { gestationalAge, formatDate, calculateEDD, formatEDD } from '../../lib/gestation'

interface Props {
  patient: Patient
  activeTab?: 'timeline' | 'consultations' | 'exams'
  onEdit?: () => void
  onArchive?: () => void
}

const tabs = [
  { id: 'timeline', label: 'Evolução', path: '' },
  { id: 'consultations', label: 'Consultas', path: '/consultations' },
  { id: 'exams', label: 'Exames', path: '/exams' },
]

export function PatientHeader({ patient, activeTab = 'timeline', onEdit, onArchive }: Props) {
  const { weeks, days } = gestationalAge(patient.dum)
  const edd = calculateEDD(patient.dum)

  return (
    <div className="bg-surface border-b border-border">
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-0">
        {/* Breadcrumb */}
        <Link
          to="/"
          className="text-sm text-muted hover:text-primary transition-colors mb-4 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Gestantes
        </Link>

        <div className="flex items-start justify-between mt-2 mb-5">
          {/* Dados da paciente */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {patient.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{patient.name}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-muted">Nasc. {formatDate(patient.dateOfBirth)}</span>
                  <span className="text-muted/40">·</span>
                  <span className="text-sm text-muted">
                    G{patient.gravidity}P{patient.parity}
                  </span>
                  <span className="text-muted/40">·</span>
                  <span className="text-sm text-muted">{patient.bloodType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Informações gestacionais + ação */}
          <div className="text-right hidden sm:block">
            <div className="flex items-baseline gap-1.5 justify-end">
              <span className="text-3xl font-bold text-primary">{weeks}</span>
              <span className="text-base font-medium text-primary/80">sem</span>
              {days > 0 && (
                <span className="text-base text-muted font-medium">+ {days}d</span>
              )}
            </div>
            <p className="text-sm text-muted mt-0.5">
              DPP <span className="font-medium text-gray-700">{formatEDD(edd)}</span>
            </p>
            <div className="mt-1.5 flex items-center justify-end gap-2 flex-wrap">
              {patient.status === 'arquivada' ? (
                <span className="text-xs font-medium text-muted bg-muted/10 border border-muted/20 px-2.5 py-1 rounded-pill">
                  Arquivada
                </span>
              ) : (
                <RiskBadge level={patient.riskLevel} size="sm" />
              )}
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="text-xs text-muted hover:text-primary transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Editar cadastro
                </button>
              )}
              {patient.status !== 'arquivada' && onArchive && (
                <button
                  onClick={onArchive}
                  className="text-xs text-muted hover:text-danger transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Encerrar acompanhamento
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile: risco + DPP */}
        <div className="flex items-center gap-3 mb-4 sm:hidden">
          {patient.status === 'arquivada' ? (
            <span className="text-xs font-medium text-muted bg-muted/10 border border-muted/20 px-2.5 py-1 rounded-pill">
              Arquivada
            </span>
          ) : (
            <RiskBadge level={patient.riskLevel} size="sm" />
          )}
          <span className="text-sm text-muted">
            {weeks}s {days}d · DPP {formatEDD(edd)}
          </span>
        </div>

        {/* Abas */}
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={`/patient/${patient.id}${tab.path}`}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-gray-700 hover:border-border'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
