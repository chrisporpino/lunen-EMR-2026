-- ============================================================
-- Lunen EMR 2026 — Functions / RPC
-- Migration: 003_functions.sql
--
-- Todas as funções expostas ao frontend via PostgREST RPC.
-- Funções SECURITY DEFINER verificam contexto de organização
-- internamente, substituindo o RLS padrão.
-- ============================================================

-- ─── 1. CÁLCULO DE IDADE GESTACIONAL ───────────────────────
-- Replica a lógica de src/lib/gestation.ts no banco.
-- Usada internamente pelas demais funções.

CREATE OR REPLACE FUNCTION calculate_gestational_age(
  p_dum      DATE,
  p_ref_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  weeks       SMALLINT,
  days        SMALLINT,
  total_days  INTEGER,
  progress    NUMERIC,   -- 0–100 (%)
  trimester   SMALLINT   -- 1 | 2 | 3
)
LANGUAGE plpgsql STABLE
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
BEGIN
  v_total := (p_ref_date - p_dum)::INTEGER;
  v_total := GREATEST(v_total, 0);   -- nunca negativo

  RETURN QUERY SELECT
    (v_total / 7)::SMALLINT                              AS weeks,
    (v_total % 7)::SMALLINT                              AS days,
    v_total                                              AS total_days,
    ROUND(LEAST((v_total::NUMERIC / 280) * 100, 100), 1) AS progress,
    CASE
      WHEN v_total <= 97  THEN 1  -- até 13+6
      WHEN v_total <= 195 THEN 2  -- até 27+6
      ELSE                     3
    END::SMALLINT                                        AS trimester;
END;
$$;

-- ─── 2. MARCOS GESTACIONAIS ────────────────────────────────
-- Retorna os 4 marcos clínicos baseados na DUM da paciente.
-- Equivalente à lógica de milestones do PregnancyTimeline.

