<script setup lang="ts">
import type { CompromissoStatus } from '../../types/agenda'
type Size = 'sm' | 'md'

withDefaults(defineProps<{
  status: CompromissoStatus
  size?: Size
}>(), {
  size: 'md',
})

const labelMap: Record<CompromissoStatus, string> = {
  confirmado: 'Confirmado',
  pendente:   'Pendente',
  cancelado:  'Cancelado',
}
</script>

<template>
  <output
    :class="['app-badge', `app-badge--${status}`, `app-badge--${size}`]"
  >
    <span class="app-badge__dot" aria-hidden="true" />
    <slot>{{ labelMap[status] }}</slot>
  </output>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.app-badge {
  @include flex(row, center, flex-start, $spacing-1);
  display: inline-flex;
  border-radius: $radius-full;
  font-weight: $font-weight-medium;
  width: fit-content;

  &--sm { font-size: $font-size-xs; padding: $spacing-1 $spacing-2; }
  &--md { font-size: $font-size-sm; padding: $spacing-1 $spacing-3; }

  &--confirmado {
    color: var(--color-status-confirmed);
    background-color: var(--color-status-bg-confirmed);

    .app-badge__dot { background-color: var(--color-status-confirmed); }
  }

  &--pendente {
    color: var(--color-status-pending);
    background-color: var(--color-status-bg-pending);

    .app-badge__dot { background-color: var(--color-status-pending); }
  }

  &--cancelado {
    color: var(--color-status-cancelled);
    background-color: var(--color-status-bg-cancelled);

    .app-badge__dot { background-color: var(--color-status-cancelled); }
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: $radius-full;
    flex-shrink: 0;
  }
}
</style>
