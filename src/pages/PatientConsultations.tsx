import { useParams, Navigate } from 'react-router-dom'
import { mockPatients } from '../data/mockPatients'
import { getConsultationsByPatient } from '../data/mockConsultations'
import { PatientHeader } from '../components/patient'
import { ConsultationEvent } from '../components/timeline'

export function PatientConsultations() {
  const { id } = useParams<{ id: string }>()
  const patient = mockPatients.find((p) => p.id === id)

  if (!patient) return <Navigate to="/" replace />

  const consultations = getConsultationsByPatient(patient.id).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  return (
    <div className="min-h-screen bg-bg">
      <PatientHeader patient={patient} activeTab="consultations" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Consultas</h2>
            <p className="text-xs text-muted mt-0.5">{consultations.length} consultas registradas</p>
          </div>
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
              />
            ))}
          </div>
        )}
      </main>
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
