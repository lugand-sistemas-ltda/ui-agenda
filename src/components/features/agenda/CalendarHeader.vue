<script setup lang="ts">
import type { CalendarViewType } from '../../../types/agenda'
import { VIEW_LABELS } from '../../../types/agenda'
import { DAYS_FULL_BR, MONTHS_BR, MONTHS_SHORT_BR, getWeekDays, formatDayMonthBR } from '../../../utils/dateUtils'
import AppButton from '../../primitives/AppButton.vue'

const props = defineProps<{
  currentDate: Date
  currentView: CalendarViewType
}>()

const emit = defineEmits<{
  prev:        []
  next:        []
  today:       []
  changeView:  [view: CalendarViewType]
  newCompromisso: []
}>()

const views: CalendarViewType[] = ['ano','mes', 'semana', 'dia', 'agenda']

function periodLabel(): string {
  const d = props.currentDate
  switch (props.currentView) {
    case 'mes':
      return `${MONTHS_BR[d.getMonth()]} ${d.getFullYear()}`
    case 'semana': {
      const days = getWeekDays(d)
      const first = days[0]
      const last  = days[6]
      if (first.getMonth() === last.getMonth()) {
        return `${first.getDate()} – ${last.getDate()} ${MONTHS_SHORT_BR[first.getMonth()]} ${first.getFullYear()}`
      }
      return `${formatDayMonthBR(first)} – ${formatDayMonthBR(last)} ${last.getFullYear()}`
    }
    case 'dia':
      return `${DAYS_FULL_BR[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT_BR[d.getMonth()]} ${d.getFullYear()}`
    case 'agenda':
      return `A partir de ${d.getDate()} ${MONTHS_SHORT_BR[d.getMonth()]} ${d.getFullYear()}`
    case 'ano':
      return String(d.getFullYear())
  }
}
</script>

<template>
  <header class="cal-header">
    <!-- Navegação e título -->
    <div class="cal-header__nav">
      <AppButton variant="ghost" size="sm" aria-label="Anterior" @click="$emit('prev')">‹</AppButton>
      <AppButton variant="ghost" size="sm" aria-label="Próximo"  @click="$emit('next')">›</AppButton>
      <AppButton variant="ghost" size="sm" @click="$emit('today')">Hoje</AppButton>
      <h1 class="cal-header__period">{{ periodLabel() }}</h1>
    </div>

    <!-- Seletor de view + novo compromisso -->
    <div class="cal-header__actions">
      <nav class="cal-header__views" aria-label="Visualização do calendário">
        <button
          v-for="v in views"
          :key="v"
          type="button"
          :class="['cal-header__view-btn', { 'cal-header__view-btn--active': currentView === v }]"
          :aria-current="currentView === v ? 'true' : undefined"
          @click="$emit('changeView', v)"
        >
          {{ VIEW_LABELS[v] }}
        </button>
      </nav>
      <AppButton variant="primary" size="sm" @click="$emit('newCompromisso')">
        + Novo compromisso
      </AppButton>
    </div>
  </header>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.cal-header {
  @include flex(row, center, space-between, $spacing-4);
  flex-wrap: wrap;
  padding: $spacing-4 $spacing-6;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-surface-raised);

  &__nav {
    @include flex(row, center, flex-start, $spacing-2);
  }

  &__period {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: var(--color-text-primary);
  }

  &__actions {
    @include flex(row, center, flex-end, $spacing-3);
    flex-wrap: wrap;
  }

  &__views {
    @include flex(row, center, flex-start, 0);
    border: 1px solid var(--color-border);
    border-radius: $radius-md;
    overflow: hidden;
  }

  &__view-btn {
    padding: $spacing-1 $spacing-3;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--color-text-secondary);
    background: transparent;
    border: none;
    border-right: 1px solid var(--color-border);
    cursor: pointer;
    transition: background-color $transition-fast, color $transition-fast;

    &:last-child { border-right: none; }

    &:hover { background-color: var(--color-surface); }

    &--active {
      background-color: var(--color-accent);
      color: var(--color-accent-text);

      &:hover { background-color: var(--color-accent-hover); }
    }
  }
}
</style>
