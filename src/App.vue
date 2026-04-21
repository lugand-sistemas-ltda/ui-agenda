<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import LoadingView from './views/LoadingView.vue'

const LOADING_DURATION = 3000
const isLoading = ref(true)

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
  }, LOADING_DURATION)
})
</script>

<template>
  <RouterView />
  <Transition name="loading-fade">
    <LoadingView v-if="isLoading" :duration="LOADING_DURATION" />
  </Transition>
</template>

<style>
.loading-fade-leave-active {
  transition: opacity 0.55s ease;
}
.loading-fade-leave-to {
  opacity: 0;
}
</style>

