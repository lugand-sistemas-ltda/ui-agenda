<script setup lang="ts">
type Variant = 'primary' | 'ghost' | 'danger' | 'icon'
type Size = 'sm' | 'md' | 'lg'

withDefaults(defineProps<{
  variant?: Variant
  size?: Size
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  ariaLabel?: string
}>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button',
})

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-label="ariaLabel"
    :aria-busy="loading"
    :class="[
      'app-btn',
      `app-btn--${variant}`,
      `app-btn--${size}`,
      { 'app-btn--loading': loading },
    ]"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="app-btn__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.app-btn {
  @include flex(row, center, center, $spacing-2);
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  font-weight: $font-weight-medium;
  white-space: nowrap;
  transition: background-color $transition-fast, color $transition-fast,
              box-shadow $transition-fast, opacity $transition-fast;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  // Tamanhos
  &--sm  { height: 32px; padding: 0 $spacing-3; font-size: $font-size-sm; }
  &--md  { height: 40px; padding: 0 $spacing-4; font-size: $font-size-base; }
  &--lg  { height: 48px; padding: 0 $spacing-6; font-size: $font-size-lg; }

  // Variantes
  &--primary {
    background-color: var(--color-accent);
    color: var(--color-accent-text);

    &:hover:not(:disabled) { background-color: var(--color-accent-hover); }
  }

  &--ghost {
    background-color: transparent;
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);

    &:hover:not(:disabled) { background-color: var(--color-surface); }
  }

  &--danger {
    background-color: var(--color-status-cancelled);
    color: #fff;

    &:hover:not(:disabled) { opacity: 0.85; }
  }

  &--icon {
    background-color: transparent;
    color: var(--color-text-secondary);
    padding: 0;
    width: 40px;
    border-radius: $radius-md;

    &:hover:not(:disabled) { background-color: var(--color-surface); }
  }

  // Spinner
  &__spinner {
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: $radius-full;
    animation: spin 600ms linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
