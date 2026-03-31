-- ============================================================
-- Lunen EMR 2026 — Schema PostgreSQL
-- Migration: 001_schema.sql
--
-- Multi-tenant: cada clínica/consultório é uma organização.
-- Todas as tabelas possuem organization_id para isolamento.
-- ============================================================

-- ─── Extensions ────────────────────────────────────────────

--CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── ORGANIZATIONS ─────────────────────────────────────────
-- Clínicas, consultórios ou centros de saúde

CREATE TABLE organizations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  cnpj        TEXT        UNIQUE,
  address     TEXT,
  city        TEXT,
  state       CHAR(2),
  phone       TEXT,
  email       TEXT,
  logo_url    TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PROFILES ──────────────────────────────────────────────
-- Estende auth.users com dados clínicos e de organização

CREATE TABLE profiles (
  id              UUID  PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID  NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  full_name       TEXT  NOT NULL,
  role            TEXT  NOT NULL CHECK (role IN ('admin', 'obstetrician', 'nurse', 'receptionist')),
  crm             TEXT,    -- Conselho Regional de Medicina (médicos)
  coren           TEXT,    -- Conselho Regional de Enfermagem (enfermeiros)
  avatar_url      TEXT,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PATIENTS ──────────────────────────────────────────────
-- Gestantes cadastradas na organização

CREATE TABLE patients (
  id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID     NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name            TEXT     NOT NULL,
  date_of_birth   DATE     NOT NULL,
  cpf             TEXT,
  -- Dados obstétricos essenciais
  dum             DATE     NOT NULL,   -- Data da Última Menstruação
  edd_calc        DATE     NOT NULL,   -- Data Provável do Parto (calculada por trigger)
  risk_level      TEXT     NOT NULL DEFAULT 'low'
                           CHECK (risk_level IN ('low', 'medium', 'high')),
  blood_type      TEXT     CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  gravidity       SMALLINT NOT NULL DEFAULT 0 CHECK (gravidity >= 0),
  parity          SMALLINT NOT NULL DEFAULT 0 CHECK (parity >= 0),
  -- Contato
  phone           TEXT,
  address         TEXT,
  -- Soft delete via status
  status          TEXT     NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'arquivada')),
  archived_at     TIMESTAMPTZ,
  archived_by     UUID     REFERENCES profiles(id) ON DELETE SET NULL,
  -- Auditoria
  created_by      UUID     REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by      UUID     REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- CPF único por organização (null permitido)
  CONSTRAINT cpf_per_org UNIQUE NULLS NOT DISTINCT (organization_id, cpf)
);

-- ─── CONSULTATIONS ─────────────────────────────────────────
-- Consultas pré-natais

