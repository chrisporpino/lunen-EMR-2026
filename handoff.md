# Project Handoff — Lunen EMR

> Este arquivo captura o estado atual do projeto para que a próxima sessão de desenvolvimento possa continuar sem depender do histórico de conversas anteriores.

---

## 1. Project Overview

**Lunen EMR** é um protótipo de sistema de prontuário eletrônico (EMR) obstétrico desenvolvido para o mercado brasileiro.

**Usuários-alvo:** Enfermeiros obstétricos e obstetras que conduzem acompanhamento pré-natal em clínicas e ambulatórios.

**Experiência principal:** Uma linha do tempo gestacional por paciente — o equivalente clínico de um feed cronológico — onde consultas, exames laboratoriais, ultrassonografias e marcos gestacionais são registrados e visualizados de forma unificada.

**Por que existe:** O pré-natal brasileiro segue um protocolo estruturado com marcos clínicos bem definidos (IG 12, 20, 28, 36 semanas). O sistema foi concebido para tornar esse protocolo visível e operacional dentro de uma interface que prioriza a linha do tempo como objeto central — um **EMR com foco na timeline**, inspirado no design do Apple Health.

**Posicionamento do produto:** O Lunen EMR é uma **ferramenta de suporte à decisão clínica**, não um prontuário genérico. O objetivo central é eliminar a necessidade de consultar histórico no WhatsApp ou reconstruir mentalmente o caso antes de cada consulta. A experiência foi projetada para que o profissional entenda a situação clínica da paciente em menos de 10 segundos ao abrir o prontuário.

O projeto é **exclusivamente frontend** neste estágio. Não há backend, não há chamadas de API e todos os dados são mockados localmente.

---

## 2. Current Development Stage

### Sprint 0 — Protótipo de Visualização Clínica (concluído)

Estabeleceu a estrutura visual completa do produto:

- Lista de pacientes com estratificação de risco
- Página de timeline da paciente
- Cálculo de idade gestacional (IG) e DPP pela Regra de Naegele
- Eventos de consulta, exame e ultrassonografia na timeline
- Marcos gestacionais (IG 12, 20, 28, 36 semanas)
- Cards de resumo clínico (IG atual, DPP, Condições Ativas)
- Gráficos de evolução de peso e altura uterina (Recharts)

### Sprint 1 — Implementação de CRUD Frontend (concluído)

**Concluído neste sprint:**

- Componente `Drawer` reutilizável (painel lateral deslizante)
- Sistema de formulários baseado em drawers para todas as entidades
- Funções de criação nos arrays mockados (`addPatient`, `addConsultation`, `addExam`, `addUltrasound`)
- Páginas convertidas para `useState` reativo com callbacks `onSaved`
- Botões de ação em todas as páginas principais
- **Edição de consultas** — `ConsultationFormDrawer` com `initialValues`, `updateConsultation`, botão de edição em `ConsultationEvent`
- **Exclusão de consultas** — `deleteConsultation`, reatividade imediata em timeline e gráficos
- **Edição e exclusão de exames** — `ExamFormDrawer` com `initialValues`, `updateExam`, `deleteExam`, botões de edição/exclusão em `ExamEvent`
- **Edição e exclusão de ultrassonografias** — `UltrasoundFormDrawer` com `initialValues`, `updateUltrasound`, `deleteUltrasound`, botões de edição/exclusão em `UltrasoundEvent`
- **Hierarquia da `PatientTimelinePage` reordenada** — gráficos clínicos agora aparecem acima da linha do tempo (ordem: resumo → gráficos → timeline)

### Sprint 2 — Persistência, Feedback, Arquivamento e Suporte à Decisão (concluído)

**Concluído neste sprint:**

