import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { mockPatients } from '../data/mockPatients'
import { getConsultationsByPatient, deleteConsultation } from '../data/mockConsultations'
import { getExamsByPatient, deleteExam } from '../data/mockExams'
import { getUltrasoundsByPatient, deleteUltrasound } from '../data/mockUltrasounds'
import { PatientHeader, ModoConsulta } from '../components/patient'
import { PregnancyTimeline } from '../components/timeline'
import { WeightChart, UterineHeightChart } from '../components/charts'
import { ConsultationFormDrawer, ExamFormDrawer, UltrasoundFormDrawer, PatientFormDrawer } from '../components/forms'
import { AlertDialog } from '../components/ui'
import { archivePatient } from '../data/mockPatients'
import {
  calculateEDD,
  formatEDD,
  gestationalAge,
  pregnancyProgress,
  getTrimesterLabel,
  formatDate,
} from '../lib/gestation'
import { Toast, useToast } from '../components/ui'
import type { Consultation, Exam, Patient, Ultrasound } from '../types'

export function PatientTimelinePage() {
  const { id } = useParams<{ id: string }>()

  // Todos os hooks devem ser chamados antes de qualquer retorno condicional
  const [patient, setPatient] = useState<Patient | undefined>(() =>
    mockPatients.find((p) => p.id === id),
  )
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [consultationDrawerOpen, setConsultationDrawerOpen] = useState(false)
  const [editingConsultation, setEditingConsultation] = useState<Consultation | undefined>(undefined)
  const [editingExam, setEditingExam] = useState<Exam | undefined>(undefined)
  const [examDrawerOpen, setExamDrawerOpen] = useState(false)
  const [usgDrawerOpen, setUsgDrawerOpen] = useState(false)
  const [editingUltrasound, setEditingUltrasound] = useState<Ultrasound | undefined>(undefined)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const { toastMessage, showToast } = useToast()

  const [consultations, setConsultations] = useState<Consultation[]>(() =>
    patient ? getConsultationsByPatient(patient.id) : [],
  )
  const [exams, setExams] = useState<Exam[]>(() =>
    patient ? getExamsByPatient(patient.id) : [],
  )
  const [ultrasounds, setUltrasounds] = useState<Ultrasound[]>(() =>
    patient ? getUltrasoundsByPatient(patient.id) : [],
  )

  if (!patient) return <Navigate to="/" replace />

  function refreshData() {
    setConsultations(getConsultationsByPatient(patient!.id))
    setExams(getExamsByPatient(patient!.id))
    setUltrasounds(getUltrasoundsByPatient(patient!.id))
  }

  function handlePatientSaved() {
    const updated = mockPatients.find((p) => p.id === patient!.id)
    if (updated) setPatient({ ...updated })
    showToast('Gestante atualizada com sucesso')
  }

  function handleArchiveConfirm() {
    archivePatient(patient!.id)
    setPatient((prev) => prev ? { ...prev, status: 'arquivada' } : prev)
    showToast('Acompanhamento encerrado com sucesso')
  }

  function handleEditConsultation(c: Consultation) {
    setEditingConsultation(c)
    setConsultationDrawerOpen(true)
  }

  function handleConsultationSaved() {
    const msg = editingConsultation ? 'Consulta atualizada com sucesso' : 'Consulta registrada com sucesso'
    refreshData()
    showToast(msg)
  }

  function handleDeleteConsultation(id: string) {
    deleteConsultation(id)
    refreshData()
    showToast('Consulta excluída com sucesso')
  }

  function handleEditExam(e: Exam) {
    setEditingExam(e)
    setExamDrawerOpen(true)
  }

  function handleExamSaved() {
    const msg = editingExam ? 'Exame atualizado com sucesso' : 'Exame registrado com sucesso'
    refreshData()
    showToast(msg)
  }

  function handleDeleteExam(id: string) {
    deleteExam(id)
    refreshData()
    showToast('Exame excluído com sucesso')
  }

  function handleEditUltrasound(u: Ultrasound) {
    setEditingUltrasound(u)
    setUsgDrawerOpen(true)
  }

  function handleUltrasoundSaved() {
    const msg = editingUltrasound ? 'Ultrassonografia atualizada com sucesso' : 'Ultrassonografia registrada com sucesso'
    refreshData()
    showToast(msg)
  }

  function handleDeleteUltrasound(id: string) {
    deleteUltrasound(id)
    refreshData()
    showToast('Ultrassonografia excluída com sucesso')
  }

  // Derivados do estado — reativos automaticamente a qualquer nova inserção
  const totalRecords = consultations.length + exams.length + ultrasounds.length

  const lastConsultation =
    consultations.length > 0
      ? [...consultations].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )[0]
      : undefined

  const edd = calculateEDD(patient.dum)
  const { weeks, days } = gestationalAge(patient.dum)
  const progress = pregnancyProgress(weeks, days)
  const trimester = getTrimesterLabel(weeks)
  const daysRemaining = Math.max(
    0,
    Math.ceil((edd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  )

  const bpAlert =
    lastConsultation &&
    (lastConsultation.vitalSigns.systolic >= 140 ||
      lastConsultation.vitalSigns.diastolic >= 90)

  return (
    <div className="min-h-screen bg-bg">
      <PatientHeader
        patient={patient}
        activeTab="timeline"
        onEdit={() => setEditDrawerOpen(true)}
        onArchive={() => setArchiveDialogOpen(true)}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Modo Consulta — suporte à decisão clínica */}
        <ModoConsulta
          patient={patient}
          consultations={consultations}
          exams={exams}
        />

        {/* Separador: histórico clínico completo */}
        <div className="flex items-center gap-3 mb-6 mt-8">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted uppercase tracking-widest font-medium">
            Histórico Clínico
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Faixa de resumo clínico */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Card IG */}
          <div className="bg-gradient-to-br from-primary to-primary-light rounded-card p-5 text-white shadow-card">
            <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-2">
              Idade Gestacional
            </p>
            <div className="flex items-baseline gap-1.5 mb-0.5">
              <span className="text-4xl font-bold leading-none">{weeks}</span>
              <span className="text-lg font-semibold">sem.</span>
              {days > 0 && (
                <span className="text-white/70 text-sm font-medium">+ {days}d</span>
              )}
            </div>
            <p className="text-white/60 text-xs mb-3">{trimester}</p>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/80 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white/50 text-xs mt-1.5 text-right">{progress}% concluída</p>
          </div>

          {/* Card DPP */}
          <div className="bg-surface rounded-card shadow-card p-5 flex flex-col justify-between">
            <p className="text-xs text-muted uppercase tracking-wide font-medium mb-3">
              Data Provável do Parto
            </p>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-tight">{formatEDD(edd)}</p>
              <p className="text-xs text-muted mt-1">
                {daysRemaining > 0
                  ? `Faltam ${daysRemaining} dias`
                  : 'Data estimada atingida'}
              </p>
            </div>
            <p className="text-xs text-muted/70 mt-3 pt-3 border-t border-border">
              DUM: {formatDate(patient.dum)}
            </p>
          </div>

          {/* Card Condições / Última Consulta */}
          <div className="bg-surface rounded-card shadow-card p-5">
            <p className="text-xs text-muted uppercase tracking-wide font-medium mb-3">
              Condições Ativas
            </p>
            <div className="space-y-1.5 mb-3">
              <ConditionTags patient={patient} />
            </div>
            {lastConsultation && (
              <div
                className={`mt-3 pt-3 border-t border-border flex items-center gap-2 ${bpAlert ? 'text-danger' : 'text-muted'}`}
              >
                <svg
                  className="w-3.5 h-3.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span
                  className={`text-xs font-semibold ${bpAlert ? 'text-danger' : 'text-gray-700'}`}
                >
                  PA {lastConsultation.vitalSigns.systolic}/
                  {lastConsultation.vitalSigns.diastolic} mmHg
                </span>
                <span className="text-xs text-muted ml-auto">
                  {lastConsultation.gestationalWeeks}s
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Gráficos clínicos */}
        <div className="mb-10">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Gráficos Clínicos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <WeightChart consultations={consultations} />
            <UterineHeightChart consultations={consultations} />
          </div>
        </div>

        {/* Cabeçalho da linha do tempo */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h2 className="text-base font-semibold text-gray-800">Linha do Tempo Gestacional</h2>
          <span className="text-xs text-muted bg-border/50 px-2.5 py-1 rounded-pill">
            {totalRecords} registros
          </span>
          <div className="ml-auto flex items-center gap-2">
            <ActionButton
              label="Consulta"
              color="primary"
              onClick={() => { setEditingConsultation(undefined); setConsultationDrawerOpen(true) }}
            />
            <ActionButton
              label="Exame"
              color="accent"
              onClick={() => { setEditingExam(undefined); setExamDrawerOpen(true) }}
            />
            <ActionButton
              label="USG"
              color="purple"
              onClick={() => { setEditingUltrasound(undefined); setUsgDrawerOpen(true) }}
            />
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-3 mb-6">
          <Legend color="bg-primary" label="Consulta" />
          <Legend color="bg-accent" label="Exame" />
          <Legend color="bg-purple-400" label="USG" />
        </div>

        {/* Linha do tempo */}
        <PregnancyTimeline
          consultations={consultations}
          exams={exams}
          ultrasounds={ultrasounds}
          dum={patient.dum}
          onEditConsultation={handleEditConsultation}
          onDeleteConsultation={handleDeleteConsultation}
          onEditExam={handleEditExam}
          onDeleteExam={handleDeleteExam}
          onEditUltrasound={handleEditUltrasound}
          onDeleteUltrasound={handleDeleteUltrasound}
        />
      </main>

      <ConsultationFormDrawer
        open={consultationDrawerOpen}
        onClose={() => { setConsultationDrawerOpen(false); setEditingConsultation(undefined) }}
        onSaved={handleConsultationSaved}
        patientId={patient.id}
        dum={patient.dum}
        initialValues={editingConsultation}
      />
      <ExamFormDrawer
        open={examDrawerOpen}
        onClose={() => { setExamDrawerOpen(false); setEditingExam(undefined) }}
        onSaved={handleExamSaved}
        patientId={patient.id}
        dum={patient.dum}
        initialValues={editingExam}
      />
      <UltrasoundFormDrawer
        open={usgDrawerOpen}
        onClose={() => { setUsgDrawerOpen(false); setEditingUltrasound(undefined) }}
        onSaved={handleUltrasoundSaved}
        patientId={patient.id}
        dum={patient.dum}
        initialValues={editingUltrasound}
      />
      <PatientFormDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        onSaved={handlePatientSaved}
        initialValues={patient}
      />
      <AlertDialog
        open={archiveDialogOpen}
        title="Encerrar acompanhamento"
        message={`Deseja encerrar o acompanhamento de ${patient.name}? Os dados serão preservados e a paciente ficará arquivada.`}
        confirmLabel="Encerrar"
        onClose={() => setArchiveDialogOpen(false)}
        onConfirm={handleArchiveConfirm}
      />
      <Toast message={toastMessage} />
    </div>
  )
}

function ActionButton({
  label,
  color,
  onClick,
}: {
  label: string
  color: 'primary' | 'accent' | 'purple'
  onClick: () => void
}) {
  const cls =
    color === 'primary'
      ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15'
      : color === 'accent'
        ? 'bg-accent/15 text-primary border-accent/20 hover:bg-accent/25'
        : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${cls}`}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </button>
  )
}

function ConditionTags({ patient }: { patient: Patient }) {
  if (patient.riskLevel === 'high') {
    return (
      <>
        <ConditionTag label="Hipertensão Gestacional" color="danger" />
        <ConditionTag label="Diabetes Gestacional" color="warning" />
        <ConditionTag label="Monitoramento 2× por semana" color="default" />
      </>
    )
  }
  if (patient.riskLevel === 'medium') {
    return (
      <>
        <ConditionTag label="Cesárea anterior" color="warning" />
        <ConditionTag label="Acompanhamento rotineiro" color="default" />
      </>
    )
  }
  return <ConditionTag label="Gestação de baixo risco" color="success" />
}

function ConditionTag({ label, color }: { label: string; color: string }) {
  const cls =
    color === 'danger'
      ? 'bg-danger/8 text-danger border border-danger/15'
      : color === 'warning'
        ? 'bg-warning/8 text-warning border border-warning/15'
        : color === 'success'
          ? 'bg-success/8 text-success border border-success/15'
          : 'bg-bg text-muted border border-border'
  return <div className={`text-xs font-medium px-3 py-1.5 rounded-xl ${cls}`}>{label}</div>
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-muted">{label}</span>
    </div>
  )
}