CREATE TABLE consultations (
  id                   UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id           UUID     NOT NULL REFERENCES patients(id)     ON DELETE CASCADE,
  organization_id      UUID     NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  consultation_date    DATE     NOT NULL,
  gestational_weeks    SMALLINT NOT NULL CHECK (gestational_weeks BETWEEN 0 AND 45),
  gestational_days     SMALLINT NOT NULL CHECK (gestational_days  BETWEEN 0 AND 6),
  consultation_type    TEXT     NOT NULL DEFAULT 'routine'
                                CHECK (consultation_type IN ('routine', 'urgent', 'specialist')),
  provider_name        TEXT     NOT NULL,
  provider_id          UUID     REFERENCES profiles(id) ON DELETE SET NULL,
  -- Sinais vitais
  bp_systolic          SMALLINT CHECK (bp_systolic   BETWEEN 50  AND 250),
  bp_diastolic         SMALLINT CHECK (bp_diastolic  BETWEEN 30  AND 150),
  heart_rate           SMALLINT CHECK (heart_rate    BETWEEN 30  AND 250),
  temperature          NUMERIC(4,1) CHECK (temperature BETWEEN 34 AND 42),
  weight               NUMERIC(5,2) CHECK (weight    BETWEEN 30  AND 200),  -- kg
  height               NUMERIC(5,2) CHECK (height    BETWEEN 100 AND 220),  -- cm
  -- Dados obstétricos
  uterine_height       NUMERIC(4,1) CHECK (uterine_height  BETWEEN 0   AND 50),   -- AU em cm
  fetal_heart_rate     SMALLINT     CHECK (fetal_heart_rate BETWEEN 80  AND 220),  -- BCF em bpm
  fetal_presentation   TEXT,
  edema                TEXT,
  notes                TEXT,
  -- Auditoria
  created_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── EXAMS ─────────────────────────────────────────────────
-- Exames laboratoriais e de imagem

CREATE TABLE exams (
  id                  UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID     NOT NULL REFERENCES patients(id)     ON DELETE CASCADE,
  organization_id     UUID     NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  exam_date           DATE     NOT NULL,
  gestational_weeks   SMALLINT CHECK (gestational_weeks BETWEEN 0 AND 45),
  gestational_days    SMALLINT CHECK (gestational_days  BETWEEN 0 AND 6),
  exam_type           TEXT     NOT NULL,
  result              TEXT,
  status              TEXT     NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('normal', 'altered', 'pending')),
  lab                 TEXT,
  notes               TEXT,
  result_received_at  TIMESTAMPTZ,
  -- Auditoria
  created_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ULTRASOUNDS ───────────────────────────────────────────
-- Ultrassonografias obstétricas

CREATE TABLE ultrasounds (
  id                  UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID     NOT NULL REFERENCES patients(id)     ON DELETE CASCADE,
  organization_id     UUID     NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  ultrasound_date     DATE     NOT NULL,
  gestational_weeks   SMALLINT CHECK (gestational_weeks BETWEEN 0 AND 45),
  gestational_days    SMALLINT CHECK (gestational_days  BETWEEN 0 AND 6),
  ultrasound_type     TEXT     NOT NULL
                               CHECK (ultrasound_type IN ('morphological', 'obstetric', 'doppler', 'transvaginal')),
  fetal_heart_rate    SMALLINT CHECK (fetal_heart_rate BETWEEN 80 AND 220),
  -- Biometria fetal (não coletada em transvaginal precoce)
  bpd                 NUMERIC(5,1),   -- Diâmetro Biparietal (mm)
  hc                  NUMERIC(6,1),   -- Circunferência Cefálica (mm)
  ac                  NUMERIC(6,1),   -- Circunferência Abdominal (mm)
  fl                  NUMERIC(5,1),   -- Comprimento do Fêmur (mm)
  estimated_weight    INTEGER  CHECK (estimated_weight BETWEEN 0 AND 6000),  -- gramas
  placenta_location   TEXT,
  amniotic_fluid      TEXT,
  fetal_presentation  TEXT,
  notes               TEXT,
  -- Auditoria
  created_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── DIAGNOSES ─────────────────────────────────────────────
-- Diagnósticos clínicos — entidade de primeira classe (Sprint 3)

CREATE TABLE diagnoses (
  id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID     NOT NULL REFERENCES patients(id)     ON DELETE CASCADE,
  organization_id UUID     NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  cid10           TEXT,
  description     TEXT     NOT NULL,
  onset_date      DATE,
  resolved_date   DATE,
  severity        TEXT     CHECK (severity IN ('mild', 'moderate', 'severe')),
  is_active       BOOLEAN  NOT NULL DEFAULT TRUE,
  notes           TEXT,
  created_by      UUID     REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by      UUID     REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── MEDICATIONS ───────────────────────────────────────────
-- Medicações prescritas — entidade de primeira classe (Sprint 3)

CREATE TABLE medications (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID    NOT NULL REFERENCES patients(id)     ON DELETE CASCADE,
  organization_id UUID    NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name            TEXT    NOT NULL,
  dosage          TEXT,
  frequency       TEXT,
  route           TEXT,       -- oral, IM, IV, sublingual, tópico
  start_date      DATE,
  end_date        DATE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  reason          TEXT,
  notes           TEXT,
  prescribed_by   UUID    REFERENCES profiles(id) ON DELETE SET NULL,
  created_by      UUID    REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by      UUID    REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CLINICAL ALERTS ───────────────────────────────────────
-- Alertas clínicos gerados automaticamente por triggers/funções

CREATE TABLE clinical_alerts (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID    NOT NULL REFERENCES patients(id)     ON DELETE CASCADE,
  organization_id UUID    NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  alert_type      TEXT    NOT NULL,
  -- Valores: 'hypertension' | 'altered_bcf' | 'altered_exam'
  --          'overdue_exam' | 'overdue_return' | 'totg_due'
  severity        TEXT    NOT NULL CHECK (severity IN ('danger', 'warning')),
  message         TEXT    NOT NULL,
  reference_id    UUID,       -- ID do registro que gerou o alerta
  reference_table TEXT,       -- 'consultations' | 'exams' | 'ultrasounds'
  is_resolved     BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID    REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── AUDIT LOGS ────────────────────────────────────────────
-- Rastreabilidade completa para compliance (LGPD / CFM)

CREATE TABLE audit_logs (
  id              UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID  REFERENCES organizations(id) ON DELETE SET NULL,
  user_id         UUID  REFERENCES profiles(id)      ON DELETE SET NULL,
  action          TEXT  NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name      TEXT  NOT NULL,
  record_id       UUID  NOT NULL,
  old_data        JSONB,
  new_data        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- profiles
CREATE INDEX idx_profiles_org        ON profiles(organization_id);
CREATE INDEX idx_profiles_role       ON profiles(organization_id, role);
CREATE INDEX idx_profiles_active     ON profiles(organization_id) WHERE is_active = TRUE;

-- patients
CREATE INDEX idx_patients_org        ON patients(organization_id);
CREATE INDEX idx_patients_status     ON patients(organization_id, status);
CREATE INDEX idx_patients_edd        ON patients(organization_id, edd_calc ASC);
CREATE INDEX idx_patients_risk       ON patients(organization_id, risk_level);


-- consultations
CREATE INDEX idx_consult_patient     ON consultations(patient_id);
CREATE INDEX idx_consult_org         ON consultations(organization_id);
CREATE INDEX idx_consult_date        ON consultations(patient_id, consultation_date DESC);
CREATE INDEX idx_consult_provider    ON consultations(provider_id) WHERE provider_id IS NOT NULL;

-- exams
CREATE INDEX idx_exams_patient       ON exams(patient_id);
CREATE INDEX idx_exams_org           ON exams(organization_id);
CREATE INDEX idx_exams_date          ON exams(patient_id, exam_date DESC);
CREATE INDEX idx_exams_status        ON exams(patient_id, status);
CREATE INDEX idx_exams_pending       ON exams(patient_id, exam_date ASC) WHERE status = 'pending';
CREATE INDEX idx_exams_altered       ON exams(patient_id, exam_date DESC) WHERE status = 'altered';

-- ultrasounds
CREATE INDEX idx_usg_patient         ON ultrasounds(patient_id);
CREATE INDEX idx_usg_org             ON ultrasounds(organization_id);
CREATE INDEX idx_usg_date            ON ultrasounds(patient_id, ultrasound_date DESC);

-- diagnoses
CREATE INDEX idx_diag_patient        ON diagnoses(patient_id);
CREATE INDEX idx_diag_active         ON diagnoses(patient_id) WHERE is_active = TRUE;

-- medications
CREATE INDEX idx_meds_patient        ON medications(patient_id);
CREATE INDEX idx_meds_active         ON medications(patient_id) WHERE is_active = TRUE;

-- clinical_alerts
CREATE INDEX idx_alerts_patient      ON clinical_alerts(patient_id) WHERE is_resolved = FALSE;
CREATE INDEX idx_alerts_org          ON clinical_alerts(organization_id) WHERE is_resolved = FALSE;
CREATE INDEX idx_alerts_severity     ON clinical_alerts(organization_id, severity) WHERE is_resolved = FALSE;

-- audit_logs
CREATE INDEX idx_audit_org           ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_record        ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_user          ON audit_logs(user_id, created_at DESC);