- **Persistência via localStorage** — `src/lib/storage.ts` com `loadFromStorage` / `saveToStorage`; todos os arrays de dados inicializam a partir do localStorage e persistem a cada mutação; fallback para seed se a chave não existir ou o JSON estiver corrompido
- **`AlertDialog` reutilizável** — `src/components/ui/AlertDialog.tsx`; modal centralizado com backdrop, fechamento por Escape, botão destrutivo; substitui os blocos de confirmação inline que existiam dentro de cada card de evento
- **Confirmações de exclusão unificadas** — `confirmingDelete` inline removido de `ConsultationEvent`, `ExamEvent` e `UltrasoundEvent`; todos usam `AlertDialog`
- **Toast/snackbar** — `src/components/ui/Toast.tsx` + `useToast`; feedback pós-ação em todas as páginas
- **Arquivamento de pacientes** — `Patient.status: 'ativa' | 'arquivada'`; `archivePatient()` em `mockPatients.ts`; botão "Encerrar acompanhamento" via `PatientHeader`; confirmação via `AlertDialog`
- **Filtro Ativas/Arquivadas** — toggle na `PatientsPage`; stat cards refletem o filtro ativo
- **Busca por nome** — campo de texto em `PatientsPage`; filtra por `p.name.toLowerCase().includes(query)`; opera em conjunto com o filtro de status; empty state contextual
- **Correção: `height` preservado na edição de consultas** — `ConsultationFormValues` agora inclui `height?: number`
- **Modo Consulta V1** — superfície de suporte à decisão clínica renderizada no topo de `PatientTimelinePage`:
  - `src/lib/consultaMode.ts` — módulo puro: `deriveAlerts`, `deriveCondutas`, `deriveActions`, `getLastTwoConsultations`, `daysAgo`, `formatDaysAgo`
  - `src/components/patient/ModoConsulta.tsx` — 4 zonas: Contexto Gestacional, Alertas Ativos, Conduta Sugerida, O que mudou, Ações Necessárias
  - Regras de alerta: PA ≥ 140/90, BCF fora de 120–160 bpm, exame `altered`, exame `pending` > 14 dias, sem consulta > 30 dias
  - Regras de ação: TOTG em semana ≥ 28, exame alterado sem consulta posterior, exame pendente > 7 dias, retorno em atraso

**Sprint 2: CONCLUÍDO**

---

## 3. Key Implemented Features

### Modo Consulta — `PatientTimelinePage` (topo)
Superfície de suporte à decisão clínica renderizada acima do histórico em `PatientTimelinePage`. Composta por 4 zonas derivadas deterministicamente dos dados existentes.

**Zone 1 — Contexto Gestacional:** nome, risco, G/P, tipo sanguíneo, IG, DPP, dias restantes, tempo decorrido desde a última consulta (relativo: "há 14 dias"). A cor do elapsed time muda para `text-warning` quando > 30 dias.

**Zone 2 — Alertas Ativos:** invisível quando não há alertas. Regras: PA ≥ 140/90, BCF fora de 120–160 bpm, exame `altered`, exame `pending` há > 14 dias, sem consulta há > 30 dias. Danger antes de warning. Máx. 4.

**Zone 2.5 — Conduta Sugerida:** visível apenas quando Zone 2 tem alertas. Mapeamento direto alerta → conduta. Máx. 3 linhas, verb-first.

**Zone 3 — O que mudou:** últimas 2 consultas com PA, BCF, AU, peso. Valores críticos em `text-danger`.

**Zone 4 — Ações Necessárias:** regras: TOTG em semana ≥ 28, exame alterado sem consulta posterior, exame pendente > 7 dias, retorno em atraso > 30 dias. Máx. 4 itens, verb-first.

### Camada de lógica clínica — `src/lib/consultaMode.ts`
Módulo puro sem React. Exporta: `deriveAlerts`, `deriveCondutas`, `deriveActions`, `getLastTwoConsultations`, `daysAgo`, `formatDaysAgo`.

### Lista de Pacientes — `PatientsPage`
Rota `/`. Exibe todas as gestantes cadastradas com badge de risco (baixo/intermediário/alto), IG atual, DPP e barra de progresso gestacional. Inclui cards de resumo por nível de risco. Botão "+ Nova Gestante" abre `PatientFormDrawer`.

**Busca por nome:** campo de texto acima dos stat cards; filtra por `p.name.toLowerCase().includes(query)`; opera em conjunto com o toggle Ativas/Arquivadas (ambos aplicados via `patients.filter`); estado limpo em `useState('')`; empty state contextual (mensagem diferente para busca sem resultado vs. lista vazia).

