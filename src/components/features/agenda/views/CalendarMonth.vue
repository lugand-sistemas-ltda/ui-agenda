<script setup lang="ts">
import { computed } from 'vue'
import type { Compromisso } from '../../../../types/agenda'
import { DAYS_SHORT_BR, generateMonthGrid, isSameDay, isToday, isCurrentMonth, parseLocal } from '../../../../utils/dateUtils'
import CompromissoCard from '../CompromissoCard.vue'

const MAX_VISIBLE = 3

const props = defineProps<{
  currentDate: Date
  compromissos: Compromisso[]
}>()

const emit = defineEmits<{
  slotClick:        [date: Date]
  compromissoClick: [compromisso: Compromisso]
}>()

const grid = computed(() =>
  generateMonthGrid(props.currentDate.getFullYear(), props.currentDate.getMonth()),
)

function dayCompromissos(date: Date): Compromisso[] {
  return props.compromissos.filter(c => isSameDay(parseLocal(c.dataInicio), date))
}
</script>

<template>
  <div class="cal-month">
    <!-- Cabeçalho dos dias da semana -->
    <div class="cal-month__weekdays" aria-hidden="true">
      <span v-for="d in DAYS_SHORT_BR" :key="d" class="cal-month__weekday">{{ d }}</span>
    </div>

    <!-- Grade de dias -->
    <div class="cal-month__grid" aria-label="Grade mensal">
      <div
        v-for="(day, idx) in grid"
        :key="idx"
        :class="[
          'cal-month__cell',
          { 'cal-month__cell--other-month': !isCurrentMonth(day, currentDate) },
          { 'cal-month__cell--today':       isToday(day) },
        ]"
        :aria-label="`${day.getDate()}/${day.getMonth() + 1}/${day.getFullYear()}`"
        @click="$emit('slotClick', day)"
      >
        <span class="cal-month__day-number">{{ day.getDate() }}</span>

        <div class="cal-month__events">
          <CompromissoCard
            v-for="c in dayCompromissos(day).slice(0, MAX_VISIBLE)"
            :key="c.id"
            :compromisso="c"
            compact
            @click="$emit('compromissoClick', c)"
          />
          <span
            v-if="dayCompromissos(day).length > MAX_VISIBLE"
            class="cal-month__overflow"
          >
            +{{ dayCompromissos(day).length - MAX_VISIBLE }} mais
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.cal-month {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    border-bottom: 1px solid var(--color-border);
  }

  &__weekday {
    padding: $spacing-2;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: var(--color-text-secondary);
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(6, 1fr);
    flex: 1;
    overflow: hidden;
  }

  &__cell {
    border-right: 1px solid var(--color-border-subtle);
    border-bottom: 1px solid var(--color-border-subtle);
    padding: $spacing-1;
    min-height: 100px;
    cursor: pointer;
    transition: background-color $transition-fast;
    overflow: hidden;

    &:nth-child(7n) { border-right: none; }

    &:hover { background-color: var(--color-surface); }

    &--other-month .cal-month__day-number {
      color: var(--color-text-disabled);
    }

    &--today .cal-month__day-number {
      background-color: var(--color-accent);
      color: var(--color-accent-text);
      border-radius: $radius-full;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__day-number {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--color-text-primary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin-bottom: $spacing-1;
  }

  &__events {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__overflow {
    font-size: $font-size-xs;
    color: var(--color-text-secondary);
    padding: 0 $spacing-1;
  }
}
</style>
