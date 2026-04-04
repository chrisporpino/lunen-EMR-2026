import { supabase } from '../lib/supabase'
import type { Patient } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPatient(row: any): Patient {
  return {
    id: row.id,
    name: row.name,
    dateOfBirth: row.date_of_birth,
    dum: row.dum,
    eddCalc: row.edd_calc,
    riskLevel: row.risk_level,
    bloodType: row.blood_type ?? '',
    gravidity: row.gravidity,
    parity: row.parity,
    phone: row.phone ?? '',
    address: row.address ?? '',
    status: row.status,
  }
}

export async function listPatients(status?: 'ativa' | 'arquivada'): Promise<Patient[]> {
  let query = supabase.from('patients').select('*').order('edd_calc', { ascending: true })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(mapPatient)
}

export async function getPatient(id: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return mapPatient(data)
}

export async function createPatient(
  values: Omit<Patient, 'id' | 'eddCalc' | 'status'>,
  organizationId: string,
  userId: string,
): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .insert({
      organization_id: organizationId,
      name: values.name,
      date_of_birth: values.dateOfBirth,
      dum: values.dum,
      edd_calc: values.dum, // trigger will overwrite this
      risk_level: values.riskLevel,
      blood_type: values.bloodType || null,
      gravidity: values.gravidity,
      parity: values.parity,
      phone: values.phone || null,
      address: values.address || null,
      status: 'ativa',
      created_by: userId,
    })
    .select()
    .single()
  if (error) throw error
  return mapPatient(data)
}

export async function updatePatient(
  id: string,
  values: Partial<Omit<Patient, 'id' | 'eddCalc'>>,
  userId: string,
): Promise<void> {
  const payload: Record<string, unknown> = { updated_by: userId }
  if (values.name !== undefined) payload.name = values.name
  if (values.dateOfBirth !== undefined) payload.date_of_birth = values.dateOfBirth
  if (values.dum !== undefined) payload.dum = values.dum
  if (values.riskLevel !== undefined) payload.risk_level = values.riskLevel
  if (values.bloodType !== undefined) payload.blood_type = values.bloodType || null
  if (values.gravidity !== undefined) payload.gravidity = values.gravidity
  if (values.parity !== undefined) payload.parity = values.parity
  if (values.phone !== undefined) payload.phone = values.phone || null
  if (values.address !== undefined) payload.address = values.address || null

  const { error } = await supabase.from('patients').update(payload).eq('id', id)
  if (error) throw error
}

export async function archivePatient(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('patients')
    .update({ status: 'arquivada', archived_at: new Date().toISOString(), archived_by: userId })
    .eq('id', id)
  if (error) throw error
}