### Timeline da Paciente — `PatientTimelinePage`
Rota `/patient/:id`. Tela principal do produto. Ordem das seções:
1. **Modo Consulta** — suporte à decisão clínica (ver seção dedicada acima)
2. Separador "Histórico Clínico"
3. Cards de resumo clínico (IG, DPP, Condições Ativas com última PA)
4. Gráficos Clínicos (WeightChart e UterineHeightChart)
5. Linha do tempo gestacional com botões de ação rápida (`+ Consulta`, `+ Exame`, `+ USG`)

Estado reativo via `useState` — criação, edição e exclusão de qualquer entidade (consulta, exame, USG) atualizam imediatamente os cards de resumo, os gráficos e a timeline via `refreshData()` que re-lê os arrays compartilhados.

### Página de Consultas — `PatientConsultations`
Rota `/patient/:id/consultations`. Lista todas as consultas ordenadas da mais recente para a mais antiga. Botão "+ Nova Consulta". Cada card tem botões de edição (lápis) e exclusão (lixeira); exclusão abre `AlertDialog`.

### Página de Exames — `PatientExams`
Rota `/patient/:id/exams`. Lista exames laboratoriais e ultrassonografias com filtro por tipo (Todos / Laboratório / Imagem). Botões "+ Novo Exame" e "+ Nova USG". Cada card tem botões de edição (lápis) e exclusão (lixeira); exclusão abre `AlertDialog`.

### Cálculos Obstétricos — `src/lib/gestation.ts`
Fonte única de verdade para todos os cálculos gestacionais: DPP (Regra de Naegele), IG em semanas+dias, trimestre, percentual de progresso, formatação de datas em português brasileiro.

### Eventos da Timeline
- **`ConsultationEvent`** — sinais vitais, AU, BCF, apresentação fetal, edema, anotações; alerta de PA ≥ 140/90 mmHg; botões de edição (lápis) e exclusão (lixeira); exclusão abre `AlertDialog` centralizado
- **`ExamEvent`** — tipo, resultado, status (Normal / Alterado / Pendente), laboratório; botões de edição (lápis) e exclusão (lixeira); exclusão abre `AlertDialog` centralizado
- **`UltrasoundEvent`** — biometria fetal (DBP, PC, CA, CF), peso estimado, ILA, localização placentária; botões de edição (lápis) e exclusão (lixeira); exclusão abre `AlertDialog` centralizado
- **`MilestoneEvent`** — marcos clínicos com indicação visual de alcançado/pendente

### Componentes UI — `src/components/ui/`
- **`RiskBadge`** — badge de nível de risco com dot colorido; tamanhos `sm` e `md`
- **`AlertDialog`** — diálogo modal centralizado para ações destrutivas; props: `open`, `title`, `message`, `confirmLabel?`, `onClose`, `onConfirm`; fecha com Escape ou clique no backdrop; `onConfirm` é chamado antes de `onClose` internamente
- **`Toast`** + **`useToast`** — sistema de notificação leve pós-ação; `useToast()` retorna `{ toastMessage, showToast }`; `showToast(msg)` dispara um toast que some automaticamente após 3 s; timer reinicia se um novo toast for disparado antes do anterior expirar; `<Toast message={toastMessage} />` renderiza no canto inferior direito (fixed, z-50)

### Sistema de Formulários — `src/components/forms/`
- **`Drawer`** — painel lateral direito com backdrop, fechamento por Escape e trava de scroll do body
- **`PatientFormDrawer`** — cadastro/edição de gestante; aceita `initialValues?: Patient`
- **`ConsultationFormDrawer`** — aceita `initialValues?: Consultation`; quando presente, opera em modo edição (`updateConsultation`) em vez de criação (`addConsultation`); título e botão mudam automaticamente; `useEffect` sincroniza o formulário ao abrir
- **`ExamFormDrawer`** — registro/edição de exame com seletor de tipos comuns, status tri-state; aceita `initialValues?: Exam`; tipos personalizados (fora da lista) round-trip corretamente via campo de texto livre
- **`UltrasoundFormDrawer`** — registro/edição de USG; biometria oculta no modo Transvaginal; aceita `initialValues?: Ultrasound`; `usgToForm` mapeia `'N/A'` para `''` nos campos opcionais
- **`FormField`** — helpers reutilizáveis: `Field`, `inputCls`, `FormSection`, `DrawerFooter` (aceita `submitLabel?`)

