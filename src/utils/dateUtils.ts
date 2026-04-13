/**
 * Utilitários de data para o padrão brasileiro: DD/MM/AAAA HH:MM:SS
 *
 * Convenção de armazenamento interno:
 *   As datas são stored como string local sem timezone: "YYYY-MM-DDTHH:MM:SS"
 *   Isso evita conversões UTC/local e mantém o comportamento esperado no Brasil.
 */

// =============================================================================
// CONSTANTES PT-BR
// =============================================================================
export const MONTHS_BR = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export const MONTHS_SHORT_BR = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

export const DAYS_SHORT_BR  = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const DAYS_FULL_BR   = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

// =============================================================================
// FORMATAÇÃO
// =============================================================================

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Date → "DD/MM/AAAA HH:MM:SS" */
export function formatDateTimeBR(date: Date): string {
  return (
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

/** Date → "DD/MM/AAAA" */
export function formatDateBR(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

/** Date → "HH:MM" */
export function formatTimeBR(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Date → "DD Mmm" ex: "13 Abr" */
export function formatDayMonthBR(date: Date): string {
  return `${pad(date.getDate())} ${MONTHS_SHORT_BR[date.getMonth()]}`
}

/** Date → "Dia, DD Mmm AAAA" ex: "Segunda, 13 Abr 2026" */
export function formatFullDateBR(date: Date): string {
  return `${DAYS_FULL_BR[date.getDay()]}, ${pad(date.getDate())} ${MONTHS_SHORT_BR[date.getMonth()]} ${date.getFullYear()}`
}

// =============================================================================
// CONVERSÃO PARA INPUTS HTML
// =============================================================================

/** Date → "YYYY-MM-DDTHH:MM" para input[type=datetime-local] */
export function toDatetimeLocal(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

/** "YYYY-MM-DDTHH:MM" (input) → string local "YYYY-MM-DDTHH:MM:SS" (armazenamento) */
export function fromDatetimeLocal(str: string): string {
  return str.length === 16 ? str + ':00' : str
}

/** string local "YYYY-MM-DDTHH:MM:SS" → Date */
export function parseLocal(str: string): Date {
  return new Date(str)
}

// =============================================================================
// COMPARAÇÕES
// =============================================================================

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export function isCurrentMonth(date: Date, refDate: Date): boolean {
  return date.getFullYear() === refDate.getFullYear() &&
         date.getMonth()    === refDate.getMonth()
}

// =============================================================================
// GERAÇÃO DE GRIDS
// =============================================================================

/**
 * Retorna o primeiro dia (Domingo) da semana que contém a data.
 */
export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Retorna os 7 dias (Dom → Sáb) da semana que contém a data.
 */
export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

/**
 * Gera 42 células (6 semanas × 7 dias) para a grade mensal.
 * A semana começa no Domingo.
 */
export function generateMonthGrid(year: number, month: number): Date[] {
  const firstDay       = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay() // 0 = Domingo
  const daysInMonth    = new Date(year, month + 1, 0).getDate()
  const cells: Date[]  = []

  // Dias do mês anterior para completar a primeira semana
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    cells.push(new Date(year, month, -i))
  }

  // Dias do mês atual
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(new Date(year, month, i))
  }

  // Dias do mês seguinte para completar 42 células
  let nextDay = 1
  while (cells.length < 42) {
    cells.push(new Date(year, month + 1, nextDay++))
  }

  return cells
}

/**
 * Retorna labels de horas para as views de dia/semana.
 * Ex: ['07:00', '08:00', ..., '22:00']
 */
export function getTimeSlots(startHour = 7, endHour = 22): string[] {
  return Array.from({ length: endHour - startHour + 1 }, (_, i) =>
    `${pad(startHour + i)}:00`,
  )
}

/** Retorna a hora (0-23) de uma string local "YYYY-MM-DDTHH:MM:SS" */
export function getHourFromLocal(str: string): number {
  return new Date(str).getHours()
}

// =============================================================================
// NAVEGAÇÃO
// =============================================================================

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7)
}

export function addYears(date: Date, years: number): Date {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + years)
  return d
}
