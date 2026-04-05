import { supabase } from '../lib/supabase'
import type { Consultation } from '../types'

/** Retorna o valor se estiver dentro do intervalo [min, max], senão null. */
function inRange(value: number | undefined | null, min: number, max: number): number | null {
  const n = Number(value)
  if (!isFinite(n) || n <= 0) return null
  return n >= min && n <= max ? n : null
}

/** Clamp para campos NOT NULL com check constraint */
function clamp(value: number, min: number, max: number): number {
  const n = Number(value)
  return Math.min(max, Math.max(min, isFinite(n) ? n : 0))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapConsultation(row: any): Consultation {
  return {
    id: row.id,
    patientId: row.patient_id,
    date: row.consultation_date,
    gestationalWeeks: row.gestational_weeks,
    gestationalDays: row.gestational_days,
    type: row.consultation_type,
    provider: row.provider_name,
    vitalSigns: {
      systolic: row.bp_systolic ?? 0,
      diastolic: row.bp_diastolic ?? 0,
      heartRate: row.heart_rate ?? undefined,
      temperature: row.temperature ? Number(row.temperature) : undefined,
      weight: row.weight ? Number(row.weight) : 0,
      height: row.height ? Number(row.height) : undefined,
    },
    uterineHeight: row.uterine_height ? Number(row.uterine_height) : 0,
    fetalHeartRate: row.fetal_heart_rate ?? 0,
    fetalPresentation: row.fetal_presentation ?? undefined,
    edema: row.edema ?? undefined,
    notes: row.notes ?? '',
  }
}

export async function getConsultationsByPatient(patientId: string): Promise<Consultation[]> {
  const { data, error } = await supabase
    .from('consultations')
    .select('*')
    .eq('patient_id', patientId)
    .order('consultation_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapConsultation)
}

export async function createConsultation(
  values: Omit<Consultation, 'id'>,
  organizationId: string,
  userId: string,
): Promise<Consultation> {
  const { data, error } = await supabase
    .from('consultations')
    .insert({
      organization_id: organizationId,
      patient_id: values.patientId,
      consultation_date: values.date,
      gestational_weeks: clamp(values.gestationalWeeks, 0, 45),
      gestational_days: clamp(values.gestationalDays, 0, 6),
      consultation_type: values.type,
      provider_name: values.provider,
      bp_systolic: inRange(values.vitalSigns.systolic, 50, 250),
      bp_diastolic: inRange(values.vitalSigns.diastolic, 30, 150),
      heart_rate: inRange(values.vitalSigns.heartRate, 30, 250),
      temperature: inRange(values.vitalSigns.temperature, 34, 42),
      weight: inRange(values.vitalSigns.weight, 30, 200),
      height: inRange(values.vitalSigns.height, 100, 220),
      uterine_height: inRange(values.uterineHeight, 0.1, 50),
      fetal_heart_rate: inRange(values.fetalHeartRate, 80, 220),
      fetal_presentation: values.fetalPresentation || null,
      edema: values.edema || null,
      notes: values.notes || null,
      created_by: userId,
    })
    .select()
    .single()
  if (error) throw error
  return mapConsultation(data)
}

export async function updateConsultation(
  id: string,
  values: Omit<Consultation, 'id'>,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('consultations')
    .update({
      consultation_date: values.date,
      gestational_weeks: clamp(values.gestationalWeeks, 0, 45),
      gestational_days: clamp(values.gestationalDays, 0, 6),
      consultation_type: values.type,
      provider_name: values.provider,
      bp_systolic: inRange(values.vitalSigns.systolic, 50, 250),
      bp_diastolic: inRange(values.vitalSigns.diastolic, 30, 150),
      heart_rate: inRange(values.vitalSigns.heartRate, 30, 250),
      temperature: inRange(values.vitalSigns.temperature, 34, 42),
      weight: inRange(values.vitalSigns.weight, 30, 200),
      height: inRange(values.vitalSigns.height, 100, 220),
      uterine_height: inRange(values.uterineHeight, 0.1, 50),
      fetal_heart_rate: inRange(values.fetalHeartRate, 80, 220),
      fetal_presentation: values.fetalPresentation || null,
      edema: values.edema || null,
      notes: values.notes || null,
      updated_by: userId,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteConsultation(id: string): Promise<void> {
  const { error } = await supabase.from('consultations').delete().eq('id', id)
  if (error) throw error
}
