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

### Sprint 1 — Implementação de CRUD Frontend (concluído)

**Concluído neste sprint:**

- Componente `Drawer` reutilizável (painel lateral deslizante)
- Sistema de formulários baseado em drawers para todas as entidades
- Funções de criação nos arrays mockados (`addPatient`, `addConsultation`, `addExam`, `addUltrasound`)
- Páginas convertidas para `useState` reativo com callbacks `onSaved`
- Botões de ação em todas as páginas principais
- **Edição de consultas** — `ConsultationFormDrawer` com `initialValues`, `updateConsultation`, botão de edição em `ConsultationEvent`
- **Exclusão de consultas** — `deleteConsultation`, confirmação inline no card, reatividade imediata em timeline e gráficos
- **Edição e exclusão de exames** — `ExamFormDrawer` com `initialValues`, `updateExam`, `deleteExam`, botões de edição/exclusão em `ExamEvent`
- **Edição e exclusão de ultrassonografias** — `UltrasoundFormDrawer` com `initialValues`, `updateUltrasound`, `deleteUltrasound`, botões de edição/exclusão em `UltrasoundEvent`
- **Hierarquia da `PatientTimelinePage` reordenada** — gráficos clínicos agora aparecem acima da linha do tempo (ordem: resumo → gráficos → timeline)

---

## 3. Key Implemented Features

### Lista de Pacientes — `PatientsPage`
Rota `/`. Exibe todas as gestantes cadastradas com badge de risco (baixo/intermediário/alto), IG atual, DPP e barra de progresso gestacional. Inclui cards de resumo por nível de risco. Botão "+ Nova Gestante" abre `PatientFormDrawer`.

### Timeline da Paciente — `PatientTimelinePage`
Rota `/patient/:id`. Tela principal do produto. Ordem das seções:
1. Cards de resumo clínico (IG, DPP, Condições Ativas com última PA)
2. Gráficos Clínicos (WeightChart e UterineHeightChart)
3. Linha do tempo gestacional com botões de ação rápida (`+ Consulta`, `+ Exame`, `+ USG`)

Estado reativo via `useState` — criação, edição e exclusão de qualquer entidade (consulta, exame, USG) atualizam imediatamente os cards de resumo, os gráficos e a timeline via `refreshData()` que re-lê os arrays compartilhados.

### Página de Consultas — `PatientConsultations`
Rota `/patient/:id/consultations`. Lista todas as consultas ordenadas da mais recente para a mais antiga. Botão "+ Nova Consulta". Cada card tem botões de edição e exclusão com confirmação inline.

### Página de Exames — `PatientExams`
Rota `/patient/:id/exams`. Lista exames laboratoriais e ultrassonografias com filtro por tipo (Todos / Laboratório / Imagem). Botões "+ Novo Exame" e "+ Nova USG". Cada card de exame e ultrassonografia tem botões de edição e exclusão com confirmação inline.

### Cálculos Obstétricos — `src/lib/gestation.ts`
Fonte única de verdade para todos os cálculos gestacionais: DPP (Regra de Naegele), IG em semanas+dias, trimestre, percentual de progresso, formatação de datas em português brasileiro.

### Eventos da Timeline
- **`ConsultationEvent`** — sinais vitais, AU, BCF, apresentação fetal, edema, anotações; alerta de PA ≥ 140/90 mmHg; botões de edição (lápis) e exclusão (lixeira) com confirmação inline
- **`ExamEvent`** — tipo, resultado, status (Normal / Alterado / Pendente), laboratório; botões de edição (lápis) e exclusão (lixeira) com confirmação inline
- **`UltrasoundEvent`** — biometria fetal (DBP, PC, CA, CF), peso estimado, ILA, localização placentária; botões de edição (lápis) e exclusão (lixeira) com confirmação inline
- **`MilestoneEvent`** — marcos clínicos com indicação visual de alcançado/pendente

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

### Camada de Dados — `src/data/`

| Arquivo | Array | Getter | Mutações disponíveis |
|---|---|---|---|
| `mockPatients.ts` | `mockPatients` | — | `addPatient`, `updatePatient` |
| `mockConsultations.ts` | `mockConsultations` | `getConsultationsByPatient` | `addConsultation`, `updateConsultation`, `deleteConsultation` |
| `mockExams.ts` | `mockExams` | `getExamsByPatient` | `addExam`, `updateExam`, `deleteExam` |
| `mockUltrasounds.ts` | `mockUltrasounds` | `getUltrasoundsByPatient` | `addUltrasound`, `updateUltrasound`, `deleteUltrasound` |

### Propagação de edição/exclusão (padrão comum a todas as entidades)
`XxxEvent.onEdit` → `setEditingXxx` + `setXxxDrawerOpen(true)` → `XxxFormDrawer` com `initialValues` → `updateXxx` → `onSaved` → `refreshData` → `useState` re-lê o array → timeline rerenderiza.

`XxxEvent.onDelete` → confirmação inline → `deleteXxx` → `refreshData` → mesma cascata acima.

---

## 4. Known Issues / Technical Debt

### Sem persistência de dados
Todos os dados vivem em arrays JavaScript em memória. Recarregar a página restaura os dados ao estado inicial dos arquivos mock. Nenhum `localStorage` ou backend foi implementado ainda.

### CRUD completo para todas as entidades
Todas as quatro entidades (Patient, Consultation, Exam, Ultrasound) têm criação e edição implementadas. Exclusão está implementada para Consultation, Exam e Ultrasound. Não existe `deletePatient` (intencional — sistemas médicos evitam hard delete de pacientes).

### Bug conhecido: campo `height` perdido na edição de consultas
`VitalSigns.height` é opcional e existe nos dados mockados, mas `ConsultationFormValues` não tem campo `height` e `consultationToForm` não o mapeia. Ao salvar uma edição, `height` é descartado silenciosamente. Sem impacto visual atual (o campo não é exibido na UI), mas é perda de dados ao editar. Para corrigir: adicionar `height` a `ConsultationFormValues`, ao mapper `consultationToForm`, ao formulário, e preservá-lo no `vitalSigns` reconstruído em `handleSubmit`.

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

1. **Feedback pós-ação** — componente de toast/snackbar leve para confirmar criação, edição e exclusão (Sprint 2)
2. **Persistência local** — `localStorage` como camada intermediária antes do backend; serializar/desserializar os arrays de dados ao carregar/salvar (Sprint 2)
3. **Diagnósticos como entidade própria** — modelo `Diagnosis` com CID-10 simplificado; substituir as tags hardcoded de `ConditionTags` em `PatientTimelinePage` (Sprint 3)
4. **Medicamentos** — entidade `Medication` com posologia, início e fim; exibição na timeline (Sprint 3)
5. **Preparação para integração com backend** — separar a camada de dados em serviços (`src/services/`) com interfaces compatíveis com REST; facilitar substituição dos mocks por chamadas reais (Sprint 4)

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

Sprint 1 está CONCLUÍDO. CRUD completo implementado para todas as entidades:
- Consultas: create, edit, delete (ConsultationFormDrawer, ConsultationEvent)
- Exames: create, edit, delete (ExamFormDrawer, ExamEvent)
- Ultrassonografias: create, edit, delete (UltrasoundFormDrawer, UltrasoundEvent)
- Pacientes: create, edit (PatientFormDrawer) — sem delete intencional

Sprint 2 é a próxima prioridade:
- localStorage para persistência entre recarregamentos
- Toast/snackbar de feedback pós-ação

Leia os arquivos relevantes antes de propor ou escrever qualquer código.
```
