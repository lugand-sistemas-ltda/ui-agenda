<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import type { Compromisso } from '../../../../types/agenda'
import {
  DAYS_SHORT_BR,
  getWeekDays,
  getTimeSlots,
  isSameDay,
  isToday,
  parseLocal,
  getHourFromLocal,
  formatDayMonthBR,
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

const weekDays  = computed(() => getWeekDays(props.currentDate))
const timeSlots = computed(() => getTimeSlots(0, 23))

function isOffHour(hour: number): boolean {
  return hour < WORK_START || hour > WORK_END
}

function isWeekend(day: Date): boolean {
  return day.getDay() === 0 || day.getDay() === 6
}

function slotCompromissos(day: Date, hour: number): Compromisso[] {
  return props.compromissos.filter(c => {
    const d = parseLocal(c.dataInicio)
    return isSameDay(d, day) && getHourFromLocal(c.dataInicio) === hour && c.renderizacao !== 'fundo_dia'
  })
}

function slotDate(day: Date, hour: number): Date {
  const d = new Date(day)
  d.setHours(hour, 0, 0, 0)
  return d
}

// ADR-005 IA-005 / ADR-002 PA-011: retorna o fundo_dia do dia (feriado, recesso…)
function dayFundoDia(day: Date): Compromisso | undefined {
  return props.compromissos.find(
    c => c.renderizacao === 'fundo_dia' && isSameDay(parseLocal(c.dataInicio), day),
  )
}

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

function tipoCssKey(tipo: string): string {
  return tipo.replace(/_/g, '-')
}
</script>

<template>
  <div class="cal-week">
    <!-- Cabeçalho: horas + 7 colunas de dias -->
    <div class="cal-week__header">
      <span class="cal-week__time-gutter" aria-hidden="true" />
      <div
        v-for="day in weekDays"
        :key="day.toISOString()"
        :class="[
          'cal-week__day-header',
          { 'cal-week__day-header--today': isToday(day) },
          { 'cal-week__day-header--weekend': isWeekend(day) },
        ]"
      >
        <!-- ADR-005 IA-005: banda colorida quando o dia é fundo_dia (feriado, recesso…) -->
        <span
          v-if="dayFundoDia(day)"
          :class="`cal-week__fundo-band cal-week__fundo-band--${tipoCssKey(dayFundoDia(day)!.tipo)}`"
          :title="dayFundoDia(day)!.titulo"
        />
        <span class="cal-week__day-name">{{ DAYS_SHORT_BR[day.getDay()] }}</span>
        <span :class="['cal-week__day-num', { 'cal-week__day-num--today': isToday(day) }]">
          {{ day.getDate() }}
        </span>
        <span class="cal-week__day-month">{{ formatDayMonthBR(day).split(' ')[1] }}</span>
      </div>
    </div>

    <!-- Grade de horários -->
    <div ref="bodyRef" class="cal-week__body">
      <div
        v-for="slot in timeSlots"
        :key="slot"
        :data-hour="parseInt(slot)"
        :class="['cal-week__row', { 'cal-week__row--off-hours': isOffHour(parseInt(slot)) }]"
      >
        <span class="cal-week__time-label">{{ slot }}</span>
        <div
          v-for="day in weekDays"
          :key="day.toISOString()"
          :class="[
            'cal-week__cell',
            { 'cal-week__cell--off-hours': isOffHour(parseInt(slot)) || isWeekend(day) },
          ]"
          :aria-label="`${formatDayMonthBR(day)} ${slot}`"
          @click="$emit('slotClick', slotDate(day, parseInt(slot)))"
        >
          <CompromissoCard
            v-for="c in slotCompromissos(day, parseInt(slot))"
            :key="c.id"
            :compromisso="c"
            compact
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
$cols: 7;

.cal-week {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__header {
    display: grid;
    grid-template-columns: $time-gutter repeat($cols, 1fr);
    border-bottom: 1px solid var(--color-border);
    background-color: var(--color-surface-raised);
    flex-shrink: 0;
  }

  &__time-gutter { /* espaçador para alinhar com labels */ }

  &__day-header {
    @include flex(column, center, center, 2px);
    padding: $spacing-2 $spacing-1;
    border-left: 1px solid var(--color-border-subtle);
    text-align: center;
    position: relative;
    overflow: hidden;

    &--today {
      background-color: var(--color-accent-subtle);
    }

    &--weekend {
      background-color: var(--color-off-hours-bg);
    }
  }

  // ADR-005 IA-005 / ADR-002 PA-011: banda colorida no topo do header do dia
  &__fundo-band {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    border-radius: 0;

    @each $tipo in feriado, ponto-facultativo, recesso {
      &--#{$tipo} { background-color: var(--color-tipo-#{$tipo}); }
    }
  }

  &__day-name {
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__day-num {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: var(--color-text-primary);
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-full;

    &--today {
      background-color: var(--color-accent);
      color: var(--color-accent-text);
    }
  }

  &__day-month {
    font-size: $font-size-xs;
    color: var(--color-text-disabled);
  }

  &__body {
    flex: 1;
    overflow-y: auto;
  }

  &__row {
    display: grid;
    grid-template-columns: $time-gutter repeat($cols, 1fr);
    border-bottom: 1px solid var(--color-border-subtle);
    min-height: 56px;
  }

  &__time-label {
    font-size: $font-size-xs;
    color: var(--color-text-disabled);
    padding: $spacing-1 $spacing-2;
    text-align: right;
    flex-shrink: 0;
  }

  &__cell {
    border-left: 1px solid var(--color-border-subtle);
    padding: 2px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    cursor: pointer;
    transition: background-color $transition-fast;

    &:hover { background-color: var(--color-surface); }

    &--off-hours {
      background-color: var(--color-off-hours-bg);
      &:hover { filter: brightness(0.97); background-color: var(--color-off-hours-bg); }
    }
  }
}
</style>
