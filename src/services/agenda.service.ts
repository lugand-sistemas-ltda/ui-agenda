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
}

export interface CompromissoAPI {
  id: string
  titulo: string
  descricao?: string
  tipo: string
  status: string
  dataInicio: string   // "YYYY-MM-DDTHH:MM:SS" — ISO sem timezone
  dataFim: string
  local?: string
  observacoes?: string
  responsavel: UsuarioAPI
  outrosResponsaveis: UsuarioAPI[]
  criadoEm: string
  atualizadoEm: string
}

export interface CompromissoPayloadAPI {
  titulo: string
  descricao?: string
  tipo: string
  status?: string
  dataInicio: string
  dataFim: string
  local?: string
  observacoes?: string
  responsavelId: string
  outrosResponsaveisIds?: string[]
}

// =============================================================================
// UTILITÁRIO INTERNO
// =============================================================================

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${body}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// =============================================================================
// USUÁRIOS
// =============================================================================

export const usuarioService = {
  listar: (): Promise<UsuarioAPI[]> =>
    request('/api/usuarios'),

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
// COMPROMISSOS
// =============================================================================

export const compromissoService = {
  /** Lista todos — ou filtra por ?ano&mes ou ?ano&mes&dia */
  listar: (params?: { ano?: number; mes?: number; dia?: number }): Promise<CompromissoAPI[]> => {
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
}
