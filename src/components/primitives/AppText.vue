<script setup lang="ts">
type Tag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'small' | 'label'
type Variant = 'primary' | 'secondary' | 'disabled' | 'accent'
type Size = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'
type Weight = 'regular' | 'medium' | 'semibold'

withDefaults(defineProps<{
  tag?: Tag
  variant?: Variant
  size?: Size
  weight?: Weight
  truncate?: boolean
}>(), {
  tag: 'span',
  variant: 'primary',
  size: 'base',
  weight: 'regular',
  truncate: false,
})
</script>

<template>
  <component
    :is="tag"
    :class="[
      'app-text',
      `app-text--${variant}`,
      `app-text--${size}`,
      `app-text--${weight}`,
      { 'app-text--truncate': truncate },
    ]"
  >
    <slot />
  </component>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.app-text {
  // Variantes de cor
  &--primary   { color: var(--color-text-primary); }
  &--secondary { color: var(--color-text-secondary); }
  &--disabled  { color: var(--color-text-disabled); }
  &--accent    { color: var(--color-accent); }

  // Tamanhos
  &--xs   { font-size: $font-size-xs; }
  &--sm   { font-size: $font-size-sm; }
  &--base { font-size: $font-size-base; }
  &--lg   { font-size: $font-size-lg; }
  &--xl   { font-size: $font-size-xl; }
  &--2xl  { font-size: $font-size-2xl; }

  // Pesos
  &--regular  { font-weight: $font-weight-regular; }
  &--medium   { font-weight: $font-weight-medium; }
  &--semibold { font-weight: $font-weight-semibold; }

  // Truncate
  &--truncate {
    @include truncate;
    display: block;
  }
}
</style>
