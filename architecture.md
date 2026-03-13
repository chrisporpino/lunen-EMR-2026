# System Architecture — Lunen EMR

> Este arquivo descreve a arquitetura técnica do sistema. Leia antes de modificar qualquer código.

---

## Tech Stack

| Tecnologia | Versão | Papel |
|---|---|---|
| **React** | 18.3 | Framework de UI — renderização baseada em componentes |
| **TypeScript** | 5.5 | Tipagem estática — todos os arquivos `.tsx` / `.ts` |
| **Vite** | 5.4 | Build tool e dev server |
| **TailwindCSS** | 3.4 | Utilitários de CSS — design tokens em `tailwind.config.js` |
| **React Router** | 6.26 | Roteamento client-side com `BrowserRouter` |
| **Recharts** | 2.12 | Gráficos clínicos (peso e altura uterina) |

O frontend é **completamente standalone**. Não há backend, não há servidor de API e não há chamadas de rede. Todos os dados vivem em arrays JavaScript em memória, definidos em `src/data/`.

---

## Project Folder Structure

```
src/
├── types/          # Interfaces TypeScript para todas as entidades de domínio
├── lib/            # Lógica pura e utilitários (cálculos obstétricos)
├── data/           # Arrays de dados mockados + funções getter e de mutação
├── components/     # Componentes React organizados por domínio
│   ├── forms/      # Sistema de drawers e formulários (Sprint 1)
│   ├── timeline/   # Eventos e container da linha do tempo
│   ├── charts/     # Gráficos Recharts
│   ├── patient/    # Cabeçalho e hero de IG da paciente
│   ├── clinical/   # Cards de sinais vitais
│   └── ui/         # Componentes reutilizáveis genéricos (RiskBadge)
└── pages/          # Componentes de página — um por rota
```

### `src/types/`
Define todas as interfaces TypeScript do domínio. Nenhuma lógica — apenas contratos de tipos.
- `index.ts` — `Patient`, `VitalSigns`, `Consultation`, `Exam`, `Ultrasound`, `TimelineItem`, `RiskLevel`
- `forms.ts` — `PatientFormValues`, `ConsultationFormValues`, `ExamFormValues`, `UltrasoundFormValues`

### `src/lib/`
Lógica pura isolada de qualquer framework. Sem efeitos colaterais, sem imports de React.
- `gestation.ts` — todos os cálculos obstétricos do sistema (ver seção dedicada abaixo)

### `src/data/`
Fonte de dados da aplicação. Arrays mutáveis em memória que simulam um banco de dados. Cada arquivo segue o mesmo padrão de três exports: array, getter por paciente, função de mutação.

### `src/components/`
Componentes React organizados por responsabilidade de domínio. Cada subpasta tem um `index.ts` que re-exporta seus membros públicos.

### `src/pages/`
Componentes de rota. Cada arquivo corresponde a uma URL. Responsáveis por:
- ler dados via getters
- gerenciar estado local com `useState`
- compor componentes de nível mais baixo
- montar os drawers de formulário

---

## Domain Data Model

### `Patient`
Representa uma gestante cadastrada no sistema.

```typescript
interface Patient {
  id: string
  name: string
  dateOfBirth: string       // ISO date
  dum: string               // Data da Última Menstruação — base de todos os cálculos
  eddCalc: string           // DPP calculada (ISO date)
  riskLevel: 'low' | 'medium' | 'high'
  bloodType: string         // ex.: "A+"
  gravidity: number         // G — número de gestações
  parity: number            // P — número de partos
  phone: string
  address: string
}
```

### `Consultation`
Representa uma consulta pré-natal realizada.

```typescript
interface Consultation {
  id: string
  patientId: string
  date: string
  gestationalWeeks: number
  gestationalDays: number
  type: 'routine' | 'urgent' | 'specialist'
  provider: string
  vitalSigns: VitalSigns    // PA, FC, temperatura, peso, altura
  uterineHeight: number     // AU em cm
  fetalHeartRate: number    // BCF em bpm
  fetalPresentation?: string
  edema?: string
  notes: string
}
```

### `Exam`
Representa um exame laboratorial.

```typescript
interface Exam {
  id: string
  patientId: string
  date: string
  gestationalWeeks: number
  gestationalDays: number
  type: string              // nome do exame (ex.: "Hemograma Completo")
  result: string
  status: 'normal' | 'altered' | 'pending'
  lab?: string
  notes?: string
}
```

### `Ultrasound`
Representa uma ultrassonografia obstétrica.