CREATE OR REPLACE FUNCTION get_gestational_milestones(p_patient_id UUID)
RETURNS TABLE (
  week         SMALLINT,
  label        TEXT,
  description  TEXT,
  target_date  DATE,
  is_reached   BOOLEAN
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dum DATE;
BEGIN
  SELECT dum INTO v_dum
  FROM patients
  WHERE id = p_patient_id AND organization_id = current_organization_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'patient_not_found';
  END IF;

  RETURN QUERY
  SELECT
    m.week,
    m.label,
    m.description,
    (v_dum + (m.week * 7) * INTERVAL '1 day')::DATE AS target_date,
    CURRENT_DATE >= (v_dum + (m.week * 7) * INTERVAL '1 day')::DATE AS is_reached
  FROM (VALUES
    (12::SMALLINT, '1º Trimestre — Rastreio',
     'Translucência nucal, PAPP-A e beta-hCG'),
    (20::SMALLINT, 'Ultrassonografia Morfológica',
     'Avaliação detalhada da anatomia fetal'),
    (28::SMALLINT, 'Rastreio de Diabetes Gestacional',
     'TOTG 75g — glicemia em jejum e 2 horas'),
    (36::SMALLINT, 'Preparação para o Parto',
     'Apresentação fetal, plano de parto e orientações')
  ) AS m(week, label, description);
END;
$$;

-- ─── 3. TIMELINE UNIFICADA DA GESTANTE ─────────────────────
-- Retorna consultas + exames + ultrassonografias em ordem cronológica.
-- Substitui a montagem feita em PregnancyTimeline.tsx.

CREATE OR REPLACE FUNCTION get_patient_timeline(p_patient_id UUID)
RETURNS TABLE (
  id                UUID,
  event_type        TEXT,
  event_date        DATE,
  gestational_weeks SMALLINT,
  gestational_days  SMALLINT,
  created_at        TIMESTAMPTZ,
  data              JSONB
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM patients
    WHERE id = p_patient_id AND organization_id = current_organization_id()
  ) THEN
    RAISE EXCEPTION 'patient_not_found';
  END IF;

  RETURN QUERY

  -- Consultas
  SELECT
    c.id,
    'consultation'::TEXT,
    c.consultation_date,
    c.gestational_weeks,
    c.gestational_days,
    c.created_at,
    jsonb_build_object(
      'type',               c.consultation_type,
      'provider',           c.provider_name,
      'provider_id',        c.provider_id,
      'bp_systolic',        c.bp_systolic,
      'bp_diastolic',       c.bp_diastolic,
      'heart_rate',         c.heart_rate,
      'temperature',        c.temperature,
      'weight',             c.weight,
      'height',             c.height,
      'uterine_height',     c.uterine_height,
      'fetal_heart_rate',   c.fetal_heart_rate,
      'fetal_presentation', c.fetal_presentation,
      'edema',              c.edema,
      'notes',              c.notes
    )
  FROM consultations c
  WHERE c.patient_id = p_patient_id

  UNION ALL

  -- Exames
  SELECT
    e.id,
    'exam'::TEXT,
    e.exam_date,
    e.gestational_weeks,
    e.gestational_days,
    e.created_at,
    jsonb_build_object(
      'exam_type',           e.exam_type,
      'result',              e.result,
      'status',              e.status,
      'lab',                 e.lab,
      'notes',               e.notes,
      'result_received_at',  e.result_received_at
    )
  FROM exams e
  WHERE e.patient_id = p_patient_id

  UNION ALL

  -- Ultrassonografias
  SELECT
    u.id,
    'ultrasound'::TEXT,
    u.ultrasound_date,
    u.gestational_weeks,
    u.gestational_days,
    u.created_at,
    jsonb_build_object(
      'type',               u.ultrasound_type,
      'fetal_heart_rate',   u.fetal_heart_rate,
      'bpd',                u.bpd,
      'hc',                 u.hc,
      'ac',                 u.ac,
      'fl',                 u.fl,
      'estimated_weight',   u.estimated_weight,
      'placenta_location',  u.placenta_location,
      'amniotic_fluid',     u.amniotic_fluid,
      'fetal_presentation', u.fetal_presentation,
      'notes',              u.notes
    )
  FROM ultrasounds u
  WHERE u.patient_id = p_patient_id

  ORDER BY event_date DESC, created_at DESC;
END;
$$;

-- ─── 4. MODO CONSULTA — SUPORTE À DECISÃO CLÍNICA ─────────
-- Porta a lógica de src/lib/consultaMode.ts para o banco.
-- Retorna alertas, conduta sugerida, ações necessárias e
-- comparativo entre as duas últimas consultas (Zone 1–4).

CREATE OR REPLACE FUNCTION get_modo_consulta(p_patient_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient           patients%ROWTYPE;
  v_last              consultations%ROWTYPE;
  v_prev              consultations%ROWTYPE;
  v_days_since_last   INTEGER;
  v_days_to_delivery  INTEGER;
  v_iga_weeks         SMALLINT;
  -- Alertas separados por severidade (danger antes, warning depois)
  v_danger_alerts     JSONB := '[]'::JSONB;
  v_warning_alerts    JSONB := '[]'::JSONB;
  -- Flags de alerta (evitam repetição na conduta sugerida)
  v_has_bp            BOOLEAN := FALSE;
  v_has_bcf           BOOLEAN := FALSE;
  v_has_altered       BOOLEAN := FALSE;
  v_has_pending       BOOLEAN := FALSE;
  v_has_no_recent     BOOLEAN := FALSE;
  -- Conduta e ações
  v_condutas          JSONB := '[]'::JSONB;
  v_actions           JSONB := '[]'::JSONB;
  -- Exames auxiliares
  v_altered_exam      exams%ROWTYPE;
  v_pending_14d       exams%ROWTYPE;
  v_pending_7d        exams%ROWTYPE;
  v_totg              exams%ROWTYPE;
BEGIN
  -- ── Buscar paciente ──────────────────────────────────────
  SELECT * INTO v_patient
  FROM patients
  WHERE id = p_patient_id AND organization_id = current_organization_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'patient_not_found';
  END IF;

  -- ── Calcular IG atual e DPP ──────────────────────────────
  v_iga_weeks       := ((CURRENT_DATE - v_patient.dum)::INTEGER / 7)::SMALLINT;
  v_days_to_delivery := (v_patient.edd_calc - CURRENT_DATE)::INTEGER;

  -- ── Últimas duas consultas ───────────────────────────────
  SELECT * INTO v_last
  FROM consultations
  WHERE patient_id = p_patient_id
  ORDER BY consultation_date DESC, created_at DESC
  LIMIT 1;

  IF v_last.id IS NOT NULL THEN
    v_days_since_last := (CURRENT_DATE - v_last.consultation_date)::INTEGER;

    SELECT * INTO v_prev
    FROM consultations
    WHERE patient_id = p_patient_id AND id != v_last.id
    ORDER BY consultation_date DESC, created_at DESC
    LIMIT 1;
  END IF;

  -- ── ALERTAS ──────────────────────────────────────────────

  -- 1. PA ≥ 140/90 na última consulta
  IF v_last.id IS NOT NULL
     AND (COALESCE(v_last.bp_systolic, 0) >= 140
          OR COALESCE(v_last.bp_diastolic, 0) >= 90)
  THEN
    v_danger_alerts := v_danger_alerts || jsonb_build_array(jsonb_build_object(
      'type',         'hypertension',
      'severity',     'danger',
      'message',      format('PA %s/%s mmHg na última consulta — há %s dia(s)',
                        v_last.bp_systolic, v_last.bp_diastolic, v_days_since_last),
      'reference_id', v_last.id
    ));
    v_has_bp := TRUE;
  END IF;

  -- 2. BCF fora de 120–160 bpm na última consulta
  IF v_last.id IS NOT NULL
     AND v_last.fetal_heart_rate IS NOT NULL
     AND v_last.fetal_heart_rate > 0
     AND (v_last.fetal_heart_rate < 120 OR v_last.fetal_heart_rate > 160)
  THEN
    v_danger_alerts := v_danger_alerts || jsonb_build_array(jsonb_build_object(
      'type',         'altered_bcf',
      'severity',     'danger',
      'message',      format('BCF %s bpm na última consulta — fora do padrão (120–160 bpm)',
                        v_last.fetal_heart_rate),
      'reference_id', v_last.id
    ));
    v_has_bcf := TRUE;
  END IF;

  -- 3. Exames com resultado alterado (máx. 2 alertas)
  FOR v_altered_exam IN
    SELECT * FROM exams
    WHERE patient_id = p_patient_id AND status = 'altered'
    ORDER BY exam_date DESC
    LIMIT 2
  LOOP
    v_danger_alerts := v_danger_alerts || jsonb_build_array(jsonb_build_object(
      'type',         'altered_exam',
      'severity',     'danger',
      'message',      v_altered_exam.exam_type || ' com resultado alterado',
      'reference_id', v_altered_exam.id
    ));
    v_has_altered := TRUE;
  END LOOP;

  -- 4. Exame pendente há mais de 14 dias
  SELECT * INTO v_pending_14d
  FROM exams
  WHERE patient_id = p_patient_id
    AND status = 'pending'
    AND (CURRENT_DATE - exam_date) > 14
  ORDER BY exam_date ASC
  LIMIT 1;

  IF v_pending_14d.id IS NOT NULL THEN
    v_warning_alerts := v_warning_alerts || jsonb_build_array(jsonb_build_object(
      'type',         'overdue_exam',
      'severity',     'warning',
      'message',      format('%s sem resultado — pendente há %s dias',
                        v_pending_14d.exam_type,
                        (CURRENT_DATE - v_pending_14d.exam_date)::INTEGER),
      'reference_id', v_pending_14d.id
    ));
    v_has_pending := TRUE;
  END IF;

  -- 5. Sem consulta recente (> 30 dias)
  IF v_last.id IS NULL OR v_days_since_last > 30 THEN
    v_warning_alerts := v_warning_alerts || jsonb_build_array(jsonb_build_object(
      'type',     'overdue_return',
      'severity', 'warning',
      'message',  CASE
                    WHEN v_last.id IS NULL THEN 'Nenhuma consulta registrada'
                    ELSE format('Sem consulta recente — há %s dias', v_days_since_last)
                  END
    ));
    v_has_no_recent := TRUE;
  END IF;

  -- ── CONDUTA SUGERIDA (máx. 3 itens) ─────────────────────

  IF v_has_bp THEN
    v_condutas := v_condutas || jsonb_build_array(
      jsonb_build_object('text', 'Reavaliar PA no início da consulta'));
  END IF;
  IF v_has_bcf THEN
    v_condutas := v_condutas || jsonb_build_array(
      jsonb_build_object('text', 'Reavaliar BCF nesta consulta'));
  END IF;
  IF v_has_altered THEN
    v_condutas := v_condutas || jsonb_build_array(
      jsonb_build_object('text', 'Revisar resultado do exame alterado com a paciente'));
  END IF;
  IF v_has_pending THEN
    v_condutas := v_condutas || jsonb_build_array(
      jsonb_build_object('text', 'Cobrar resultado do exame pendente'));
  END IF;
  IF v_has_no_recent THEN
    v_condutas := v_condutas || jsonb_build_array(
      jsonb_build_object('text', 'Agendar retorno antes de encerrar a consulta'));
  END IF;

  -- ── AÇÕES NECESSÁRIAS (máx. 4 itens) ────────────────────

  -- 1. TOTG a partir de 28 semanas
  IF v_iga_weeks >= 28 THEN
    SELECT * INTO v_totg
    FROM exams
    WHERE patient_id = p_patient_id AND exam_type ILIKE '%TOTG%'
    LIMIT 1;

    IF NOT FOUND THEN
      v_actions := v_actions || jsonb_build_array(
        jsonb_build_object('text', 'Solicitar TOTG 75g hoje — marco de 28 semanas atingido'));
    END IF;
  END IF;

  -- 2. Exame alterado sem consulta posterior
  SELECT * INTO v_altered_exam
  FROM exams
  WHERE patient_id = p_patient_id AND status = 'altered'
  ORDER BY exam_date DESC
  LIMIT 1;

  IF v_altered_exam.id IS NOT NULL THEN
    IF v_last.id IS NULL
       OR v_last.consultation_date < v_altered_exam.exam_date
    THEN
      v_actions := v_actions || jsonb_build_array(
        jsonb_build_object('text', 'Revisar exame alterado nesta consulta'));
    END IF;
  END IF;

  -- 3. Exame pendente há mais de 7 dias
  SELECT * INTO v_pending_7d
  FROM exams
  WHERE patient_id = p_patient_id
    AND status = 'pending'
    AND (CURRENT_DATE - exam_date) > 7
  ORDER BY exam_date ASC
  LIMIT 1;

  IF v_pending_7d.id IS NOT NULL THEN
    v_actions := v_actions || jsonb_build_array(jsonb_build_object(
      'text', format('Cobrar resultado de %s — pendente há %s dias',
                v_pending_7d.exam_type,
                (CURRENT_DATE - v_pending_7d.exam_date)::INTEGER)
    ));
  END IF;

  -- 4. Retorno em atraso
  IF v_last.id IS NOT NULL AND v_days_since_last > 30 THEN
    v_actions := v_actions || jsonb_build_array(
      jsonb_build_object('text', 'Agendar retorno antes de encerrar a consulta'));
  ELSIF v_last.id IS NULL THEN
    v_actions := v_actions || jsonb_build_array(
      jsonb_build_object('text', 'Registrar acompanhamento inicial da paciente'));
  END IF;

  -- ── RESPOSTA FINAL ───────────────────────────────────────

  RETURN jsonb_build_object(

    -- Zone 1: Briefing para Hoje
    'briefing', jsonb_build_object(
      'days_since_last_consultation', v_days_since_last,
      'days_to_delivery',             v_days_to_delivery,
      'alert_count',                  jsonb_array_length(v_danger_alerts || v_warning_alerts)
    ),

    -- Zone 2: Alertas Ativos (danger primeiro, máx. 4)
    'alerts', (
      SELECT COALESCE(jsonb_agg(elem), '[]'::JSONB)
      FROM (
        SELECT elem
        FROM jsonb_array_elements(v_danger_alerts || v_warning_alerts)
        WITH ORDINALITY AS t(elem, ord)
        ORDER BY ord
        LIMIT 4
      ) s
    ),

    -- Zone 2.5: Conduta Sugerida (máx. 3)
    'condutas', (
      SELECT COALESCE(jsonb_agg(elem), '[]'::JSONB)
      FROM (
        SELECT elem
        FROM jsonb_array_elements(v_condutas)
        WITH ORDINALITY AS t(elem, ord)
        ORDER BY ord
        LIMIT 3
      ) s
    ),

    -- Zone 3: O que Mudou (comparativo das 2 últimas consultas)
    'last_consultation', CASE WHEN v_last.id IS NOT NULL THEN
      jsonb_build_object(
        'id',               v_last.id,
        'date',             v_last.consultation_date,
        'weeks',            v_last.gestational_weeks,
        'days',             v_last.gestational_days,
        'bp_systolic',      v_last.bp_systolic,
        'bp_diastolic',     v_last.bp_diastolic,
        'fetal_heart_rate', v_last.fetal_heart_rate,
        'uterine_height',   v_last.uterine_height,
        'weight',           v_last.weight
      )
    ELSE NULL END,

    'previous_consultation', CASE WHEN v_prev.id IS NOT NULL THEN
      jsonb_build_object(
        'id',               v_prev.id,
        'date',             v_prev.consultation_date,
        'bp_systolic',      v_prev.bp_systolic,
        'bp_diastolic',     v_prev.bp_diastolic,
        'fetal_heart_rate', v_prev.fetal_heart_rate,
        'uterine_height',   v_prev.uterine_height,
        'weight',           v_prev.weight
      )
    ELSE NULL END,

    -- Zone 4: Ações Necessárias (máx. 4)
    'actions', (
      SELECT COALESCE(jsonb_agg(elem), '[]'::JSONB)
      FROM (
        SELECT elem
        FROM jsonb_array_elements(v_actions)
        WITH ORDINALITY AS t(elem, ord)
        ORDER BY ord
        LIMIT 4
      ) s
    )
  );
END;
$$;

-- ─── 5. DADOS PARA GRÁFICOS ────────────────────────────────
-- Retorna séries de peso materno e altura uterina.
-- Equivalente ao WeightChart e UterineHeightChart.

CREATE OR REPLACE FUNCTION get_patient_charts(p_patient_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_weight_data   JSONB;
  v_uterine_data  JSONB;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM patients
    WHERE id = p_patient_id AND organization_id = current_organization_id()
  ) THEN
    RAISE EXCEPTION 'patient_not_found';
  END IF;

  -- Gráfico de Peso Materno
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'date',             consultation_date,
      'gestational_weeks', gestational_weeks,
      'gestational_days',  gestational_days,
      'weight',           weight
    ) ORDER BY consultation_date ASC
  ), '[]'::JSONB) INTO v_weight_data
  FROM consultations
  WHERE patient_id = p_patient_id AND weight IS NOT NULL;

  -- Gráfico de Altura Uterina (medida real vs. esperada)
  -- Referência simplificada: AU esperada ≈ semanas gestacionais (Belizán)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'date',             consultation_date,
      'gestational_weeks', gestational_weeks,
      'gestational_days',  gestational_days,
      'uterine_height',   uterine_height,
      'expected_height',  gestational_weeks   -- cm, regra de Belizán simplificada
    ) ORDER BY consultation_date ASC
  ), '[]'::JSONB) INTO v_uterine_data
  FROM consultations
  WHERE patient_id = p_patient_id AND uterine_height IS NOT NULL;

  RETURN jsonb_build_object(
    'weight',         v_weight_data,
    'uterine_height', v_uterine_data
  );
