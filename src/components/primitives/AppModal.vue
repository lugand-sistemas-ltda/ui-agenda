<!-- Bloco separado: contador de ID no escopo do módulo (compartilhado entre instâncias) -->
<script lang="ts">
let _nextModalId = 0
</script>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  open:      boolean
  size?:     Size
  /** Título auto-renderizado no header. Substitúivel pelo slot #header. */
  title?:    string
  closable?: boolean
}>(), {
  size:     'md',
  closable: true,
})

const emit = defineEmits<{ close: [] }>()

/** ID único para aria-labelledby (acessibilidade) */
const titleId = `app-modal-title-${++_nextModalId}`

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.closable) emit('close')
}

onMounted(()  => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="app-modal">
      <div
        v-if="open"
        class="app-modal__backdrop"
        @click.self="closable && $emit('close')"
      >
        <dialog
          open
          aria-modal="true"
          :aria-labelledby="($slots.header || title) ? titleId : undefined"
          :class="['app-modal', `app-modal--${size}`]"
        >
          <!-- ── Header ──────────────────────────────────────────────── -->
          <!-- Renderizado se: slot #header fornecido OU prop title definida -->
          <header v-if="$slots.header || title" class="app-modal__header">
            <slot name="header">
              <!-- Header padrão: título + botão de fechar -->
              <h2 :id="titleId" class="app-modal__title">{{ title }}</h2>
              <button
                v-if="closable"
                type="button"
                class="app-modal__close"
                aria-label="Fechar"
                @click.stop="$emit('close')"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </slot>
          </header>

          <!-- ── Body ───────────────────────────────────────────────── -->
          <!-- Slot default: conteúdo livre; flex col com gap herdado. -->
          <div class="app-modal__body">
            <slot />
          </div>

          <!-- ── Footer ─────────────────────────────────────────────── -->
          <!-- Só renderizado quando o slot #footer é fornecido pelo consumidor. -->
          <footer v-if="$slots.footer" class="app-modal__footer">
            <slot name="footer" />
          </footer>
        </dialog>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.app-modal {
  background-color: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: $radius-lg;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - $spacing-8 * 2);
  width: 100%;
  overflow: hidden;

  &--sm { max-width: 420px; }
  &--md { max-width: 600px; }
  &--lg { max-width: 800px; }

  &__backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-4;
    z-index: $z-modal;
  }

  // ── Header ────────────────────────────────────────────────────────────
  &__header {
    @include flex(row, center, space-between, $spacing-3);
    padding: $spacing-4 $spacing-6;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: var(--color-text-primary);
    line-height: $line-height-tight;
    margin: 0;
  }

  &__close {
    @include flex(row, center, center);
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--color-text-secondary);
    border-radius: $radius-md;
    transition: color $transition-fast, background-color $transition-fast;

    svg { width: 16px; height: 16px; }

    &:hover {
      color: var(--color-text-primary);
      background-color: var(--color-surface);
    }
    &:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }
  }

  // ── Body ──────────────────────────────────────────────────────────────
  &__body {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-5 $spacing-6;
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
    min-height: 0; // Necessário: flex child não pode overflow o pai
  }

  // ── Footer ────────────────────────────────────────────────────────────
  &__footer {
    @include flex(row, center, space-between, $spacing-3);
    padding: $spacing-4 $spacing-6;
    border-top: 1px solid var(--color-border);
    flex-shrink: 0;
  }
}

// ── Transição de abertura/fechamento ────────────────────────────────────
.app-modal-enter-active,
.app-modal-leave-active {
  transition: opacity $transition-fast;

  .app-modal {
    transition: transform $transition-fast, opacity $transition-fast;
  }
}

.app-modal-enter-from,
.app-modal-leave-to {
  opacity: 0;

  .app-modal {
    transform: scale(0.96) translateY(-8px);
    opacity: 0;
  }
}
</style>
