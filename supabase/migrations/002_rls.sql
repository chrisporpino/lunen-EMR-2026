-- ============================================================
-- Lunen EMR 2026 — Row Level Security (RLS)
-- Migration: 002_rls.sql
--
-- Modelo de acesso:
--   admin        → CRUD total dentro da organização
--   obstetrician → CRUD de todos os registros clínicos
--   nurse        → CRUD de todos os registros clínicos
--   receptionist → somente leitura de pacientes
--
-- Regra central: usuários só acessam dados de SUA organização.
-- ============================================================

-- ─── Funções auxiliares (SECURITY DEFINER) ─────────────────
-- Executam com permissões do owner, não do chamador.
-- Evitam recursão infinita no RLS ao consultar profiles.

CREATE OR REPLACE FUNCTION current_organization_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- Retorna TRUE se o usuário tem acesso clínico (pode criar/editar registros)
CREATE OR REPLACE FUNCTION is_clinical_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role IN ('obstetrician', 'nurse', 'admin')
     FROM profiles WHERE id = auth.uid()),
    FALSE
  )
$$;

-- Retorna TRUE se o usuário é administrador da organização
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM profiles WHERE id = auth.uid()),
    FALSE
  )
$$;

-- ─── Habilitar RLS em todas as tabelas ─────────────────────

ALTER TABLE organizations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ultrasounds      ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_alerts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ORGANIZATIONS
-- Usuário vê e edita apenas sua própria organização.
-- ============================================================

CREATE POLICY "organizations_select"
  ON organizations FOR SELECT
  USING (id = current_organization_id());

CREATE POLICY "organizations_update"
  ON organizations FOR UPDATE
  USING (id = current_organization_id() AND is_admin())
  WITH CHECK (id = current_organization_id() AND is_admin());

-- ============================================================
-- PROFILES
-- Membros veem todos os perfis da organização.
-- Cada usuário edita o próprio; admin edita qualquer um.
-- ============================================================

CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (organization_id = current_organization_id());

-- Inserção de novos membros: apenas admin ou via trigger on_auth_user_created
CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  WITH CHECK (
    organization_id = current_organization_id()
    AND is_admin()
  );

-- Atualização: próprio perfil OU admin da organização
CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (
    id = auth.uid()
    OR (organization_id = current_organization_id() AND is_admin())
  )
  WITH CHECK (
    id = auth.uid()
    OR (organization_id = current_organization_id() AND is_admin())
  );

-- Desativação (não deleção física): somente admin, não pode remover a si mesmo
CREATE POLICY "profiles_delete"
  ON profiles FOR DELETE
  USING (
    organization_id = current_organization_id()
    AND is_admin()
    AND id != auth.uid()
  );

-- ============================================================
-- PATIENTS
-- Todos os membros veem. Clínicos criam/editam. Admin deleta.
-- Deleção física raramente usada — preferir archive_patient().
-- ============================================================

CREATE POLICY "patients_select"
  ON patients FOR SELECT
  USING (organization_id = current_organization_id());

CREATE POLICY "patients_insert"
  ON patients FOR INSERT
  WITH CHECK (
    organization_id = current_organization_id()
    AND is_clinical_user()
  );

CREATE POLICY "patients_update"
  ON patients FOR UPDATE
  USING (
    organization_id = current_organization_id()
    AND is_clinical_user()
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND is_clinical_user()
  );

-- Hard delete: apenas admin (preferir soft delete via status)
CREATE POLICY "patients_delete"
  ON patients FOR DELETE
  USING (
    organization_id = current_organization_id()
    AND is_admin()
  );

-- ============================================================
-- CONSULTATIONS
-- Todos veem. Clínicos criam. Criador ou admin editam/deletam.
-- ============================================================

CREATE POLICY "consultations_select"
  ON consultations FOR SELECT
  USING (organization_id = current_organization_id());

CREATE POLICY "consultations_insert"
  ON consultations FOR INSERT
  WITH CHECK (
    organization_id = current_organization_id()
    AND is_clinical_user()
  );

CREATE POLICY "consultations_update"
  ON consultations FOR UPDATE
  USING (
    organization_id = current_organization_id()
    AND (created_by = auth.uid() OR is_admin())
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND (created_by = auth.uid() OR is_admin())
  );

CREATE POLICY "consultations_delete"
  ON consultations FOR DELETE
  USING (
    organization_id = current_organization_id()
    AND (created_by = auth.uid() OR is_admin())
  );

-- ============================================================
-- EXAMS
-- ============================================================

CREATE POLICY "exams_select"
  ON exams FOR SELECT
  USING (organization_id = current_organization_id());

