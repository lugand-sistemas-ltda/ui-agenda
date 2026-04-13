<script setup lang="ts">
import type { Compromisso, CompromissoTipo } from '../../../types/agenda'
import { TIPO_LABELS, STATUS_LABELS } from '../../../types/agenda'
import AppBadge from '../../primitives/AppBadge.vue'
import { formatTimeBR, formatDateBR, parseLocal } from '../../../utils/dateUtils'

withDefaults(defineProps<{
  compromisso: Compromisso
  compact?: boolean
}>(), {
  compact: false,
})

defineEmits<{ click: [compromisso: Compromisso] }>()

function tipoCssKey(tipo: CompromissoTipo): string {
  return tipo.replace(/_/g, '-')
}
</script>

<template>
  <button
    type="button"
    :class="['compromisso-card', `compromisso-card--${tipoCssKey(compromisso.tipo)}`, { 'compromisso-card--compact': compact }]"
    @click="$emit('click', compromisso)"
  >
    <!-- Compact (usado no mês e semana) -->
    <template v-if="compact">
      <span class="compromisso-card__dot" aria-hidden="true" />
      <span class="compromisso-card__title-compact">{{ compromisso.titulo }}</span>
      <span class="compromisso-card__time-compact">
        {{ formatTimeBR(parseLocal(compromisso.dataInicio)) }}
      </span>
    </template>

    <!-- Full (usado na agenda e dia) -->
    <template v-else>
      <div class="compromisso-card__header">
        <span class="compromisso-card__tipo-label">{{ TIPO_LABELS[compromisso.tipo] }}</span>
        <AppBadge :status="compromisso.status" size="sm">
          {{ STATUS_LABELS[compromisso.status] }}
        </AppBadge>
      </div>
      <p class="compromisso-card__title">{{ compromisso.titulo }}</p>
      <p class="compromisso-card__meta">
        {{ formatDateBR(parseLocal(compromisso.dataInicio)) }}
        {{ formatTimeBR(parseLocal(compromisso.dataInicio)) }} –
        {{ formatTimeBR(parseLocal(compromisso.dataFim)) }}
      </p>
      <p v-if="compromisso.local" class="compromisso-card__meta">
        📍 {{ compromisso.local }}
      </p>
      <p class="compromisso-card__meta">
        {{ compromisso.responsavel.nome }}
        <template v-if="compromisso.outrosResponsaveis.length">
          + {{ compromisso.outrosResponsaveis.length }} responsável(is)
        </template>
      </p>
    </template>
  </button>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.compromisso-card {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: filter $transition-fast;

  &:hover { filter: brightness(0.94); }
  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  // ---- Modo compact ----
  &--compact {
    @include flex(row, center, flex-start, $spacing-1);
    padding: 2px $spacing-1;
    font-size: $font-size-xs;
    overflow: hidden;
    white-space: nowrap;
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: $radius-full;
    flex-shrink: 0;
  }

  &__title-compact {
    @include truncate;
    flex: 1;
    font-weight: $font-weight-medium;
  }

  &__time-compact {
    flex-shrink: 0;
    color: inherit;
    opacity: 0.75;
  }

  // ---- Modo full ----
  &__header {
    @include flex(row, center, space-between, $spacing-2);
    margin-bottom: $spacing-1;
  }

  &__tipo-label {
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__title {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: inherit;
    margin-bottom: $spacing-1;
  }

  &__meta {
    font-size: $font-size-xs;
    opacity: 0.8;
    margin-bottom: 2px;
  }

  // ---- Variantes por tipo (compact: bg + cor; full: border-left + bg suave) ----
  @each $tipo in feriado, ponto-facultativo, oitiva, operacao, livre {
    &--#{$tipo} {
      background-color: var(--color-tipo-#{$tipo}-bg);
      color:            var(--color-tipo-#{$tipo});

      .compromisso-card__dot { background-color: var(--color-tipo-#{$tipo}); }

      &:not(.compromisso-card--compact) {
        border-left: 3px solid var(--color-tipo-#{$tipo});
        padding: $spacing-2 $spacing-3;
      }
    }
  }
}
</style>
