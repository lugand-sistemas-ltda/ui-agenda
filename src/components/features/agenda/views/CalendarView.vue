<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { Compromisso, CalendarViewType, CompromissoPayload } from '../../../../types/agenda'
import { addDays, addWeeks, addMonths, addYears } from '../../../../utils/dateUtils'
import { useAgenda } from '../../../../composables/useAgenda'
import CalendarHeader  from '../CalendarHeader.vue'
import CalendarMonth   from './CalendarMonth.vue'
import CalendarWeek    from './CalendarWeek.vue'
import CalendarDay     from './CalendarDay.vue'
import CalendarAgenda  from './CalendarAgenda.vue'
import CalendarYear    from './CalendarYear.vue'
import CompromissoModal from '../CompromissoModal.vue'

// ---- Estado ----
const currentDate = ref(new Date())
const currentView = ref<CalendarViewType>('mes')

const modalOpen         = ref(false)
const editingCompromisso = ref<Compromisso | null>(null)
const modalDefaultDate  = ref<Date | null>(null)

// ---- Composable ----
const { getByMonth, addCompromisso, updateCompromisso, removeCompromisso, fetchByMonth, loading, error } = useAgenda()

// ---- Carregamento de dados ----

async function loadForCurrentView(): Promise<void> {
  const d    = currentDate.value
  const year = d.getFullYear()
  const month = d.getMonth()

  if (currentView.value === 'ano') {
    await Promise.all(Array.from({ length: 12 }, (_, m) => fetchByMonth(year, m)))
  } else if (currentView.value === 'agenda') {
    await Promise.all([
      fetchByMonth(year, month),
      fetchByMonth(year, month + 1),
      fetchByMonth(year, month + 2),
    ])
  } else {
    await fetchByMonth(year, month)
  }
}

onMounted(loadForCurrentView)
watch([currentDate, currentView], loadForCurrentView)

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
    case 'agenda':
      // CalendarAgenda filtra os próximos 60 dias internamente
      return getByMonth(d.getFullYear(), d.getMonth())
        .concat(getByMonth(d.getFullYear(), d.getMonth() + 1))
        .concat(getByMonth(d.getFullYear(), d.getMonth() + 2))
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
  if (id) {
    await updateCompromisso(id, payload)
  } else {
    await addCompromisso(payload)
  }
  closeModal()
}

async function handleDelete(id: string) {
  await removeCompromisso(id)
  closeModal()
}

// ---- Slot click: navegar para o dia e abrir modal ----
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
    <div v-if="error" class="calendar-view__error" role="alert">
      ⚠️ Erro ao carregar dados: {{ error }}
    </div>

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
      <!-- Overlay de loading -->
      <div v-if="loading" class="calendar-view__loading" aria-live="polite" aria-label="Carregando">
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
        @slot-click="handleSlotClick"
        @compromisso-click="openEditModal"
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

  &__error {
    padding: $spacing-2 $spacing-4;
    background-color: var(--color-status-bg-cancelled);
    border-bottom: 1px solid var(--color-status-cancelled);
    color: var(--color-text-primary);
    font-size: $font-size-sm;
    flex-shrink: 0;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
