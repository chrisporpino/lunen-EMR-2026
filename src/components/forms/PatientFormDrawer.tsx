import { useState, useEffect } from 'react'
import type { Patient, RiskLevel } from '../../types'
import type { PatientFormValues } from '../../types/forms'
import { calculateEDD } from '../../lib/gestation'
import { addPatient, updatePatient } from '../../data/mockPatients'
import { Drawer } from './Drawer'
import { Field, inputCls, DrawerFooter } from './FormField'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initialValues?: Patient
}

const EMPTY: PatientFormValues = {
  name: '',
  dateOfBirth: '',
  dum: '',
  riskLevel: 'low',
  bloodType: '',
  gravidity: 1,
  parity: 0,
  phone: '',
  address: '',
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const RISK_OPTIONS: { value: RiskLevel; label: string }[] = [
  { value: 'low', label: 'Baixo' },
  { value: 'medium', label: 'Intermediário' },
  { value: 'high', label: 'Alto' },
]
const riskActiveCls: Record<RiskLevel, string> = {
  low: 'bg-success/10 border-success text-success',
  medium: 'bg-warning/10 border-warning text-warning',
  high: 'bg-danger/10 border-danger text-danger',
}

export function PatientFormDrawer({ open, onClose, onSaved, initialValues }: Props) {
  const isEditing = !!initialValues
  const [form, setForm] = useState<PatientFormValues>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof PatientFormValues, string>>>({})

  useEffect(() => {
    if (!open) return
    if (initialValues) {
      setForm({
        name: initialValues.name,
        dateOfBirth: initialValues.dateOfBirth,
        dum: initialValues.dum,
        riskLevel: initialValues.riskLevel,
        bloodType: initialValues.bloodType,
        gravidity: initialValues.gravidity,
        parity: initialValues.parity,
        phone: initialValues.phone,
        address: initialValues.address,
      })
    } else {
      setForm(EMPTY)
    }
    setErrors({})
  }, [open])

  function set<K extends keyof PatientFormValues>(key: K, value: PatientFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<Record<keyof PatientFormValues, string>> = {}
    if (!form.name.trim()) e.name = 'Nome obrigatório'
    if (!form.dateOfBirth) e.dateOfBirth = 'Data de nascimento obrigatória'
    if (!form.dum) e.dum = 'DUM obrigatória'
    if (!form.bloodType) e.bloodType = 'Tipo sanguíneo obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const edd = calculateEDD(form.dum)
    const eddCalcStr = edd.toISOString().slice(0, 10)

    if (isEditing) {
      updatePatient(initialValues.id, {
        name: form.name.trim(),
        dateOfBirth: form.dateOfBirth,
        dum: form.dum,
        eddCalc: eddCalcStr,
        riskLevel: form.riskLevel,
        bloodType: form.bloodType,
        gravidity: form.gravidity,
        parity: form.parity,
        phone: form.phone,
        address: form.address,
      })
    } else {
      addPatient({
        id: 'p-' + Date.now().toString(36),
        name: form.name.trim(),
        dateOfBirth: form.dateOfBirth,
        dum: form.dum,
        eddCalc: eddCalcStr,
        riskLevel: form.riskLevel,
        bloodType: form.bloodType,
        gravidity: form.gravidity,
        parity: form.parity,
        phone: form.phone,
        address: form.address,
        status: 'ativa',
      })
    }
    onSaved()
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar Cadastro' : 'Nova Gestante'}
      subtitle={isEditing ? initialValues.name : 'Preencha os dados da paciente'}
      footer={
        <DrawerFooter
          onClose={onClose}
          onSubmit={handleSubmit}
          submitLabel={isEditing ? 'Salvar alterações' : 'Cadastrar'}
        />
      }
    >
      <div className="space-y-5">
        <Field label="Nome completo" error={errors.name} required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Nome da paciente"
            className={inputCls(!!errors.name)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Data de nascimento" error={errors.dateOfBirth} required>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => set('dateOfBirth', e.target.value)}
              className={inputCls(!!errors.dateOfBirth)}
            />
          </Field>
          <Field label="Tipo sanguíneo" error={errors.bloodType} required>
            <select
              value={form.bloodType}
              onChange={(e) => set('bloodType', e.target.value)}
              className={inputCls(!!errors.bloodType)}
            >
              <option value="">Selecionar</option>
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="DUM — Data da Última Menstruação" error={errors.dum} required>
          <input
            type="date"
            value={form.dum}
            onChange={(e) => set('dum', e.target.value)}
            className={inputCls(!!errors.dum)}
          />
          {form.dum && (
            <p className="text-xs text-muted mt-1">
              DPP calculada:{' '}
              {calculateEDD(form.dum).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          )}
        </Field>

        <Field label="Nível de risco">
          <div className="flex gap-2">
            {RISK_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => set('riskLevel', r.value)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                  form.riskLevel === r.value
                    ? riskActiveCls[r.value]
                    : 'border-border text-muted hover:bg-bg'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Gestações (G)">
            <input
              type="number"
              min={0}
              value={form.gravidity}
              onChange={(e) => set('gravidity', Number(e.target.value))}
              className={inputCls(false)}
            />
          </Field>
          <Field label="Partos (P)">
            <input
              type="number"
              min={0}
              value={form.parity}
              onChange={(e) => set('parity', Number(e.target.value))}
              className={inputCls(false)}
            />
          </Field>
        </div>

        <Field label="Telefone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+55 11 99999-9999"
            className={inputCls(false)}
          />
        </Field>

        <Field label="Endereço">
          <input
            type="text"
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="Rua, número – Cidade, UF"
            className={inputCls(false)}
          />
        </Field>
      </div>
    </Drawer>
  )
}
