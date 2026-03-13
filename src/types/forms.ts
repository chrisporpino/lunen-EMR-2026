import type { RiskLevel } from '.'

export interface PatientFormValues {
  name: string
  dateOfBirth: string
  dum: string
  riskLevel: RiskLevel
  bloodType: string
  gravidity: number
  parity: number
  phone: string
  address: string
}

export interface ConsultationFormValues {
  date: string
  type: 'routine' | 'urgent' | 'specialist'
  provider: string
  systolic: number
  diastolic: number
  heartRate: number
  temperature: number
  weight: number
  uterineHeight: number
  fetalHeartRate: number
  fetalPresentation: string
  edema: string
  notes: string
}

export interface ExamFormValues {
  date: string
  type: string
  result: string
  status: 'normal' | 'altered' | 'pending'
  lab: string
  notes: string
}

export interface UltrasoundFormValues {
  date: string
  type: 'morphological' | 'obstetric' | 'doppler' | 'transvaginal'
  fetalHeartRate: number
  bpd: number
  hc: number
  ac: number
  fl: number
  estimatedWeight: number
  placentaLocation: string
  amnioticFluid: string
  fetalPresentation: string
  notes: string
}