```typescript
interface Ultrasound {
  id: string
  patientId: string
  date: string
  gestationalWeeks: number
  gestationalDays: number
  type: 'morphological' | 'obstetric' | 'doppler' | 'transvaginal'
  fetalHeartRate: number    // BCF em bpm
  biometry: {
    bpd: number             // Diâmetro biparietal (mm)
    hc: number              // Perímetro cefálico (mm)
    ac: number              // Circunferência abdominal (mm)
    fl: number              // Comprimento do fêmur (mm)
  }
  estimatedWeight: number   // Peso fetal estimado (g)
  placentaLocation: string
  amnioticFluid: string     // ILA
  fetalPresentation: string
  notes: string
}
```

### Relação com a Timeline
`Consultation`, `Exam` e `Ultrasound` são as três entidades clínicas que compõem a linha do tempo. Todas compartilham os campos `patientId`, `date`, `gestationalWeeks` e `gestationalDays`, o que permite ordená-las cronologicamente e exibi-las juntas em um feed unificado.

---

## Timeline Architecture

O componente `PregnancyTimeline` (`src/components/timeline/PregnancyTimeline.tsx`) recebe as três listas de eventos como props e os combina em um único feed cronológico decrescente.

```
PregnancyTimeline
  props: consultations[], exams[], ultrasounds[], dum

  internamente:
  ├── milestoneEvents[]  — calculados a partir de dum (semanas 12, 20, 28, 36)
  ├── merge + sort DESC por date
  └── renderiza por tipo:
      ├── 'consultation' → <ConsultationEvent />
      ├── 'exam'         → <ExamEvent />
      ├── 'ultrasound'   → <UltrasoundEvent />
      └── 'milestone'    → <MilestoneEvent />
```

**Cada evento é um componente independente**, responsável apenas por exibir seus dados. Nenhum evento conhece os outros. A ordenação e o merge são responsabilidade exclusiva de `PregnancyTimeline`.

**Marcos gestacionais** são gerados dinamicamente a partir da DUM — não são armazenados no banco de dados. O sistema calcula a data de cada marco (`dum + semana * 7 dias`) e determina se já foi alcançado comparando com `Date.now()`.

---

## Gestational Calculation Engine

**Arquivo:** `src/lib/gestation.ts`

Este módulo é a **única fonte de verdade** para todos os cálculos obstétricos do sistema. Nunca duplicar estas lógicas em componentes ou páginas.

| Função | Propósito |
|---|---|
| `calculateEDD(dum)` | Calcula a DPP pela Regra de Naegele (DUM + 280 dias) |
| `gestationalAgeDays(dum, refDate?)` | Total de dias gestacionais desde a DUM |
| `gestationalAge(dum, refDate?)` | Retorna `{ weeks, days }` |
| `formatGA(weeks, days)` | Formata como "32 semanas + 5 dias" |
| `getTrimester(weeks)` | Retorna `1`, `2` ou `3` |
| `getTrimesterLabel(weeks)` | Retorna `"1º Trimestre"` etc. |
| `pregnancyProgress(weeks, days)` | Percentual de conclusão (0–100) |
| `formatDate(dateStr)` | Formata data em pt-BR: "26 de ago. de 2024" |
| `formatEDD(edd)` | Formata DPP em pt-BR |

Os form drawers de consulta, exame e USG usam `gestationalAge(dum, formDate)` para calcular automaticamente a IG no momento do registro, sem que o usuário precise informá-la manualmente.

---

## UI Architecture

### `components/patient/`
Componentes do contexto da paciente.
- **`PatientHeader`** — cabeçalho fixo presente em todas as telas da paciente; exibe nome, IG, DPP, risco e as abas de navegação (Evolução / Consultas / Exames)
- **`GestationalAgeHero`** — display isolado da IG com barra de progresso por trimestre; pode ser reutilizado em outros contextos

### `components/timeline/`
Componentes da linha do tempo.
- **`PregnancyTimeline`** — container que faz o merge e renderiza os eventos
- **`ConsultationEvent`** — card de consulta com grid de sinais vitais e alerta de PA
- **`ExamEvent`** — card de exame com badge de status colorido
- **`UltrasoundEvent`** — card de USG com biometria expandível
- **`MilestoneEvent`** — marco gestacional com estado alcançado/pendente

### `components/charts/`
Gráficos Recharts renderizados na `PatientTimelinePage`.
- **`WeightChart`** — evolução do peso materno; recebe `consultations[]` e filtra/ordena internamente; exige mínimo de 2 pontos
- **`UterineHeightChart`** — AU medida vs. esperada; a curva esperada é `week` cm (referência clínica simplificada)

### `components/clinical/`
- **`VitalCard`** — card de métrica clínica com label, valor, unidade e status de cor (ok / warning / danger)

