import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { mockPatients } from '../data/mockPatients'
import { getConsultationsByPatient, deleteConsultation } from '../data/mockConsultations'
import { PatientHeader } from '../components/patient'
import { ConsultationEvent } from '../components/timeline'
import { ConsultationFormDrawer, PatientFormDrawer } from '../components/forms'
import type { Consultation, Patient } from '../types'

export function PatientConsultations() {
  const { id } = useParams<{ id: string }>()

  // Hooks must be called before any early return
  const [patient, setPatient] = useState<Patient | undefined>(() =>
    mockPatients.find((p) => p.id === id),
  )
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingConsultation, setEditingConsultation] = useState<Consultation | undefined>(undefined)
  const [consultations, setConsultations] = useState<Consultation[]>(() =>
    patient
      ? getConsultationsByPatient(patient.id).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
      : [],
  )

  if (!patient) return <Navigate to="/" replace />

  function refreshConsultations() {
    setConsultations(
      getConsultationsByPatient(patient!.id).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    )
  }

  function handleEditConsultation(c: Consultation) {
    setEditingConsultation(c)
    setDrawerOpen(true)
  }

  function handleDeleteConsultation(id: string) {
    deleteConsultation(id)
    refreshConsultations()
  }

  function handlePatientSaved() {
    const updated = mockPatients.find((p) => p.id === patient!.id)
    if (updated) setPatient({ ...updated })
  }

  return (
    <div className="min-h-screen bg-bg">
      <PatientHeader patient={patient} activeTab="consultations" onEdit={() => setEditDrawerOpen(true)} />

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
                onEdit={handleEditConsultation}
                onDelete={handleDeleteConsultation}
              />
            ))}
          </div>
        )}
      </main>

      <ConsultationFormDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingConsultation(undefined) }}
        onSaved={refreshConsultations}
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
