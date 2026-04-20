/**
 * useSession — Iteração 2
 *
 * Gerencia o usuário ativo (login simples, sem autenticação).
 * O usuário selecionado é persistido em localStorage.
 *
 * Ao montar, busca a lista de usuários da API e restaura a seleção anterior.
 * Expõe também as agendas consolidadas do usuário ativo (pessoal + unidade).
 */

import { ref, computed, readonly, watch } from 'vue'
import type { Agenda } from '../types/agenda'
import type { UsuarioAPI, AgendaAPI } from '../services/agenda.service'
import { usuarioService, agendaService } from '../services/agenda.service'

// =============================================================================
// ESTADO SINGLETON
// =============================================================================

const STORAGE_KEY = 'sri-agenda:usuarioId'

const usuarios         = ref<UsuarioAPI[]>([])
const usuarioAtivoId   = ref<string | null>(localStorage.getItem(STORAGE_KEY))
const agendas          = ref<Agenda[]>([])
const selectedAgendaId = ref<string | null>(null)
const loadingSession   = ref(false)
const errorSession     = ref<string | null>(null)
const isAuthenticated  = ref<boolean>(!!localStorage.getItem(STORAGE_KEY))

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

  // Persiste a seleção no localStorage
  watch(usuarioAtivoId, (id) => {
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else    localStorage.removeItem(STORAGE_KEY)
  })

  // --- Carregamento inicial ---------------------------------------------------

  async function init(): Promise<void> {
    if (usuarios.value.length > 0) return   // já carregado (singleton)
    loadingSession.value = true
    errorSession.value   = null
    try {
      usuarios.value = await usuarioService.listar()

      // Valida se o usuário salvo ainda existe; se não, limpa
      if (
        usuarioAtivoId.value &&
        !usuarios.value.find(u => u.id === usuarioAtivoId.value)
      ) {
        usuarioAtivoId.value = null
      }

      // Carrega agendas do usuário ativo (se houver)
      if (usuarioAtivoId.value) {
        await _fetchAgendas(usuarioAtivoId.value)
      }
    } catch (e) {
      errorSession.value = String(e)
    } finally {
      loadingSession.value = false
    }
  }

  async function _fetchAgendas(id: string): Promise<void> {
    try {
      const data = await agendaService.consolidada(id)
      agendas.value = data.map(fromAgendaAPI)
      // Auto-seleciona a agenda pessoal do usuário como padrão
      const pessoal = agendas.value.find(a => a.tipo === 'pessoal')
      selectedAgendaId.value = pessoal?.id ?? agendas.value[0]?.id ?? null
    } catch {
      agendas.value          = []
      selectedAgendaId.value = null
    }
  }

  // --- Seleção de usuário ----------------------------------------------------

  async function selecionarUsuario(id: string | null): Promise<void> {
    usuarioAtivoId.value   = id
    isAuthenticated.value  = !!id
    agendas.value          = []
    selectedAgendaId.value = null   // será re-selecionado em _fetchAgendas
    if (id) await _fetchAgendas(id)
  }

  function logout(): void {
    usuarioAtivoId.value   = null
    isAuthenticated.value  = false
    agendas.value          = []
    selectedAgendaId.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  function selecionarAgenda(id: string | null): void {
    selectedAgendaId.value = id
  }

  // --- Derivados --------------------------------------------------------------

  const usuarioAtivo = computed(() =>
    usuarios.value.find(u => u.id === usuarioAtivoId.value) ?? null,
  )

  /**
   * IDs de todas as agendas consolidadas (para uso interno se necessário).
   */
  const agendaIds = computed<string[]>(() =>
    agendas.value.map(a => a.id),
  )

  /** Agenda atualmente selecionada como filtro ativo do calendário. */
  const agendaAtiva = computed<Agenda | null>(
    () => agendas.value.find(a => a.id === selectedAgendaId.value) ?? null,
  )

  /**
   * Papel do usuário na agenda da unidade (ou pessoal se não houver unidade).
   * Usado para exibição no AppHeader.
   */
  const papelNaUnidade = computed<string | null>(() => {
    const unidade = agendas.value.find(a => a.tipo === 'unidade')
    return unidade?.papel ?? agendas.value[0]?.papel ?? null
  })

  return {
    usuarios:          readonly(usuarios),
    usuarioAtivo,
    usuarioAtivoId:    readonly(usuarioAtivoId),
    agendas:           readonly(agendas),
    agendaIds,
    selectedAgendaId:  readonly(selectedAgendaId),
    agendaAtiva,
    papelNaUnidade,
    loadingSession:    readonly(loadingSession),
    errorSession:      readonly(errorSession),
    isAuthenticated:   readonly(isAuthenticated),
    init,
    selecionarUsuario,
    selecionarAgenda,
    logout,
  }
}
