import { useState, useEffect } from 'react'
import type { ConsultationFormValues } from '../../types/forms'
import type { Consultation } from '../../types'
import { gestationalAge } from '../../lib/gestation'
import { addConsultation, updateConsultation } from '../../data/mockConsultations'
import { Drawer } from './Drawer'
import { Field, inputCls, FormSection, DrawerFooter } from './FormField'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  patientId: string
  dum: string
  initialValues?: Consultation
}

const EMPTY: ConsultationFormValues = {
  date: '',
  type: 'routine',
  provider: '',
  systolic: 120,
  diastolic: 80,
  heartRate: 80,
  temperature: 36.5,
  weight: 0,
  uterineHeight: 0,
  fetalHeartRate: 0,
  fetalPresentation: '',
  edema: 'absent',
  notes: '',
}

const CONSULTATION_TYPES = [
  { value: 'routine', label: 'Rotina' },
  { value: 'urgent', label: 'Urgência' },
  { value: 'specialist', label: 'Especialista' },
] as const

const EDEMA_OPTIONS = [
  { value: 'absent', label: 'Ausente' },
  { value: 'trace', label: 'Discreto' },
  { value: '1+', label: '1+' },
  { value: '2+', label: '2+' },
  { value: '3+', label: '3+' },
]

const PRESENTATIONS = ['Cefálica', 'Pélvica', 'Transversa', 'Oblíqua']

function consultationToForm(c: Consultation): ConsultationFormValues {
  return {
    date: c.date,
    type: c.type,
    provider: c.provider,
    systolic: c.vitalSigns.systolic,
    diastolic: c.vitalSigns.diastolic,
    heartRate: c.vitalSigns.heartRate ?? 80,
    temperature: c.vitalSigns.temperature ?? 36.5,
    weight: c.vitalSigns.weight,
    uterineHeight: c.uterineHeight,
    fetalHeartRate: c.fetalHeartRate,
    fetalPresentation: c.fetalPresentation ?? '',
    edema: c.edema ?? 'absent',
    notes: c.notes,
  }
}

