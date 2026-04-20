<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSession } from '../composables/useSession'
import { useTheme } from '../composables/useTheme'
import AppButton from '../components/primitives/AppButton.vue'

const router = useRouter()
const { theme, toggleTheme } = useTheme()
const { usuarios, usuarioAtivoId, loadingSession, errorSession, isAuthenticated, init, selecionarUsuario } = useSession()

const selectedId = ref<string>(usuarioAtivoId.value ?? '')

onMounted(init)

async function handleLogin(): Promise<void> {
  if (!selectedId.value) return
  await selecionarUsuario(selectedId.value)
  router.push('/')
}
</script>

<template>
  <div class="login-view">
    <div class="login-view__card">
      <!-- Cabeçalho da card -->
      <header class="login-view__header">
        <h1 class="login-view__title">ui-agenda</h1>
        <p class="login-view__subtitle">SRI — Módulo de Agendamento</p>
      </header>

      <!-- Erro de carregamento -->
      <p v-if="errorSession" class="login-view__error" role="alert">
        {{ errorSession }}
      </p>

      <!-- Formulário de seleção -->
      <form class="login-view__form" @submit.prevent="handleLogin">
        <label class="login-view__label" for="login-user-select">
          Entrar como
        </label>

        <select
          id="login-user-select"
          v-model="selectedId"
          class="login-view__select"
          :disabled="loadingSession"
        >
          <option value="" disabled>— Selecionar usuário —</option>
          <option v-for="u in usuarios" :key="u.id" :value="u.id">
            {{ u.nome }}
          </option>
        </select>

        <AppButton
          type="submit"
          variant="primary"
          size="md"
          :disabled="!selectedId || loadingSession"
          class="login-view__btn"
        >
          {{ loadingSession ? 'Carregando…' : 'Entrar' }}
        </AppButton>
      </form>

      <!-- Rodapé: toggle de tema -->
      <footer class="login-view__footer">
        <AppButton
          variant="ghost"
          size="sm"
          :aria-label="theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'"
          @click="toggleTheme"
        >
          {{ theme === 'light' ? '🌙 Tema escuro' : '☀️ Tema claro' }}
        </AppButton>
      </footer>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.login-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  background-color: var(--color-bg);

  &__card {
    display: flex;
    flex-direction: column;
    gap: $spacing-6;
    width: 100%;
    max-width: 360px;
    padding: $spacing-8;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: $radius-lg;
    box-shadow: 0 4px 24px color-mix(in srgb, var(--color-text-primary) 8%, transparent);
  }

  &__header {
    text-align: center;
  }

  &__title {
    margin: 0 0 $spacing-1;
    font-size: $font-size-2xl;
    font-weight: $font-weight-semibold;
    color: var(--color-accent);
    letter-spacing: -0.02em;
  }

  &__subtitle {
    margin: 0;
    font-size: $font-size-sm;
    color: var(--color-text-secondary);
  }

  &__error {
    margin: 0;
    padding: $spacing-3;
    font-size: $font-size-sm;
    color: var(--color-error, #d32f2f);
    background-color: color-mix(in srgb, var(--color-error, #d32f2f) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-error, #d32f2f) 30%, transparent);
    border-radius: $radius-md;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
  }

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--color-text-secondary);
  }

  &__select {
    width: 100%;
    padding: $spacing-2 $spacing-3;
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    color: var(--color-text-primary);
    background-color: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: $radius-md;
    cursor: pointer;
    outline: none;
    transition: border-color $transition-fast;

    &:focus-visible { border-color: var(--color-accent); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &__btn {
    width: 100%;
  }

  &__footer {
    text-align: center;
    border-top: 1px solid var(--color-border);
    padding-top: $spacing-4;
  }
}
</style>
