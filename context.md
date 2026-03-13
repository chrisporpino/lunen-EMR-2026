# Project Context — Lunen EMR

> Este arquivo descreve o contexto de produto e domínio do sistema. Leia antes de iniciar qualquer sessão de desenvolvimento.

---

## Product Overview

**Lunen EMR** é um sistema de prontuário eletrônico (EMR) obstétrico com foco na linha do tempo gestacional, desenvolvido para o mercado brasileiro.

**Usuários-alvo:** Enfermeiros obstétricos e obstetras que conduzem acompanhamento pré-natal em clínicas, consultórios e ambulatórios de saúde da mulher.

**Objetivo central:** Registrar e visualizar a evolução da gestação de forma clara, cronológica e clinicamente significativa — substituindo anotações em papel, planilhas e mensagens de WhatsApp por um registro estruturado e navegável.

**O que diferencia o Lunen EMR dos sistemas tradicionais:**
A maioria dos prontuários eletrônicos organiza dados clínicos em tabelas e formulários separados por categoria. O Lunen EMR organiza tudo em torno de uma **linha do tempo gestacional** — o equivalente digital de um diário clínico da gravidez. Consultas, exames, ultrassonografias e marcos obstétricos aparecem em sequência cronológica, permitindo que o profissional compreenda a evolução da gestação com um único olhar.

---

## Problem Being Solved

O acompanhamento pré-natal no Brasil envolve múltiplas consultas, dezenas de exames e uma série de marcos clínicos distribuídos ao longo de 40 semanas. Na prática clínica cotidiana, essas informações frequentemente ficam:

- **Dispersas em papéis** — cartão da gestante, requisições avulsas, laudos impressos
- **Fragmentadas em sistemas desconectados** — laboratório, imagem, prontuário e receituário em plataformas diferentes
- **Perdidas em canais informais** — grupos de WhatsApp, anotações de celular, post-its
- **Inacessíveis no momento da consulta** — exames solicitados em consultas anteriores sem resultado vinculado ao prontuário

O resultado é um profissional de saúde que precisa reconstruir mentalmente o histórico da paciente a cada consulta, aumentando o risco de erros, retrabalho e perda de continuidade do cuidado.

O Lunen EMR resolve isso consolidando todo o histórico gestacional em uma única linha do tempo clara e navegável.

---

## Product Philosophy

### Timeline-first medical record
A linha do tempo não é uma tela secundária — ela é o produto. Todo o design parte do princípio de que o profissional precisa revisar a história da paciente rapidamente antes ou durante a consulta.

### Varredura clínica rápida
Cada evento na timeline foi desenhado para ser escaneado visualmente em segundos. Informações críticas (PA elevada, resultado alterado, peso fetal abaixo do esperado) são destacadas visualmente sem exigir que o usuário expanda o card.

### Carga cognitiva mínima
A interface evita formulários longos, menus profundos e navegação complexa. Ações de registro abrem em drawers laterais sem perder o contexto da tela atual. Cálculos obstétricos (IG, DPP, progresso) são feitos automaticamente pelo sistema.

### Inspiração: Apple Health
O sistema de design segue a filosofia visual do Apple Health: fundo claro (`#F7F9F9`), cards brancos com sombra suave, paleta teal como cor primária (`#3A7D7C`), tipografia Inter, border-radius generoso e elementos visuais que comunicam saúde sem ser estéreis. O objetivo é que a interface pareça familiar e confiável para qualquer usuário de smartphone moderno.

### Consciência do domínio obstétrico
O sistema conhece o protocolo pré-natal brasileiro. Os marcos gestacionais nas semanas 12, 20, 28 e 36 são eventos de primeira classe na timeline. A IG é sempre calculada automaticamente a partir da DUM. A DPP é exibida com contagem regressiva de dias. Alertas clínicos (PA ≥ 140/90 mmHg) são gerados automaticamente sem configuração do usuário.

---

## Core Domain Concepts

Estes são os conceitos obstétricos fundamentais que o sistema modela e exibe. Todo desenvolvedor que trabalhe no projeto deve entendê-los.

### DUM — Data da Última Menstruação
A DUM é o ponto de partida de todos os cálculos gestacionais. É a data do primeiro dia do último ciclo menstrual antes da concepção. A partir dela, o sistema calcula automaticamente a IG e a DPP. É registrada uma única vez no cadastro da paciente e nunca muda.

