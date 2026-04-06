-- Migration 006: Corrige o CHECK constraint de fetal_heart_rate
-- para cobrir bradicardia fetal (mínimo clínico real é ~50 bpm)
--
-- O constraint original BETWEEN 80 AND 220 rejeita registros válidos
-- de bradicardia fetal (ex: 70 bpm em sofrimento fetal).

ALTER TABLE consultations
  DROP CONSTRAINT IF EXISTS consultations_fetal_heart_rate_check;

ALTER TABLE consultations
  ADD CONSTRAINT consultations_fetal_heart_rate_check
  CHECK (fetal_heart_rate BETWEEN 50 AND 220);

-- Mesmo ajuste na tabela de ultrassonografias
ALTER TABLE ultrasounds
  DROP CONSTRAINT IF EXISTS ultrasounds_fetal_heart_rate_check;

ALTER TABLE ultrasounds
  ADD CONSTRAINT ultrasounds_fetal_heart_rate_check
  CHECK (fetal_heart_rate BETWEEN 50 AND 220);
