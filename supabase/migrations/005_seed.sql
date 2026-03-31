-- ============================================================
-- Lunen EMR 2026 — Seed Data (ambiente de desenvolvimento)
-- Migration: 005_seed.sql
--
-- ATENÇÃO: Execute com a service_role key (bypassa RLS).
-- Os profiles aqui são "shells" — os auth.users correspondentes
-- precisam ser criados via Supabase Auth Dashboard ou CLI antes
-- de rodar este script, usando os mesmos UUIDs.
--
-- UUIDs fixos facilitan testes reproduzíveis e resets de banco.
-- ============================================================

-- ─── Organização Demo ──────────────────────────────────────

INSERT INTO organizations (id, name, cnpj, city, state, phone, email)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Clínica Lunen Demo',
  '00.000.000/0001-00',
  'São Paulo', 'SP',
  '(11) 99999-9999',
  'demo@lunenemr.com'
)
ON CONFLICT (id) DO NOTHING;

-- ─── Profiles Demo ─────────────────────────────────────────
-- Os UUIDs abaixo devem existir em auth.users.
-- Crie-os primeiro via: supabase auth create-user (ou Dashboard).

INSERT INTO profiles (id, organization_id, full_name, role, crm, coren)
VALUES
  -- Admin
  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Admin Demo', 'admin', NULL, NULL),

  -- Obstetra
  ('00000000-0000-0000-0001-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'Dra. Ana Obstetra', 'obstetrician', 'CRM/SP 123456', NULL),

  -- Enfermeira
  ('00000000-0000-0000-0001-000000000003',
   '00000000-0000-0000-0000-000000000001',
   'Enf. Beatriz Silva', 'nurse', NULL, 'COREN/SP 789012')
ON CONFLICT (id) DO NOTHING;

-- ─── Pacientes ─────────────────────────────────────────────
-- edd_calc é calculada automaticamente pelo trigger trg_patients_auto_edd.
-- DUM ajustada para que os dados sejam coerentes a partir de 2026-03-30.

INSERT INTO patients (
  id, organization_id,
  name, date_of_birth, dum,
  risk_level, blood_type, gravidity, parity,
  phone, status,
  created_by
)
VALUES
  -- p1: Maria Clara — baixo risco, 28 semanas
  ('10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Maria Clara Santos', '1995-03-15', '2025-09-01',
   'low', 'O+', 2, 1,
   '(11) 98765-4321', 'ativa',
   '00000000-0000-0000-0001-000000000002'),

  -- p2: Ana Beatriz — risco médio, 37 semanas
  ('10000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'Ana Beatriz Costa', '1990-07-22', '2025-07-10',
   'medium', 'A+', 3, 2,
   '(11) 91234-5678', 'ativa',
   '00000000-0000-0000-0001-000000000002'),

  -- p3: Fernanda — alto risco, 18 semanas
  ('10000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   'Fernanda Oliveira', '1998-11-30', '2025-11-15',
   'high', 'B+', 1, 0,
   '(11) 97654-3210', 'ativa',
   '00000000-0000-0000-0001-000000000002')
ON CONFLICT (id) DO NOTHING;

-- ─── Consultas ─────────────────────────────────────────────

INSERT INTO consultations (
  patient_id, organization_id,
  consultation_date, gestational_weeks, gestational_days,
  consultation_type, provider_name, provider_id,
  bp_systolic, bp_diastolic, heart_rate, weight,
  uterine_height, fetal_heart_rate, notes,
  created_by
)
VALUES

  -- Maria Clara — 10 sem: 1ª consulta
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   '2025-11-10', 10, 3, 'routine',
   'Dra. Ana Obstetra', '00000000-0000-0000-0001-000000000002',
   110, 70, 80, 62.5, 0, 0,
   'Primeira consulta pré-natal. Exames de 1º trimestre solicitados.',
   '00000000-0000-0000-0001-000000000002'),

  -- Maria Clara — 20 sem: morfológica
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   '2026-01-15', 20, 1, 'routine',
   'Dra. Ana Obstetra', '00000000-0000-0000-0001-000000000002',
   115, 75, 82, 65.8, 20, 148,
   'Morfológica sem alterações. Paciente bem. Ganho ponderal adequado.',
   '00000000-0000-0000-0001-000000000002'),

  -- Maria Clara — 28 sem: TOTG solicitado
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   '2026-03-10', 28, 1, 'routine',
   'Dra. Ana Obstetra', '00000000-0000-0000-0001-000000000002',
   118, 76, 84, 70.2, 28, 145,
   'TOTG 75g solicitado. BCF normal. Apresentação cefálica.',
   '00000000-0000-0000-0001-000000000002'),

  -- Ana Beatriz — 12 sem: PA elevada
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   '2025-10-05', 12, 2, 'routine',
   'Dra. Ana Obstetra', '00000000-0000-0000-0001-000000000002',
   130, 85, 88, 74.0, 0, 0,
   'PA ligeiramente elevada. Risco médio confirmado. Orientações sobre repouso.',
   '00000000-0000-0000-0001-000000000002'),

  -- Ana Beatriz — 34 sem: pré-eclâmpsia (PA ≥ 140/90 → gera alerta DANGER)
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   '2026-03-05', 34, 2, 'urgent',
   'Dra. Ana Obstetra', '00000000-0000-0000-0001-000000000002',
   145, 95, 92, 80.5, 33, 155,
   'PA ≥ 140/90. Suspeita de pré-eclâmpsia. Internação avaliada. Repouso relativo prescrito.',
   '00000000-0000-0000-0001-000000000002'),

  -- Fernanda — 10 sem: 1ª consulta, alto risco
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
   '2026-01-20', 10, 0, 'specialist',
   'Dra. Ana Obstetra', '00000000-0000-0000-0001-000000000002',
   120, 80, 78, 55.0, 0, 0,
   'Gestação de alto risco por histórico familiar. Encaminhada ao pré-natal especializado.',
   '00000000-0000-0000-0001-000000000002')

