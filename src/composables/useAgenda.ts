import { ref, readonly, computed } from 'vue'
import type { Compromisso, CompromissoPayload } from '../types/agenda'
import { isSameDay, parseLocal } from '../utils/dateUtils'

// =============================================================================
// SINGLETON — estado compartilhado entre todos os componentes
// =============================================================================

const compromissos = ref<Compromisso[]>([
  // ----- Mock: Feriado Tiradentes -----
  {
    id: 'mock-1',
    titulo: 'Tiradentes',
    descricao: 'Feriado nacional',
    tipo: 'feriado',
    status: 'confirmado',
    dataInicio: '2026-04-21T00:00:00',
    dataFim:    '2026-04-21T23:59:59',
    responsavel: { id: 'sys', nome: 'Sistema' },
    outrosResponsaveis: [],
  },
  // ----- Mock: Ponto Facultativo -----
  {
    id: 'mock-2',
    titulo: 'Ponto Facultativo',
    descricao: 'Véspera de Tiradentes',
    tipo: 'ponto_facultativo',
    status: 'confirmado',
    dataInicio: '2026-04-20T00:00:00',
    dataFim:    '2026-04-20T23:59:59',
    responsavel: { id: 'sys', nome: 'Sistema' },
    outrosResponsaveis: [],
  },
  // ----- Mock: Oitiva -----
  {
    id: 'mock-3',
    titulo: 'Oitiva — Proc. 1234/2026',
    descricao: 'Oitiva de testemunhas referente ao processo 1234/2026',
    tipo: 'oitiva',
    status: 'confirmado',
    dataInicio: '2026-04-15T09:00:00',
    dataFim:    '2026-04-15T11:00:00',
    responsavel: { id: 'u1', nome: 'André Myszko' },
    outrosResponsaveis: [{ id: 'u2', nome: 'Maria Silva' }],
    local: 'Sala de Audiências 3',
    observacoes: 'Trazer documentação completa do processo',
  },
  // ----- Mock: Operação -----
  {
    id: 'mock-4',
    titulo: 'Operação Madrugada',
    tipo: 'operacao',
    status: 'pendente',
    dataInicio: '2026-04-17T02:00:00',
    dataFim:    '2026-04-17T06:00:00',
    responsavel: { id: 'u1', nome: 'André Myszko' },
    outrosResponsaveis: [],
    local: 'Zona Norte',
  },
  // ----- Mock: Livre -----
  {
    id: 'mock-5',
    titulo: 'Reunião de equipe',
    tipo: 'livre',
    status: 'confirmado',
    dataInicio: '2026-04-13T09:00:00',
    dataFim:    '2026-04-13T10:00:00',
    responsavel: { id: 'u1', nome: 'André Myszko' },
    outrosResponsaveis: [],
    observacoes: 'Pauta: planejamento do trimestre',
  },
  // ----- Mock: Oitiva mesma semana -----
  {
    id: 'mock-6',
    titulo: 'Oitiva — Proc. 0987/2026',
    tipo: 'oitiva',
    status: 'pendente',
    dataInicio: '2026-04-14T14:00:00',
    dataFim:    '2026-04-14T16:00:00',
    responsavel: { id: 'u1', nome: 'André Myszko' },
    outrosResponsaveis: [],
    local: 'Sala Virtual',
  },
])

// =============================================================================
// COMPOSABLE
// =============================================================================

export function useAgenda() {

  // --- CRUD -----------------------------------------------------------------

  function addCompromisso(payload: CompromissoPayload): Compromisso {
    const compromisso: Compromisso = { ...payload, id: crypto.randomUUID() }
    compromissos.value.push(compromisso)
    return compromisso
  }

  function updateCompromisso(id: string, payload: Partial<CompromissoPayload>): void {
    const idx = compromissos.value.findIndex(c => c.id === id)
    if (idx !== -1) {
      compromissos.value[idx] = { ...compromissos.value[idx], ...payload }
    }
  }

  function removeCompromisso(id: string): void {
    compromissos.value = compromissos.value.filter(c => c.id !== id)
  }

  function getById(id: string): Compromisso | undefined {
    return compromissos.value.find(c => c.id === id)
  }

  // --- FILTROS --------------------------------------------------------------

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
    addCompromisso,
    updateCompromisso,
    removeCompromisso,
    getById,
    getByDay,
    getByMonth,
  }
}
