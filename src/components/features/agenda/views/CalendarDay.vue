<script setup lang="ts">
import { computed } from 'vue'
import type { Compromisso } from '../../../../types/agenda'
import {
  getTimeSlots,
  isSameDay,
  parseLocal,
  getHourFromLocal,
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

const timeSlots = computed(() => getTimeSlots(START_HOUR, END_HOUR))

const dayCompromissos = computed(() =>
  props.compromissos.filter(c => isSameDay(parseLocal(c.dataInicio), props.currentDate)),
)

function slotCompromissos(hour: number): Compromisso[] {
  return dayCompromissos.value.filter(c => getHourFromLocal(c.dataInicio) === hour)
}

function slotDate(hour: number): Date {
  const d = new Date(props.currentDate)
  d.setHours(hour, 0, 0, 0)
  return d
}
</script>

<template>
  <div class="cal-day">
    <!-- Aviso de compromissos fora do intervalo exibido -->
    <div v-if="dayCompromissos.filter(c => getHourFromLocal(c.dataInicio) < START_HOUR || getHourFromLocal(c.dataInicio) > END_HOUR).length" class="cal-day__overflow-notice">
      {{
        dayCompromissos.filter(c => getHourFromLocal(c.dataInicio) < START_HOUR || getHourFromLocal(c.dataInicio) > END_HOUR).length
      }} compromisso(s) fora do intervalo 07:00–22:00
    </div>

    <!-- Grade horária -->
    <div class="cal-day__body">
      <div
        v-for="slot in timeSlots"
        :key="slot"
        class="cal-day__row"
        :aria-label="`${slot}`"
        @click="$emit('slotClick', slotDate(parseInt(slot)))"
      >
        <span class="cal-day__time-label">{{ slot }}</span>
        <div class="cal-day__events">
          <CompromissoCard
            v-for="c in slotCompromissos(parseInt(slot))"
            :key="c.id"
            :compromisso="c"
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

.cal-day {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

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