ON CONFLICT DO NOTHING;

-- ─── Exames ────────────────────────────────────────────────

INSERT INTO exams (
  patient_id, organization_id,
  exam_date, gestational_weeks, gestational_days,
  exam_type, result, status, lab,
  created_by
)
VALUES

  -- Maria Clara: hemograma normal
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   '2025-11-12', 10, 5,
   'Hemograma Completo', 'Hb 12.5 g/dL — normal', 'normal', 'Lab Central',
   '00000000-0000-0000-0001-000000000003'),

  -- Maria Clara: TOTG pendente (>14 dias → gera alerta WARNING)
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   '2026-03-12', 28, 3,
   'TOTG 75g', NULL, 'pending', 'Lab Central',
   '00000000-0000-0000-0001-000000000003'),

  -- Ana Beatriz: hemograma ALTERADO
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   '2025-10-08', 12, 5,
   'Hemograma Completo', 'Hb 10.2 g/dL — anemia leve', 'altered', 'Lab Central',
   '00000000-0000-0000-0001-000000000003'),

  -- Ana Beatriz: TOTG ALTERADO (DM gestacional)
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   '2026-01-15', 28, 2,
   'TOTG 75g', 'Glicemia jejum: 102 mg/dL; 2h pós-carga: 152 mg/dL — critério positivo',
   'altered', 'Lab Central',
   '00000000-0000-0000-0001-000000000003'),

  -- Ana Beatriz: urina pendente
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   '2026-02-05', 30, 0,
   'Urina Rotina EAS', NULL, 'pending', 'Lab Central',
   '00000000-0000-0000-0001-000000000003'),

  -- Fernanda: sorologias normais
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
   '2026-01-22', 10, 2,
   'Sorologias TORCH', 'CMV IgG+, IgM– (imune). Toxoplasma IgG–, IgM– (suscetível).',
   'normal', 'Lab Referência',
   '00000000-0000-0000-0001-000000000003'),

  -- Fernanda: Doppler pendente (> 14 dias → alerta)
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
   '2026-02-10', 13, 1,
   'Doppler Uteroplacentário', NULL, 'pending', NULL,
   '00000000-0000-0000-0001-000000000002')

ON CONFLICT DO NOTHING;

-- ─── Ultrassonografias ─────────────────────────────────────

INSERT INTO ultrasounds (
  patient_id, organization_id,
  ultrasound_date, gestational_weeks, gestational_days,
  ultrasound_type, fetal_heart_rate,
  bpd, hc, ac, fl, estimated_weight,
  placenta_location, amniotic_fluid, fetal_presentation, notes,
  created_by
)
VALUES

  -- Maria Clara: morfológica normal (20 sem)
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   '2026-01-18', 20, 4,
   'morphological', 148,
   49.2, 178.5, 155.8, 34.2, 348,
   'Fúndica', 'ILA 14.2 cm — normal', 'Cefálica',
   'Morfológica sem alterações. Biometria compatível com IG. Fossa posterior normal.',
   '00000000-0000-0000-0001-000000000002'),

  -- Ana Beatriz: obstétrica (34 sem)
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   '2026-03-08', 34, 3,
   'obstetric', 154,
   86.4, 308.2, 295.6, 66.1, 2134,
   'Posterior', 'ILA 10.8 cm — normal', 'Cefálica',
   'Feto ativo. Biometria no percentil 50. Líquido amniótico normal.',
   '00000000-0000-0000-0001-000000000002'),

  -- Ana Beatriz: Doppler alterado
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   '2026-03-15', 35, 3,
   'doppler', 158,
   NULL, NULL, NULL, NULL, NULL,
   'Anterior', 'ILA 9.5 cm', 'Cefálica',
   'IP artérias uterinas elevado bilateralmente. Notching bilateral presente. Vigilância intensiva recomendada.',
   '00000000-0000-0000-0001-000000000002'),

  -- Fernanda: transvaginal precoce (10 sem)
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
   '2026-01-25', 10, 5,
   'transvaginal', 168,
   NULL, NULL, NULL, NULL, NULL,
   NULL, NULL, NULL,
   'Colo uterino 38mm. Saco gestacional bem implantado. BCF 168 bpm — normal para IG.',
   '00000000-0000-0000-0001-000000000002'),

  -- Fernanda: obstétrica (18 sem)
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
   '2026-03-15', 18, 0,
   'obstetric', 142,
   44.2, 158.3, 143.7, 30.8, 225,
   'Posterior', 'ILA 16.1 cm — normal', 'Indiferente',
   'Biometria compatível com IG. Morfológica agendada para 20 semanas.',
   '00000000-0000-0000-0001-000000000002')

ON CONFLICT DO NOTHING;

-- ─── Gerar alertas iniciais para os dados de seed ──────────
-- Executa para cada paciente ativa após inserir os dados clínicos.

DO $$
DECLARE
  v_patient_id UUID;
BEGIN
  FOR v_patient_id IN
    SELECT id FROM patients
    WHERE organization_id = '00000000-0000-0000-0000-000000000001'
  LOOP
    PERFORM generate_clinical_alerts(v_patient_id);
  END LOOP;
END;
$$;
