<script setup lang="ts">
import type { Agenda } from '../../../types/agenda'

const props = defineProps<{
  /** Lista de agendas disponíveis para o usuário ativo */
  agendas: readonly Agenda[]
  /** ID da agenda atualmente selecionada */
  selectedId: string | null
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

/** Label legível por tipo de agenda */
function label(a: Agenda): string {
  if (a.tipo === 'pessoal') return 'Minha Agenda'
  return a.nome
}

/** Agendas que permitem apenas visualização (sem criação) */
function isReadonly(a: Agenda): boolean {
  return a.tipo === 'unidade' || a.tipo === 'grupo' || a.tipo === 'sistema'
}
</script>

<template>
  <nav v-if="agendas.length > 0" class="agenda-filter" aria-label="Filtro de agenda">
    <ul class="agenda-filter__list">
      <li
        v-for="a in agendas"
        :key="a.id"
        class="agenda-filter__item"
        :class="{
          'agenda-filter__item--active':   a.id === selectedId,
          'agenda-filter__item--readonly': isReadonly(a),
        }"
      >
        <button
          type="button"
          :aria-pressed="a.id === selectedId"
          :aria-label="label(a) + (isReadonly(a) ? ' (somente leitura)' : '')"
          class="agenda-filter__btn"
          @click="emit('select', a.id)"
        >
          <!-- Ícone cadeado para agendas read-only -->
          <svg
            v-if="isReadonly(a)"
            class="agenda-filter__icon"
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          {{ label(a) }}
        </button>
      </li>
    </ul>
  </nav>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.agenda-filter {
  flex-shrink: 0;
  padding: $spacing-1 $spacing-3;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-surface);

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-1;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: $spacing-1;
    padding: $spacing-1 $spacing-3;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    line-height: 1.4;
    color: var(--color-text-muted);
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: $radius-full;
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s, border-color 0.15s;

    &:hover {
      background-color: var(--color-accent-subtle);
      color: var(--color-text);
    }
  }

  &__item--active &__btn {
    background-color: var(--color-accent);
    color: var(--color-accent-fg);
    border-color: var(--color-accent);
  }

  &__item--readonly &__btn {
    // Estilo levemente diferenciado para indicar somente leitura
    border-style: dashed;
  }

  &__icon {
    flex-shrink: 0;
    opacity: 0.7;
  }
}
</style>
