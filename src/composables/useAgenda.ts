import { ref, readonly, computed } from 'vue'
import type { Compromisso, CompromissoPayload, ItemVisibilidade } from '../types/agenda'
import type { CompromissoAPI } from '../services/agenda.service'
import { compromissoService } from '../services/agenda.service'
import { isSameDay, parseLocal } from '../utils/dateUtils'

// =============================================================================
// SINGLETON — estado compartilhado entre todos os componentes
// =============================================================================

const compromissos  = ref<Compromisso[]>([])
const loading       = ref(false)
const error         = ref<string | null>(null)

// =============================================================================
// MAPEAMENTO API → domínio local
// =============================================================================

function fromAPI(c: CompromissoAPI): Compromisso {
  return {
    id:             c.id,
    titulo:         c.titulo,
    descricao:      c.descricao,
    tipo:           c.tipo as Compromisso['tipo'],
    status:         c.status as Compromisso['status'],
    renderizacao:   (c.renderizacao ?? 'evento') as Compromisso['renderizacao'],
    exigePresenca:  c.exigePresenca ?? false,
    dataInicio:     c.dataInicio,
    dataFim:        c.dataFim,
    local:          c.local,
    observacoes:    c.observacoes,
    responsavel:    c.responsavel ? { id: c.responsavel.id, nome: c.responsavel.nome } : null,
    outrosResponsaveis: c.outrosResponsaveis.map(r => ({ id: r.id, nome: r.nome })),
    agendaId:       c.agendaId,
    itemPaiId:      c.itemPaiId,
    visibilidade:   (c.visibilidade as ItemVisibilidade) ?? 'privado',
  }
}

// =============================================================================
// COMPOSABLE
// =============================================================================

export function useAgenda() {

  // --- CARREGAMENTO ---------------------------------------------------------

  /**
   * Busca os compromissos de um mês.
   *
   * @param usuarioId  Se fornecido, aplica VIS-004 (ADR-007): retorna todos os itens
   *                   visíveis para o usuário — pessoais, grupo, unidade e globais.
   *                   Se omitido, busca sem filtro (sem sessão ativa).
   */
  async function fetchByMonth(year: number, month: number, usuarioId?: string): Promise<void> {
    loading.value = true
    error.value   = null
    try {
      let fetched: ReturnType<typeof fromAPI>[] = []

      const params = usuarioId
        ? { ano: year, mes: month + 1, usuarioId }
        : { ano: year, mes: month + 1 }

      const data = await compromissoService.listar(params)
      fetched = data.map(fromAPI)

      // Mescla com o estado: remove os do mesmo mês e reinsere os novos
      compromissos.value = [
        ...compromissos.value.filter(c => {
          const d = parseLocal(c.dataInicio)
          return !(d.getFullYear() === year && d.getMonth() === month)
        }),
        ...fetched,
      ]
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  // --- CRUD -----------------------------------------------------------------

  async function addCompromisso(payload: CompromissoPayload): Promise<Compromisso> {
    const created = await compromissoService.criar({
      titulo:              payload.titulo,
      descricao:           payload.descricao,
      tipo:                payload.tipo,
      status:              payload.status,
      dataInicio:          payload.dataInicio,
      dataFim:             payload.dataFim,
      local:               payload.local,
      observacoes:         payload.observacoes,
      responsavelId:       payload.responsavel?.id,
      outrosResponsaveisIds: payload.outrosResponsaveis.map(r => r.id),
      agendaId:            payload.agendaId,
      visibilidade:        payload.visibilidade,
    })
    const compromisso = fromAPI(created)
    compromissos.value.push(compromisso)
    return compromisso
  }

  async function updateCompromisso(id: string, payload: Partial<CompromissoPayload>): Promise<void> {
    const updated = await compromissoService.atualizar(id, {
      titulo:              payload.titulo,
      descricao:           payload.descricao,
      tipo:                payload.tipo,
      status:              payload.status,
      dataInicio:          payload.dataInicio,
      dataFim:             payload.dataFim,
      local:               payload.local,
      observacoes:         payload.observacoes,
      responsavelId:       payload.responsavel?.id,
      outrosResponsaveisIds: payload.outrosResponsaveis?.map(r => r.id),
      agendaId:            payload.agendaId,
      visibilidade:        payload.visibilidade,
    })
    const idx = compromissos.value.findIndex(c => c.id === id)
    if (idx !== -1) compromissos.value[idx] = fromAPI(updated)
  }

  async function removeCompromisso(id: string): Promise<void> {
    await compromissoService.remover(id)
    compromissos.value = compromissos.value.filter(c => c.id !== id)
  }

  function getById(id: string): Compromisso | undefined {
    return compromissos.value.find(c => c.id === id)
  }

  // --- FILTROS (locais — sobre o estado já carregado) -----------------------

  function getByDay(date: Date): Compromisso[] {
    return compromissos.value.filter(c =>
      isSameDay(parseLocal(c.dataInicio), date),
    )
  }

  function getByMonth(year: number, month: number): Compromisso[] {
    return compromissos.value.filter(c => {
      const d = parseLocal(c.dataInicio)
      return d.getFullYear() === year && d.getMonth() === month
    })
  }

  // --- ORDENADO -------------------------------------------------------------

  const sortedCompromissos = computed(() =>
    [...compromissos.value].sort(
      (a, b) => parseLocal(a.dataInicio).getTime() - parseLocal(b.dataInicio).getTime(),
    ),
  )

  return {
    compromissos: readonly(compromissos),
    sortedCompromissos,
    loading:  readonly(loading),
    error:    readonly(error),
    fetchByMonth,
    addCompromisso,
    updateCompromisso,
    removeCompromisso,
    getById,
    getByDay,
    getByMonth,
  }
}
