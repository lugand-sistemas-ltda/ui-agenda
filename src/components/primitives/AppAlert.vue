<script setup lang="ts">
import { computed } from 'vue'

export type AlertVariant = 'info' | 'warning' | 'error' | 'success'

// Heroicons v1 solid (MIT) — paths para viewBox="0 0 20 20"
const ICON_PATHS: Record<AlertVariant, string> = {
  info:    'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z',
  warning: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
  error:   'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z',
  success: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
}

const props = withDefaults(defineProps<{
  variant?:     AlertVariant
  title?:       string
  dismissible?: boolean
}>(), {
  variant:     'info',
  dismissible: false,
})

defineEmits<{ dismiss: [] }>()

const iconPath = computed(() => ICON_PATHS[props.variant])
</script>

<template>
  <div
    role="alert"
    :class="['app-alert', `app-alert--${variant}`]"
  >
    <!-- Ícone -->
    <svg
      class="app-alert__icon"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path fill-rule="evenodd" :d="iconPath" clip-rule="evenodd" />
    </svg>

    <!-- Conteúdo -->
    <div class="app-alert__body">
      <p v-if="title" class="app-alert__title">{{ title }}</p>

      <!-- Slot default: conteúdo livre (texto, links, listas, etc.) -->
      <div class="app-alert__content">
        <slot />
      </div>
    </div>

    <!-- Botão de fechar (opcional) -->
    <button
      v-if="dismissible"
      type="button"
      class="app-alert__dismiss"
      aria-label="Fechar alerta"
      @click="$emit('dismiss')"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  </div>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.app-alert {
  @include flex(row, flex-start, flex-start, $spacing-3);
  border-radius: $radius-md;
  border: 1px solid;
  padding: $spacing-3 $spacing-4;
  position: relative;

  // Variantes — cada uma lê as CSS vars de feedback do tema ativo
  &--info {
    color:            var(--color-feedback-info);
    background-color: var(--color-feedback-info-bg);
    border-color:     var(--color-feedback-info-border);
  }

  &--warning {
    color:            var(--color-feedback-warning);
    background-color: var(--color-feedback-warning-bg);
    border-color:     var(--color-feedback-warning-border);
  }

  &--error {
    color:            var(--color-feedback-error);
    background-color: var(--color-feedback-error-bg);
    border-color:     var(--color-feedback-error-border);
  }

  &--success {
    color:            var(--color-feedback-success);
    background-color: var(--color-feedback-success-bg);
    border-color:     var(--color-feedback-success-border);
  }

  // Ícone
  &__icon {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    margin-top: 1px; // alinhamento óptico com a primeira linha de texto
  }

  // Área de texto
  &__body {
    @include flex(column, flex-start, flex-start, $spacing-1);
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    line-height: $line-height-tight;
    margin: 0;
  }

  &__content {
    font-size: $font-size-sm;
    line-height: $line-height-base;
    color: var(--color-text-primary); // conteúdo legível, não colorido
  }

  // Botão de fechar
  &__dismiss {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    color: currentColor;
    opacity: 0.6;
    border-radius: $radius-sm;
    align-self: flex-start;
    margin-left: auto;
    transition: opacity $transition-fast;

    svg { width: 14px; height: 14px; }

    &:hover { opacity: 1; }
    &:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }
  }
}
</style>
