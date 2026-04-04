-- ============================================================
-- Lunen EMR 2026 — Triggers
-- Migration: 004_triggers.sql
-- ============================================================

-- ─── 1. updated_at automático ──────────────────────────────
-- Garante que updated_at sempre reflita a última modificação.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_exams_updated_at
  BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_ultrasounds_updated_at
  BEFORE UPDATE ON ultrasounds
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_diagnoses_updated_at
  BEFORE UPDATE ON diagnoses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_medications_updated_at
  BEFORE UPDATE ON medications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_alerts_updated_at
  BEFORE UPDATE ON clinical_alerts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 2. DPP automática (Regra de Naegele) ──────────────────
-- Recalcula edd_calc = DUM + 280 dias sempre que DUM mudar.
-- O INSERT não precisa fornecer edd_calc — o trigger cuida.

CREATE OR REPLACE FUNCTION auto_calculate_edd()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.edd_calc := NEW.dum + INTERVAL '280 days';
  RETURN NEW;
END;
$$;

-- Dispara em INSERT (sempre) e em UPDATE somente quando dum mudar
CREATE TRIGGER trg_patients_auto_edd
  BEFORE INSERT OR UPDATE OF dum ON patients
  FOR EACH ROW EXECUTE FUNCTION auto_calculate_edd();

-- ─── 3. Alertas clínicos automáticos ──────────────────────
-- Recalcula alertas após qualquer mudança em consultas ou exames.
-- Usa AFTER para ter os dados finais já persistidos.

CREATE OR REPLACE FUNCTION trigger_generate_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM generate_clinical_alerts(NEW.patient_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_alerts_on_consultation
  AFTER INSERT OR UPDATE ON consultations
  FOR EACH ROW EXECUTE FUNCTION trigger_generate_alerts();

CREATE TRIGGER trg_alerts_on_exam
  AFTER INSERT OR UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION trigger_generate_alerts();

-- ─── 4. Audit log ─────────────────────────────────────────
-- Registra INSERT, UPDATE e DELETE nas tabelas clínicas.
-- Conformidade com LGPD e normas do CFM para prontuários.

CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id    UUID;
  v_record_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_org_id    := OLD.organization_id;
    v_record_id := OLD.id;
  ELSE
    v_org_id    := NEW.organization_id;
    v_record_id := NEW.id;
  END IF;

  INSERT INTO audit_logs (
    organization_id, user_id, action,
    table_name,      record_id,
    old_data,        new_data
  ) VALUES (
    v_org_id,
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    v_record_id,
    CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD)::JSONB ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::JSONB ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar auditoria nas tabelas com dados clínicos sensíveis
CREATE TRIGGER trg_audit_patients
  AFTER INSERT OR UPDATE OR DELETE ON patients
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER trg_audit_consultations
  AFTER INSERT OR UPDATE OR DELETE ON consultations
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER trg_audit_exams
  AFTER INSERT OR UPDATE OR DELETE ON exams
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER trg_audit_ultrasounds
  AFTER INSERT OR UPDATE OR DELETE ON ultrasounds
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER trg_audit_diagnoses
  AFTER INSERT OR UPDATE OR DELETE ON diagnoses
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER trg_audit_medications
  AFTER INSERT OR UPDATE OR DELETE ON medications
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- ─── 5. Criação automática de organização + profile no signup ─
-- Fluxo: usuário cria conta → sistema cria organização → cria profile
--
-- Metadados opcionais no signUp({ data: { ... } }):
--   full_name        → nome do usuário (fallback: prefixo do e-mail)
--   organization_name → nome da clínica (fallback: "Clínica <full_name>")
--   organization_id  → UUID de org existente (para convidar usuário a org já criada)
--   role             → papel na org (fallback: 'admin')

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id   UUID;
  v_org_name TEXT;
  v_name     TEXT;
  v_role     TEXT;
BEGIN
  v_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
    split_part(NEW.email, '@', 1)
  );

  v_role := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'role'), ''),
    'admin'
  );

  -- Se foi passado organization_id, vincula a uma org existente
  v_org_id := (NEW.raw_user_meta_data ->> 'organization_id')::UUID;

  -- Caso contrário, cria uma nova organização automaticamente
  IF v_org_id IS NULL THEN
    v_org_name := COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'organization_name'), ''),
      'Clínica ' || v_name
    );

    INSERT INTO organizations (name)
    VALUES (v_org_name)
    RETURNING id INTO v_org_id;
  END IF;

  -- Cria o profile vinculado à organização
  INSERT INTO profiles (id, organization_id, full_name, role)
  VALUES (NEW.id, v_org_id, v_name, v_role)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger no schema auth (gerenciado pelo Supabase)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
