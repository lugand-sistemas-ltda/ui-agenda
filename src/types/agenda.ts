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

export type ItemVisibilidade = 'privado' | 'grupo' | 'unidade' | 'global' | 'selecionado' | 'participante'

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
  /** Visibilidade do item (ADR-007 VIS-002). Default: 'privado'. */
  visibilidade?: ItemVisibilidade
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

// =============================================================================
// AGENDA E SESSÃO (Iteração 2)
// =============================================================================

export type TipoAgenda = 'pessoal' | 'grupo' | 'unidade' | 'sistema'

export type PapelGrupo =
  | 'administrador'
  | 'gestor'
  | 'operador'
  | 'secretaria'
  | 'estagiario'
  | 'proprietario'

export interface Agenda {
  id:             string
  nome:           string
  tipo:           TipoAgenda
  proprietarioId: string | null
  grupoId:        string | null
  ativa:          boolean
  /** Preenchido pela rota /consolidada — papel do usuário nesta agenda */
  papel:          PapelGrupo | null
}

export const PAPEL_LABELS: Record<PapelGrupo, string> = {
  administrador: 'Administrador',
  gestor:        'Gestor',
  operador:      'Operador',
  secretaria:    'Secretaria',
  estagiario:    'Estagiário',
  proprietario:  'Proprietário',
}

export const TIPO_AGENDA_LABELS: Record<TipoAgenda, string> = {
  pessoal:  'Pessoal',
  grupo:    'Grupo',
  unidade:  'Unidade',
  sistema:  'Sistema',
}

export const VISIBILIDADE_LABELS: Record<ItemVisibilidade, string> = {
  privado:      'Privado (somente minha agenda)',
  participante: 'Responsáveis (apenas para responsáveis)',
  grupo:        'Grupo (membros do grupo)',
  unidade:      'Unidade (toda a unidade)',
  global:       'Global (todo o sistema)',
  selecionado:  'Selecionado (grupos específicos)',
}

/**
 * Quais opções de visibilidade cada papel pode definir (ADR-009 PM-002).
 * Indexado por `${papel}:${tipoAgenda}` para agendas não-pessoais,
 * e por `${papel}` como fallback para agendas pessoais.
 */
export const VISIBILIDADE_POR_PAPEL: Record<string, ItemVisibilidade[]> = {
  // Agenda PESSOAL — permite privado e participante
  'administrador:pessoal': ['privado', 'participante', 'grupo', 'unidade', 'global', 'selecionado'],
  'gestor:pessoal':        ['privado', 'participante', 'grupo', 'unidade', 'selecionado'],
  'secretaria:pessoal':    ['privado', 'participante', 'grupo'],
  'operador:pessoal':      ['privado', 'participante'],
  'estagiario:pessoal':    ['privado', 'participante'],

  // Agenda de UNIDADE / GRUPO — privado não faz sentido; usa participante no lugar
  'administrador:unidade': ['participante', 'grupo', 'unidade', 'global', 'selecionado'],
  'gestor:unidade':        ['participante', 'grupo', 'unidade', 'selecionado'],
  'secretaria:unidade':    ['participante', 'grupo'],
  'operador:unidade':      ['participante'],
  'estagiario:unidade':    ['participante'],

  // Agenda de GRUPO (mesma lógica que unidade)
  'administrador:grupo':   ['participante', 'grupo', 'unidade', 'global', 'selecionado'],
  'gestor:grupo':          ['participante', 'grupo', 'unidade', 'selecionado'],
  'secretaria:grupo':      ['participante', 'grupo'],
  'operador:grupo':        ['participante'],
  'estagiario:grupo':      ['participante'],

  // Fallback legado (sem tipo de agenda)
  administrador: ['privado', 'participante', 'grupo', 'unidade', 'global', 'selecionado'],
  gestor:        ['privado', 'participante', 'grupo', 'unidade', 'selecionado'],
  secretaria:    ['privado', 'participante', 'grupo'],
  operador:      ['privado', 'participante'],
  estagiario:    ['privado', 'participante'],
}

export const VIEW_LABELS: Record<CalendarViewType, string> = {
  mes:     'Mês',
  semana:  'Semana',
  dia:     'Dia',
  agenda:  'Agenda',
  ano:     'Ano',
}

