<script setup lang="ts">
import { computed } from 'vue'
import type { Compromisso, CompromissoTipo, ItemRenderizacao } from '../../../../types/agenda'
import {
  MONTHS_BR,
  generateMonthGrid,
  isCurrentMonth,
  isToday,
  parseLocal,
} from '../../../../utils/dateUtils'

const props = defineProps<{
  currentDate: Date
  compromissos: Compromisso[]
}>()

const emit = defineEmits<{
  dayClick: [date: Date]
}>()

const year = computed(() => props.currentDate.getFullYear())

// 12 meses — cada um com sua grade de dias
const months = computed(() =>
  Array.from({ length: 12 }, (_, m) => ({
    label: MONTHS_BR[m],
    month: m,
    grid: generateMonthGrid(year.value, m),
  })),
)

// Mapa rápido: "YYYY-MM-DD" → { renderizacao, tipo } do primeiro item marcador do dia
interface DayMark { renderizacao: ItemRenderizacao; tipo: CompromissoTipo }
const dayMarkMap = computed(() => {
  const map = new Map<string, DayMark>()
  for (const c of props.compromissos) {
    const d   = parseLocal(c.dataInicio)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    if (!map.has(key)) map.set(key, { renderizacao: c.renderizacao, tipo: c.tipo })
  }
  return map
})

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth()).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function tipoCssKey(tipo: CompromissoTipo): string {
  return tipo.replace(/_/g, '-')
}
</script>

<template>
  <div class="cal-year">
    <div class="cal-year__grid">
      <section
        v-for="{ label, month, grid } in months"
        :key="month"
        class="cal-year__month"
      >
        <h3 class="cal-year__month-label">{{ label }}</h3>

        <!-- Cabeçalho Seg–Dom (abreviado 1 letra) -->
        <div class="cal-year__weekdays">
          <span v-for="d in ['D','S','T','Q','Q','S','S']" :key="d + Math.random()" class="cal-year__wd">{{ d }}</span>
        </div>

        <!-- Grade de 42 células -->
        <div class="cal-year__days">
          <button
            v-for="(day, idx) in grid"
            :key="idx"
            type="button"
            :class="[
              'cal-year__day',
              { 'cal-year__day--other-month': !isCurrentMonth(day, new Date(currentDate.getFullYear(), month)) },
              { 'cal-year__day--today': isToday(day) },
              // ADR-005 IA-005: fundo_dia colore o fundo do dia como quadrado
              dayMarkMap.get(dayKey(day))?.renderizacao === 'fundo_dia'
                ? `cal-year__day--fundo-${tipoCssKey(dayMarkMap.get(dayKey(day))!.tipo)}`
                : '',
            ]"
            :aria-label="`${day.getDate()}/${day.getMonth()+1}/${day.getFullYear()}`"
            @click="$emit('dayClick', day)"
          >
            <span class="cal-year__day-num">{{ day.getDate() }}</span>
            <!-- evento: ponto pequeno; fundo_dia: tratado via classe CSS no botão -->
            <span
              v-if="dayMarkMap.get(dayKey(day))?.renderizacao === 'evento'"
              :class="['cal-year__dot', `cal-year__dot--${tipoCssKey(dayMarkMap.get(dayKey(day))!.tipo)}`]"
            />
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.cal-year {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-4 $spacing-6;

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $spacing-6;

    @media (max-width: $bp-lg) { grid-template-columns: repeat(3, 1fr); }
    @media (max-width: $bp-md) { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: $bp-sm) { grid-template-columns: 1fr; }
  }

  &__month {
    background-color: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: $radius-md;
    padding: $spacing-3;
  }

  &__month-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--color-text-primary);
    text-align: center;
    margin-bottom: $spacing-2;
  }

  &__weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: $spacing-1;
  }

  &__wd {
    font-size: 9px;
    font-weight: $font-weight-semibold;
    color: var(--color-text-disabled);
    text-align: center;
    text-transform: uppercase;
  }

  &__days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
  }

  &__day {
    @include flex(column, center, center, 1px);
    background: transparent;
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;
    padding: 2px 0;
    transition: background-color $transition-fast;

    &:hover { background-color: var(--color-surface); }

    &:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 1px;
    }

    &--other-month .cal-year__day-num {
      color: var(--color-text-disabled);
    }

    &--today .cal-year__day-num {
      background-color: var(--color-accent);
      color: var(--color-accent-text);
      border-radius: $radius-full;
    }

    // ADR-005 IA-005: fundo_dia colore o fundo do dia como quadrado colorido
    @each $tipo in feriado, ponto-facultativo, recesso {
      &--fundo-#{$tipo} {
        background-color: var(--color-tipo-#{$tipo}-bg);
        border-radius: $radius-sm;

        .cal-year__day-num { color: var(--color-tipo-#{$tipo}); font-weight: $font-weight-semibold; }
      }
    }
  }

  &__day-num {
    font-size: 10px;
    font-weight: $font-weight-medium;
    color: var(--color-text-primary);
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__dot {
    width: 4px;
    height: 4px;
    border-radius: $radius-full;
    flex-shrink: 0;

    // Cor por tipo de compromisso
    @each $tipo in feriado, ponto-facultativo, recesso, oitiva, operacao, reuniao, periodo, livre {
      &--#{$tipo} { background-color: var(--color-tipo-#{$tipo}); }
    }
  }
}
</style>