### Gráficos Clínicos — `src/components/charts/`
- **`WeightChart`** — linha do peso materno por IG (requer ≥ 2 pontos)
- **`UterineHeightChart`** — altura uterina medida vs. esperada (curva de referência = semana gestacional)

Ambos recebem `consultations` como prop e rerenderizam automaticamente após edição ou exclusão de consultas.

### Camada de Dados — `src/data/` + `src/lib/storage.ts`

`src/lib/storage.ts` exporta `loadFromStorage<T>(key, seed)` e `saveToStorage<T>(key, data)`. Cada arquivo de dados inicializa seu array via `loadFromStorage` e chama `saveToStorage` ao final de cada mutação. Chaves no localStorage: `lunen:patients`, `lunen:consultations`, `lunen:exams`, `lunen:ultrasounds`.

| Arquivo | Array | Getter | Mutações disponíveis |
|---|---|---|---|
| `mockPatients.ts` | `mockPatients` | — | `addPatient`, `updatePatient`, `archivePatient` |
| `mockConsultations.ts` | `mockConsultations` | `getConsultationsByPatient` | `addConsultation`, `updateConsultation`, `deleteConsultation` |
| `mockExams.ts` | `mockExams` | `getExamsByPatient` | `addExam`, `updateExam`, `deleteExam` |
| `mockUltrasounds.ts` | `mockUltrasounds` | `getUltrasoundsByPatient` | `addUltrasound`, `updateUltrasound`, `deleteUltrasound` |

### Propagação de edição/exclusão (padrão comum a todas as entidades)
`XxxEvent.onEdit` → `setEditingXxx` + `setXxxDrawerOpen(true)` → `XxxFormDrawer` com `initialValues` → `updateXxx` → `onSaved` → `refreshData` → `useState` re-lê o array → timeline rerenderiza.

`XxxEvent.onDelete` → `AlertDialog` centralizado → confirmação → `deleteXxx` → `refreshData` → mesma cascata acima.

---

## 4. Known Issues / Technical Debt

### ~~Sem feedback visual pós-ação~~ — resolvido
Toast implementado em todas as páginas para create/edit/delete de todas as entidades.

### ~~Sem arquivamento de pacientes~~ — resolvido
`Patient.status: 'ativa' | 'arquivada'`. Botão "Encerrar acompanhamento" em todas as páginas da paciente (via `PatientHeader`). `PatientsPage` filtra por status com toggle Ativas/Arquivadas.

### Condições Ativas hardcoded por nível de risco
O card "Condições Ativas" em `PatientTimelinePage` exibe tags fixas determinadas pelo campo `riskLevel` da paciente. Não há uma entidade de diagnóstico real no modelo de dados.

### Sem autenticação
A aplicação não tem controle de acesso. O campo de usuário no header é apenas visual.

### Stack sem backend
Todo o estado da aplicação é frontend-only. Dados persistem via localStorage. A preparação para integração com uma API REST ainda não foi iniciada.

---

## 5. Next Development Tasks

Em ordem de prioridade sugerida:

**Sprint 2 — CONCLUÍDO**
- ~~localStorage persistence~~ — implementado
- ~~AlertDialog~~ — implementado
- ~~Toast/snackbar~~ — implementado
- ~~Arquivamento de pacientes~~ — implementado
- ~~Filtro Ativas/Arquivadas~~ — implementado
- ~~Busca por nome na lista de pacientes~~ — implementado
- ~~Modo Consulta V1~~ — implementado

