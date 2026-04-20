<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../../composables/useTheme'
import { useSession } from '../../composables/useSession'
import { PAPEL_LABELS } from '../../types/agenda'
import AppContainer from '../primitives/AppContainer.vue'
import AppText from '../primitives/AppText.vue'
import AppButton from '../primitives/AppButton.vue'

const router = useRouter()
const { theme, toggleTheme } = useTheme()
const { usuarioAtivo, papelNaUnidade, logout, init } = useSession()

onMounted(init)

function handleLogout(): void {
  logout()
  router.push('/login')
}
</script>

<template>
  <header class="app-header">
    <AppContainer tag="div" full padding="sm" class="app-header__inner">
      <!-- Logo / nome do app -->
      <AppText tag="h1" size="lg" weight="semibold" variant="accent" class="app-header__logo">
        ui-agenda
      </AppText>

      <!-- Ações do header -->
      <div class="app-header__actions">
        <!-- Sessão: nome do usuário ativo + papel + sair -->
        <div class="app-header__session">
          <span class="app-header__username">{{ usuarioAtivo?.nome }}</span>
          <span v-if="papelNaUnidade" class="app-header__papel">
            {{ PAPEL_LABELS[papelNaUnidade as keyof typeof PAPEL_LABELS] ?? papelNaUnidade }}
          </span>
          <AppButton
            variant="ghost"
            size="sm"
            aria-label="Sair"
            @click="handleLogout"
          >
            Sair
          </AppButton>
        </div>
        <AppButton
          variant="icon"
          size="sm"
          :aria-label="theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'"
          @click="toggleTheme"
        >
          <!-- Ícone sol (tema claro ativo) -->
          <svg
            v-if="theme === 'light'"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1"  x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22"   x2="5.64"  y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1"  y1="12" x2="3"  y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64"  y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>

          <!-- Ícone lua (tema escuro ativo) -->
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </AppButton>
      </div>
    </AppContainer>
  </header>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.app-header {
  position: sticky;
  top: 0;
  z-index: $z-sticky;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(8px);
  // Garante que o fundo não fique transparente ao usar o blur
  background-color: color-mix(in srgb, var(--color-surface) 90%, transparent);

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__logo {
    // Remove margem padrão do h1
    margin: 0;
    letter-spacing: -0.01em;
    user-select: none;
  }

  &__session {
    @include flex(row, center, flex-start, $spacing-2);
  }

  &__username {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--color-text-primary);
  }

  &__papel {
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: var(--color-accent);
    background-color: var(--color-accent-subtle);
    border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
    border-radius: $radius-full;
    padding: 2px $spacing-2;
  }

  &__actions {
    @include flex(row, center, flex-end, $spacing-2);
  }
}
</style>
