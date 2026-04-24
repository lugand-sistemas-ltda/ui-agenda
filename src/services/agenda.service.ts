/**
 * Serviço HTTP — SRI Agenda API
 *
 * Centraliza todas as chamadas à api-agenda (Quarkus, porta 8080).
 * Os componentes não devem fazer fetch diretamente — sempre via este módulo.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

// =============================================================================
// TIPOS (espelhando o back-end)
// =============================================================================

export interface UsuarioAPI {
  id: string
  nome: string
  email: string
  matricula: string
  grupoId?: string
}

// ---- Auth (Iteração 2) ----
export interface AuthLoginResponse {
  sessionId: string
  usuarioId: string
  nome:      string
  email:     string
  matricula: string
  papel:     string | null
}

// ---- Agenda (Iteração 2) ----
export interface AgendaAPI {
  id:             string
  nome:           string
  tipo:           string
  proprietarioId: string | null
  grupoId:        string | null
  ativa:          boolean
  papel:          string | null
}

export interface CompromissoAPI {
  id: string
  titulo: string
  descricao?: string
  tipo: string
  status: string
  renderizacao: string
  exigePresenca: boolean
  dataInicio: string   // "YYYY-MM-DDTHH:MM:SS" — ISO sem timezone
  dataFim: string
  local?: string
  observacoes?: string
  responsavel: UsuarioAPI | null   // null para itens fundo_dia (feriados, etc.)
  outrosResponsaveis: UsuarioAPI[]
  agendaId?: string
  itemPaiId?: string
  visibilidade?: string
  criadoEm: string
  atualizadoEm: string
}

export interface CompromissoPayloadAPI {
  titulo: string
  descricao?: string
  tipo: string
  status?: string
  renderizacao?: string
  exigePresenca?: boolean
  dataInicio: string
  dataFim: string
  local?: string
  observacoes?: string
  responsavelId?: string   // opcional para itens fundo_dia
  outrosResponsaveisIds?: string[]
  agendaId?: string
  itemPaiId?: string
  visibilidade?: string
}

// =============================================================================
// UTILITÁRIO INTERNO
// =============================================================================

const SESSION_STORAGE_KEY = 'sri-agenda:sessionId'

// =============================================================================
// ERROS DE API
// =============================================================================

/**
 * Erro tipado lançado quando a API retorna status >= 400.
 * Permite que chamadores diferenciem 401 (sessão expirada), 403 (sem permissão)
 * e outros erros sem fazer parsing de mensagem de texto.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Inclui X-Session-Id automaticamente quando há sessão ativa, sem exigir que
  // cada chamador conheça o localStorage. Chamadas de auth que já enviam o header
  // explicitamente via init?.headers têm prioridade (spread posterior).
  const storedSession = localStorage.getItem(SESSION_STORAGE_KEY)
  const autoSessionHeader: Record<string, string> = storedSession
    ? { 'X-Session-Id': storedSession }
    : {}
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...autoSessionHeader, ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new ApiError(res.status, `API ${res.status}: ${body}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// =============================================================================
// AUTENTICAÇÃO
// =============================================================================

export const authService = {
  login: (matricula: string, senha: string): Promise<AuthLoginResponse> =>
    request('/api/auth/login', {
      method:  'POST',
      body:    JSON.stringify({ matricula, senha }),
    }),

  /** Valida a sessão e retorna dados do usuário. Lança erro se expirada/inválida. */
  me: (sessionId: string): Promise<AuthLoginResponse> =>
    request('/api/auth/me', {
      headers: { 'X-Session-Id': sessionId },
    }),

  logout: (sessionId: string): Promise<void> =>
    request('/api/auth/logout', {
      method:  'POST',
      headers: { 'X-Session-Id': sessionId },
    }),
}

// =============================================================================
// USUÁRIOS
// =============================================================================

export const usuarioService = {
  listar: (params?: { grupoId?: string }): Promise<UsuarioAPI[]> => {
    const qs = params?.grupoId ? `?grupoId=${params.grupoId}` : ''
    return request(`/api/usuarios${qs}`)
  },

  buscar: (id: string): Promise<UsuarioAPI> =>
    request(`/api/usuarios/${id}`),

  criar: (payload: { nome: string; email: string }): Promise<UsuarioAPI> =>
    request('/api/usuarios', { method: 'POST', body: JSON.stringify(payload) }),

  atualizar: (id: string, payload: { nome: string; email: string }): Promise<UsuarioAPI> =>
    request(`/api/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  remover: (id: string): Promise<void> =>
    request(`/api/usuarios/${id}`, { method: 'DELETE' }),
}

// =============================================================================
// AGENDAS (Iteração 2)
// =============================================================================

export const agendaService = {
  listar: (): Promise<AgendaAPI[]> =>
    request('/api/agendas'),

  consolidada: (usuarioId: string): Promise<AgendaAPI[]> =>
    request(`/api/agendas/consolidada?usuarioId=${usuarioId}`),
}

// =============================================================================
// COMPROMISSOS
// =============================================================================

export const compromissoService = {
  /** Lista todos — ou filtra por ?usuarioId (VIS-004) ou ?agendaId; combinável com ?ano&mes ou ?ano&mes&dia */
  listar: (params?: { ano?: number; mes?: number; dia?: number; agendaId?: string; usuarioId?: string }): Promise<CompromissoAPI[]> => {
    const qs = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)])
    ).toString() : ''
    return request(`/api/compromissos${qs ? '?' + qs : ''}`)
  },

  buscar: (id: string): Promise<CompromissoAPI> =>
    request(`/api/compromissos/${id}`),

  criar: (payload: CompromissoPayloadAPI): Promise<CompromissoAPI> =>
    request('/api/compromissos', { method: 'POST', body: JSON.stringify(payload) }),

  atualizar: (id: string, payload: Partial<CompromissoPayloadAPI>): Promise<CompromissoAPI> =>
    request(`/api/compromissos/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  remover: (id: string): Promise<void> =>
    request(`/api/compromissos/${id}`, { method: 'DELETE' }),

  /** Verifica conflito de responsável com exige_presenca=true (ADR-005 CONFLITO-B / RN-008) */
  verificarConflito: (params: {
    responsavelId: string
    inicio: string
    fim: string
    excluirId?: string
  }): Promise<CompromissoAPI[]> => {
    const qs = new URLSearchParams({
      responsavelId: params.responsavelId,
      inicio:        params.inicio,
      fim:           params.fim,
      ...(params.excluirId ? { excluirId: params.excluirId } : {}),
    }).toString()
    return request(`/api/compromissos/conflito?${qs}`)
  },
}
