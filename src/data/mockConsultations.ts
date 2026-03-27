import type { Consultation } from '../types'
import { loadFromStorage, saveToStorage } from '../lib/storage'

const STORAGE_KEY = 'lunen:consultations'

const SEED_CONSULTATIONS: Consultation[] = [
  {
    id: 'c1',
    patientId: 'p1',
    date: '2025-10-13',
    gestationalWeeks: 11,
    gestationalDays: 3,
    type: 'routine',
    provider: 'Dra. Luciana Ferreira',
    vitalSigns: {
      systolic: 118,
      diastolic: 76,
      heartRate: 82,
      temperature: 36.4,
      weight: 61.2,
      height: 164,
    },
    uterineHeight: 12,
    fetalHeartRate: 162,
    fetalPresentation: 'Cefálica',
    edema: 'absent',
    notes:
      'Primeira consulta de pré-natal. Boas condições clínicas gerais. Solicitados exames de rotina do primeiro trimestre e ultrassonografia morfológica.',
  },
  {
    id: 'c2',
    patientId: 'p1',
    date: '2025-12-13',
    gestationalWeeks: 20,
    gestationalDays: 1,
    type: 'routine',
    provider: 'Dra. Luciana Ferreira',
    vitalSigns: {
      systolic: 122,
      diastolic: 80,
      heartRate: 86,
      temperature: 36.6,
      weight: 64.8,
      height: 164,
    },
    uterineHeight: 20,
    fetalHeartRate: 148,
    fetalPresentation: 'Cefálica',
    edema: 'trace',
    notes:
      'Consulta do segundo trimestre. Edema discreto em tornozelos, orientada sobre repouso relativo. Solicitada ultrassonografia morfológica.',
  },
  {
    id: 'c3',
    patientId: 'p1',
    date: '2026-02-11',
    gestationalWeeks: 28,
    gestationalDays: 5,
    type: 'routine',
    provider: 'Dra. Luciana Ferreira',
    vitalSigns: {
      systolic: 130,
      diastolic: 85,
      heartRate: 90,
      temperature: 36.5,
      weight: 69.4,
      height: 164,
    },
    uterineHeight: 29,
    fetalHeartRate: 142,
    fetalPresentation: 'Cefálica',
    edema: '1+',
    notes:
      'Pressão arterial levemente elevada. Iniciado monitoramento para hipertensão gestacional. Solicitada proteinúria de 24 horas e Doppler obstétrico.',
  },
  {
    id: 'c4',
    patientId: 'p2',
    date: '2026-02-16',
    gestationalWeeks: 5,
    gestationalDays: 3,
    type: 'routine',
    provider: 'Dr. Roberto Almeida',
    vitalSigns: {
      systolic: 110,
      diastolic: 70,
      heartRate: 78,
      weight: 55.0,
      height: 160,
    },
    uterineHeight: 0,
    fetalHeartRate: 0,
    notes: 'Primeira consulta, gestação muito precoce confirmada. Boas condições gerais. Prescrito ácido fólico e vitaminas.',
  },
  {
    id: 'c5',
    patientId: 'p3',
    date: '2026-02-05',
    gestationalWeeks: 15,
    gestationalDays: 6,
    type: 'routine',
    provider: 'Dra. Patricia Lima',
    vitalSigns: {
      systolic: 125,
      diastolic: 82,
      heartRate: 88,
      weight: 72.5,
      height: 158,
    },
    uterineHeight: 16,
    fetalHeartRate: 154,
    fetalPresentation: 'Cefálica',
    edema: 'absent',
    notes: 'Paciente com cesárea anterior. Monitoramento de cicatriz uterina em andamento. Evolução gestacional dentro da normalidade.',
  },
]

export const mockConsultations: Consultation[] = loadFromStorage(STORAGE_KEY, SEED_CONSULTATIONS)

export const getConsultationsByPatient = (patientId: string): Consultation[] =>
  mockConsultations.filter((c) => c.patientId === patientId)

export function addConsultation(consultation: Consultation): void {
  mockConsultations.push(consultation)
  saveToStorage(STORAGE_KEY, mockConsultations)
}

export function updateConsultation(updated: Consultation): void {
  const idx = mockConsultations.findIndex((c) => c.id === updated.id)
  if (idx !== -1) {
    mockConsultations[idx] = updated
    saveToStorage(STORAGE_KEY, mockConsultations)
  }
}

export function deleteConsultation(id: string): void {
  const idx = mockConsultations.findIndex((c) => c.id === id)
  if (idx !== -1) {
    mockConsultations.splice(idx, 1)
    saveToStorage(STORAGE_KEY, mockConsultations)
  }
}