**Sprint 3 — prioridades sugeridas**
1. **Validar Modo Consulta com usuário real** — observar se as zonas, alertas e condutas fazem sentido no contexto de uma consulta real; ajustar regras de priorização com base no feedback
2. **Refinar lógica de alertas e ações** — expandir regras em `consultaMode.ts`: intervalo de retorno por nível de risco, marcos além da semana 28, desvio de peso entre consultas
3. **Diagnósticos como entidade própria** — modelo `Diagnosis` com CID-10 simplificado; substituir as tags hardcoded de `ConditionTags` em `PatientTimelinePage`
4. **Medicamentos** — entidade `Medication` com posologia, início e fim; exibição na timeline

**Sprint 4**
5. **Preparação para integração com backend** — separar a camada de dados em serviços (`src/services/`) com interfaces compatíveis com REST; facilitar substituição dos mocks por chamadas reais

---

## 6. Development Rules

Estas regras devem ser respeitadas em todas as sessões de desenvolvimento futuras:

- **Interface em português brasileiro** — todos os textos visíveis ao usuário, labels de formulário, mensagens de erro e placeholders devem estar em pt-BR
- **Manter a direção de design Apple Health** — cards brancos com sombra suave, paleta teal (`#3A7D7C`), border-radius generoso, tipografia Inter; ver `tailwind.config.js` para os tokens de design
- **Não introduzir bibliotecas de estado global** — usar apenas `useState` e `useReducer` do React; não adicionar Redux, Zustand, Jotai ou similares
- **`gestation.ts` é a fonte única de verdade** para cálculos de IG, DPP, trimestre e progresso gestacional; nunca duplicar essas lógicas em componentes
- **Preferir drawers a páginas separadas** para formulários; a navegação por abas do `PatientHeader` deve permanecer como o único mecanismo de troca de contexto dentro de uma paciente
- **A timeline é a tela principal** — qualquer nova funcionalidade deve ser avaliada em função de como ela se integra à experiência da linha do tempo
- **Sem backend ainda** — não adicionar chamadas de API, `fetch`, `axios` ou qualquer dependência de rede até que o backend seja formalmente iniciado
- **Padrão de edição estabelecido** — para adicionar edição a qualquer entidade: (1) `updateXxx` em `src/data/`; (2) `initialValues?: Xxx` no drawer com `useEffect` de sincronização; (3) botão de lápis no event card; (4) `editingXxx` state + handler na página

---

## 7. Next Session Starting Point

```
Leia este arquivo e o repositório antes de escrever qualquer código.

Este projeto é um protótipo de EMR obstétrico frontend-only para o mercado brasileiro.
É uma ferramenta de suporte à decisão clínica — não um prontuário genérico.
Objetivo: o profissional entende o caso em menos de 10 segundos ao abrir o prontuário.

Sprint 0: CONCLUÍDO — visualização clínica completa
Sprint 1: CONCLUÍDO — CRUD completo para todas as entidades:
  - Pacientes: create, edit (sem delete — intencional)
  - Consultas: create, edit, delete
  - Exames: create, edit, delete
  - Ultrassonografias: create, edit, delete

Sprint 2: CONCLUÍDO — tudo abaixo está implementado e funcionando:
  - Persistência via localStorage (src/lib/storage.ts)
  - AlertDialog centralizado (src/components/ui/AlertDialog.tsx)
  - Toast/snackbar (src/components/ui/Toast.tsx + useToast)
  - Arquivamento de pacientes: Patient.status ('ativa'|'arquivada'); archivePatient()
  - Filtro Ativas/Arquivadas na PatientsPage
  - Busca por nome na PatientsPage (case-insensitive, combina com filtro de status)
  - Modo Consulta V1:
      src/lib/consultaMode.ts — lógica pura: deriveAlerts, deriveCondutas, deriveActions
      src/components/patient/ModoConsulta.tsx — 4 zonas de decisão clínica
      PatientTimelinePage — ModoConsulta renderizado no topo, antes do histórico

Capacidades atuais do sistema por entidade:
  - Pacientes: create, edit, archive, filter (ativas/arquivadas), search by name
  - Consultas: create, edit, delete
  - Exames: create, edit, delete
  - Ultrassonografias: create, edit, delete

Próximo passo sugerido (Sprint 3):
  Validar Modo Consulta com usuário real e refinar regras de alertas/condutas/ações.

Leia os arquivos relevantes antes de propor ou escrever qualquer código.
```