### IG — Idade Gestacional
Medida em semanas + dias (ex.: "28 semanas + 3 dias"). É calculada subtraindo a DUM da data de referência. A IG determina em qual trimestre a paciente está, quais marcos já foram alcançados e quais exames devem ser solicitados. O sistema recalcula a IG em tempo real para qualquer data.

**Trimestres:**
- 1º Trimestre: até 13+6 semanas
- 2º Trimestre: 14 a 27+6 semanas
- 3º Trimestre: 28 semanas até o parto

### DPP — Data Provável do Parto
Calculada pela **Regra de Naegele**: DUM + 280 dias (40 semanas). É exibida com contagem regressiva de dias e atualizada automaticamente. Representa a data estimada do parto, não uma data exata.

### AU — Altura Uterina
Medida em centímetros do fundo uterino até a sínfise púbica. Registrada em cada consulta obstétrica. Espera-se que a AU em centímetros corresponda aproximadamente à IG em semanas (ex.: 28 cm às 28 semanas). O gráfico `UterineHeightChart` compara a AU medida com a curva esperada para detectar desvios de crescimento fetal.

### BCF — Batimentos Cardíacos Fetais
Frequência cardíaca fetal medida em batimentos por minuto (bpm), normalmente por sonar Doppler ou ausculta. O valor normal situa-se entre 120 e 160 bpm. Registrado em cada consulta e em cada ultrassonografia. Valores fora da faixa indicam possível sofrimento fetal.

### Marcos Gestacionais
O protocolo pré-natal brasileiro define exames e avaliações obrigatórias em idades gestacionais específicas. O sistema modela quatro marcos principais:

| Semana | Marco | Objetivo principal |
|--------|-------|-------------------|
| 12 | Rastreio do 1º Trimestre | TN, PAPP-A, beta-hCG, Doppler uterino |
| 20 | USG Morfológica | Anatomia fetal detalhada |
| 28 | Rastreio de Diabetes Gestacional | TOTG 75g |
| 36 | Preparação para o Parto | Posição fetal, plano de parto |

---

## Current Product Capabilities

O sistema implementa atualmente as seguintes capacidades:

- **Lista de gestantes** — visualização de todas as pacientes ativas com IG, DPP, risco e progresso gestacional
- **Timeline da paciente** — linha do tempo unificada com consultas, exames, ultrassonografias e marcos gestacionais
- **Cálculo automático de IG e DPP** — em tempo real, a partir da DUM registrada
- **Cards de resumo clínico** — IG atual, DPP com contagem regressiva, última PA registrada, condições ativas
- **Eventos de consulta** — sinais vitais completos, AU, BCF, apresentação fetal, edema, anotações clínicas
- **Eventos de exame laboratorial** — tipo, resultado, status (Normal / Alterado / Pendente), laboratório
- **Eventos de ultrassonografia** — biometria fetal (DBP, PC, CA, CF), peso estimado, ILA, placenta
- **Marcos gestacionais** — indicação visual de marcos alcançados e próximos
- **Gráfico de peso materno** — evolução do peso ao longo da gestação
- **Gráfico de altura uterina** — AU medida vs. curva esperada por semana
- **Formulários em drawer** — criação de novas pacientes, consultas, exames e ultrassonografias sem sair da tela atual
- **Estratificação de risco** — classificação visual de pacientes em baixo, intermediário e alto risco

---

## Current Limitations

O sistema encontra-se em fase de protótipo frontend. As seguintes limitações são conhecidas e intencionais neste estágio:

- **Sem backend** — não há servidor, banco de dados ou API. Todo o sistema roda exclusivamente no navegador
- **Dados mockados** — os registros existentes são fictícios e fixos, definidos em `src/data/`
- **Sem persistência** — dados criados durante a sessão são perdidos ao recarregar a página
- **CRUD parcial** — apenas criação de registros está implementada; edição e exclusão ainda não existem
- **Sem autenticação** — não há controle de acesso, login ou identificação de usuário
- **Condições ativas simplificadas** — o card de condições ativas é gerado a partir do nível de risco da paciente, não de diagnósticos reais estruturados
