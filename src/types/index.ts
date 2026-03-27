export type RiskLevel = 'low' | 'medium' | 'high'

export interface Patient {
  id: string
  name: string
  dateOfBirth: string
  dum: string // Data da última menstruação
  eddCalc: string // Expected delivery date (calculated from DUM)
  riskLevel: RiskLevel
  bloodType: string
  gravidity: number
  parity: number
  phone: string
  address: string
  status: 'ativa' | 'arquivada'
}

export interface VitalSigns {
  systolic: number
  diastolic: number
  heartRate?: number
  temperature?: number
  weight: number
  height?: number
}

export interface Consultation {
  id: string
  patientId: string
  date: string
  gestationalWeeks: number
  gestationalDays: number
  type: 'routine' | 'urgent' | 'specialist'
  provider: string
  vitalSigns: VitalSigns
  uterineHeight: number
  fetalHeartRate: number
  fetalPresentation?: string
  edema?: string
  notes: string
}

export interface Exam {
  id: string
  patientId: string
  date: string
  gestationalWeeks: number
  gestationalDays: number
  type: string
  result: string
  status: 'normal' | 'altered' | 'pending'
  lab?: string
  notes?: string
}

export interface Ultrasound {
  id: string
  patientId: string
  date: string
  gestationalWeeks: number
  gestationalDays: number
  type: 'morphological' | 'obstetric' | 'doppler' | 'transvaginal'
  fetalHeartRate: number
  biometry: {
    bpd: number
    hc: number
    ac: number
    fl: number
  }
  estimatedWeight: number
  placentaLocation: string
  amnioticFluid: string
  fetalPresentation: string
  notes: string
}

export type TimelineEventType = 'consultation' | 'exam' | 'ultrasound'

export interface TimelineItem {
  id: string
  type: TimelineEventType
  date: string
  gestationalWeeks: number
  gestationalDays: number
  data: Consultation | Exam | Ultrasound
}
