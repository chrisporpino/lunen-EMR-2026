import { supabase } from '../lib/supabase'
import type { Ultrasound } from '../types'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value || 0))
}

function inRange(value: number | undefined | null, min: number, max: number): number | null {
  if (value == null || value <= 0) return null
  return value >= min && value <= max ? value : null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUltrasound(row: any): Ultrasound {
  return {
    id: row.id,
    patientId: row.patient_id,
    date: row.ultrasound_date,
    gestationalWeeks: row.gestational_weeks ?? 0,
    gestationalDays: row.gestational_days ?? 0,
    type: row.ultrasound_type,
    fetalHeartRate: row.fetal_heart_rate ?? 0,
    biometry: {
      bpd: row.bpd ? Number(row.bpd) : 0,
      hc: row.hc ? Number(row.hc) : 0,
      ac: row.ac ? Number(row.ac) : 0,
      fl: row.fl ? Number(row.fl) : 0,
    },
    estimatedWeight: row.estimated_weight ?? 0,
    placentaLocation: row.placenta_location ?? 'N/A',
    amnioticFluid: row.amniotic_fluid ?? 'N/A',
    fetalPresentation: row.fetal_presentation ?? 'N/A',
    notes: row.notes ?? '',
  }
}

export async function getUltrasoundsByPatient(patientId: string): Promise<Ultrasound[]> {
  const { data, error } = await supabase
    .from('ultrasounds')
    .select('*')
    .eq('patient_id', patientId)
    .order('ultrasound_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapUltrasound)
}

export async function createUltrasound(
  values: Omit<Ultrasound, 'id'>,
  organizationId: string,
  userId: string,
): Promise<Ultrasound> {
  const { data, error } = await supabase
    .from('ultrasounds')
    .insert({
      organization_id: organizationId,
      patient_id: values.patientId,
      ultrasound_date: values.date,
      gestational_weeks: clamp(values.gestationalWeeks, 0, 45),
      gestational_days: clamp(values.gestationalDays, 0, 6),
      ultrasound_type: values.type,
      fetal_heart_rate: inRange(values.fetalHeartRate, 80, 220),
      bpd: values.biometry.bpd || null,
      hc: values.biometry.hc || null,
      ac: values.biometry.ac || null,
      fl: values.biometry.fl || null,
      estimated_weight: values.estimatedWeight || null,
      placenta_location: values.placentaLocation !== 'N/A' ? values.placentaLocation || null : null,
      amniotic_fluid: values.amnioticFluid !== 'N/A' ? values.amnioticFluid || null : null,
      fetal_presentation: values.fetalPresentation !== 'N/A' ? values.fetalPresentation || null : null,
      notes: values.notes || null,
      created_by: userId,
    })
    .select()
    .single()
  if (error) throw error
  return mapUltrasound(data)
}

export async function updateUltrasound(
  id: string,
  values: Omit<Ultrasound, 'id'>,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('ultrasounds')
    .update({
      ultrasound_date: values.date,
      gestational_weeks: clamp(values.gestationalWeeks, 0, 45),
      gestational_days: clamp(values.gestationalDays, 0, 6),
      ultrasound_type: values.type,
      fetal_heart_rate: inRange(values.fetalHeartRate, 80, 220),
      bpd: values.biometry.bpd || null,
      hc: values.biometry.hc || null,
      ac: values.biometry.ac || null,
      fl: values.biometry.fl || null,
      estimated_weight: values.estimatedWeight || null,
      placenta_location: values.placentaLocation !== 'N/A' ? values.placentaLocation || null : null,
      amniotic_fluid: values.amnioticFluid !== 'N/A' ? values.amnioticFluid || null : null,
      fetal_presentation: values.fetalPresentation !== 'N/A' ? values.fetalPresentation || null : null,
      notes: values.notes || null,
      updated_by: userId,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteUltrasound(id: string): Promise<void> {
  const { error } = await supabase.from('ultrasounds').delete().eq('id', id)
  if (error) throw error
}
