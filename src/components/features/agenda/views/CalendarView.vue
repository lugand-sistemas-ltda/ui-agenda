<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { Compromisso, CalendarViewType, CompromissoPayload } from '../../../../types/agenda'
import { addDays, addWeeks, addMonths, addYears } from '../../../../utils/dateUtils'
import { useAgenda } from '../../../../composables/useAgenda'
import { useToast } from '../../../../composables/useToast'
import CalendarHeader  from '../CalendarHeader.vue'
import AppAlert        from '../../../primitives/AppAlert.vue'
import CalendarMonth   from './CalendarMonth.vue'
import CalendarWeek    from './CalendarWeek.vue'
import CalendarDay     from './CalendarDay.vue'
import CalendarAgenda  from './CalendarAgenda.vue'
import CalendarYear    from './CalendarYear.vue'
import CompromissoModal from '../CompromissoModal.vue'

// ---- Estado ----
const currentDate = ref(new Date())
const currentView = ref<CalendarViewType>('mes')

// ---- Paginação da view Agenda (scroll infinito) ----
const AGENDA_DAYS_INITIAL  = 60
const AGENDA_DAYS_STEP     = 30
const agendaDaysAhead      = ref(AGENDA_DAYS_INITIAL)
const agendaLoadingMore    = ref(false)
const agendaMonthCount     = computed(() => Math.ceil(agendaDaysAhead.value / AGENDA_DAYS_STEP) + 1)

const modalOpen         = ref(false)
const editingCompromisso = ref<Compromisso | null>(null)
const modalDefaultDate  = ref<Date | null>(null)

// ---- Composable ----
const { getByMonth, addCompromisso, updateCompromisso, removeCompromisso, fetchByMonth, loading, error } = useAgenda()
const { success: toastSuccess, error: toastError } = useToast()

// ---- Carregamento de dados ----

async function loadForCurrentView(): Promise<void> {
  const d    = currentDate.value
  const year = d.getFullYear()
  const month = d.getMonth()

  if (currentView.value === 'ano') {
    await Promise.all(Array.from({ length: 12 }, (_, m) => fetchByMonth(year, m)))
  } else if (currentView.value === 'agenda') {
    // Carrega tantos meses quantos forem necessários para cobrir agendaDaysAhead
    await Promise.all(
      Array.from({ length: agendaMonthCount.value }, (_, i) => {
        const d = new Date(year, month + i, 1)
        return fetchByMonth(d.getFullYear(), d.getMonth())
      }),
    )
  } else {
    await fetchByMonth(year, month)
  }
}

onMounted(loadForCurrentView)
watch([currentDate, currentView], (_, [, prevView]) => {
  // Ao navegar dentro da view agenda, reseta a janela de paginação
  if (currentView.value === 'agenda') agendaDaysAhead.value = AGENDA_DAYS_INITIAL
  loadForCurrentView()
})

// ---- Compromissos filtrados para a view atual ----
const viewCompromissos = computed(() => {
  const d = currentDate.value
  switch (currentView.value) {
    case 'mes':
      return getByMonth(d.getFullYear(), d.getMonth())
    case 'semana':
    case 'dia':
      // As views filtram internamente por dia; passamos todos do mês para eficiência
      return getByMonth(d.getFullYear(), d.getMonth())
    case 'agenda': {
      // Fornece dados de todos os meses já carregados para a janela de paginação
      const months: Compromisso[] = []
      for (let i = 0; i < agendaMonthCount.value; i++) {
        const nd = new Date(d.getFullYear(), d.getMonth() + i, 1)
        months.push(...getByMonth(nd.getFullYear(), nd.getMonth()))
      }
      return months
    }
    case 'ano': {
      // Todos os compromissos do ano
      const all = []
      for (let m = 0; m < 12; m++) all.push(...getByMonth(d.getFullYear(), m))
      return all
    }
    default:
      return []
  }
})

// ---- Navegação ----
function navigatePrev() {
  switch (currentView.value) {
    case 'mes':    currentDate.value = addMonths(currentDate.value, -1); break
    case 'semana': currentDate.value = addWeeks(currentDate.value, -1);  break
    case 'dia':    currentDate.value = addDays(currentDate.value, -1);   break
    case 'agenda': currentDate.value = addDays(currentDate.value, -7);   break
    case 'ano':    currentDate.value = addYears(currentDate.value, -1);  break
  }
}

function navigateNext() {
  switch (currentView.value) {
    case 'mes':    currentDate.value = addMonths(currentDate.value, 1); break
    case 'semana': currentDate.value = addWeeks(currentDate.value, 1);  break
    case 'dia':    currentDate.value = addDays(currentDate.value, 1);   break
    case 'agenda': currentDate.value = addDays(currentDate.value, 7);   break
    case 'ano':    currentDate.value = addYears(currentDate.value, 1);  break
  }
}