CREATE POLICY "exams_insert"
  ON exams FOR INSERT
  WITH CHECK (
    organization_id = current_organization_id()
    AND is_clinical_user()
  );

CREATE POLICY "exams_update"
  ON exams FOR UPDATE
  USING (
    organization_id = current_organization_id()
    AND (created_by = auth.uid() OR is_admin())
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND (created_by = auth.uid() OR is_admin())
  );

CREATE POLICY "exams_delete"
  ON exams FOR DELETE
  USING (
    organization_id = current_organization_id()
    AND (created_by = auth.uid() OR is_admin())
  );

-- ============================================================
-- ULTRASOUNDS
-- ============================================================

CREATE POLICY "ultrasounds_select"
  ON ultrasounds FOR SELECT
  USING (organization_id = current_organization_id());

CREATE POLICY "ultrasounds_insert"
  ON ultrasounds FOR INSERT
  WITH CHECK (
    organization_id = current_organization_id()
    AND is_clinical_user()
  );

CREATE POLICY "ultrasounds_update"
  ON ultrasounds FOR UPDATE
  USING (
    organization_id = current_organization_id()
    AND (created_by = auth.uid() OR is_admin())
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND (created_by = auth.uid() OR is_admin())
  );

CREATE POLICY "ultrasounds_delete"
  ON ultrasounds FOR DELETE
  USING (
    organization_id = current_organization_id()
    AND (created_by = auth.uid() OR is_admin())
  );

-- ============================================================
-- DIAGNOSES
-- Somente médicos (obstetrician) e admin podem criar/editar.
-- ============================================================

CREATE POLICY "diagnoses_select"
  ON diagnoses FOR SELECT
  USING (organization_id = current_organization_id());

CREATE POLICY "diagnoses_insert"
  ON diagnoses FOR INSERT
  WITH CHECK (
    organization_id = current_organization_id()
    AND current_user_role() IN ('obstetrician', 'admin')
  );

CREATE POLICY "diagnoses_update"
  ON diagnoses FOR UPDATE
  USING (
    organization_id = current_organization_id()
    AND current_user_role() IN ('obstetrician', 'admin')
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND current_user_role() IN ('obstetrician', 'admin')
  );

CREATE POLICY "diagnoses_delete"
  ON diagnoses FOR DELETE
  USING (
    organization_id = current_organization_id()
    AND current_user_role() IN ('obstetrician', 'admin')
  );

-- ============================================================
-- MEDICATIONS
-- Somente médicos (obstetrician) e admin prescrevem.
-- ============================================================

CREATE POLICY "medications_select"
  ON medications FOR SELECT
  USING (organization_id = current_organization_id());

CREATE POLICY "medications_insert"
  ON medications FOR INSERT
  WITH CHECK (
    organization_id = current_organization_id()
    AND current_user_role() IN ('obstetrician', 'admin')
  );

CREATE POLICY "medications_update"
  ON medications FOR UPDATE
  USING (
    organization_id = current_organization_id()
    AND current_user_role() IN ('obstetrician', 'admin')
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND current_user_role() IN ('obstetrician', 'admin')
  );

CREATE POLICY "medications_delete"
  ON medications FOR DELETE
  USING (
    organization_id = current_organization_id()
    AND current_user_role() IN ('obstetrician', 'admin')
  );

-- ============================================================
-- CLINICAL ALERTS
-- Todos veem. Clínicos resolvem. Inserção via SECURITY DEFINER.
-- ============================================================

CREATE POLICY "alerts_select"
  ON clinical_alerts FOR SELECT
  USING (organization_id = current_organization_id());

-- Inserção gerenciada por funções SECURITY DEFINER (generate_clinical_alerts)
CREATE POLICY "alerts_insert"
  ON clinical_alerts FOR INSERT
  WITH CHECK (organization_id = current_organization_id());

-- Atualização para resolver alertas
CREATE POLICY "alerts_update"
  ON clinical_alerts FOR UPDATE
  USING (
    organization_id = current_organization_id()
    AND is_clinical_user()
  )
  WITH CHECK (
    organization_id = current_organization_id()
    AND is_clinical_user()
  );

-- ============================================================
-- AUDIT LOGS
-- Somente leitura para admins. Inserção via triggers SECURITY DEFINER.
-- ============================================================

CREATE POLICY "audit_select"
  ON audit_logs FOR SELECT
  USING (
    organization_id = current_organization_id()
    AND is_admin()
  );

-- Inserção exclusiva por triggers (SECURITY DEFINER, ignoram RLS)
CREATE POLICY "audit_insert_trigger"
  ON audit_logs FOR INSERT
  WITH CHECK (TRUE);
