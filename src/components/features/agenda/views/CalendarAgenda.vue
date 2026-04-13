<script setup lang="ts">
import { computed } from 'vue'
import type { Compromisso } from '../../../../types/agenda'
import {
  MONTHS_SHORT_BR,
  DAYS_FULL_BR,
  parseLocal,
  formatTimeBR,
} from '../../../../utils/dateUtils'
import CompromissoCard from '../CompromissoCard.vue'

const DAYS_AHEAD = 60

const props = defineProps<{
  currentDate: Date
  compromissos: Compromisso[]
}>()

const emit = defineEmits<{
  compromissoClick: [compromisso: Compromisso]
  slotClick:        [date: Date]
}>()

interface DayGroup {
  date: Date
  label: string
  items: Compromisso[]
}

const groups = computed<DayGroup[]>(() => {
  const from = new Date(props.currentDate)
  from.setHours(0, 0, 0, 0)
  const to = new Date(from)
  to.setDate(to.getDate() + DAYS_AHEAD)

  // Filtrar e ordenar
  const filtered = props.compromissos
    .filter(c => {
      const d = parseLocal(c.dataInicio)
      return d >= from && d <= to
    })
    .sort((a, b) => parseLocal(a.dataInicio).getTime() - parseLocal(b.dataInicio).getTime())

  // Agrupar por dia
  const map = new Map<string, DayGroup>()
  for (const c of filtered) {
    const d    = parseLocal(c.dataInicio)
    const key  = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!map.has(key)) {
      const label = `${DAYS_FULL_BR[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT_BR[d.getMonth()]} ${d.getFullYear()}`
      map.set(key, { date: d, label, items: [] })
    }
    map.get(key)!.items.push(c)
  }

  return [...map.values()]
})
</script>

<template>
  <div class="cal-agenda">
    <div v-if="!groups.length" class="cal-agenda__empty">
      Nenhum compromisso nos próximos {{ 60 }} dias.
    </div>

    <section
      v-for="group in groups"
      :key="group.date.toISOString()"
      class="cal-agenda__group"
    >
      <header class="cal-agenda__date-header" @click="$emit('slotClick', group.date)">
        <span class="cal-agenda__date-label">{{ group.label }}</span>
        <span class="cal-agenda__count">{{ group.items.length }} compromisso(s)</span>
      </header>

      <div class="cal-agenda__items">
        <div v-for="c in group.items" :key="c.id" class="cal-agenda__item">
          <span class="cal-agenda__item-time">
            {{ formatTimeBR(parseLocal(c.dataInicio)) }}
          </span>
          <CompromissoCard
            :compromisso="c"
            @click="$emit('compromissoClick', c)"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.cal-agenda {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-4 $spacing-6;
  display: flex;
  flex-direction: column;
  gap: $spacing-6;

  &__empty {
    color: var(--color-text-secondary);
    font-size: $font-size-base;
    text-align: center;
    padding: $spacing-12;
  }

  &__group { display: flex; flex-direction: column; gap: $spacing-2; }

  &__date-header {
    @include flex(row, baseline, space-between, $spacing-3);
    padding: $spacing-2 0;
    border-bottom: 2px solid var(--color-accent);
    cursor: pointer;
  }

  &__date-label {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: var(--color-text-primary);
  }

  &__count {
    font-size: $font-size-xs;
    color: var(--color-text-secondary);
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }

  &__item {
    @include flex(row, flex-start, flex-start, $spacing-3);
  }

  &__item-time {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--color-text-secondary);
    min-width: 44px;
    padding-top: $spacing-2;
  }
}
</style>
