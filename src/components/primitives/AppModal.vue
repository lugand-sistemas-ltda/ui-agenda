<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  open: boolean
  size?: Size
  closable?: boolean
}>(), {
  size: 'md',
  closable: true,
})

const emit = defineEmits<{ close: [] }>()

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.closable) emit('close')
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
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
          :class="['app-modal', `app-modal--${size}`]"
        >
          <slot />
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
}

// Transição
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
