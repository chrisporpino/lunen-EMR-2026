# Project Handoff — Lunen EMR

> Este arquivo captura o estado atual do projeto para que a próxima sessão de desenvolvimento possa continuar sem depender do histórico de conversas anteriores.

---

## 1. Project Overview

**Lunen EMR** é um protótipo de sistema de prontuário eletrônico (EMR) obstétrico desenvolvido para o mercado brasileiro.

**Usuários-alvo:** Enfermeiros obstétricos e obstetras que conduzem acompanhamento pré-natal em clínicas e ambulatórios.

**Experiência principal:** Uma linha do tempo gestacional por paciente — o equivalente clínico de um feed cronológico — onde consultas, exames laboratoriais, ultrassonografias e marcos gestacionais são registrados e visualizados de forma unificada.

**Por que existe:** O pré-natal brasileiro segue um protocolo estruturado com marcos clínicos bem definidos (IG 12, 20, 28, 36 semanas). O sistema foi concebido para tornar esse protocolo visível e operacional dentro de uma interface que prioriza a linha do tempo como objeto central — um **EMR com foco na timeline**, inspirado no design do Apple Health.

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

### Sprint 1 — Implementação de CRUD Frontend (em andamento)

**Concluído neste sprint:**

- Componente `Drawer` reutilizável (painel lateral deslizante)
- Sistema de formulários baseado em drawers para todas as entidades
- Funções de criação nos arrays mockados (`addPatient`, `addConsultation`, `addExam`, `addUltrasound`)
- Páginas convertidas para `useState` reativo com callbacks `onSaved`
- Botões de ação em todas as páginas principais
- **Edição de consultas** — `ConsultationFormDrawer` com `initialValues`, `updateConsultation`, botão de edição em `ConsultationEvent`
- **Exclusão de consultas** — `deleteConsultation`, confirmação inline no card, reatividade imediata em timeline e gráficos
- **Hierarquia da `PatientTimelinePage` reordenada** — gráficos clínicos agora aparecem acima da linha do tempo (ordem: resumo → gráficos → timeline)

**Pendente neste sprint:**

- Edição e exclusão de exames laboratoriais
- Edição e exclusão de ultrassonografias

---

## 3. Key Implemented Features

### Lista de Pacientes — `PatientsPage`
Rota `/`. Exibe todas as gestantes cadastradas com badge de risco (baixo/intermediário/alto), IG atual, DPP e barra de progresso gestacional. Inclui cards de resumo por nível de risco. Botão "+ Nova Gestante" abre `PatientFormDrawer`.

### Timeline da Paciente — `PatientTimelinePage`
Rota `/patient/:id`. Tela principal do produto. Ordem das seções:
1. Cards de resumo clínico (IG, DPP, Condições Ativas com última PA)
2. Gráficos Clínicos (WeightChart e UterineHeightChart)
3. Linha do tempo gestacional com botões de ação rápida (`+ Consulta`, `+ Exame`, `+ USG`)

Estado reativo via `useState` — criação, edição e exclusão de consultas atualizam imediatamente cards, gráficos e timeline.

### Página de Consultas — `PatientConsultations`
Rota `/patient/:id/consultations`. Lista todas as consultas ordenadas da mais recente para a mais antiga. Botão "+ Nova Consulta". Cada card tem botões de edição e exclusão com confirmação inline.

### Página de Exames — `PatientExams`
Rota `/patient/:id/exams`. Lista exames laboratoriais e ultrassonografias com filtro por tipo (Todos / Laboratório / Imagem). Botões "+ Novo Exame" e "+ Nova USG". **Edição e exclusão ainda não implementadas nesta página.**

### Cálculos Obstétricos — `src/lib/gestation.ts`
Fonte única de verdade para todos os cálculos gestacionais: DPP (Regra de Naegele), IG em semanas+dias, trimestre, percentual de progresso, formatação de datas em português brasileiro.

### Eventos da Timeline
- **`ConsultationEvent`** — sinais vitais, AU, BCF, apresentação fetal, edema, anotações; alerta de PA ≥ 140/90 mmHg; botões de edição (lápis) e exclusão (lixeira) com confirmação inline
- **`ExamEvent`** — tipo, resultado, status (Normal / Alterado / Pendente), laboratório; **sem edição/exclusão ainda**
- **`UltrasoundEvent`** — biometria fetal (DBP, PC, CA, CF), peso estimado, ILA, localização placentária; **sem edição/exclusão ainda**
- **`MilestoneEvent`** — marcos clínicos com indicação visual de alcançado/pendente

### Sistema de Formulários — `src/components/forms/`
- **`Drawer`** — painel lateral direito com backdrop, fechamento por Escape e trava de scroll do body
- **`PatientFormDrawer`** — cadastro/edição de gestante; aceita `initialValues?: Patient`
- **`ConsultationFormDrawer`** — aceita `initialValues?: Consultation`; quando presente, opera em modo edição (`updateConsultation`) em vez de criação (`addConsultation`); título e botão mudam automaticamente; `useEffect` sincroniza o formulário ao abrir
- **`ExamFormDrawer`** — registro de exame com seletor de tipos comuns, status tri-state; **sem suporte a `initialValues` ainda**
- **`UltrasoundFormDrawer`** — registro de USG; biometria oculta no modo Transvaginal; **sem suporte a `initialValues` ainda**
- **`FormField`** — helpers reutilizáveis: `Field`, `inputCls`, `FormSection`, `DrawerFooter` (aceita `submitLabel?`)

