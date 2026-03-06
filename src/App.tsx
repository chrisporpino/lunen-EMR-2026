import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PatientsPage } from './pages/PatientsPage'
import { PatientTimelinePage } from './pages/PatientTimelinePage'
import { PatientConsultations } from './pages/PatientConsultations'
import { PatientExams } from './pages/PatientExams'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PatientsPage />} />
        <Route path="/patient/:id" element={<PatientTimelinePage />} />
        <Route path="/patient/:id/consultations" element={<PatientConsultations />} />
        <Route path="/patient/:id/exams" element={<PatientExams />} />
      </Routes>
    </BrowserRouter>
  )
}
