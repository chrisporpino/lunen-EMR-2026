/**
 * Modo Consulta — lógica de suporte à decisão clínica
 *
 * Módulo puro: sem React, sem efeitos colaterais.
 * Deriva alertas, conduta e ações a partir dos dados clínicos da paciente.
 */

import type { Consultation, Exam } from '../types'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type AlertSeverity = 'danger' | 'warning'

export interface ConsultaAlert {
  message: string
  severity: AlertSeverity
}

export interface ConsultaConduta {
  text: string
}

export interface ConsultaAction {
  text: string
}

// ─── Helpers de data ──────────────────────────────────────────────────────────

export function daysAgo(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00')
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)))
}

export function formatDaysAgo(days: number): string {
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  return `há ${days} dias`
}

// ─── Helper interno ───────────────────────────────────────────────────────────

function sortConsultationsDesc(consultations: Consultation[]): Consultation[] {
  return [...consultations].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
}

// ─── Alertas ──────────────────────────────────────────────────────────────────

/**
 * Deriva alertas clínicos a partir das consultas e exames da paciente.
 * Ordem de prioridade: danger primeiro, warning depois.
 * Máximo de 4 alertas.
 */
export function deriveAlerts(consultations: Consultation[], exams: Exam[]): ConsultaAlert[] {
  const last = sortConsultationsDesc(consultations)[0]
  const danger: ConsultaAlert[] = []
  const warnings: ConsultaAlert[] = []

  // 1. PA ≥ 140/90 na última consulta
  if (last && (last.vitalSigns.systolic >= 140 || last.vitalSigns.diastolic >= 90)) {
    const d = daysAgo(last.date)
    danger.push({
      message: `PA ${last.vitalSigns.systolic}/${last.vitalSigns.diastolic} na última consulta — ${formatDaysAgo(d)}`,
      severity: 'danger',
    })
  }

  // 2. BCF fora do padrão (120–160 bpm) na última consulta
  if (last && last.fetalHeartRate > 0 &&
      (last.fetalHeartRate < 120 || last.fetalHeartRate > 160)) {
    danger.push({
      message: `BCF ${last.fetalHeartRate} bpm na última consulta — fora do padrão`,
      severity: 'danger',
    })
  }

  // 3. Exames com resultado alterado (máx. 2 alertas)
  exams
    .filter((e) => e.status === 'altered')
    .slice(0, 2)
    .forEach((e) => {
      danger.push({
        message: `${e.type} com resultado alterado`,
        severity: 'danger',
      })
    })

  // 4. Exame pendente há mais de 14 dias (máx. 1 alerta)
  const oldPending = exams.filter((e) => e.status === 'pending' && daysAgo(e.date) > 14)
  if (oldPending.length > 0) {
    const d = daysAgo(oldPending[0].date)
    warnings.push({
      message: `${oldPending[0].type} sem resultado — pendente há ${d} dias`,
      severity: 'warning',
    })
  }

  // 5. Sem consulta recente (mais de 30 dias)
  if (!last || daysAgo(last.date) > 30) {
    const d = last ? daysAgo(last.date) : null
    warnings.push({
      message: d !== null
        ? `Sem consulta recente — há ${d} dias`
        : 'Nenhuma consulta registrada',
      severity: 'warning',
    })
  }

  return [...danger, ...warnings].slice(0, 4)
}

// ─── Conduta sugerida ─────────────────────────────────────────────────────────

/**
 * Deriva sugestões de conduta a partir dos alertas ativos.
 * Cada linha começa com um verbo. Máximo de 3 itens.
 */
export function deriveCondutas(alerts: ConsultaAlert[]): ConsultaConduta[] {
  const condutas: ConsultaConduta[] = []

  const hasBP      = alerts.some((a) => a.message.startsWith('PA ') && a.severity === 'danger')
  const hasBCF     = alerts.some((a) => a.message.includes('bpm'))
  const hasAltered = alerts.some((a) => a.message.includes('resultado alterado'))
  const hasPending = alerts.some((a) => a.message.includes('pendente'))
  const hasNoRecent = alerts.some((a) =>
    a.message.startsWith('Sem consulta') || a.message.startsWith('Nenhuma consulta'),
  )

  if (hasBP)       condutas.push({ text: 'Reavaliar PA no início da consulta' })
  if (hasBCF)      condutas.push({ text: 'Reavaliar BCF nesta consulta' })
  if (hasAltered)  condutas.push({ text: 'Revisar resultado do exame alterado com a paciente' })
  if (hasPending)  condutas.push({ text: 'Cobrar resultado do exame pendente' })
  if (hasNoRecent) condutas.push({ text: 'Agendar retorno antes de encerrar a consulta' })

  return condutas.slice(0, 3)
}

// ─── Ações necessárias ────────────────────────────────────────────────────────

/**
 * Deriva ações necessárias para esta consulta.
 * Baseado em regras clínicas simples e determinísticas.
 * Máximo de 4 ações, com verbos no imperativo.
 */
export function deriveActions(
  consultations: Consultation[],
  exams: Exam[],
  gestWeeks: number,
): ConsultaAction[] {
  const sorted = sortConsultationsDesc(consultations)
  const last = sorted[0]
  const actions: ConsultaAction[] = []

  // 1. TOTG: semana ≥ 28 sem nenhum TOTG registrado
  const hasTOTG = exams.some((e) => /TOTG|tolerância\s*à\s*glicose/i.test(e.type))
  if (gestWeeks >= 28 && !hasTOTG) {
    actions.push({ text: 'Solicitar TOTG 75g hoje — marco de 28 semanas atingido' })
  }

  // 2. Exame alterado sem consulta posterior
  const alteredExams = exams.filter((e) => e.status === 'altered')
  if (alteredExams.length > 0) {
    const mostRecentAltered = [...alteredExams].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0]
    const consultAfterExists =
      last &&
      new Date(last.date).getTime() >= new Date(mostRecentAltered.date).getTime()
    if (!consultAfterExists) {
      actions.push({ text: 'Revisar exame alterado nesta consulta' })
    }
  }

  // 3. Exame pendente há mais de 7 dias
  const oldPending = exams.filter((e) => e.status === 'pending' && daysAgo(e.date) > 7)
  if (oldPending.length > 0) {
    const d = daysAgo(oldPending[0].date)
    actions.push({ text: `Cobrar resultado de ${oldPending[0].type} — pendente há ${d} dias` })
  }

  // 4. Retorno em atraso (> 30 dias sem consulta)
  if (last && daysAgo(last.date) > 30) {
    actions.push({ text: 'Agendar retorno antes de encerrar a consulta' })
  } else if (!last) {
    actions.push({ text: 'Registrar acompanhamento inicial da paciente' })
  }

  return actions.slice(0, 4)
}

// ─── Utilitários de zona 3 ────────────────────────────────────────────────────

/** Retorna as 2 últimas consultas ordenadas da mais recente para a mais antiga. */
export function getLastTwoConsultations(consultations: Consultation[]): Consultation[] {
  return sortConsultationsDesc(consultations).slice(0, 2)
}
