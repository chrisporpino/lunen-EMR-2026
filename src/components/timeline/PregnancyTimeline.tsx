import type { Consultation, Exam, Ultrasound } from '../../types'
import { ConsultationEvent } from './ConsultationEvent'
import { ExamEvent } from './ExamEvent'
import { UltrasoundEvent } from './UltrasoundEvent'
import { MilestoneEvent } from './MilestoneEvent'

const MILESTONES = [
  {
    week: 12,
    title: 'Rastreio do 1º Trimestre',
    description:
      'Translucência nucal, Doppler de artérias uterinas, PAPP-A e beta-hCG. Janela ideal: 11–13+6 semanas.',
  },
  {
    week: 20,
    title: 'Ultrassonografia Morfológica',
    description: 'Avaliação anatômica detalhada do feto. Janela ideal entre 20 e 24 semanas.',
  },
  {
    week: 28,
    title: 'Rastreio de Diabetes Gestacional',
    description: 'TOTG 75g recomendado entre 24 e 28 semanas. Vacinação dTpa no 3º trimestre.',
  },
  {
    week: 36,
    title: 'Preparação para o Parto',
    description:
      'Avaliação de posição fetal, maturidade pulmonar e elaboração do plano de parto.',
  },
]

type AnyEvent =
  | { type: 'consultation'; date: string; data: Consultation }
  | { type: 'exam'; date: string; data: Exam }
  | { type: 'ultrasound'; date: string; data: Ultrasound }
  | {
      type: 'milestone'
      date: string
      data: { week: number; title: string; description: string; isReached: boolean }
    }

interface Props {
  consultations: Consultation[]
  exams: Exam[]
  ultrasounds: Ultrasound[]
  dum: string
  onEditConsultation?: (c: Consultation) => void
  onDeleteConsultation?: (id: string) => void
  onEditExam?: (e: Exam) => void
  onDeleteExam?: (id: string) => void
}

export function PregnancyTimeline({ consultations, exams, ultrasounds, dum, onEditConsultation, onDeleteConsultation, onEditExam, onDeleteExam }: Props) {
  const today = new Date()
  const dumDate = new Date(dum + 'T00:00:00')

  const milestoneEvents: AnyEvent[] = MILESTONES.map((m) => {
    const milestoneDate = new Date(dumDate)
    milestoneDate.setDate(milestoneDate.getDate() + m.week * 7)
    const isReached = milestoneDate <= today
    return {
      type: 'milestone' as const,
      date: milestoneDate.toISOString().slice(0, 10),
      data: { week: m.week, title: m.title, description: m.description, isReached },
    }
  })

  const events: AnyEvent[] = [
    ...consultations.map((c) => ({ type: 'consultation' as const, date: c.date, data: c })),
    ...exams.map((e) => ({ type: 'exam' as const, date: e.date, data: e })),
    ...ultrasounds.map((u) => ({ type: 'ultrasound' as const, date: u.date, data: u })),
    ...milestoneEvents,
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (events.length === 0) {
    return (
      <div className="text-center py-16 text-muted">
        <svg
          className="w-12 h-12 mx-auto mb-3 opacity-30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm">Nenhum registro encontrado.</p>
      </div>
    )
  }

  return (
    <div>
      {events.map((event, index) => {
        const isLast = index === events.length - 1

        if (event.type === 'consultation') {
          return (
            <ConsultationEvent
              key={`c-${event.data.id}`}
              consultation={event.data}
              isLast={isLast}
              onEdit={onEditConsultation}
              onDelete={onDeleteConsultation}
            />
          )
        }
        if (event.type === 'exam') {
          return (
            <ExamEvent
              key={`e-${event.data.id}`}
              exam={event.data}
              isLast={isLast}
              onEdit={onEditExam}
              onDelete={onDeleteExam}
            />
          )
        }
        if (event.type === 'ultrasound') {
          return (
            <UltrasoundEvent
              key={`u-${event.data.id}`}
              ultrasound={event.data}
              isLast={isLast}
            />
          )
        }
        return (
          <MilestoneEvent
            key={`m-${event.data.week}`}
            week={event.data.week}
            title={event.data.title}
            description={event.data.description}
            isReached={event.data.isReached}
            isLast={isLast}
          />
        )
      })}
    </div>
  )
}