### `components/ui/`
- **`RiskBadge`** — badge de nível de risco com dot colorido; tamanhos `sm` e `md`

### `components/forms/`
Ver seção dedicada abaixo.

---

## Form System (Sprint 1)

O Sprint 1 introduziu um sistema de formulários baseado em drawers laterais. O padrão é consistente em todas as entidades.

### Componente base: `Drawer`
`src/components/forms/Drawer.tsx`

Painel lateral deslizante da direita. Comportamentos:
- Backdrop semitransparente com clique para fechar
- Fechamento por tecla `Escape`
- Trava de scroll do `document.body` quando aberto
- Animação CSS com `transform: translateX`
- Header com título e subtítulo opcionais
- Área de conteúdo com scroll independente
- Footer fixo para botões de ação

Props: `open`, `onClose`, `title`, `subtitle?`, `children`, `footer?`

### Helpers: `FormField`
`src/components/forms/FormField.tsx`

Exporta utilitários reutilizados em todos os formulários:
- **`Field`** — wrapper com label uppercase, marcação de campo obrigatório e mensagem de erro
- **`inputCls(hasError)`** — string de classes Tailwind para inputs/selects/textareas
- **`FormSection`** — divisor visual com label para seções dentro de um formulário
- **`DrawerFooter`** — rodapé padrão com botões Cancelar + Salvar

### Form Drawers

| Componente | Props específicas | Mutação chamada |
|---|---|---|
| `PatientFormDrawer` | `onSaved` | `addPatient` |
| `ConsultationFormDrawer` | `patientId`, `dum`, `onSaved` | `addConsultation` |
| `ExamFormDrawer` | `patientId`, `dum`, `onSaved` | `addExam` |
| `UltrasoundFormDrawer` | `patientId`, `dum`, `onSaved` | `addUltrasound` |

Todos os drawers clínicos (Consultation, Exam, Ultrasound) calculam a IG automaticamente usando `gestationalAge(dum, form.date)` e exibem o resultado no subtítulo do drawer enquanto o usuário preenche o formulário.

Todos os drawers recebem `onSaved: () => void` — um callback que a página pai usa para atualizar seu estado local após a mutação.

### Padrão de mutação de dados

Os arrays de dados em `src/data/` são objetos `const` JavaScript (referência imutável, conteúdo mutável). As funções `addXxx` fazem `push` diretamente no array. As páginas mantêm cópias em `useState` e as atualizam via callback `onSaved`:

```typescript
// Na página:
const [consultations, setConsultations] = useState(() =>
  getConsultationsByPatient(patient.id)
)

function handleSaved() {
  // Re-lê o array após o push da função addConsultation
  setConsultations(getConsultationsByPatient(patient.id))
}

// No drawer:
addConsultation(newRecord)  // push no array do módulo
onSaved()                   // dispara re-render na página
```

---

## State Strategy

### Princípio geral
**Estado local via `useState`**. Não há biblioteca de gerenciamento de estado global (Redux, Zustand, Jotai, Context API para dados clínicos).

### Por componente
- **Páginas** — mantêm listas de dados como `useState`, inicializadas com lazy initializer a partir dos getters de `src/data/`
- **Drawers** — mantêm estado do formulário internamente; comunicam o resultado via callbacks (`onSaved`, `onClose`)
- **Eventos da timeline** — estado local apenas para expansão/colapso de seções (`useState<boolean>`)
- **Charts** — sem estado; recebem `consultations[]` como prop e derivam os dados de exibição inline

### Regra de hooks
Todos os `useState` são declarados **antes de qualquer retorno condicional** nas páginas. Isso é necessário porque algumas páginas fazem `if (!patient) return <Navigate />` — os hooks devem ser chamados de forma incondicional independentemente.

### Sem backend
Toda a reatividade é local ao processo do navegador. Recarregar a página reinicializa todos os arrays de dados ao estado definido nos arquivos `src/data/mock*.ts`. Não há sincronização, não há persistência e não há comunicação entre abas.

---

## Routing

Definido em `src/App.tsx` com `BrowserRouter`.

| Rota | Página | Descrição |
|---|---|---|
| `/` | `PatientsPage` | Lista de todas as gestantes |
| `/patient/:id` | `PatientTimelinePage` | Timeline + resumo clínico + gráficos |
| `/patient/:id/consultations` | `PatientConsultations` | Lista de consultas da paciente |
| `/patient/:id/exams` | `PatientExams` | Exames e USGs com filtro por tipo |

A navegação entre as abas da paciente (Evolução / Consultas / Exames) é feita via `<Link>` do React Router — sem estado compartilhado entre páginas. Cada página inicializa seu próprio estado ao montar.
