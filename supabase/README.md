# Lunen EMR 2026 — Supabase Backend

## Arquivos de migração

| Arquivo | Responsabilidade |
|---------|-----------------|
| `001_schema.sql` | Tabelas, relacionamentos, constraints, índices |
| `002_rls.sql` | Row Level Security — funções helper + policies por tabela |
| `003_functions.sql` | RPC functions (lógica de negócio no banco) |
| `004_triggers.sql` | Triggers automáticos (updated_at, EDD, alertas, audit) |
| `005_seed.sql` | Dados de desenvolvimento (3 pacientes + registros clínicos) |

---

## Como aplicar

### Via Supabase CLI (recomendado)

```bash
# 1. Instale a CLI
npm install -g supabase

# 2. Login e link com seu projeto
supabase login
supabase link --project-ref SEU_PROJECT_REF

# 3. Aplique todas as migrações em ordem
supabase db push
```

### Via SQL Editor (Dashboard)

Cole e execute cada arquivo **na ordem numérica** no SQL Editor do Dashboard Supabase.

### Para o seed (requer service_role)

O seed precisa da `service_role` key porque bypassa o RLS para inserir profiles.
Use o SQL Editor do Dashboard (que roda como superuser) ou:

```bash
psql "$DATABASE_URL" -f supabase/migrations/005_seed.sql
```

---

## Modelo de dados

```
organizations
    └── profiles          (membros: admin | obstetrician | nurse | receptionist)
    └── patients
            └── consultations   (sinais vitais, BCF, AU)
            └── exams           (laboratório e imagem)
            └── ultrasounds     (biometria fetal)
            └── diagnoses       (CID-10, Sprint 3)
            └── medications     (prescrições, Sprint 3)
            └── clinical_alerts (gerados automaticamente)
    └── audit_logs         (rastreabilidade LGPD/CFM)
```

---

## RPC Functions disponíveis

Chamadas via `supabase.rpc('nome_da_funcao', { params })`:

| Função | Descrição |
|--------|-----------|
| `calculate_gestational_age(dum, ref_date?)` | IG em semanas+dias, trimestre, progresso |
| `get_gestational_milestones(patient_id)` | 4 marcos clínicos (12, 20, 28, 36 semanas) |
| `get_patient_timeline(patient_id)` | Consultas + exames + USGs em ordem cronológica |
| `get_modo_consulta(patient_id)` | Alertas, conduta sugerida e ações necessárias |
| `get_patient_charts(patient_id)` | Séries para WeightChart e UterineHeightChart |
| `get_patient_profile(patient_id)` | Paciente + IG atual + alertas ativos |
| `list_patients(status?, risk?, search?, limit?, offset?)` | Lista paginada com filtros |
| `archive_patient(patient_id, archive?)` | Arquivar / desarquivar (soft delete) |
| `upsert_consultation(patient_id, ...)` | Criar ou editar consulta + recalcular alertas |
| `generate_clinical_alerts(patient_id)` | Recalcular alertas (chamada manual ou via trigger) |
| `resolve_clinical_alert(alert_id)` | Marcar alerta como resolvido |
| `get_organization_dashboard()` | Estatísticas da organização |

---

## Multi-tenancy

Cada `organization_id` isola completamente os dados. O RLS garante que:

- Queries sem autenticação retornam **zero linhas** (não erro)
- Usuários só acessam registros da **sua organização**
- Funções `SECURITY DEFINER` validam o contexto internamente

---

## Roles e permissões

| Ação | admin | obstetrician | nurse | receptionist |
|------|:-----:|:------------:|:-----:|:------------:|
| Ver pacientes | ✓ | ✓ | ✓ | ✓ |
| Criar/editar pacientes | ✓ | ✓ | ✓ | — |
| Criar/editar consultas | ✓ | ✓ | ✓ | — |
| Criar/editar exames | ✓ | ✓ | ✓ | — |
| Criar diagnósticos | ✓ | ✓ | — | — |
| Prescrever medicamentos | ✓ | ✓ | — | — |
| Ver audit logs | ✓ | — | — | — |
| Gerenciar membros | ✓ | — | — | — |

---

## Integração com o frontend (Sprint 4)

Substituir o `src/lib/storage.ts` por chamadas ao Supabase:

```ts
// Antes (localStorage)
import { getPatients } from '../data/mockPatients'

// Depois (Supabase)
import { supabase } from '../lib/supabase'

const { data } = await supabase.rpc('list_patients', {
  p_status: 'ativa',
  p_search: searchTerm,
})
```

```ts
// Modo Consulta
const { data } = await supabase.rpc('get_modo_consulta', {
  p_patient_id: patientId,
})
// data.alerts, data.condutas, data.actions, data.briefing
```

---

## Variáveis de ambiente necessárias

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
