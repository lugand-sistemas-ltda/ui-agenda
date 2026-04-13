<script setup lang="ts">
import CalendarView from './components/features/agenda/views/CalendarView.vue'
</script>

<template>
  <div class="app-layout">
    <CalendarView />
  </div>
</template>

<style lang="scss">
@use 'styles/abstracts' as *;

.app-layout {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  padding: $spacing-4;
  background-color: var(--color-bg);
}
</style>