END;
$$;

-- ─── 6. LISTAR GESTANTES COM FILTROS ───────────────────────
-- Substitui a filtragem feita no frontend (PatientsPage).
-- Suporta paginação, filtro por status/risco e busca por nome.

CREATE OR REPLACE FUNCTION list_patients(
  p_status      TEXT    DEFAULT 'ativa',   -- 'ativa' | 'arquivada' | 'all'
  p_risk_level  TEXT    DEFAULT NULL,      -- 'low' | 'medium' | 'high' | null
  p_search      TEXT    DEFAULT NULL,      -- busca parcial por nome
  p_limit       INTEGER DEFAULT 50,
  p_offset      INTEGER DEFAULT 0
)
RETURNS TABLE (
  id              UUID,
  name            TEXT,
  date_of_birth   DATE,
  dum             DATE,
  edd_calc        DATE,
  risk_level      TEXT,
  blood_type      TEXT,
  gravidity       SMALLINT,
  parity          SMALLINT,
  phone           TEXT,
  status          TEXT,
  iga_weeks       SMALLINT,
  iga_days        SMALLINT,
  days_to_edd     INTEGER,
  total_count     BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT
      p.*,
      ((CURRENT_DATE - p.dum)::INTEGER / 7)::SMALLINT  AS v_iga_weeks,
      ((CURRENT_DATE - p.dum)::INTEGER % 7)::SMALLINT  AS v_iga_days,
      (p.edd_calc - CURRENT_DATE)::INTEGER              AS v_days_to_edd
    FROM patients p
    WHERE
      p.organization_id = current_organization_id()
      AND (p_status = 'all' OR p.status = p_status)
      AND (p_risk_level IS NULL OR p.risk_level = p_risk_level)
      AND (
        p_search IS NULL
        OR unaccent(lower(p.name)) ILIKE '%' || unaccent(lower(p_search)) || '%'
      )
  )
  SELECT
    f.id, f.name, f.date_of_birth, f.dum, f.edd_calc,
    f.risk_level, f.blood_type, f.gravidity, f.parity, f.phone, f.status,
    f.v_iga_weeks, f.v_iga_days, f.v_days_to_edd,
    COUNT(*) OVER ()::BIGINT AS total_count
  FROM filtered f
  ORDER BY f.edd_calc ASC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

