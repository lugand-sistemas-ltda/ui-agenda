<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import type { Compromisso } from '../../../../types/agenda'
import {
  MONTHS_SHORT_BR,
  DAYS_FULL_BR,
  parseLocal,
  formatTimeBR,
} from '../../../../utils/dateUtils'
import CompromissoCard from '../CompromissoCard.vue'

const props = defineProps<{
  currentDate: Date
  compromissos: Compromisso[]
  /** Janela de dias a exibir — controlada externamente via loadMore (padrão 60) */
  daysAhead:    number
  /** Indica que novos dados estão sendo buscados — exibe spinner no fundo */
  loadingMore:  boolean
}>()

const emit = defineEmits<{
  compromissoClick: [compromisso: Compromisso]
  slotClick:        [date: Date]
  /** Disparado quando o usuário chegou ao fundo da lista */
  loadMore:         []
}>()

// ---- Sentinela de scroll infinito ----
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function setupObserver() {
  if (observer) observer.disconnect()
  observer = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) emit('loadMore') },
    { rootMargin: '120px' },
  )
  if (sentinel.value) observer.observe(sentinel.value)
}

onMounted(setupObserver)
// Re-observar se o sentinela for recriado no DOM (ex.: troca de view)
watch(sentinel, (el) => { if (el && observer) observer.observe(el) })
onBeforeUnmount(() => observer?.disconnect())

// ---- Grupos de dias ----

interface DayGroup {
  date: Date
  label: string
  fundoDia: Compromisso | undefined
  eventos: Compromisso[]
}

function tipoCssKey(tipo: string): string {
  return tipo.replace(/_/g, '-')
}

function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6
}

const groups = computed<DayGroup[]>(() => {
  const from = new Date(props.currentDate)
  from.setHours(0, 0, 0, 0)
  const to = new Date(from)
  to.setDate(to.getDate() + props.daysAhead)

  const filtered = props.compromissos
    .filter(c => {
      const d = parseLocal(c.dataInicio)
      return d >= from && d <= to
    })
    .sort((a, b) => parseLocal(a.dataInicio).getTime() - parseLocal(b.dataInicio).getTime())

  const map = new Map<string, DayGroup>()
  for (const c of filtered) {
    const d   = parseLocal(c.dataInicio)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!map.has(key)) {
      const label = `${DAYS_FULL_BR[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT_BR[d.getMonth()]} ${d.getFullYear()}`
      map.set(key, { date: d, label, fundoDia: undefined, eventos: [] })
    }
    const group = map.get(key)!
    if (c.renderizacao === 'fundo_dia') {
      if (!group.fundoDia) group.fundoDia = c
    } else {
      group.eventos.push(c)
    }
  }

  return [...map.values()]
})
</script>

<template>
  <div class="cal-agenda">
    <div v-if="!groups.length && !loadingMore" class="cal-agenda__empty">
      Nenhum compromisso nos próximos {{ daysAhead }} dias.
    </div>

    <section
      v-for="group in groups"
      :key="group.date.toISOString()"
      class="cal-agenda__group"
    >
      <!-- ADR-005 IA-005: header colorido quando o dia tem fundo_dia (ou fim de semana) -->
      <header
        :class="[
          'cal-agenda__date-header',
          group.fundoDia ? `cal-agenda__date-header--fundo-${tipoCssKey(group.fundoDia.tipo)}` : '',
          !group.fundoDia && isWeekend(group.date) ? 'cal-agenda__date-header--weekend' : '',
        ]"
        @click="$emit('slotClick', group.date)"
      >
        <span class="cal-agenda__date-label">{{ group.label }}</span>
        <span v-if="group.fundoDia" class="cal-agenda__fundo-badge">
          {{ group.fundoDia.titulo }}
        </span>
        <span class="cal-agenda__count">{{ group.eventos.length }} compromisso(s)</span>
      </header>

      <div class="cal-agenda__items">
        <div v-for="c in group.eventos" :key="c.id" class="cal-agenda__item">
          <span class="cal-agenda__item-time">
            {{ formatTimeBR(parseLocal(c.dataInicio)) }}
          </span>
          <CompromissoCard
            :compromisso="c"
            @click="$emit('compromissoClick', c)"
          />
        </div>
      </div>
    </section>

    <!-- Sentinela para IntersectionObserver + spinner de carregamento -->
    <div ref="sentinel" class="cal-agenda__sentinel" aria-hidden="true">
      <span v-if="loadingMore" class="cal-agenda__load-spinner" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.cal-agenda {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-4 $spacing-6;
  display: flex;
  flex-direction: column;
  gap: $spacing-6;

  &__empty {
    color: var(--color-text-secondary);
    font-size: $font-size-base;
    text-align: center;
    padding: $spacing-12;
  }

  &__group { display: flex; flex-direction: column; gap: $spacing-2; }

  &__date-header {
    @include flex(row, baseline, space-between, $spacing-3);
    padding: $spacing-2 $spacing-3;
    border-bottom: 2px solid var(--color-accent);
    border-radius: $radius-sm $radius-sm 0 0;
    cursor: pointer;

    // ADR-005 IA-005 / ADR-002 PA-011: header colorido para dias com fundo_dia
    &--weekend {
      background-color: var(--color-off-hours-bg);
      border-bottom-color: var(--color-border);

      .cal-agenda__date-label { color: var(--color-text-secondary); }
    }

    @each $tipo in feriado, ponto-facultativo, recesso {
      &--fundo-#{$tipo} {
        background-color: var(--color-tipo-#{$tipo}-bg);
        border-bottom-color: var(--color-tipo-#{$tipo});
      }
    }
  }

  &__fundo-badge {
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: var(--color-text-secondary);
    padding: 2px $spacing-2;
    border-radius: $radius-full;
    background-color: rgba(0, 0, 0, 0.08);
  }

  &__date-label {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: var(--color-text-primary);
  }

  &__count {
    font-size: $font-size-xs;
    color: var(--color-text-secondary);
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }

  &__item {
    @include flex(row, flex-start, flex-start, $spacing-3);
  }

  &__item-time {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--color-text-secondary);
    min-width: 44px;
    padding-top: $spacing-2;
  }

  &__sentinel {
    height: 1px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-4 0;
  }

  &__load-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: $radius-full;
    animation: cal-agenda-spin 0.7s linear infinite;
  }
}

@keyframes cal-agenda-spin {
  to { transform: rotate(360deg); }
}
</style>
