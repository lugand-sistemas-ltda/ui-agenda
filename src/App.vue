<script setup lang="ts">
import AppHeader from './components/layout/AppHeader.vue'
import CalendarView from './components/features/agenda/views/CalendarView.vue'
import AppToastContainer from './components/primitives/AppToastContainer.vue'
</script>

<template>
  <div class="app-layout">
    <AppHeader />
    <main class="app-layout__main">
      <CalendarView />
    </main>

    <!-- Sistema de toasts — singleton, registrado uma única vez aqui -->
    <AppToastContainer />
  </div>
</template>

<style lang="scss">
@use 'styles/abstracts' as *;

.app-layout {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background-color: var(--color-bg);

  &__main {
    flex: 1;
    min-height: 0;
    padding: $spacing-4;
    overflow: hidden;
  }
}
</style>