### Gráficos Clínicos — `src/components/charts/`
- **`WeightChart`** — linha do peso materno por IG (requer ≥ 2 pontos)
- **`UterineHeightChart`** — altura uterina medida vs. esperada (curva de referência = semana gestacional)

Ambos recebem `consultations` como prop e rerenderizam automaticamente após edição ou exclusão de consultas.

### Camada de Dados — `src/data/`

| Arquivo | Array | Getter | Mutações disponíveis |
|---|---|---|---|
| `mockPatients.ts` | `mockPatients` | — | `addPatient`, `updatePatient` |
| `mockConsultations.ts` | `mockConsultations` | `getConsultationsByPatient` | `addConsultation`, `updateConsultation`, `deleteConsultation` |
| `mockExams.ts` | `mockExams` | `getExamsByPatient` | `addExam` |
| `mockUltrasounds.ts` | `mockUltrasounds` | `getUltrasoundsByPatient` | `addUltrasound` |

### Propagação de edição/exclusão de consultas
`ConsultationEvent.onEdit` → `setEditingConsultation` + `setConsultationDrawerOpen(true)` → `ConsultationFormDrawer` com `initialValues` → `updateConsultation` → `onSaved` → `refreshData` → `useState` re-lê o array → timeline, cards clínicos e gráficos rerenderizam.

`ConsultationEvent.onDelete` → confirmação inline → `deleteConsultation` → `refreshData` → mesma cascata acima.

---

## 4. Known Issues / Technical Debt

### Sem persistência de dados
Todos os dados vivem em arrays JavaScript em memória. Recarregar a página restaura os dados ao estado inicial dos arquivos mock. Nenhum `localStorage` ou backend foi implementado ainda.

### Edição e exclusão incompletas
`updateExam`, `deleteExam`, `updateUltrasound` e `deleteUltrasound` **não existem ainda**. `ExamEvent` e `UltrasoundEvent` não têm botões de edição ou exclusão. `ExamFormDrawer` e `UltrasoundFormDrawer` não aceitam `initialValues`.

### Sem feedback visual pós-ação
Após criar, editar ou excluir um registro, o drawer fecha e a lista atualiza, mas nenhum toast, snackbar ou notificação confirma a operação ao usuário.

### Condições Ativas hardcoded por nível de risco
O card "Condições Ativas" em `PatientTimelinePage` exibe tags fixas determinadas pelo campo `riskLevel` da paciente. Não há uma entidade de diagnóstico real no modelo de dados.

### Sem autenticação
A aplicação não tem controle de acesso. O campo de usuário no header é apenas visual.

### Stack sem backend
Todo o estado da aplicação é frontend-only e volátil. A preparação para integração com uma API REST ainda não foi iniciada.

---

## 5. Next Development Tasks

Em ordem de prioridade sugerida:

1. **Edição de exames** — adicionar `initialValues?: Exam` ao `ExamFormDrawer` (mesmo padrão do `ConsultationFormDrawer`: `useEffect`, mapeamento de valores, `updateExam`); botão de edição em `ExamEvent`; função `updateExam` em `mockExams.ts`
2. **Exclusão de exames** — botão de exclusão em `ExamEvent` com confirmação inline; função `deleteExam` em `mockExams.ts`; propagação via `onEdit`/`onDelete` em `PregnancyTimeline` e `PatientExams`
3. **Edição de ultrassonografias** — mesmo padrão para `UltrasoundFormDrawer` / `UltrasoundEvent` / `updateUltrasound`
4. **Exclusão de ultrassonografias** — mesmo padrão para `deleteUltrasound`
5. **Feedback pós-ação** — componente de toast/snackbar leve para confirmar criação, edição e exclusão
6. **Diagnósticos como entidade própria** — modelo `Diagnosis` com CID-10 simplificado; substituir as tags hardcoded de `ConditionTags`
7. **Persistência local** — `localStorage` como camada intermediária antes do backend; serializar/desserializar os arrays de dados
8. **Preparação para integração com backend** — separar a camada de dados em serviços (`src/services/`) com interfaces compatíveis com REST; facilitar substituição dos mocks por chamadas reais

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
Leia este arquivo e todo o repositório antes de escrever qualquer código.

Este projeto é um protótipo de EMR obstétrico frontend-only para o mercado brasileiro.
A tela principal é a linha do tempo gestacional da paciente (/patient/:id).

Sprint 1 está em andamento. Edição e exclusão de CONSULTAS já estão implementadas.
O padrão está estabelecido em ConsultationFormDrawer e ConsultationEvent.

A próxima prioridade é implementar o mesmo padrão para EXAMES e ULTRASSONOGRAFIAS:
- updateExam / deleteExam em mockExams.ts
- initialValues em ExamFormDrawer
- botões de edição/exclusão em ExamEvent
- updateUltrasound / deleteUltrasound em mockUltrasounds.ts
- initialValues em UltrasoundFormDrawer
- botões de edição/exclusão em UltrasoundEvent
- propagação via PregnancyTimeline e PatientExams

Leia os arquivos relevantes antes de propor ou escrever qualquer código.
```
