import type { Patient } from '../types'
import { loadFromStorage, saveToStorage } from '../lib/storage'

const STORAGE_KEY = 'lunen:patients'

const SEED_PATIENTS: Patient[] = [
  {
    id: 'p1',
    name: 'Maria Clara da Silva',
    dateOfBirth: '1994-03-15',
    dum: '2025-07-25',
    eddCalc: '2026-05-02',
    riskLevel: 'high',
    bloodType: 'A+',
    gravidity: 2,
    parity: 1,
    phone: '+55 11 99234-5678',
    address: 'Rua das Flores, 142 – São Paulo, SP',
    status: 'ativa',
  },
  {
    id: 'p2',
    name: 'Ana Beatriz Oliveira',
    dateOfBirth: '1998-07-22',
    dum: '2026-01-09',
    eddCalc: '2026-10-16',
    riskLevel: 'low',
    bloodType: 'O+',
    gravidity: 1,
    parity: 0,
    phone: '+55 11 98765-4321',
    address: 'Av. Paulista, 900 – São Paulo, SP',
    status: 'ativa',
  },
  {
    id: 'p3',
    name: 'Fernanda Costa Mendes',
    dateOfBirth: '1990-11-05',
    dum: '2025-10-17',
    eddCalc: '2026-07-24',
    riskLevel: 'medium',
    bloodType: 'B-',
    gravidity: 3,
    parity: 2,
    phone: '+55 21 97654-3210',
    address: 'Rua da Consolação, 50 – Rio de Janeiro, RJ',
    status: 'ativa',
  },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockPatients: Patient[] = (loadFromStorage(STORAGE_KEY, SEED_PATIENTS) as any[])
  .map((p) => ({ status: 'ativa', ...p }))

export function addPatient(patient: Patient): void {
  mockPatients.push(patient)
  saveToStorage(STORAGE_KEY, mockPatients)
}

export function updatePatient(id: string, updates: Partial<Patient>): void {
  const idx = mockPatients.findIndex((p) => p.id === id)
  if (idx !== -1) {
    mockPatients[idx] = { ...mockPatients[idx], ...updates }
    saveToStorage(STORAGE_KEY, mockPatients)
  }
}

export function archivePatient(id: string): void {
  updatePatient(id, { status: 'arquivada' })
}
