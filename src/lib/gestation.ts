/**
 * Utilitários de cálculo obstétrico
 * DUM = Data da Última Menstruação
 * IG  = Idade Gestacional
 * DPP = Data Provável do Parto
 */

/**
 * Calcula a DPP a partir da DUM pela Regra de Naegele.
 * Adiciona 1 ano, subtrai 3 meses, adiciona 7 dias.
 */
export function calculateEDD(dum: string): Date {
  const lmp = new Date(dum + 'T00:00:00')
  const edd = new Date(lmp)
  edd.setFullYear(edd.getFullYear() + 1)
  edd.setMonth(edd.getMonth() - 3)
  edd.setDate(edd.getDate() + 7)
  return edd
}

/**
 * Calcula a idade gestacional em dias totais a partir da DUM.
 */
export function gestationalAgeDays(dum: string, referenceDate?: string): number {
  const lmp = new Date(dum + 'T00:00:00')
  const ref = referenceDate ? new Date(referenceDate + 'T00:00:00') : new Date()
  const diffMs = ref.getTime() - lmp.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Retorna a IG como { weeks, days }.
 */
export function gestationalAge(
  dum: string,
  referenceDate?: string,
): { weeks: number; days: number } {
  const totalDays = gestationalAgeDays(dum, referenceDate)
  return {
    weeks: Math.floor(totalDays / 7),
    days: totalDays % 7,
  }
}

/**
 * Formata a idade gestacional como texto legível.
 * Ex.: "32 semanas + 5 dias"
 */
export function formatGA(weeks: number, days: number): string {
  if (days === 0) return `${weeks} semanas`
  return `${weeks} semanas + ${days} ${days === 1 ? 'dia' : 'dias'}`
}

/**
 * Formata uma data no padrão brasileiro.
 * Ex.: "26 de ago. de 2024"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Formata a DPP com mês e ano por extenso.
 */
export function formatEDD(edd: Date): string {
  return edd.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Retorna o número do trimestre (1, 2 ou 3) com base nas semanas gestacionais.
 */
export function getTrimester(weeks: number): 1 | 2 | 3 {
  if (weeks < 14) return 1
  if (weeks < 28) return 2
  return 3
}

/**
 * Retorna o rótulo do trimestre.
 */
export function getTrimesterLabel(weeks: number): string {
  const t = getTrimester(weeks)
  return `${t}º Trimestre`
}

/**
 * Percentual de conclusão da gestação (0–100).
 */
export function pregnancyProgress(weeks: number, days: number): number {
  const totalDays = weeks * 7 + days
  return Math.min(100, Math.round((totalDays / 280) * 100))
}
