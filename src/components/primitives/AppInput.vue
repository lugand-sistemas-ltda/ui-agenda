<script setup lang="ts">
type InputType = 'text' | 'password' | 'date' | 'time' | 'datetime-local' | 'email' | 'tel' | 'number'

const model = defineModel<string>()

withDefaults(defineProps<{
  type?: InputType
  label?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  error?: string
  id?: string
}>(), {
  type: 'text',
  disabled: false,
  readonly: false,
})

defineOptions({ inheritAttrs: false })
</script>

<template>
  <div :class="['app-input', { 'app-input--error': error, 'app-input--disabled': disabled }]">
    <label v-if="label" :for="id" class="app-input__label">
      {{ label }}
    </label>
    <input
      :id="id"
      v-model="model"
      v-bind="$attrs"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${id}-error` : undefined"
      class="app-input__field"
    />
    <span v-if="error" :id="`${id}-error`" class="app-input__error" role="alert">
      {{ error }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.app-input {
  @include flex(column, flex-start, flex-start, $spacing-1);
  width: 100%;

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--color-text-primary);
  }

  &__field {
    width: 100%;
    height: 40px;
    padding: 0 $spacing-3;
    background-color: var(--color-surface-raised);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    border-radius: $radius-md;
    font-size: $font-size-base;
    transition: border-color $transition-fast, box-shadow $transition-fast;
    appearance: none;

    // Estilo nativo de date/time
    &[type='date'],
    &[type='time'],
    &[type='datetime-local'] {
      cursor: pointer;
    }

    &::placeholder {
      color: var(--color-text-disabled);
    }

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

  // Estado de erro
  &--error .app-input__field {
    border-color: var(--color-status-cancelled);

    &:focus {
      box-shadow: 0 0 0 3px var(--color-status-bg-cancelled);
    }
  }
}
</style>
