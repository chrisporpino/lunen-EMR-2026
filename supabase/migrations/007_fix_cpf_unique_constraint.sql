-- Migration 007: Corrige a unique constraint de CPF na tabela patients
--
-- O constraint original usa NULLS NOT DISTINCT, o que faz NULLs serem
-- tratados como iguais. Resultado: apenas UMA paciente por organização
-- pode ter cpf = null, gerando 409 Conflict ao cadastrar a segunda.
--
-- A correção remove NULLS NOT DISTINCT para restaurar o comportamento
-- padrão do PostgreSQL: NULLs são distintos, então múltiplas pacientes
-- sem CPF informado podem coexistir na mesma organização.

ALTER TABLE patients DROP CONSTRAINT IF EXISTS cpf_per_org;

ALTER TABLE patients
  ADD CONSTRAINT cpf_per_org UNIQUE (organization_id, cpf);
