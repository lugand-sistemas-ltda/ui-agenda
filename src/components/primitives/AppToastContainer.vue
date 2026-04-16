<script setup lang="ts">
import { useToast } from '../../composables/useToast'
import AppToast from './AppToast.vue'

/**
 * AppToastContainer — adicionar uma única vez em App.vue.
 *
 * Não recebe props: conecta-se diretamente ao singleton useToast.
 * Para disparar toasts de qualquer componente:
 *   const { info, success, warning, error } = useToast()
 */

const { toasts, remove } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="app-toast-container" aria-live="off" aria-atomic="false">
      <TransitionGroup name="app-toast" tag="div" class="app-toast-container__list">
        <AppToast
          v-for="toast in toasts"
          :key="toast.id"
          v-bind="toast"
          @dismiss="remove"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.app-toast-container {
  position: fixed;
  bottom:   $spacing-6;
  right:    $spacing-6;
  z-index:  $z-toast;
  pointer-events: none; // permite clicar na app por baixo

  &__list {
    display:        flex;
    flex-direction: column-reverse; // novo toast aparece em baixo
    gap:            $spacing-3;
    align-items:    flex-end;
  }
}

// Cada toast dentro do container pode ser clicado
:deep(.app-toast) {
  pointer-events: auto;
}

// Transição de entrada/saída via TransitionGroup
.app-toast-enter-active {
  transition: transform $transition-base, opacity $transition-base;
}
.app-toast-leave-active {
  transition: transform $transition-fast, opacity $transition-fast;
  position:   absolute; // evita que outros toasts "saltem" durante a saída
}
.app-toast-enter-from {
  opacity:   0;
  transform: translateX(24px);
}
.app-toast-leave-to {
  opacity:   0;
  transform: translateX(24px) scale(0.95);
}
.app-toast-move {
  transition: transform $transition-base;
}
</style>
