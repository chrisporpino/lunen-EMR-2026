import { useState, useEffect, useCallback } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { getPatient, archivePatient } from '../services/patients'
import { getConsultationsByPatient, deleteConsultation } from '../services/consultations'
import { PatientHeader } from '../components/patient'
import { ConsultationEvent } from '../components/timeline'
import { ConsultationFormDrawer, PatientFormDrawer } from '../components/forms'
import { Toast, useToast, AlertDialog } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import type { Consultation, Patient } from '../types'

export function PatientConsultations() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const [patient, setPatient] = useState<Patient | null | undefined>(undefined)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingConsultation, setEditingConsultation] = useState<Consultation | undefined>(undefined)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const { toastMessage, showToast } = useToast()

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [p, cons] = await Promise.all([getPatient(id), getConsultationsByPatient(id)])
      setPatient(p)
      setConsultations(cons)
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

  async function refreshConsultations() {
    const cons = await getConsultationsByPatient(patient!.id)
    setConsultations(cons)
  }

  async function handleConsultationSaved() {
    const msg = editingConsultation ? 'Consulta atualizada' : 'Consulta registrada'
    await refreshConsultations()
    showToast(msg)
  }

  async function handleDeleteConsultation(cid: string) {
    await deleteConsultation(cid)
    setConsultations((prev) => prev.filter((c) => c.id !== cid))
    showToast('Consulta excluída')
  }

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

  return (
    <div className="min-h-screen bg-bg">
      <PatientHeader
        patient={patient}
        activeTab="consultations"
        onEdit={() => setEditDrawerOpen(true)}
        onArchive={() => setArchiveDialogOpen(true)}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Consultas</h2>
            <p className="text-xs text-muted mt-0.5">{consultations.length} consultas registradas</p>
          </div>
          <button
            onClick={() => { setEditingConsultation(undefined); setDrawerOpen(true) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors shadow-card"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nova Consulta
          </button>
        </div>

        {consultations.length === 0 ? (
          <EmptyState label="Nenhuma consulta registrada." />
        ) : (
          <div className="max-w-2xl">
            {consultations.map((c, i) => (
              <ConsultationEvent
                key={c.id}
                consultation={c}
                isLast={i === consultations.length - 1}
                onEdit={(cons) => { setEditingConsultation(cons); setDrawerOpen(true) }}
                onDelete={handleDeleteConsultation}
              />
            ))}
          </div>
        )}
      </main>

      <ConsultationFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingConsultation(undefined) }}
        onSaved={handleConsultationSaved}
        patientId={patient.id}
        dum={patient.dum}
        initialValues={editingConsultation}
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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p className="text-sm">{label}</p>
    </div>
  )
}
