<script setup lang="ts">
import { computed } from 'vue'
import type { Agenda, TipoAgenda } from '../../../types/agenda'

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

const GRUPO_LABELS: Record<TipoAgenda, string> = {
  pessoal:  'Minhas agendas',
  unidade:  'Agendas de unidade',
  grupo:    'Agendas de grupo',
  sistema:  'Sistema',
}

/** Agendas agrupadas por tipo, na ordem de exibição. */
const grupos = computed(() => {
  const ordem: TipoAgenda[] = ['pessoal', 'unidade', 'grupo', 'sistema']
  return ordem
    .map(tipo => ({ tipo, label: GRUPO_LABELS[tipo], itens: props.agendas.filter(a => a.tipo === tipo) }))
    .filter(g => g.itens.length > 0)
})

function handleChange(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  emit('select', id)
}
</script>

<template>
  <div v-if="agendas.length > 0" class="agenda-filter" aria-label="Filtro de agenda">
    <!-- Select nativo — acessível, performático, suporta optgroup -->
    <select
      class="agenda-filter__select"
      :value="selectedId ?? ''"
      aria-label="Selecionar agenda"
      @change="handleChange"
    >
      <optgroup v-for="g in grupos" :key="g.tipo" :label="g.label">
        <option
          v-for="a in g.itens"
          :key="a.id"
          :value="a.id"
        >
          {{ label(a) }}{{ (a.tipo === 'unidade' || a.tipo === 'grupo' || a.tipo === 'sistema') ? ' 🔒' : '' }}
        </option>
      </optgroup>
    </select>
  </div>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.agenda-filter {
  flex-shrink: 0;
  @include flex(row, center, flex-start, $spacing-3);
  padding: $spacing-2 $spacing-4;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-surface);

  // Select nativo estilizado
  &__select {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--color-text);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: $radius-md;
    padding: $spacing-1 $spacing-3;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s;

    &:hover,
    &:focus {
      border-color: var(--color-accent);
    }
  }
}
</style>