function navigateToday() {
  currentDate.value = new Date()
}

// ---- Modal ----
function openNewModal(date?: Date) {
  editingCompromisso.value = null
  modalDefaultDate.value   = date ?? new Date()
  modalOpen.value          = true
}

function openEditModal(compromisso: Compromisso) {
  editingCompromisso.value = compromisso
  modalDefaultDate.value   = null
  modalOpen.value          = true
}

function closeModal() {
  modalOpen.value = false
}

async function handleSave(payload: CompromissoPayload, id?: string) {
  try {
    if (id) {
      await updateCompromisso(id, payload)
      toastSuccess('Compromisso atualizado com sucesso.')
    } else {
      await addCompromisso(payload)
      toastSuccess('Compromisso criado com sucesso.')
    }
    closeModal()
  } catch {
    toastError('Não foi possível salvar o compromisso.', 'Erro ao salvar')
  }
}

async function handleDelete(id: string) {
  try {
    await removeCompromisso(id)
    closeModal()
    toastSuccess('Compromisso excluído com sucesso.')
  } catch {
    toastError('Não foi possível excluir o compromisso.', 'Erro ao excluir')
  }
}

// ---- Slot click: navegar para o dia e abrir modal ----
/** Scroll infinito: ao chegar no fundo, busca o próximo mês e amplia a janela */
async function handleAgendaLoadMore(): Promise<void> {
  if (agendaLoadingMore.value) return
  agendaLoadingMore.value = true
  try {
    const d              = currentDate.value
    const nextOffset     = agendaMonthCount.value  // índice do mês ainda não carregado
    agendaDaysAhead.value += AGENDA_DAYS_STEP
    const nd = new Date(d.getFullYear(), d.getMonth() + nextOffset, 1)
    await fetchByMonth(nd.getFullYear(), nd.getMonth())
  } finally {
    agendaLoadingMore.value = false
  }
}

function handleSlotClick(date: Date) {
  if (currentView.value === 'mes' || currentView.value === 'agenda' || currentView.value === 'ano') {
    currentDate.value  = date
    currentView.value  = 'dia'
  } else {
    openNewModal(date)
  }
}
</script>

<template>
  <div class="calendar-view">
    <!-- Banner de erro -->
    <AppAlert v-if="error" variant="error" title="Erro ao carregar dados" class="calendar-view__error-alert">
      {{ error }}
    </AppAlert>

    <CalendarHeader
      :current-date="currentDate"
      :current-view="currentView"
      @prev="navigatePrev"
      @next="navigateNext"
      @today="navigateToday"
      @change-view="v => currentView = v"
      @new-compromisso="openNewModal()"
    />

    <div class="calendar-view__body">
      <!-- Overlay de loading (oculto durante loadMore para não sobrepor o spinner do fundo) -->
      <div v-if="loading && !agendaLoadingMore" class="calendar-view__loading" aria-live="polite" aria-label="Carregando">
        <span class="calendar-view__spinner" />
      </div>
      <CalendarMonth
        v-if="currentView === 'mes'"
        :current-date="currentDate"
        :compromissos="viewCompromissos"
        @slot-click="handleSlotClick"
        @compromisso-click="openEditModal"
      />
      <CalendarWeek
        v-else-if="currentView === 'semana'"
        :current-date="currentDate"
        :compromissos="viewCompromissos"
        @slot-click="openNewModal"
        @compromisso-click="openEditModal"
      />
      <CalendarDay
        v-else-if="currentView === 'dia'"
        :current-date="currentDate"
        :compromissos="viewCompromissos"
        @slot-click="openNewModal"
        @compromisso-click="openEditModal"
      />
      <CalendarAgenda
        v-else-if="currentView === 'agenda'"
        :current-date="currentDate"
        :compromissos="viewCompromissos"
        :days-ahead="agendaDaysAhead"
        :loading-more="agendaLoadingMore"
        @slot-click="handleSlotClick"
        @compromisso-click="openEditModal"
        @load-more="handleAgendaLoadMore"
      />
      <CalendarYear
        v-else-if="currentView === 'ano'"
        :current-date="currentDate"
        :compromissos="viewCompromissos"
        @day-click="handleSlotClick"
      />
    </div>

    <CompromissoModal
      :open="modalOpen"
      :compromisso="editingCompromisso"
      :default-date="modalDefaultDate"
      @close="closeModal"
      @save="handleSave"
      @delete="handleDelete"
    />
  </div>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.calendar-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: $radius-lg;
  overflow: hidden;

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    position: relative;
  }

  &__loading {
    position: absolute;
    inset: 0;
    z-index: $z-overlay;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: color-mix(in srgb, var(--color-bg) 70%, transparent);
    backdrop-filter: blur(2px);
  }

  &__spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  &__error-alert {
    flex-shrink: 0;
    border-radius: 0;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
