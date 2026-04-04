import { supabase } from '../lib/supabase'
import type { Exam } from '../types'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value || 0))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapExam(row: any): Exam {
  return {
    id: row.id,
    patientId: row.patient_id,
    date: row.exam_date,
    gestationalWeeks: row.gestational_weeks ?? 0,
    gestationalDays: row.gestational_days ?? 0,
    type: row.exam_type,
    result: row.result ?? '',
    status: row.status,
    lab: row.lab ?? undefined,
    notes: row.notes ?? undefined,
  }
}

export async function getExamsByPatient(patientId: string): Promise<Exam[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('patient_id', patientId)
    .order('exam_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapExam)
}

export async function createExam(
  values: Omit<Exam, 'id'>,
  organizationId: string,
  userId: string,
): Promise<Exam> {
  const { data, error } = await supabase
    .from('exams')
    .insert({
      organization_id: organizationId,
      patient_id: values.patientId,
      exam_date: values.date,
      gestational_weeks: clamp(values.gestationalWeeks, 0, 45),
      gestational_days: clamp(values.gestationalDays, 0, 6),
      exam_type: values.type,
      result: values.result || null,
      status: values.status,
      lab: values.lab || null,
      notes: values.notes || null,
      created_by: userId,
    })
    .select()
    .single()
  if (error) throw error
  return mapExam(data)
}

export async function updateExam(
  id: string,
  values: Omit<Exam, 'id'>,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('exams')
    .update({
      exam_date: values.date,
      gestational_weeks: clamp(values.gestationalWeeks, 0, 45),
      gestational_days: clamp(values.gestationalDays, 0, 6),
      exam_type: values.type,
      result: values.result || null,
      status: values.status,
      lab: values.lab || null,
      notes: values.notes || null,
      updated_by: userId,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteExam(id: string): Promise<void> {
  const { error } = await supabase.from('exams').delete().eq('id', id)
  if (error) throw error
}
