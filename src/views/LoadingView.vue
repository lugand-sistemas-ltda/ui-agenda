<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  duration: number
}>()

const dotCount = ref(1)
let dotInterval: ReturnType<typeof setInterval>

onMounted(() => {
  dotInterval = setInterval(() => {
    dotCount.value = dotCount.value >= 3 ? 1 : dotCount.value + 1
  }, 500)
})

onBeforeUnmount(() => {
  clearInterval(dotInterval)
})

const dots = computed(() => '.'.repeat(dotCount.value))
</script>

<template>
  <div
    class="loading-view"
    role="status"
    aria-live="polite"
    aria-label="Carregando aplicação"
    :style="{ '--loading-duration': `${props.duration}ms` }"
  >
    <!-- Giroflex superior -->
    <div class="loading-view__giroflex" aria-hidden="true">
      <div class="loading-view__glow loading-view__glow--red"></div>
      <div class="loading-view__glow loading-view__glow--blue"></div>
      <div class="loading-view__glow loading-view__glow--flash"></div>
    </div>

    <!-- Conteúdo central -->
    <div class="loading-view__content">
      <img
        src="/logo_pcpr.png"
        alt="Polícia Civil do Paraná"
        class="loading-view__logo"
        draggable="false"
      />
      <p class="loading-view__tagline">Cuidando de vidas, fortalecendo a comunidade.</p>
      <div class="loading-view__loading-row">
        <div class="loading-view__spinner"></div>
        <p class="loading-view__label">
          Carregando<span class="loading-view__dots" aria-hidden="true">{{ dots }}</span>
        </p>
      </div>
    </div>

    <!-- Barra de progresso inferior -->
    <div class="loading-view__progress-wrap" aria-hidden="true">
      <div class="loading-view__progress-bar"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

// ── Paleta interna ──────────────────────────────────────────────────────────
$g-red:       #dc2626;
$g-blue:      #2563eb;
$g-red-soft:  rgba(220, 38, 38, 0.6);
$g-blue-soft: rgba(37, 99, 235, 0.6);

// ── Timing compartilhado ────────────────────────────────────────────────────
$cycle:        2.0s;
$cycle-half:   1.0s;
$spin-speed:   0.9s;

// ═══════════════════════════════════════════════════════════════════════════
// ANIMAÇÕES
// ═══════════════════════════════════════════════════════════════════════════

// Giroflex: vermelho entra primeiro, depois azul, flashes brancos nas transições
// O vermelho fica ativo de 0% a ~42%, depois apaga.
// O azul fica ativo de ~50% a ~90%, depois apaga.
// O branco pisca brevemente nas duas trocas (~43-47% e ~91-95%).

@keyframes glow-red {
  0%    { opacity: 0.72; }
  6%    { opacity: 0.46; }   // dip 1
  11%   { opacity: 0.70; }
  17%   { opacity: 0.38; }   // dip 2 — mais fundo
  22%   { opacity: 0.66; }
  29%   { opacity: 0.50; }   // dip 3
  34%   { opacity: 0.72; }
  40%   { opacity: 0.55; }   // dip leve antes de apagar
  45%   { opacity: 0;    }
  94%   { opacity: 0;    }
  100%  { opacity: 0.72; }
}

@keyframes glow-blue {
  0%    { opacity: 0;    }
  48%   { opacity: 0;    }
  53%   { opacity: 0.68; }
  59%   { opacity: 0.44; }   // dip 1
  64%   { opacity: 0.70; }
  71%   { opacity: 0.40; }   // dip 2 — mais fundo
  76%   { opacity: 0.66; }
  83%   { opacity: 0.52; }   // dip 3
  88%   { opacity: 0.72; }
  93%   { opacity: 0;    }
  100%  { opacity: 0;    }
}

@keyframes glow-flash {
  0%   { opacity: 0; }
  41%  { opacity: 0; }
  44%  { opacity: 0.55; } // flash vermelho → azul
  47%  { opacity: 0; }
  89%  { opacity: 0; }
  92%  { opacity: 0.45; } // flash azul → vermelho
  95%  { opacity: 0; }
  100% { opacity: 0; }
}

// Spinner: rotação contínua
@keyframes spin {
  to { transform: rotate(360deg); }
}

// Spinner: troca de cor sincronizada com o giroflex
@keyframes spinner-glow {
  0%, 100% {
    border-top-color:   rgba($g-red,  0.95);
    border-right-color: rgba($g-red,  0.20);
    filter: drop-shadow(0 0 6px rgba($g-red, 0.50));
  }
  50% {
    border-top-color:   rgba($g-blue, 0.95);
    border-right-color: rgba($g-blue, 0.20);
    filter: drop-shadow(0 0 6px rgba($g-blue, 0.50));
  }
}

