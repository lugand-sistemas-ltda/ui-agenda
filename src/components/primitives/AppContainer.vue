<script setup lang="ts">
type Tag = 'div' | 'section' | 'main' | 'aside' | 'header' | 'footer' | 'article'
type Padding = 'none' | 'sm' | 'md' | 'lg'

withDefaults(defineProps<{
  tag?: Tag
  padding?: Padding
  // full: ocupa 100% da largura sem max-width (ex: layouts de tela cheia)
  full?: boolean
}>(), {
  tag: 'div',
  padding: 'md',
  full: false,
})
</script>

<template>
  <component
    :is="tag"
    :class="[
      'app-container',
      `app-container--p-${padding}`,
      { 'app-container--full': full },
    ]"
  >
    <slot />
  </component>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.app-container {
  width: 100%;
  margin-inline: auto;
  max-width: $bp-xl;   // 1280px — limite padrão da agenda

  &--full { max-width: 100%; }

  &--p-none { padding: 0; }
  &--p-sm   { padding: $spacing-4; }
  &--p-md   { padding: $spacing-6; }
  &--p-lg   { padding: $spacing-8; }

  @include respond-to(md) {
    &--p-sm  { padding: $spacing-4 $spacing-6; }
    &--p-md  { padding: $spacing-6 $spacing-8; }
    &--p-lg  { padding: $spacing-8 $spacing-10; }
  }
}
</style>
