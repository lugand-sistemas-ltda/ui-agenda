<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import type { Compromisso, CompromissoPayload, CompromissoTipo, CompromissoStatus } from '../../../types/agenda'
import { TIPO_LABELS, STATUS_LABELS } from '../../../types/agenda'
import type { SelectOption } from '../../primitives/AppSelect.vue'
import AppModal from '../../primitives/AppModal.vue'
import AppInput from '../../primitives/AppInput.vue'
import AppSelect from '../../primitives/AppSelect.vue'
import AppTextarea from '../../primitives/AppTextarea.vue'
import AppButton from '../../primitives/AppButton.vue'
import AppText from '../../primitives/AppText.vue'
import { toDatetimeLocal, fromDatetimeLocal, addDays, parseLocal } from '../../../utils/dateUtils'

const props = withDefaults(defineProps<{
  open: boolean
  /** Compromisso a editar. null = criação */
  compromisso?: Compromisso | null
  /** Data/hora pré-preenchida ao criar pelo calendário */
  defaultDate?: Date | null
}>(), {
  compromisso: null,
  defaultDate: null,
})

const emit = defineEmits<{
  close: []
  save:  [payload: CompromissoPayload, id?: string]
}>()

// ---- Opções de selects ----

const tipoOptions: SelectOption[] = (Object.keys(TIPO_LABELS) as CompromissoTipo[]).map(k => ({
  value: k,
  label: TIPO_LABELS[k],
}))

const statusOptions: SelectOption[] = (Object.keys(STATUS_LABELS) as CompromissoStatus[]).map(k => ({
  value: k,
  label: STATUS_LABELS[k],
}))

// ---- Estado do formulário ----

function defaultForm() {
  const base = props.defaultDate ?? new Date()
  const fim  = new Date(base); fim.setHours(fim.getHours() + 1)
  return {
    titulo:            '',
    descricao:         '',
    tipo:              'livre' as CompromissoTipo,
    status:            'pendente' as CompromissoStatus,
    dataInicio:        toDatetimeLocal(base),
    dataFim:           toDatetimeLocal(fim),
    responsavelNome:   '',
    outrosNomes:       [] as string[],
    local:             '',
    observacoes:       '',
  }
}

const form    = reactive(defaultForm())
const errors  = reactive<Partial<Record<keyof typeof form | 'generic', string>>>({})

// Preenche o form quando o modal abre
watch(() => props.open, (open) => {
  if (!open) return
  Object.assign(errors, {})
  if (props.compromisso) {
    const c = props.compromisso
    Object.assign(form, {
      titulo:          c.titulo,
      descricao:       c.descricao ?? '',
      tipo:            c.tipo,
      status:          c.status,
      dataInicio:      toDatetimeLocal(parseLocal(c.dataInicio)),
      dataFim:         toDatetimeLocal(parseLocal(c.dataFim)),
      responsavelNome: c.responsavel.nome,
      outrosNomes:     c.outrosResponsaveis.map(r => r.nome),
      local:           c.local ?? '',
      observacoes:     c.observacoes ?? '',
    })
  } else {
    Object.assign(form, defaultForm())
  }
}, { immediate: true })

const modalTitle = computed(() =>
  props.compromisso ? 'Editar compromisso' : 'Novo compromisso',
)

// Título automático para tipos não-livre
watch(() => form.tipo, (tipo) => {
  if (tipo !== 'livre') form.titulo = TIPO_LABELS[tipo]
})

function addOutro() {
  form.outrosNomes.push('')
}

function removeOutro(idx: number) {
  form.outrosNomes.splice(idx, 1)
}

// ---- Validação e submit ----

function validate(): boolean {
  Object.keys(errors).forEach(k => delete (errors as Record<string, string>)[k])
  let ok = true

  if (!form.titulo.trim()) {
    errors.titulo = 'Título é obrigatório'
    ok = false
  }
  if (!form.dataInicio) {
    errors.dataInicio = 'Data de início é obrigatória'
    ok = false
  }
  if (!form.dataFim) {
    errors.dataFim = 'Data de término é obrigatória'
    ok = false
  }
  if (form.dataInicio && form.dataFim && form.dataFim < form.dataInicio) {
    errors.dataFim = 'O término deve ser após o início'
    ok = false
  }
  if (!form.responsavelNome.trim()) {
    errors.responsavelNome = 'Responsável é obrigatório'
    ok = false
  }

  return ok
}