// Barra de progresso: preenchimento linear no tempo de loading
@keyframes progress-fill {
  from { width: 0%; }
  to   { width: 100%; }
}

// Barra de progresso: cor + brilho sincronizados com o giroflex
@keyframes progress-glow {
  0%, 100% {
    background: linear-gradient(90deg, #7f1d1d, $g-red, #f87171);
    box-shadow:
      0 0  8px $g-red-soft,
      0 0 20px rgba(220, 38, 38, 0.22),
      0 -6px 24px rgba(220, 38, 38, 0.15);
  }
  50% {
    background: linear-gradient(90deg, #1e3a8a, $g-blue, #60a5fa);
    box-shadow:
      0 0  8px $g-blue-soft,
      0 0 20px rgba(37, 99, 235, 0.22),
      0 -6px 24px rgba(37, 99, 235, 0.15);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════════════════════════

.loading-view {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #070711;
  overflow: hidden;

  // ── Giroflex ────────────────────────────────────────────────────────────
  &__giroflex {
    position:       absolute;
    top:            0;
    left:           0;
    right:          0;
    height:         280px;
    pointer-events: none;
  }

  // Cada camada: largura total, ancorada no topo, degradê de cima para baixo.
  // O gradiente radial cria o arco de luz que enfraquece conforme desce.
  &__glow {
    position: absolute;
    top:   0;
    left:  0;
    right: 0;
    height: 280px;

    &--red {
      background: linear-gradient(
        to bottom,
        rgba($g-red, 0.72) 0px,
        rgba($g-red, 0.36) 6px,
        rgba($g-red, 0.10) 28px,
        rgba($g-red, 0.02) 70px,
        transparent 120px
      );
      opacity:   0.72;
      animation: glow-red $cycle ease-in-out infinite;
    }

    &--blue {
      background: linear-gradient(
        to bottom,
        rgba($g-blue, 0.72) 0px,
        rgba($g-blue, 0.36) 6px,
        rgba($g-blue, 0.10) 28px,
        rgba($g-blue, 0.02) 70px,
        transparent 120px
      );
      opacity:   0;
      animation: glow-blue $cycle ease-in-out infinite;
    }

    // Flash branco: ainda mais curto, apenas na borda
    &--flash {
      background: linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.55) 0px,
        rgba(255, 255, 255, 0.18) 5px,
        rgba(255, 255, 255, 0.04) 20px,
        transparent 45px
      );
      opacity:   0;
      animation: glow-flash $cycle linear infinite;
    }
  }

  // ── Conteúdo central ────────────────────────────────────────────────────
  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-6;
  }

  &__logo {
    width:       288px;
    height:      auto;
    object-fit:  contain;
    user-select: none;
    filter: drop-shadow(0 2px 12px rgba(255, 255, 255, 0.12));
  }

  &__tagline {
    font-family:    $font-family-base;
    font-size:      2.25rem;
    font-weight:    $font-weight-regular;
    color:          rgba(255, 255, 255, 0.30);
    letter-spacing: 0.04em;
    text-align:     center;
    line-height:    $line-height-base;
    white-space:    nowrap;
    margin:         0;
    margin-top:     calc(-1 * $spacing-3);
  }

  &__loading-row {
    display:     flex;
    flex-direction: row;
    align-items: center;
    gap:         $spacing-3;
  }

  &__spinner {
    flex-shrink:   0;
    width:         16px;
    height:        16px;
    border-radius: 50%;
    border:        1.5px solid rgba(255, 255, 255, 0.06);
    border-top-color:   rgba($g-red, 0.95);
    border-right-color: rgba($g-red, 0.20);
    animation:
      spin         $spin-speed linear      infinite,
      spinner-glow $cycle      ease-in-out infinite;
  }

  &__label {
    font-family:    $font-family-base;
    font-size:      $font-size-sm;
    font-weight:    $font-weight-medium;
    color:          rgba(255, 255, 255, 0.38);
    letter-spacing: 0.10em;
    text-transform: uppercase;
    line-height:    1;
    user-select:    none;
    margin:         0;
  }

  &__dots {
    display:     inline-block;
    min-width:   1.6ch;
    color:       rgba(255, 255, 255, 0.58);
  }

  // ── Progresso inferior ──────────────────────────────────────────────────
  &__progress-wrap {
    position:   absolute;
    bottom:     0;
    left:       0;
    right:      0;
    height:     2px;
    background: rgba(255, 255, 255, 0.05);
  }

  &__progress-bar {
    height:        100%;
    width:         0%;
    border-radius: $radius-full;
    animation:
      progress-fill var(--loading-duration, 3s) cubic-bezier(0.22, 1, 0.36, 1) forwards,
      progress-glow $cycle ease-in-out infinite;
  }
}
</style>
