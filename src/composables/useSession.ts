/**
 * useSession — Iteração 2 (auth real)
 *
 * Gerencia sessão de autenticação baseada em UUID opaco.
 * O cliente armazena o sessionId em localStorage; o backend valida via
 * GET /api/auth/me (X-Session-Id header) com expiração de 8 h.
 *
 * Singleton: todas as refs vivem fora da função → estado compartilhado.
 */

import { ref, computed, readonly } from 'vue'
import type { Agenda } from '../types/agenda'
import type { AuthLoginResponse, AgendaAPI } from '../services/agenda.service'
import { authService, agendaService } from '../services/agenda.service'

// =============================================================================
// ESTADO SINGLETON
// =============================================================================

const SESSION_KEY = 'sri-agenda:sessionId'

/** UUID de sessão opaco (token do backend). */
const sessionId      = ref<string | null>(localStorage.getItem(SESSION_KEY))

/** Dados do usuário autenticado — preenchidos após login ou validação. */
const sessaoAtiva    = ref<AuthLoginResponse | null>(null)

const agendas        = ref<Agenda[]>([])
const selectedAgendaId = ref<string | null>(null)
const loadingSession = ref(false)
const errorSession   = ref<string | null>(null)

/** Verdadeiro somente após validação bem-sucedida com o backend. */
const isAuthenticated = ref<boolean>(false)

// =============================================================================
// MAPEAMENTO API → domínio
// =============================================================================

function fromAgendaAPI(a: AgendaAPI): Agenda {
  return {
    id:             a.id,
    nome:           a.nome,
    tipo:           a.tipo as Agenda['tipo'],
    proprietarioId: a.proprietarioId,
    grupoId:        a.grupoId,
    ativa:          a.ativa,
    papel:          (a.papel ?? null) as Agenda['papel'],
  }
}

// =============================================================================
// COMPOSABLE
// =============================================================================

export function useSession() {

  // --- Carregamento inicial (valida sessão salva) -----------------------------

  async function init(): Promise<void> {
    // Chamado em múltiplos componentes; executa a validação apenas uma vez.
    if (isAuthenticated.value) return
    if (!sessionId.value) {
      isAuthenticated.value = false
      return
    }
    loadingSession.value = true
    errorSession.value   = null
    try {
      const dados = await authService.me(sessionId.value)
      sessaoAtiva.value     = dados
      isAuthenticated.value = true
      await _fetchAgendas(dados.usuarioId)
    } catch {
      // Sessão expirada ou inválida — limpa localStorage
      _clearSession()
    } finally {
      loadingSession.value = false
    }
  }

  // --- Login (chamado pela LoginView) ----------------------------------------

  async function login(matricula: string, senha: string): Promise<void> {
    loadingSession.value = true
    errorSession.value   = null
    try {
      const dados = await authService.login(matricula, senha)
      sessionId.value       = dados.sessionId
      localStorage.setItem(SESSION_KEY, dados.sessionId)
      sessaoAtiva.value     = dados
      isAuthenticated.value = true
      await _fetchAgendas(dados.usuarioId)
    } finally {
      loadingSession.value = false
    }
  }

  // --- Logout ----------------------------------------------------------------

  async function logout(): Promise<void> {
    if (sessionId.value) {
      try { await authService.logout(sessionId.value) } catch { /* ignora */ }
    }
    _clearSession()
  }

  // --- Agendas consolidadas --------------------------------------------------

  async function _fetchAgendas(usuarioId: string): Promise<void> {
    try {
      const data = await agendaService.consolidada(usuarioId)
      agendas.value = data.map(fromAgendaAPI)
      const pessoal = agendas.value.find(a => a.tipo === 'pessoal')
      selectedAgendaId.value = pessoal?.id ?? agendas.value[0]?.id ?? null
    } catch {
      agendas.value          = []
      selectedAgendaId.value = null
    }
  }

  function selecionarAgenda(id: string | null): void {
    selectedAgendaId.value = id
  }

  // --- Limpar estado ---------------------------------------------------------

  function _clearSession(): void {
    sessionId.value        = null
    sessaoAtiva.value      = null
    isAuthenticated.value  = false
    agendas.value          = []
    selectedAgendaId.value = null
    localStorage.removeItem(SESSION_KEY)
  }

  // --- Derivados -------------------------------------------------------------

  /** ID do usuário ativo — extraído da sessão validada. */
  const usuarioAtivoId = computed<string | null>(
    () => sessaoAtiva.value?.usuarioId ?? null,
  )

  /**
   * Dados do usuário ativo (nome, email, matricula).
   * Exposto para AppHeader e outros consumidores.
   */
  const usuarioAtivo = computed(() => sessaoAtiva.value)

  /** IDs de todas as agendas consolidadas. */
  const agendaIds = computed<string[]>(() => agendas.value.map(a => a.id))

  /**
   * Papel do usuário autenticado — vem diretamente do backend (grupo_membro).
   * Ex.: 'gestor', 'estagiario', 'secretaria', 'operador', 'administrador'.
   */
  const papelAtivo = computed<string | null>(() => sessaoAtiva.value?.papel ?? null)

  /** Agenda selecionada como filtro ativo do calendário. */
  const agendaAtiva = computed<Agenda | null>(
    () => agendas.value.find(a => a.id === selectedAgendaId.value) ?? null,
  )

  /**
   * ID do grupo ao qual o usuário pertence — extraído da agenda de unidade consolidada.
   * As agendas pessoais não têm grupoId (campo `grupo` é nulo), então usamos a unidade.
   * Usado para filtrar a lista de usuários no modal (escopo correto de unidade).
   */
  const grupoIdAtivo = computed<string | null>(() => {
    const unidade = agendas.value.find(a => a.tipo === 'unidade' && a.grupoId)
    return unidade?.grupoId ?? null
  })

  /**
   * ID da agenda pessoal do usuário logado.
   * Usado para garantir que itens privados sejam criados na agenda pessoal.
   */
  const agendaPessoalId = computed<string | null>(() =>
    agendas.value.find(a => a.tipo === 'pessoal')?.id ?? null,
  )

  /**
   * Papel do usuário na agenda de unidade (para AppHeader).
   */
  const papelNaUnidade = computed<string | null>(() => {
    const unidade = agendas.value.find(a => a.tipo === 'unidade')
    return unidade?.papel ?? agendas.value[0]?.papel ?? null
  })

  return {
    usuarioAtivo,
    usuarioAtivoId,
    agendas:           readonly(agendas),
    agendaIds,
    selectedAgendaId:  readonly(selectedAgendaId),
    agendaAtiva,
    grupoIdAtivo,
    agendaPessoalId,
    papelAtivo,
    papelNaUnidade,
    loadingSession:    readonly(loadingSession),
    errorSession:      readonly(errorSession),
    isAuthenticated:   readonly(isAuthenticated),
    init,
    login,
    logout,
    selecionarAgenda,
  }
}