-- ─── 7. ARQUIVAR / DESARQUIVAR GESTANTE ────────────────────
-- Soft delete — altera status sem remover dados.

CREATE OR REPLACE FUNCTION archive_patient(
  p_patient_id UUID,
  p_archive    BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_clinical_user() THEN
    RAISE EXCEPTION 'insufficient_permissions';
  END IF;

  UPDATE patients SET
    status      = CASE WHEN p_archive THEN 'arquivada' ELSE 'ativa' END,
    archived_at = CASE WHEN p_archive THEN NOW()       ELSE NULL    END,
    archived_by = CASE WHEN p_archive THEN auth.uid()  ELSE NULL    END,
    updated_by  = auth.uid(),
    updated_at  = NOW()
  WHERE id = p_patient_id
    AND organization_id = current_organization_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'patient_not_found';
  END IF;

  RETURN jsonb_build_object('success', TRUE, 'archived', p_archive);
END;
$$;

-- ─── 8. UPSERT DE CONSULTA COM RECÁLCULO DE ALERTAS ────────
-- Cria ou atualiza uma consulta e automaticamente
-- recalcula os alertas clínicos da paciente.

CREATE OR REPLACE FUNCTION upsert_consultation(
  p_patient_id         UUID,
  p_consultation_id    UUID         DEFAULT NULL,   -- NULL = INSERT
  p_consultation_date  DATE         DEFAULT CURRENT_DATE,
  p_consultation_type  TEXT         DEFAULT 'routine',
  p_provider_name      TEXT         DEFAULT '',
  p_provider_id        UUID         DEFAULT NULL,
  p_bp_systolic        SMALLINT     DEFAULT NULL,
  p_bp_diastolic       SMALLINT     DEFAULT NULL,
  p_heart_rate         SMALLINT     DEFAULT NULL,
  p_temperature        NUMERIC      DEFAULT NULL,
  p_weight             NUMERIC      DEFAULT NULL,
  p_height             NUMERIC      DEFAULT NULL,
  p_uterine_height     NUMERIC      DEFAULT NULL,
  p_fetal_heart_rate   SMALLINT     DEFAULT NULL,
  p_fetal_presentation TEXT         DEFAULT NULL,
  p_edema              TEXT         DEFAULT NULL,
  p_notes              TEXT         DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id      UUID;
  v_iga         RECORD;
  v_consult_id  UUID;
BEGIN
  IF NOT is_clinical_user() THEN
    RAISE EXCEPTION 'insufficient_permissions';
  END IF;

  -- Recuperar organização e calcular IG
  SELECT organization_id INTO v_org_id
  FROM patients
  WHERE id = p_patient_id AND organization_id = current_organization_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'patient_not_found';
  END IF;

  SELECT * INTO v_iga
  FROM calculate_gestational_age(
    (SELECT dum FROM patients WHERE id = p_patient_id),
    p_consultation_date
  );

  IF p_consultation_id IS NULL THEN
    -- INSERT
    INSERT INTO consultations (
      patient_id, organization_id,
      consultation_date, gestational_weeks, gestational_days,
      consultation_type, provider_name, provider_id,
      bp_systolic, bp_diastolic, heart_rate, temperature,
      weight, height, uterine_height, fetal_heart_rate,
      fetal_presentation, edema, notes,
      created_by, updated_by
    ) VALUES (
      p_patient_id, v_org_id,
      p_consultation_date, v_iga.weeks, v_iga.days,
      p_consultation_type, p_provider_name, p_provider_id,
      p_bp_systolic, p_bp_diastolic, p_heart_rate, p_temperature,
      p_weight, p_height, p_uterine_height, p_fetal_heart_rate,
      p_fetal_presentation, p_edema, p_notes,
      auth.uid(), auth.uid()
    )
    RETURNING id INTO v_consult_id;

  ELSE
    -- UPDATE (valida criador ou admin)
    UPDATE consultations SET
      consultation_date   = p_consultation_date,
      gestational_weeks   = v_iga.weeks,
      gestational_days    = v_iga.days,
      consultation_type   = p_consultation_type,
      provider_name       = p_provider_name,
      provider_id         = p_provider_id,
      bp_systolic         = p_bp_systolic,
      bp_diastolic        = p_bp_diastolic,
      heart_rate          = p_heart_rate,
      temperature         = p_temperature,
      weight              = p_weight,
      height              = p_height,
      uterine_height      = p_uterine_height,
      fetal_heart_rate    = p_fetal_heart_rate,
      fetal_presentation  = p_fetal_presentation,
      edema               = p_edema,
      notes               = p_notes,
      updated_by          = auth.uid(),
      updated_at          = NOW()
    WHERE id = p_consultation_id
      AND patient_id = p_patient_id
      AND organization_id = v_org_id
      AND (created_by = auth.uid() OR is_admin())
    RETURNING id INTO v_consult_id;

    IF v_consult_id IS NULL THEN
      RAISE EXCEPTION 'consultation_not_found_or_unauthorized';
    END IF;
  END IF;

  -- Recalcular alertas clínicos após qualquer mudança
  PERFORM generate_clinical_alerts(p_patient_id);

  RETURN jsonb_build_object(
    'success',         TRUE,
    'consultation_id', v_consult_id
  );
END;
$$;

-- ─── 9. GERAR ALERTAS CLÍNICOS ─────────────────────────────
-- Recalcula e persiste todos os alertas não resolvidos.
-- Chamada automaticamente por triggers após INSERT/UPDATE
-- em consultations e exams.

CREATE OR REPLACE FUNCTION generate_clinical_alerts(p_patient_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id          UUID;
  v_last            consultations%ROWTYPE;
  v_days_since_last INTEGER;
  v_iga_weeks       SMALLINT;
  v_exam_row        exams%ROWTYPE;
  v_count           INTEGER := 0;
BEGIN
  SELECT organization_id, dum INTO v_org_id, v_iga_weeks
  FROM patients WHERE id = p_patient_id;

  v_iga_weeks := ((CURRENT_DATE - (SELECT dum FROM patients WHERE id = p_patient_id))::INTEGER / 7)::SMALLINT;

  IF v_org_id IS NULL THEN RETURN 0; END IF;

  -- Limpar alertas anteriores não resolvidos para recalcular do zero
  DELETE FROM clinical_alerts
  WHERE patient_id = p_patient_id AND is_resolved = FALSE;

  -- Última consulta
  SELECT * INTO v_last
  FROM consultations
  WHERE patient_id = p_patient_id
  ORDER BY consultation_date DESC LIMIT 1;

  IF v_last.id IS NOT NULL THEN
    v_days_since_last := (CURRENT_DATE - v_last.consultation_date)::INTEGER;
  END IF;

  -- Alerta: Hipertensão (PA ≥ 140/90)
  IF v_last.id IS NOT NULL
     AND (COALESCE(v_last.bp_systolic, 0) >= 140
          OR COALESCE(v_last.bp_diastolic, 0) >= 90)
  THEN
    INSERT INTO clinical_alerts
      (patient_id, organization_id, alert_type, severity, message, reference_id, reference_table)
    VALUES (
      p_patient_id, v_org_id, 'hypertension', 'danger',
      format('PA %s/%s mmHg — risco de pré-eclâmpsia',
        v_last.bp_systolic, v_last.bp_diastolic),
      v_last.id, 'consultations'
    );
    v_count := v_count + 1;
  END IF;

  -- Alerta: BCF anormal
  IF v_last.id IS NOT NULL
     AND v_last.fetal_heart_rate IS NOT NULL
     AND v_last.fetal_heart_rate > 0
     AND (v_last.fetal_heart_rate < 120 OR v_last.fetal_heart_rate > 160)
  THEN
    INSERT INTO clinical_alerts
      (patient_id, organization_id, alert_type, severity, message, reference_id, reference_table)
    VALUES (
      p_patient_id, v_org_id, 'altered_bcf', 'danger',
      format('BCF %s bpm — avaliar bem-estar fetal', v_last.fetal_heart_rate),
      v_last.id, 'consultations'
    );
    v_count := v_count + 1;
  END IF;

  -- Alerta: Exames alterados
  FOR v_exam_row IN
    SELECT * FROM exams
    WHERE patient_id = p_patient_id AND status = 'altered'
    ORDER BY exam_date DESC
  LOOP
    INSERT INTO clinical_alerts
      (patient_id, organization_id, alert_type, severity, message, reference_id, reference_table)
    VALUES (
      p_patient_id, v_org_id, 'altered_exam', 'danger',
      v_exam_row.exam_type || ' com resultado alterado',
      v_exam_row.id, 'exams'
    );
    v_count := v_count + 1;
  END LOOP;

  -- Alerta: Exame pendente > 14 dias
  SELECT * INTO v_exam_row
  FROM exams
  WHERE patient_id = p_patient_id
    AND status = 'pending'
    AND (CURRENT_DATE - exam_date) > 14
  ORDER BY exam_date ASC LIMIT 1;

  IF FOUND THEN
    INSERT INTO clinical_alerts
      (patient_id, organization_id, alert_type, severity, message, reference_id, reference_table)
    VALUES (
      p_patient_id, v_org_id, 'overdue_exam', 'warning',
      format('%s pendente há %s dias',
        v_exam_row.exam_type,
        (CURRENT_DATE - v_exam_row.exam_date)::INTEGER),
      v_exam_row.id, 'exams'
    );
    v_count := v_count + 1;
  END IF;

  -- Alerta: TOTG pendente (≥ 28 semanas sem exame registrado)
  IF v_iga_weeks >= 28 THEN
    SELECT * INTO v_exam_row
    FROM exams
    WHERE patient_id = p_patient_id AND exam_type ILIKE '%TOTG%'
    LIMIT 1;

    IF NOT FOUND THEN
      INSERT INTO clinical_alerts
        (patient_id, organization_id, alert_type, severity, message)
      VALUES (
        p_patient_id, v_org_id, 'totg_due', 'warning',
        'TOTG 75g não registrado — marco de 28 semanas atingido'
      );
      v_count := v_count + 1;
    END IF;
  END IF;

  -- Alerta: Sem consulta recente (> 30 dias)
  IF v_last.id IS NULL OR v_days_since_last > 30 THEN
    INSERT INTO clinical_alerts
      (patient_id, organization_id, alert_type, severity, message)
    VALUES (
      p_patient_id, v_org_id, 'overdue_return', 'warning',
      CASE
        WHEN v_last.id IS NULL THEN 'Nenhuma consulta registrada'
        ELSE format('Sem consulta há %s dias', v_days_since_last)
      END
    );
    v_count := v_count + 1;
  END IF;

  RETURN v_count;
END;
$$;

-- ─── 10. RESOLVER ALERTA ───────────────────────────────────

CREATE OR REPLACE FUNCTION resolve_clinical_alert(p_alert_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_clinical_user() THEN
    RAISE EXCEPTION 'insufficient_permissions';
  END IF;

  UPDATE clinical_alerts SET
    is_resolved = TRUE,
    resolved_at = NOW(),
    resolved_by = auth.uid(),
    updated_at  = NOW()
  WHERE id = p_alert_id
    AND organization_id = current_organization_id()
    AND is_resolved = FALSE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'alert_not_found_or_already_resolved';
  END IF;

  RETURN jsonb_build_object('success', TRUE);
END;
$$;

-- ─── 11. DASHBOARD DA ORGANIZAÇÃO ─────────────────────────
-- Resumo estatístico para a tela inicial da clínica.

CREATE OR REPLACE FUNCTION get_organization_dashboard()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID := current_organization_id();
BEGIN
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      -- Totais
      'total_active',     COUNT(*) FILTER (WHERE status = 'ativa'),
      'total_archived',   COUNT(*) FILTER (WHERE status = 'arquivada'),
      -- Por risco (apenas ativas)
      'risk_low',         COUNT(*) FILTER (WHERE status = 'ativa' AND risk_level = 'low'),
      'risk_medium',      COUNT(*) FILTER (WHERE status = 'ativa' AND risk_level = 'medium'),
      'risk_high',        COUNT(*) FILTER (WHERE status = 'ativa' AND risk_level = 'high'),
      -- Por trimestre (apenas ativas)
      'first_trimester',  COUNT(*) FILTER (WHERE status = 'ativa' AND (CURRENT_DATE - dum) <= 97),
      'second_trimester', COUNT(*) FILTER (WHERE status = 'ativa' AND (CURRENT_DATE - dum) BETWEEN 98 AND 195),
      'third_trimester',  COUNT(*) FILTER (WHERE status = 'ativa' AND (CURRENT_DATE - dum) > 195),
      -- Próximas do parto (≤ 14 dias)
      'near_term',        COUNT(*) FILTER (WHERE status = 'ativa' AND (edd_calc - CURRENT_DATE) BETWEEN 0 AND 14),
      -- Alertas ativos
      'active_alerts',    (SELECT COUNT(*) FROM clinical_alerts WHERE organization_id = v_org_id AND is_resolved = FALSE),
      'danger_alerts',    (SELECT COUNT(*) FROM clinical_alerts WHERE organization_id = v_org_id AND is_resolved = FALSE AND severity = 'danger'),
      'warning_alerts',   (SELECT COUNT(*) FROM clinical_alerts WHERE organization_id = v_org_id AND is_resolved = FALSE AND severity = 'warning')
    )
    FROM patients
    WHERE organization_id = v_org_id
  );
END;
$$;

-- ─── 12. PERFIL COMPLETO DA GESTANTE ──────────────────────
-- Retorna paciente + IG atual + alertas ativos em um único RPC.

CREATE OR REPLACE FUNCTION get_patient_profile(p_patient_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient   patients%ROWTYPE;
  v_iga       RECORD;
  v_alerts    JSONB;
BEGIN
  SELECT * INTO v_patient
  FROM patients
  WHERE id = p_patient_id AND organization_id = current_organization_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'patient_not_found';
  END IF;

  SELECT * INTO v_iga
  FROM calculate_gestational_age(v_patient.dum);

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id',         id,
    'alert_type', alert_type,
    'severity',   severity,
    'message',    message,
    'created_at', created_at
  ) ORDER BY severity DESC, created_at DESC), '[]'::JSONB)
  INTO v_alerts
  FROM clinical_alerts
  WHERE patient_id = p_patient_id AND is_resolved = FALSE;

  RETURN jsonb_build_object(
    'id',            v_patient.id,
    'name',          v_patient.name,
    'date_of_birth', v_patient.date_of_birth,
    'dum',           v_patient.dum,
    'edd_calc',      v_patient.edd_calc,
    'risk_level',    v_patient.risk_level,
    'blood_type',    v_patient.blood_type,
    'gravidity',     v_patient.gravidity,
    'parity',        v_patient.parity,
    'phone',         v_patient.phone,
    'status',        v_patient.status,
    -- IG calculada em tempo real
    'iga_weeks',     v_iga.weeks,
    'iga_days',      v_iga.days,
    'iga_progress',  v_iga.progress,
    'trimester',     v_iga.trimester,
    'days_to_edd',   (v_patient.edd_calc - CURRENT_DATE)::INTEGER,
    -- Alertas ativos
    'active_alerts', v_alerts
  );
END;
$$;
