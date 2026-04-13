<script setup lang="ts">
import { computed } from 'vue'
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

const START_HOUR = 7
const END_HOUR   = 22

const props = defineProps<{
  currentDate: Date
  compromissos: Compromisso[]
}>()

const emit = defineEmits<{
  slotClick:        [date: Date]
  compromissoClick: [compromisso: Compromisso]
}>()

const weekDays  = computed(() => getWeekDays(props.currentDate))
const timeSlots = computed(() => getTimeSlots(START_HOUR, END_HOUR))

function slotCompromissos(day: Date, hour: number): Compromisso[] {
  return props.compromissos.filter(c => {
    const d = parseLocal(c.dataInicio)
    return isSameDay(d, day) && getHourFromLocal(c.dataInicio) === hour
  })
}

function slotDate(day: Date, hour: number): Date {
  const d = new Date(day)
  d.setHours(hour, 0, 0, 0)
  return d
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
        :class="['cal-week__day-header', { 'cal-week__day-header--today': isToday(day) }]"
      >
        <span class="cal-week__day-name">{{ DAYS_SHORT_BR[day.getDay()] }}</span>
        <span :class="['cal-week__day-num', { 'cal-week__day-num--today': isToday(day) }]">
          {{ day.getDate() }}
        </span>
        <span class="cal-week__day-month">{{ formatDayMonthBR(day).split(' ')[1] }}</span>
      </div>
    </div>

    <!-- Grade de horários -->
    <div class="cal-week__body">
      <div
        v-for="slot in timeSlots"
        :key="slot"
        class="cal-week__row"
      >
        <span class="cal-week__time-label">{{ slot }}</span>
        <div
          v-for="day in weekDays"
          :key="day.toISOString()"
          class="cal-week__cell"
          :aria-label="`${formatDayMonthBR(day)} ${slot}`"
          @click="$emit('slotClick', slotDate(day, parseInt(slot)))"
        >
          <CompromissoCard
            v-for="c in slotCompromissos(day, parseInt(slot))"
            :key="c.id"
            :compromisso="c"
            compact
            @click.stop="$emit('compromissoClick', c)"
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

    &--today {
      background-color: var(--color-accent-subtle);
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
  }
}
</style>
