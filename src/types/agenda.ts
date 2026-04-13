// =============================================================================
// TIPOS DE COMPROMISSO
// =============================================================================
export type CompromissoTipo =
  | 'feriado'
  | 'ponto_facultativo'
  | 'oitiva'
  | 'operacao'
  | 'livre'

export type CompromissoStatus = 'confirmado' | 'pendente' | 'cancelado'

export type CalendarViewType = 'mes' | 'semana' | 'dia' | 'agenda' | 'ano'

// =============================================================================
// ENTIDADES
// =============================================================================
export interface Responsavel {
  id: string
  nome: string
}

export interface Compromisso {
  id: string
  titulo: string
  descricao?: string
  tipo: CompromissoTipo
  status: CompromissoStatus
  /**
   * Data/hora de início no formato local sem timezone: "YYYY-MM-DDTHH:MM:SS"
   * Exibir ao usuário como "DD/MM/AAAA HH:MM:SS" (padrão brasileiro).
   */
  dataInicio: string
  /**
   * Data/hora de fim no formato local sem timezone: "YYYY-MM-DDTHH:MM:SS"
   */
  dataFim: string
  responsavel: Responsavel
  outrosResponsaveis: Responsavel[]
  local?: string
  observacoes?: string
}

export type CompromissoPayload = Omit<Compromisso, 'id'>

// =============================================================================
// LABELS PT-BR
// =============================================================================
export const TIPO_LABELS: Record<CompromissoTipo, string> = {
  feriado:           'Feriado',
  ponto_facultativo: 'Ponto Facultativo',
  oitiva:            'Oitiva',
  operacao:          'Operação',
  livre:             'Livre',
}

export const STATUS_LABELS: Record<CompromissoStatus, string> = {
  confirmado: 'Confirmado',
  pendente:   'Pendente',
  cancelado:  'Cancelado',
}

export const VIEW_LABELS: Record<CalendarViewType, string> = {
  mes:     'Mês',
  semana:  'Semana',
  dia:     'Dia',
  agenda:  'Agenda',
  ano:     'Ano',
}
