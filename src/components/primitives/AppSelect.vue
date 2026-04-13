<script setup lang="ts">
export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

const model = defineModel<string | number>()

withDefaults(defineProps<{
  options: SelectOption[]
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  id?: string
}>(), {
  disabled: false,
})
</script>

<template>
  <div :class="['app-select', { 'app-select--error': error, 'app-select--disabled': disabled }]">
    <label v-if="label" :for="id" class="app-select__label">
      {{ label }}
    </label>
    <div class="app-select__wrapper">
      <select
        :id="id"
        v-model="model"
        :disabled="disabled"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : undefined"
        class="app-select__field"
      >
        <option v-if="placeholder" value="" disabled hidden>
          {{ placeholder }}
        </option>
        <option
          v-for="opt in options"
          :key="opt.value"
          :value="opt.value"
          :disabled="opt.disabled"
        >
          {{ opt.label }}
        </option>
      </select>
      <span class="app-select__icon" aria-hidden="true">▾</span>
    </div>
    <span v-if="error" :id="`${id}-error`" class="app-select__error" role="alert">
      {{ error }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.app-select {
  @include flex(column, flex-start, flex-start, $spacing-1);
  width: 100%;

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--color-text-primary);
  }

  &__wrapper {
    position: relative;
    width: 100%;
  }

  &__field {
    width: 100%;
    height: 40px;
    padding: 0 $spacing-8 0 $spacing-3;
    background-color: var(--color-surface-raised);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    border-radius: $radius-md;
    font-size: $font-size-base;
    appearance: none;
    cursor: pointer;
    transition: border-color $transition-fast, box-shadow $transition-fast;

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

  &__icon {
    position: absolute;
    right: $spacing-3;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-secondary);
    pointer-events: none;
    font-size: $font-size-sm;
  }

  &__error {
    font-size: $font-size-xs;
    color: var(--color-status-cancelled);
  }

  &--error .app-select__field {
    border-color: var(--color-status-cancelled);

    &:focus {
      box-shadow: 0 0 0 3px var(--color-status-bg-cancelled);
    }
  }
}
</style>
