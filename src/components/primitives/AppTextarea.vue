<script setup lang="ts">
const model = defineModel<string>()

withDefaults(defineProps<{
  label?: string
  placeholder?: string
  disabled?: boolean
  rows?: number
  error?: string
  id?: string
}>(), {
  disabled: false,
  rows: 4,
})
</script>

<template>
  <div :class="['app-textarea', { 'app-textarea--error': error, 'app-textarea--disabled': disabled }]">
    <label v-if="label" :for="id" class="app-textarea__label">
      {{ label }}
    </label>
    <textarea
      :id="id"
      v-model="model"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${id}-error` : undefined"
      class="app-textarea__field"
    />
    <span v-if="error" :id="`${id}-error`" class="app-textarea__error" role="alert">
      {{ error }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.app-textarea {
  @include flex(column, flex-start, flex-start, $spacing-1);
  width: 100%;

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--color-text-primary);
  }

  &__field {
    width: 100%;
    padding: $spacing-2 $spacing-3;
    background-color: var(--color-surface-raised);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    border-radius: $radius-md;
    font-size: $font-size-base;
    resize: vertical;
    min-height: 80px;
    transition: border-color $transition-fast, box-shadow $transition-fast;

    &::placeholder { color: var(--color-text-disabled); }

    &:focus {
      outline: none;
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px var(--color-accent-subtle);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  &__error {
    font-size: $font-size-xs;
    color: var(--color-status-cancelled);
  }

  &--error .app-textarea__field {
    border-color: var(--color-status-cancelled);
    &:focus { box-shadow: 0 0 0 3px var(--color-status-bg-cancelled); }
  }
}
</style>
