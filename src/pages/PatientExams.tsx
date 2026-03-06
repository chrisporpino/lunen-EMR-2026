import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { mockPatients } from '../data/mockPatients'
import { getExamsByPatient } from '../data/mockExams'
import { getUltrasoundsByPatient } from '../data/mockUltrasounds'
import { PatientHeader } from '../components/patient'
import { ExamEvent, UltrasoundEvent } from '../components/timeline'

type Filter = 'all' | 'lab' | 'imaging'

export function PatientExams() {
  const { id } = useParams<{ id: string }>()
  const [filter, setFilter] = useState<Filter>('all')

  const patient = mockPatients.find((p) => p.id === id)
  if (!patient) return <Navigate to="/" replace />

  const exams = getExamsByPatient(patient.id).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
  const ultrasounds = getUltrasoundsByPatient(patient.id).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  const filterLabels: Record<Filter, string> = {
    all: 'Todos',
    lab: 'Laboratório',
    imaging: 'Imagem',
  }

  return (
    <div className="min-h-screen bg-bg">
      <PatientHeader patient={patient} activeTab="exams" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Exames e Imagem</h2>
            <p className="text-xs text-muted mt-0.5">
              {exams.length} exames laboratoriais · {ultrasounds.length} ultrassonografias
            </p>
          </div>
          {/* Filtros */}
          <div className="flex gap-1 bg-bg border border-border rounded-xl p-1">
            {(['all', 'lab', 'imaging'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  filter === f
                    ? 'bg-surface shadow-card text-primary'
                    : 'text-muted hover:text-gray-700'
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-2xl space-y-0">
          {(filter === 'all' || filter === 'imaging') &&
            ultrasounds.map((u, i) => (
              <UltrasoundEvent
                key={u.id}
                ultrasound={u}
                isLast={filter === 'imaging' && i === ultrasounds.length - 1}
              />
            ))}

          {(filter === 'all' || filter === 'lab') &&
            exams.map((e, i) => (
              <ExamEvent
                key={e.id}
                exam={e}
                isLast={i === exams.length - 1}
              />
            ))}

          {filter === 'lab' && exams.length === 0 && (
            <EmptyState label="Nenhum exame laboratorial registrado." />
          )}
          {filter === 'imaging' && ultrasounds.length === 0 && (
            <EmptyState label="Nenhuma ultrassonografia registrada." />
          )}
          {filter === 'all' && exams.length === 0 && ultrasounds.length === 0 && (
            <EmptyState label="Nenhum exame registrado." />
          )}
        </div>
      </main>
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
