// =============================================================================
// TIPOS DE ITEM DE AGENDA
// =============================================================================

/** Driver visual do item no calendário (ADR-005 IA-002, ADR-002 PA-011).
 *  Use este campo — não 'tipo' — para decidir como renderizar no front-end. */
export type ItemRenderizacao = 'evento' | 'fundo_dia' | 'periodo'

/** Tipo semântico do item (ADR-005 IA-001). */
export type CompromissoTipo =
  | 'feriado'
  | 'ponto_facultativo'
  | 'recesso'
  | 'oitiva'
  | 'operacao'
  | 'reuniao'
  | 'periodo'
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
  /** Driver de renderização visual (ADR-005 IA-002). Use isto, não 'tipo'. */
  renderizacao: ItemRenderizacao
  /** Presença física obrigatória: participa de verificação de conflito CONFLITO-B. */
  exigePresenca: boolean
  /**
   * Data/hora de início no formato local sem timezone: "YYYY-MM-DDTHH:MM:SS"
   * Exibir ao usuário como "DD/MM/AAAA HH:MM:SS" (padrão brasileiro).
   */
  dataInicio: string
  /**
   * Data/hora de fim no formato local sem timezone: "YYYY-MM-DDTHH:MM:SS"
   */
  dataFim: string
  /** Null para itens fundo_dia (feriados, etc.). */
  responsavel: Responsavel | null
  outrosResponsaveis: Responsavel[]
  local?: string
  observacoes?: string
  agendaId?: string
  itemPaiId?: string
}

export type CompromissoPayload = Omit<Compromisso, 'id'>

// =============================================================================
// LABELS PT-BR
// =============================================================================
export const TIPO_LABELS: Record<CompromissoTipo, string> = {
  feriado:           'Feriado',
  ponto_facultativo: 'Ponto Facultativo',
  recesso:           'Recesso',
  oitiva:            'Oitiva',
  operacao:          'Operação',
  reuniao:           'Reunião',
  periodo:           'Período',
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

