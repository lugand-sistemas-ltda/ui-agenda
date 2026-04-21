<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSession } from '../composables/useSession'
import { useTheme } from '../composables/useTheme'
import AppButton from '../components/primitives/AppButton.vue'
import AppInput from '../components/primitives/AppInput.vue'

const router = useRouter()
const { theme, toggleTheme } = useTheme()
const { login, loadingSession, errorSession, isAuthenticated, init } = useSession()

const matricula = ref('')
const senha     = ref('')
const localError = ref<string | null>(null)

onMounted(async () => {
  await init()
  // Se já há sessão válida no localStorage, redireciona direto
  if (isAuthenticated.value) router.replace('/')
})

async function handleLogin(): Promise<void> {
  localError.value = null
  if (!matricula.value.trim() || !senha.value) return
  try {
    await login(matricula.value.trim(), senha.value)
    router.push('/')
  } catch {
    localError.value = 'Matrícula ou senha incorretos.'
    senha.value = ''
  }
}
</script>

<template>
  <div class="login-view">
    <div class="login-view__card">
      <!-- Logo -->
      <header class="login-view__header">
        <img
          src="/logo_pcpr.png"
          alt="Polícia Civil do Paraná"
          class="login-view__logo"
          draggable="false"
        />
        <h1 class="login-view__title">SRI — Módulo de Agendamento</h1>
      </header>

      <!-- Erro de autenticação -->
      <p v-if="localError || errorSession" class="login-view__error" role="alert">
        {{ localError ?? errorSession }}
      </p>

      <!-- Formulário de login -->
      <form class="login-view__form" @submit.prevent="handleLogin" novalidate>
        <div class="login-view__field">
          <label class="login-view__label" for="login-matricula">Matrícula</label>
          <AppInput
            id="login-matricula"
            v-model="matricula"
            type="text"
            inputmode="numeric"
            placeholder="Ex.: 1000001"
            autocomplete="username"
            :disabled="loadingSession"
            class="login-view__input"
          />
        </div>

        <div class="login-view__field">
          <label class="login-view__label" for="login-senha">Senha</label>
          <AppInput
            id="login-senha"
            v-model="senha"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            :disabled="loadingSession"
            class="login-view__input"
          />
        </div>

        <AppButton
          type="submit"
          variant="primary"
          size="md"
          :disabled="!matricula.trim() || !senha || loadingSession"
          class="login-view__btn"
        >
          {{ loadingSession ? 'Entrando…' : 'Entrar' }}
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
    max-width: 380px;
    padding: $spacing-8;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: $radius-lg;
    box-shadow: 0 4px 24px color-mix(in srgb, var(--color-text-primary) 8%, transparent);
  }

  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-3;
    text-align: center;
  }

  &__logo {
    width: 80px;
    height: auto;
    object-fit: contain;
    user-select: none;
  }

  &__title {
    margin: 0;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: var(--color-text-secondary);
    letter-spacing: 0.01em;
  }

  &__error {
    margin: 0;
    padding: $spacing-3;
    font-size: $font-size-sm;
    color: var(--color-feedback-error, #d32f2f);
    background-color: color-mix(in srgb, var(--color-feedback-error, #d32f2f) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-feedback-error, #d32f2f) 30%, transparent);
    border-radius: $radius-md;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
  }

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--color-text-secondary);
  }

  &__input {
    width: 100%;
  }

  &__btn {
    width: 100%;
    margin-top: $spacing-1;
  }

  &__footer {
    text-align: center;
    border-top: 1px solid var(--color-border);
    padding-top: $spacing-4;
  }
}
</style>