export function ConsultationFormDrawer({ open, onClose, onSaved, patientId, dum, initialValues }: Props) {
  const isEditing = !!initialValues
  const [form, setForm] = useState<ConsultationFormValues>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof ConsultationFormValues, string>>>({})

  useEffect(() => {
    if (open) {
      setForm(initialValues ? consultationToForm(initialValues) : EMPTY)
      setErrors({})
    }
  }, [open, initialValues])

  function set<K extends keyof ConsultationFormValues>(key: K, value: ConsultationFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const ga = form.date ? gestationalAge(dum, form.date) : null

  function validate(): boolean {
    const e: Partial<Record<keyof ConsultationFormValues, string>> = {}
    if (!form.date) e.date = 'Data obrigatória'
    if (!form.provider.trim()) e.provider = 'Profissional obrigatório'
    if (!form.weight || form.weight <= 0) e.weight = 'Peso obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const { weeks, days } = ga ?? { weeks: 0, days: 0 }
    const record: Consultation = {
      id: initialValues?.id ?? 'c-' + Date.now().toString(36),
      patientId: initialValues?.patientId ?? patientId,
      date: form.date,
      gestationalWeeks: weeks,
      gestationalDays: days,
      type: form.type,
      provider: form.provider.trim(),
      vitalSigns: {
        systolic: form.systolic,
        diastolic: form.diastolic,
        heartRate: form.heartRate,
        temperature: form.temperature,
        weight: form.weight,
      },
      uterineHeight: form.uterineHeight,
      fetalHeartRate: form.fetalHeartRate,
      fetalPresentation: form.fetalPresentation || undefined,
      edema: form.edema || undefined,
      notes: form.notes,
    }
    if (isEditing) {
      updateConsultation(record)
    } else {
      addConsultation(record)
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
      title={isEditing ? 'Editar Consulta' : 'Nova Consulta'}
      subtitle={ga ? `IG calculada: ${ga.weeks}s ${ga.days > 0 ? `+ ${ga.days}d` : ''}` : 'Preencha os dados da consulta'}
      footer={<DrawerFooter onClose={handleClose} onSubmit={handleSubmit} submitLabel={isEditing ? 'Salvar alterações' : 'Salvar'} />}
    >
      <div className="space-y-5">
        {/* Identificação */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Data da consulta" error={errors.date} required>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className={inputCls(!!errors.date)}
            />
          </Field>
          <Field label="Tipo">
            <select
              value={form.type}
              onChange={(e) => set('type', e.target.value as ConsultationFormValues['type'])}
              className={inputCls(false)}
            >
              {CONSULTATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Profissional" error={errors.provider} required>
          <input
            type="text"
            value={form.provider}
            onChange={(e) => set('provider', e.target.value)}
            placeholder="Nome do profissional"
            className={inputCls(!!errors.provider)}
          />
        </Field>

        <FormSection label="Sinais Vitais" />

        <div className="grid grid-cols-2 gap-4">
          <Field label="PA Sistólica (mmHg)">
            <input
              type="number"
              min={60} max={220} step={1}
              value={form.systolic}
              onChange={(e) => set('systolic', Number(e.target.value))}
              className={inputCls(false)}
            />
          </Field>
          <Field label="PA Diastólica (mmHg)">
            <input
              type="number"
              min={40} max={140} step={1}
              value={form.diastolic}
              onChange={(e) => set('diastolic', Number(e.target.value))}
              className={inputCls(false)}
            />
          </Field>
        </div>

        {(form.systolic >= 140 || form.diastolic >= 90) && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/8 border border-danger/20 rounded-xl">
            <svg className="w-4 h-4 text-danger flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs font-semibold text-danger">PA elevada — verificar critérios de pré-eclâmpsia</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <Field label="FC (bpm)">
            <input
              type="number"
              min={40} max={200} step={1}
              value={form.heartRate}
              onChange={(e) => set('heartRate', Number(e.target.value))}
              className={inputCls(false)}
            />
          </Field>
          <Field label="Temp. (°C)">
            <input
              type="number"
              min={35} max={42} step={0.1}
              value={form.temperature}
              onChange={(e) => set('temperature', Number(e.target.value))}
              className={inputCls(false)}
            />
          </Field>
          <Field label="Peso (kg)" error={errors.weight} required>
            <input
              type="number"
              min={30} max={200} step={0.1}
              value={form.weight || ''}
              onChange={(e) => set('weight', Number(e.target.value))}
              placeholder="0.0"
              className={inputCls(!!errors.weight)}
            />
          </Field>
        </div>

        <FormSection label="Exame Obstétrico" />

        <div className="grid grid-cols-2 gap-4">
          <Field label="Altura Uterina (cm)">
            <input
              type="number"
              min={0} max={50} step={0.5}
              value={form.uterineHeight || ''}
              onChange={(e) => set('uterineHeight', Number(e.target.value))}
              placeholder="0"
              className={inputCls(false)}
            />
          </Field>
          <Field label="BCF (bpm)">
            <input
              type="number"
              min={0} max={220} step={1}
              value={form.fetalHeartRate || ''}
              onChange={(e) => set('fetalHeartRate', Number(e.target.value))}
              placeholder="0"
              className={inputCls(false)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Apresentação fetal">
            <select
              value={form.fetalPresentation}
              onChange={(e) => set('fetalPresentation', e.target.value)}
              className={inputCls(false)}
            >
              <option value="">Não avaliado</option>
              {PRESENTATIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Edema">
            <select
              value={form.edema}
              onChange={(e) => set('edema', e.target.value)}
              className={inputCls(false)}
            >
              {EDEMA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Observações clínicas">
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Anotações e condutas..."
            className={inputCls(false) + ' resize-none'}
          />
        </Field>
      </div>
    </Drawer>
  )
}