function handleSubmit() {
  if (!validate()) return

  const payload: CompromissoPayload = {
    titulo:            form.titulo.trim(),
    descricao:         form.descricao.trim() || undefined,
    tipo:              form.tipo,
    status:            form.status,
    dataInicio:        fromDatetimeLocal(form.dataInicio),
    dataFim:           fromDatetimeLocal(form.dataFim),
    responsavel:       { id: crypto.randomUUID(), nome: form.responsavelNome.trim() },
    outrosResponsaveis: form.outrosNomes
      .filter(n => n.trim())
      .map(n => ({ id: crypto.randomUUID(), nome: n.trim() })),
    local:       form.local.trim() || undefined,
    observacoes: form.observacoes.trim() || undefined,
  }

  emit('save', payload, props.compromisso?.id)
}
</script>

<template>
  <AppModal :open="open" size="md" @close="$emit('close')">
    <form class="comp-modal" novalidate @submit.prevent="handleSubmit">
      <!-- Cabeçalho -->
      <div class="comp-modal__header">
        <AppText tag="h2" size="lg" weight="semibold">{{ modalTitle }}</AppText>
        <AppButton variant="icon" type="button" aria-label="Fechar" @click="$emit('close')">✕</AppButton>
      </div>

      <!-- Corpo com scroll -->
      <div class="comp-modal__body">
        <!-- Tipo -->
        <AppSelect
          id="tipo"
          v-model="form.tipo"
          :options="tipoOptions"
          label="Tipo de compromisso"
        />

        <!-- Título -->
        <AppInput
          id="titulo"
          v-model="form.titulo"
          label="Título"
          placeholder="Título do compromisso"
          :error="errors.titulo"
        />

        <!-- Datas -->
        <div class="comp-modal__row">
          <AppInput
            id="dataInicio"
            v-model="form.dataInicio"
            type="datetime-local"
            label="Início"
            :error="errors.dataInicio"
          />
          <AppInput
            id="dataFim"
            v-model="form.dataFim"
            type="datetime-local"
            label="Término"
            :error="errors.dataFim"
          />
        </div>

        <!-- Status -->
        <AppSelect
          id="status"
          v-model="form.status"
          :options="statusOptions"
          label="Status"
        />

        <!-- Responsável -->
        <AppInput
          id="responsavel"
          v-model="form.responsavelNome"
          label="Responsável"
          placeholder="Nome do responsável"
          :error="errors.responsavelNome"
        />

        <!-- Outros responsáveis -->
        <div class="comp-modal__outros">
          <div class="comp-modal__outros-header">
            <AppText tag="span" size="sm" weight="medium">Outros responsáveis</AppText>
            <AppButton variant="ghost" size="sm" type="button" @click="addOutro">
              + Adicionar
            </AppButton>
          </div>
          <div
            v-for="(_, idx) in form.outrosNomes"
            :key="idx"
            class="comp-modal__outro-row"
          >
            <AppInput
              :id="`outro-${idx}`"
              v-model="form.outrosNomes[idx]"
              :placeholder="`Responsável ${idx + 1}`"
            />
            <AppButton variant="icon" size="sm" type="button" aria-label="Remover" @click="removeOutro(idx)">
              ✕
            </AppButton>
          </div>
        </div>

        <!-- Local -->
        <AppInput
          id="local"
          v-model="form.local"
          label="Local"
          placeholder="Local do compromisso (opcional)"
        />

        <!-- Descrição -->
        <AppInput
          id="descricao"
          v-model="form.descricao"
          label="Descrição"
          placeholder="Descrição breve (opcional)"
        />

        <!-- Observações -->
        <AppTextarea
          id="observacoes"
          v-model="form.observacoes"
          label="Observações"
          placeholder="Observações adicionais (opcional)"
          :rows="3"
        />
      </div>

      <!-- Rodapé -->
      <div class="comp-modal__footer">
        <AppButton variant="ghost" type="button" @click="$emit('close')">Cancelar</AppButton>
        <AppButton variant="primary" type="submit">
          {{ compromisso ? 'Salvar alterações' : 'Criar compromisso' }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

.comp-modal {
  display: flex;
  flex-direction: column;
  max-height: inherit;

  &__header {
    @include flex(row, center, space-between, $spacing-2);
    padding: $spacing-4 $spacing-6;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-4 $spacing-6;
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing-4;

    @media (max-width: 480px) { grid-template-columns: 1fr; }
  }

  &__outros {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }

  &__outros-header {
    @include flex(row, center, space-between, $spacing-2);
  }

  &__outro-row {
    @include flex(row, flex-start, flex-start, $spacing-2);

    .app-input { flex: 1; }
  }

  &__footer {
    @include flex(row, center, flex-end, $spacing-3);
    padding: $spacing-4 $spacing-6;
    border-top: 1px solid var(--color-border);
    flex-shrink: 0;
  }
}
</style>
