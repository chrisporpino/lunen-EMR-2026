import type { Ultrasound } from '../types'

export const mockUltrasounds: Ultrasound[] = [
  {
    id: 'u1',
    patientId: 'p1',
    date: '2025-11-07',
    gestationalWeeks: 15,
    gestationalDays: 0,
    type: 'morphological',
    fetalHeartRate: 156,
    biometry: {
      bpd: 31.2,
      hc: 112.0,
      ac: 102.5,
      fl: 21.8,
    },
    estimatedWeight: 128,
    placentaLocation: 'Posterior, grau I',
    amnioticFluid: 'Normal – ILA 14,2 cm',
    fetalPresentation: 'Cefálica',
    notes:
      'Avaliação da anatomia fetal dentro dos parâmetros normais. Osso nasal presente. TN 1,8 mm. Nenhuma malformação estrutural identificada.',
  },
  {
    id: 'u2',
    patientId: 'p1',
    date: '2026-01-04',
    gestationalWeeks: 23,
    gestationalDays: 2,
    type: 'obstetric',
    fetalHeartRate: 144,
    biometry: {
      bpd: 57.8,
      hc: 208.4,
      ac: 188.6,
      fl: 41.2,
    },
    estimatedWeight: 578,
    placentaLocation: 'Posterior, grau I–II',
    amnioticFluid: 'Normal – ILA 16,1 cm',
    fetalPresentation: 'Cefálica',
    notes: 'Desenvolvimento morfológico normal. Crescimento adequado para a idade gestacional.',
  },
  {
    id: 'u3',
    patientId: 'p1',
    date: '2026-02-22',
    gestationalWeeks: 30,
    gestationalDays: 2,
    type: 'doppler',
    fetalHeartRate: 138,
    biometry: {
      bpd: 75.2,
      hc: 276.0,
      ac: 258.4,
      fl: 58.6,
    },
    estimatedWeight: 1480,
    placentaLocation: 'Posterior, grau II',
    amnioticFluid: 'Normal – ILA 13,8 cm',
    fetalPresentation: 'Cefálica',
    notes:
      'Doppler de artéria umbilical com resistência discretamente elevada. IR 0,68. Artérias uterinas com incisura bilateral. Monitoramento intensificado.',
  },
  // Paciente p2
  {
    id: 'u4',
    patientId: 'p2',
    date: '2026-03-02',
    gestationalWeeks: 7,
    gestationalDays: 3,
    type: 'transvaginal',
    fetalHeartRate: 142,
    biometry: {
      bpd: 0,
      hc: 0,
      ac: 0,
      fl: 0,
    },
    estimatedWeight: 0,
    placentaLocation: 'N/A',
    amnioticFluid: 'N/A',
    fetalPresentation: 'N/A',
    notes: 'Gestação intrauterina tópica e evolutiva. CCN 13,2 mm. Atividade cardíaca fetal presente.',
  },
  // Paciente p3
  {
    id: 'u5',
    patientId: 'p3',
    date: '2026-02-21',
    gestationalWeeks: 18,
    gestationalDays: 1,
    type: 'morphological',
    fetalHeartRate: 150,
    biometry: {
      bpd: 43.2,
      hc: 156.0,
      ac: 138.5,
      fl: 31.2,
    },
    estimatedWeight: 255,
    placentaLocation: 'Anterior, grau I',
    amnioticFluid: 'Normal – ILA 15,0 cm',
    fetalPresentation: 'Cefálica',
    notes: 'Morfologia fetal normal. Cicatriz uterina de cesárea anterior íntegra.',
  },
]

export const getUltrasoundsByPatient = (patientId: string): Ultrasound[] =>
  mockUltrasounds.filter((u) => u.patientId === patientId)

export function addUltrasound(ultrasound: Ultrasound): void {
  mockUltrasounds.push(ultrasound)
}

export function updateUltrasound(updated: Ultrasound): void {
  const idx = mockUltrasounds.findIndex((u) => u.id === updated.id)
  if (idx !== -1) mockUltrasounds[idx] = updated
}

export function deleteUltrasound(id: string): void {
  const idx = mockUltrasounds.findIndex((u) => u.id === id)
  if (idx !== -1) mockUltrasounds.splice(idx, 1)
}
