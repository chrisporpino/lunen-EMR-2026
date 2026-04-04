import { useState, useEffect } from 'react'
import type { UltrasoundFormValues } from '../../types/forms'
import type { Ultrasound } from '../../types'
import { gestationalAge } from '../../lib/gestation'
import { createUltrasound, updateUltrasound } from '../../services/ultrasounds'
import { useAuth } from '../../contexts/AuthContext'
import { Drawer } from './Drawer'
import { Field, inputCls, FormSection, DrawerFooter } from './FormField'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  patientId: string
  dum: string
  initialValues?: Ultrasound
}

const EMPTY: UltrasoundFormValues = {
  date: '',
  type: 'obstetric',
  fetalHeartRate: 0,
  bpd: 0,
  hc: 0,
  ac: 0,
  fl: 0,
  estimatedWeight: 0,
  placentaLocation: '',
  amnioticFluid: '',
  fetalPresentation: '',
  notes: '',
}

const USG_TYPES = [
  { value: 'obstetric', label: 'Obstétrica' },
  { value: 'morphological', label: 'Morfológica' },
  { value: 'doppler', label: 'Doppler' },
  { value: 'transvaginal', label: 'Transvaginal' },
] as const

function usgToForm(u: Ultrasound): UltrasoundFormValues {
  return {
    date: u.date,
    type: u.type,
    fetalHeartRate: u.fetalHeartRate,
    bpd: u.biometry.bpd,
    hc: u.biometry.hc,
    ac: u.biometry.ac,
    fl: u.biometry.fl,
    estimatedWeight: u.estimatedWeight,
    placentaLocation: u.placentaLocation === 'N/A' ? '' : u.placentaLocation,
    amnioticFluid: u.amnioticFluid === 'N/A' ? '' : u.amnioticFluid,
    fetalPresentation: u.fetalPresentation === 'N/A' ? '' : u.fetalPresentation,
    notes: u.notes,
  }
}

export function UltrasoundFormDrawer({ open, onClose, onSaved, patientId, dum, initialValues }: Props) {
  const isEditing = !!initialValues
  const { profile, user } = useAuth()
  const [form, setForm] = useState<UltrasoundFormValues>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof UltrasoundFormValues, string>>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(initialValues ? usgToForm(initialValues) : EMPTY)
      setErrors({})
      setSaveError(null)
    }
  }, [open, initialValues])

  function set<K extends keyof UltrasoundFormValues>(key: K, value: UltrasoundFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function numericField(key: keyof UltrasoundFormValues, value: string) {
    set(key, Number(value) as UltrasoundFormValues[typeof key])
  }

  const ga = form.date ? gestationalAge(dum, form.date) : null
  const isTransvaginal = form.type === 'transvaginal'

  function validate(): boolean {
    const e: Partial<Record<keyof UltrasoundFormValues, string>> = {}
    if (!form.date) e.date = 'Data obrigatória'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    if (!profile || !user) { setSaveError('Sessão expirada. Faça login novamente.'); return }
    setSaving(true)
    setSaveError(null)
    const { weeks, days } = ga ?? { weeks: 0, days: 0 }
    const record: Omit<Ultrasound, 'id'> = {
      patientId,
      date: form.date,
      gestationalWeeks: weeks,
      gestationalDays: days,
      type: form.type,
      fetalHeartRate: form.fetalHeartRate,
      biometry: { bpd: form.bpd, hc: form.hc, ac: form.ac, fl: form.fl },
      estimatedWeight: form.estimatedWeight,
      placentaLocation: form.placentaLocation || 'N/A',
      amnioticFluid: form.amnioticFluid || 'N/A',
      fetalPresentation: form.fetalPresentation || 'N/A',
      notes: form.notes,
    }
    try {
      if (isEditing) {
        await updateUltrasound(initialValues.id, record, user.id)
      } else {
        await createUltrasound(record, profile.organization_id, user.id)
      }
      onSaved()
      onClose()
    } catch {
      setSaveError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar Ultrassonografia' : 'Nova Ultrassonografia'}
      subtitle={ga ? `IG calculada: ${ga.weeks}s ${ga.days > 0 ? `+ ${ga.days}d` : ''}` : 'Preencha os dados do exame'}
      footer={<DrawerFooter onClose={onClose} onSubmit={handleSubmit} submitLabel={isEditing ? 'Salvar alterações' : 'Salvar'} loading={saving} />}
    >
      <div className="space-y-5">
        {saveError && (
          <div className="flex items-center gap-2 bg-danger/8 border border-danger/20 rounded-xl px-3 py-2.5">
            <svg className="w-4 h-4 text-danger flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-danger font-medium">{saveError}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Data" error={errors.date} required>
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
              onChange={(e) => set('type', e.target.value as UltrasoundFormValues['type'])}
              className={inputCls(false)}
            >
              {USG_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="BCF (bpm)">
          <input
            type="number"
            min={0} max={220} step={1}
            value={form.fetalHeartRate || ''}
            onChange={(e) => numericField('fetalHeartRate', e.target.value)}
            placeholder="0"
            className={inputCls(false)}
          />
        </Field>

        {!isTransvaginal && (
          <>
            <FormSection label="Biometria Fetal" />

            <div className="grid grid-cols-2 gap-4">
              <Field label="DBP (mm)">
                <input type="number" min={0} step={0.1} value={form.bpd || ''} onChange={(e) => numericField('bpd', e.target.value)} placeholder="0.0" className={inputCls(false)} />
              </Field>
              <Field label="PC (mm)">
                <input type="number" min={0} step={0.1} value={form.hc || ''} onChange={(e) => numericField('hc', e.target.value)} placeholder="0.0" className={inputCls(false)} />
              </Field>
              <Field label="CA (mm)">
                <input type="number" min={0} step={0.1} value={form.ac || ''} onChange={(e) => numericField('ac', e.target.value)} placeholder="0.0" className={inputCls(false)} />
              </Field>
              <Field label="CF (mm)">
                <input type="number" min={0} step={0.1} value={form.fl || ''} onChange={(e) => numericField('fl', e.target.value)} placeholder="0.0" className={inputCls(false)} />
              </Field>
            </div>

            <Field label="Peso Estimado (g)">
              <input type="number" min={0} step={1} value={form.estimatedWeight || ''} onChange={(e) => numericField('estimatedWeight', e.target.value)} placeholder="0" className={inputCls(false)} />
            </Field>

            <FormSection label="Avaliação" />

            <Field label="Localização da placenta">
              <input type="text" value={form.placentaLocation} onChange={(e) => set('placentaLocation', e.target.value)} placeholder="Ex.: Posterior, grau I" className={inputCls(false)} />
            </Field>

            <Field label="Líquido amniótico (ILA)">
              <input type="text" value={form.amnioticFluid} onChange={(e) => set('amnioticFluid', e.target.value)} placeholder="Ex.: Normal – ILA 14,2 cm" className={inputCls(false)} />
            </Field>

            <Field label="Apresentação fetal">
              <select value={form.fetalPresentation} onChange={(e) => set('fetalPresentation', e.target.value)} className={inputCls(false)}>
                <option value="">Não avaliado</option>
                <option>Cefálica</option>
                <option>Pélvica</option>
                <option>Transversa</option>
                <option>Oblíqua</option>
              </select>
            </Field>
          </>
        )}

        <Field label="Laudo / Observações">
          <textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Descrição e achados do exame..." className={inputCls(false) + ' resize-none'} />
        </Field>
      </div>
    </Drawer>
  )
}
