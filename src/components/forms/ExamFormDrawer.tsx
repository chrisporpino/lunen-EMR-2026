import { useState, useEffect } from 'react'
import type { ExamFormValues } from '../../types/forms'
import type { Exam } from '../../types'
import { gestationalAge } from '../../lib/gestation'
import { addExam, updateExam } from '../../data/mockExams'
import { Drawer } from './Drawer'
import { Field, inputCls, DrawerFooter } from './FormField'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  patientId: string
  dum: string
  initialValues?: Exam
}

const EMPTY: ExamFormValues = {
  date: '',
  type: '',
  result: '',
  status: 'pending',
  lab: '',
  notes: '',
}

function examToForm(e: Exam): ExamFormValues {
  return {
    date: e.date,
    type: e.type,
    result: e.result,
    status: e.status,
    lab: e.lab ?? '',
    notes: e.notes ?? '',
  }
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente', cls: 'bg-warning/10 border-warning text-warning' },
  { value: 'normal', label: 'Normal', cls: 'bg-success/10 border-success text-success' },
  { value: 'altered', label: 'Alterado', cls: 'bg-danger/10 border-danger text-danger' },
] as const

const COMMON_EXAMS = [
  'Hemograma Completo',
  'Glicemia de Jejum',
  'Urocultura (EAS)',
  'TOTG 75g',
  'Proteinúria de 24 Horas',
  'Sorologias (VDRL, HIV, Rubéola)',
  'Tipagem Sanguínea e Rh',
  'TSH',
  'Ferritina',
  'Outro',
]

export function ExamFormDrawer({ open, onClose, onSaved, patientId, dum, initialValues }: Props) {
  const isEditing = !!initialValues
  const [form, setForm] = useState<ExamFormValues>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof ExamFormValues, string>>>({})

  useEffect(() => {
    if (open) {
      setForm(initialValues ? examToForm(initialValues) : EMPTY)
      setErrors({})
    }
  }, [open, initialValues])

  function set<K extends keyof ExamFormValues>(key: K, value: ExamFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const ga = form.date ? gestationalAge(dum, form.date) : null

  function validate(): boolean {
    const e: Partial<Record<keyof ExamFormValues, string>> = {}
    if (!form.date) e.date = 'Data obrigatória'
    if (!form.type.trim()) e.type = 'Tipo de exame obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const { weeks, days } = ga ?? { weeks: 0, days: 0 }
    const record: Exam = {
      id: initialValues?.id ?? 'e-' + Date.now().toString(36),
      patientId: initialValues?.patientId ?? patientId,
      date: form.date,
      gestationalWeeks: weeks,
      gestationalDays: days,
      type: form.type.trim(),
      result: form.result,
      status: form.status,
      lab: form.lab || undefined,
      notes: form.notes || undefined,
    }
    if (isEditing) {
      updateExam(record)
    } else {
      addExam(record)
    }
    onSaved()
    onClose()
  }

  function handleClose() {
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={isEditing ? 'Editar Exame' : 'Novo Exame'}
      subtitle={ga ? `IG calculada: ${ga.weeks}s ${ga.days > 0 ? `+ ${ga.days}d` : ''}` : 'Preencha os dados do exame'}
      footer={<DrawerFooter onClose={handleClose} onSubmit={handleSubmit} submitLabel={isEditing ? 'Salvar alterações' : 'Salvar'} />}
    >
      <div className="space-y-5">
        <Field label="Data do exame" error={errors.date} required>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className={inputCls(!!errors.date)}
          />
        </Field>

        <Field label="Tipo de exame" error={errors.type} required>
          <select
            value={COMMON_EXAMS.includes(form.type) ? form.type : 'Outro'}
            onChange={(e) => {
              const v = e.target.value
              set('type', v === 'Outro' ? '' : v)
            }}
            className={inputCls(!!errors.type)}
          >
            <option value="">Selecionar exame</option>
            {COMMON_EXAMS.map((ex) => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
          {(!COMMON_EXAMS.includes(form.type) || form.type === '') && (
            <input
              type="text"
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
              placeholder="Nome do exame"
              className={inputCls(!!errors.type) + ' mt-2'}
            />
          )}
        </Field>

        <Field label="Status">
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('status', opt.value)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                  form.status === opt.value ? opt.cls : 'border-border text-muted hover:bg-bg'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Resultado">
          <textarea
            rows={2}
            value={form.result}
            onChange={(e) => set('result', e.target.value)}
            placeholder="Valores e resultado do exame..."
            className={inputCls(false) + ' resize-none'}
          />
        </Field>

        <Field label="Laboratório">
          <input
            type="text"
            value={form.lab}
            onChange={(e) => set('lab', e.target.value)}
            placeholder="Nome do laboratório"
            className={inputCls(false)}
          />
        </Field>

        <Field label="Observações">
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Interpretação clínica e condutas..."
            className={inputCls(false) + ' resize-none'}
          />
        </Field>
      </div>
    </Drawer>
  )
}
