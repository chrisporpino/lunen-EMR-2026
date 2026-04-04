import { useState, useEffect, useCallback } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { getPatient, archivePatient } from '../services/patients'
import { getExamsByPatient, deleteExam } from '../services/exams'
import { getUltrasoundsByPatient, deleteUltrasound } from '../services/ultrasounds'
import { PatientHeader } from '../components/patient'
import { ExamEvent, UltrasoundEvent } from '../components/timeline'
import { ExamFormDrawer, UltrasoundFormDrawer, PatientFormDrawer } from '../components/forms'
import { Toast, useToast, AlertDialog } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import type { Exam, Patient, Ultrasound } from '../types'

type Filter = 'all' | 'lab' | 'imaging'

type MergedItem =
  | { kind: 'exam'; data: Exam }
  | { kind: 'ultrasound'; data: Ultrasound }

const mergeAndSort = (exams: Exam[], ultrasounds: Ultrasound[]): MergedItem[] =>
  [
    ...exams.map((e): MergedItem => ({ kind: 'exam', data: e })),
    ...ultrasounds.map((u): MergedItem => ({ kind: 'ultrasound', data: u })),
  ].sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())

export function PatientExams() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const [patient, setPatient] = useState<Patient | null | undefined>(undefined)
  const [exams, setExams] = useState<Exam[]>([])
  const [ultrasounds, setUltrasounds] = useState<Ultrasound[]>([])
  const [loading, setLoading] = useState(true)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [examDrawerOpen, setExamDrawerOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | undefined>(undefined)
  const [usgDrawerOpen, setUsgDrawerOpen] = useState(false)
  const [editingUltrasound, setEditingUltrasound] = useState<Ultrasound | undefined>(undefined)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const { toastMessage, showToast } = useToast()

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [p, exs, usgs] = await Promise.all([
        getPatient(id),
        getExamsByPatient(id),
        getUltrasoundsByPatient(id),
      ])
      setPatient(p)
      setExams(exs)
      setUltrasounds(usgs)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <svg className="w-6 h-6 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!patient) return <Navigate to="/" replace />

  async function handlePatientSaved() {
    const updated = await getPatient(patient!.id)
    if (updated) setPatient(updated)
    showToast('Gestante atualizada com sucesso')
  }

  async function handleArchiveConfirm() {
    if (!user) return
    await archivePatient(patient!.id, user.id)
    setPatient((prev) => prev ? { ...prev, status: 'arquivada' } : prev)
    showToast('Acompanhamento encerrado com sucesso')
  }

  async function handleExamSaved() {
    const msg = editingExam ? 'Exame atualizado' : 'Exame registrado'
    const exs = await getExamsByPatient(patient!.id)
    setExams(exs)
    showToast(msg)
  }

  async function handleDeleteExam(eid: string) {
    await deleteExam(eid)
    setExams((prev) => prev.filter((e) => e.id !== eid))
    showToast('Exame excluído')
  }

  async function handleUltrasoundSaved() {
    const msg = editingUltrasound ? 'Ultrassonografia atualizada' : 'Ultrassonografia registrada'
    const usgs = await getUltrasoundsByPatient(patient!.id)
    setUltrasounds(usgs)
    showToast(msg)
  }

  async function handleDeleteUltrasound(uid: string) {
    await deleteUltrasound(uid)
    setUltrasounds((prev) => prev.filter((u) => u.id !== uid))
    showToast('Ultrassonografia excluída')
  }

  const filterLabels: Record<Filter, string> = { all: 'Todos', lab: 'Laboratório', imaging: 'Imagem' }

  return (
    <div className="min-h-screen bg-bg">
      <PatientHeader
        patient={patient}
        activeTab="exams"
        onEdit={() => setEditDrawerOpen(true)}
        onArchive={() => setArchiveDialogOpen(true)}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-800">Exames e Imagem</h2>
            <p className="text-xs text-muted mt-0.5">
              {exams.length} exames laboratoriais · {ultrasounds.length} ultrassonografias
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditingExam(undefined); setExamDrawerOpen(true) }}
              className="flex items-center gap-1.5 px-3 py-2 bg-accent/15 text-primary text-xs font-semibold rounded-xl hover:bg-accent/25 transition-colors border border-accent/20"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Novo Exame
            </button>
            <button
              onClick={() => { setEditingUltrasound(undefined); setUsgDrawerOpen(true) }}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-600 text-xs font-semibold rounded-xl hover:bg-purple-100 transition-colors border border-purple-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Nova USG
            </button>
          </div>

          <div className="flex gap-1 bg-bg border border-border rounded-xl p-1">
            {(['all', 'lab', 'imaging'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  filter === f ? 'bg-surface shadow-card text-primary' : 'text-muted hover:text-gray-700'
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-2xl space-y-0">
          {filter === 'all' && (() => {
            const merged = mergeAndSort(exams, ultrasounds)
            if (merged.length === 0) return <EmptyState label="Nenhum exame registrado." />
            return merged.map((item, i) => {
              const isLast = i === merged.length - 1
              if (item.kind === 'exam') {
                return (
                  <ExamEvent
                    key={item.data.id}
                    exam={item.data}
                    isLast={isLast}
                    onEdit={(e) => { setEditingExam(e); setExamDrawerOpen(true) }}
                    onDelete={handleDeleteExam}
                  />
                )
              }
              return (
                <UltrasoundEvent
                  key={item.data.id}
                  ultrasound={item.data}
                  isLast={isLast}
                  onEdit={(u) => { setEditingUltrasound(u); setUsgDrawerOpen(true) }}
                  onDelete={handleDeleteUltrasound}
                />
              )
            })
          })()}

          {filter === 'lab' && (
            exams.length === 0
              ? <EmptyState label="Nenhum exame laboratorial registrado." />
              : exams.map((e, i) => (
                  <ExamEvent
                    key={e.id}
                    exam={e}
                    isLast={i === exams.length - 1}
                    onEdit={(ex) => { setEditingExam(ex); setExamDrawerOpen(true) }}
                    onDelete={handleDeleteExam}
                  />
                ))
          )}

          {filter === 'imaging' && (
            ultrasounds.length === 0
              ? <EmptyState label="Nenhuma ultrassonografia registrada." />
              : ultrasounds.map((u, i) => (
                  <UltrasoundEvent
                    key={u.id}
                    ultrasound={u}
                    isLast={i === ultrasounds.length - 1}
                    onEdit={(us) => { setEditingUltrasound(us); setUsgDrawerOpen(true) }}
                    onDelete={handleDeleteUltrasound}
                  />
                ))
          )}
        </div>
      </main>

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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-20 text-muted">
      <svg className="w-12 h-12 mx-auto mb-3 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
      <p className="text-sm">{label}</p>
    </div>
  )
}
