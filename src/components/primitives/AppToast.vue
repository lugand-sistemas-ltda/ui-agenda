<script setup lang="ts">
import { computed } from 'vue'
import type { ToastVariant } from '../../composables/useToast'

// Heroicons v1 solid (MIT) — paths para viewBox="0 0 20 20"
const ICON_PATHS: Record<ToastVariant, string> = {
  info:    'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z',
  warning: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
  error:   'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z',
  success: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
}

const props = defineProps<{
  id:        number
  variant:   ToastVariant
  /** Mensagem principal. Pode ser substituída pelo slot default. */
  message:   string
  title?:    string
  /** Duração em ms — controla a barra de progresso CSS. 0 = permanente. */
  duration:  number
}>()

defineEmits<{ dismiss: [id: number] }>()

const iconPath = computed(() => ICON_PATHS[props.variant])

/** `role` semântico: erros/avisos interrompem (assertive); info/sucesso são polite */
const ariaRole = computed<'alert' | 'status'>(() =>
  props.variant === 'error' || props.variant === 'warning' ? 'alert' : 'status',
)
</script>

<template>
  <div
    :role="ariaRole"
    :class="['app-toast', `app-toast--${variant}`]"
  >
    <!-- Ícone -->
    <svg
      class="app-toast__icon"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path fill-rule="evenodd" :d="iconPath" clip-rule="evenodd" />
    </svg>

    <!-- Conteúdo -->
    <div class="app-toast__body">
      <p v-if="title" class="app-toast__title">{{ title }}</p>

      <!-- Slot default permite conteúdo rico; cai no message se não fornecido -->
      <div class="app-toast__content">
        <slot>{{ message }}</slot>
      </div>
    </div>

    <!-- Botão de fechar -->
    <button
      type="button"
      class="app-toast__dismiss"
      aria-label="Fechar notificação"
      @click="$emit('dismiss', id)"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <!-- Barra de progresso animada (só quando duration > 0) -->
    <div
      v-if="duration > 0"
      class="app-toast__progress"
      :style="{ '--toast-duration': `${duration}ms` }"
      aria-hidden="true"
    />
  </div>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.app-toast {
  @include flex(row, flex-start, flex-start, $spacing-3);
  position:         relative;
  background-color: var(--color-surface-raised);
  border:           1px solid var(--color-border);
  border-left:      4px solid;  // tarja lateral de cor — sobreescrita por variante
  border-radius:    $radius-md;
  box-shadow:       var(--shadow-md);
  padding:          $spacing-3 $spacing-4;
  width:            320px;
  max-width:        calc(100vw - $spacing-8);
  overflow:         hidden;

  // Variantes — tarja lateral e cor do ícone
  &--info    { border-left-color: var(--color-feedback-info);    color: var(--color-feedback-info);    }
  &--warning { border-left-color: var(--color-feedback-warning); color: var(--color-feedback-warning); }
  &--error   { border-left-color: var(--color-feedback-error);   color: var(--color-feedback-error);   }
  &--success { border-left-color: var(--color-feedback-success); color: var(--color-feedback-success); }

  &__icon {
    flex-shrink: 0;
    width:       18px;
    height:      18px;
    margin-top:  1px;
  }

  &__body {
    @include flex(column, flex-start, flex-start, $spacing-1);
    flex:      1;
    min-width: 0;
  }

  &__title {
    font-size:   $font-size-sm;
    font-weight: $font-weight-semibold;
    line-height: $line-height-tight;
    margin:      0;
    color:       var(--color-text-primary);
  }

  &__content {
    font-size:  $font-size-sm;
    line-height: $line-height-base;
    color:      var(--color-text-secondary);
    word-break: break-word;
  }

  &__dismiss {
    @include flex(row, center, center);
    flex-shrink:      0;
    align-self:       flex-start;
    width:            20px;
    height:           20px;
    padding:          0;
    border:           none;
    background:       transparent;
    cursor:           pointer;
    color:            var(--color-text-secondary);
    border-radius:    $radius-sm;
    margin-left:      auto;
    opacity:          0.6;
    transition:       opacity $transition-fast;

    svg { width: 14px; height: 14px; }

    &:hover { opacity: 1; }
    &:focus-visible {
      outline:        2px solid var(--color-accent);
      outline-offset: 2px;
    }
  }

  // Barra de progresso — animação CSS pura, temporizador em useToast
  &__progress {
    position:   absolute;
    bottom:     0;
    left:       0;
    height:     3px;
    width:      100%;
    background: currentColor;
    opacity:    0.3;
    transform-origin: left;
    animation:  toast-progress var(--toast-duration, 4000ms) linear forwards;
  }
}

@keyframes toast-progress {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}
</style>
