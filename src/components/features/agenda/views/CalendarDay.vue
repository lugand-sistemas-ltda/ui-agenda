<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import type { Compromisso } from '../../../../types/agenda'
import {
  getTimeSlots,
  isSameDay,
  parseLocal,
  getHourFromLocal,
} from '../../../../utils/dateUtils'
import CompromissoCard from '../CompromissoCard.vue'

const WORK_START = 7
const WORK_END   = 22

const props = defineProps<{
  currentDate: Date
  compromissos: Compromisso[]
}>()

const emit = defineEmits<{
  slotClick:        [date: Date]
  compromissoClick: [compromisso: Compromisso]
}>()

const timeSlots = computed(() => getTimeSlots(0, 23))

const dayCompromissos = computed(() =>
  props.compromissos.filter(c => isSameDay(parseLocal(c.dataInicio), props.currentDate)),
)

function slotCompromissos(hour: number): Compromisso[] {
  return dayCompromissos.value.filter(
    c => c.renderizacao !== 'fundo_dia' && getHourFromLocal(c.dataInicio) === hour,
  )
}

// ADR-005 IA-005 / ADR-002 PA-011: fundo_dia do dia atual
const fundoDia = computed(() =>
  dayCompromissos.value.find(c => c.renderizacao === 'fundo_dia'),
)

function tipoCssKey(tipo: string): string {
  return tipo.replace(/_/g, '-')
}

function isOffHour(hour: number): boolean {
  return hour < WORK_START || hour > WORK_END
}

const isWeekend = computed(() => {
  const d = props.currentDate.getDay()
  return d === 0 || d === 6
})

// Auto-scroll para o horário de expediente ao montar ou navegar
const bodyRef = ref<HTMLElement | null>(null)

function scrollToWorkHours(): void {
  nextTick(() => {
    const row = bodyRef.value?.querySelector<HTMLElement>(`[data-hour="${WORK_START}"]`)
    row?.scrollIntoView({ block: 'start' })
  })
}

onMounted(scrollToWorkHours)
watch(() => props.currentDate, scrollToWorkHours)

function slotDate(hour: number): Date {
  const d = new Date(props.currentDate)
  d.setHours(hour, 0, 0, 0)
  return d
}
</script>

<template>
  <div class="cal-day">
    <!-- ADR-005 IA-005: banda colorida no topo quando o dia é fundo_dia -->
    <div
      v-if="fundoDia"
      :class="`cal-day__fundo-band cal-day__fundo-band--${tipoCssKey(fundoDia.tipo)}`"
    >
      <span class="cal-day__fundo-label">{{ fundoDia.titulo }}</span>
    </div>

    <!-- Aviso de compromissos fora do intervalo exibido -->
    <div v-if="dayCompromissos.filter(c => getHourFromLocal(c.dataInicio) < WORK_START || getHourFromLocal(c.dataInicio) > WORK_END).length" class="cal-day__overflow-notice">
      {{
        dayCompromissos.filter(c => getHourFromLocal(c.dataInicio) < WORK_START || getHourFromLocal(c.dataInicio) > WORK_END).length
      }} compromisso(s) fora do expediente 07:00–22:00
    </div>

    <!-- Grade horária -->
    <div ref="bodyRef" class="cal-day__body">
      <div
        v-for="slot in timeSlots"
        :key="slot"
        :data-hour="parseInt(slot)"
        :class="[
          'cal-day__row',
          { 'cal-day__row--off-hours': isOffHour(parseInt(slot)) || isWeekend },
        ]"
        :aria-label="`${slot}`"
        @click="$emit('slotClick', slotDate(parseInt(slot)))"
      >
        <span class="cal-day__time-label">{{ slot }}</span>
        <div class="cal-day__events">
          <CompromissoCard
            v-for="c in slotCompromissos(parseInt(slot))"
            :key="c.id"
            :compromisso="c"
            @click="$emit('compromissoClick', c)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

$time-gutter: 52px;

.cal-day {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  // ADR-005 IA-005 / ADR-002 PA-011: banda colorida no topo do dia
  &__fundo-band {
    display: flex;
    align-items: center;
    padding: $spacing-2 $spacing-4;
    gap: $spacing-2;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;

    @each $tipo in feriado, ponto-facultativo, recesso {
      &--#{$tipo} {
        background-color: var(--color-tipo-#{$tipo}-bg);
        border-left: 4px solid var(--color-tipo-#{$tipo});
      }
    }
  }

  &__fundo-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--color-text-primary);
  }

  &__overflow-notice {
    padding: $spacing-2 $spacing-4;
    font-size: $font-size-sm;
    color: var(--color-status-pending);
    background-color: var(--color-status-bg-pending);
    border-bottom: 1px solid var(--color-border);
  }

  &__body {
    flex: 1;
    overflow-y: auto;
  }

  &__row {
    display: grid;
    grid-template-columns: $time-gutter 1fr;
    border-bottom: 1px solid var(--color-border-subtle);
    min-height: 64px;
    cursor: pointer;
    transition: background-color $transition-fast;

    &:hover { background-color: var(--color-surface); }

    &--off-hours {
      background-color: var(--color-off-hours-bg);
      &:hover { filter: brightness(0.97); background-color: var(--color-off-hours-bg); }
    }
  }

  &__time-label {
    font-size: $font-size-xs;
    color: var(--color-text-disabled);
    padding: $spacing-2;
    text-align: right;
    flex-shrink: 0;
    align-self: flex-start;
    padding-top: $spacing-2;
  }

  &__events {
    padding: $spacing-1 $spacing-2;
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }
}
</style>
