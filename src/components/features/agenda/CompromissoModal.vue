<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import type { Compromisso, CompromissoPayload, CompromissoTipo, CompromissoStatus, ItemVisibilidade } from '../../../types/agenda'
import { TIPO_LABELS, STATUS_LABELS, VISIBILIDADE_LABELS, VISIBILIDADE_POR_PAPEL } from '../../../types/agenda'
import type { SelectOption } from '../../primitives/AppSelect.vue'
import AppModal from '../../primitives/AppModal.vue'
import AppInput from '../../primitives/AppInput.vue'
import AppSelect from '../../primitives/AppSelect.vue'
import AppTextarea from '../../primitives/AppTextarea.vue'
import AppButton from '../../primitives/AppButton.vue'
import AppText from '../../primitives/AppText.vue'
import AppAlert from '../../primitives/AppAlert.vue'
import { toDatetimeLocal, fromDatetimeLocal, parseLocal } from '../../../utils/dateUtils'
import { useAgenda } from '../../../composables/useAgenda'
import { useSession } from '../../../composables/useSession'
import type { UsuarioAPI } from '../../../services/agenda.service'
import { usuarioService, compromissoService } from '../../../services/agenda.service'

const props = withDefaults(defineProps<{
  open: boolean
  /** Compromisso a editar. null = criação */
  compromisso?: Compromisso | null
  /** Data/hora pré-preenchida ao criar pelo calendário */
  defaultDate?: Date | null
  /** ID da agenda que receberá o item criado (agenda pessoal ativa) */
  agendaId?: string | null
  /** Tipo da agenda ativa: determina quais visibilidades estão disponíveis */
  agendaTipo?: string | null
  /** Quando false, o modal é somente leitura para criação (ex.: agenda da unidade) */
  canCreate?: boolean
}>(), {
  compromisso: null,
  defaultDate: null,
  agendaId:    null,
  agendaTipo:  null,
  canCreate:   true,
})

const emit = defineEmits<{
  close:  []
  save:   [payload: CompromissoPayload, id?: string]
  delete: [id: string]
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

// ---- Controle de papel (RN-004 / RN-010) ----

const { papelAtivo, usuarioAtivoId, usuarioAtivo, grupoIdAtivo } = useSession()

// ---- Usuários da API ----
// Re-busca sempre que o grupo ativo mudar (agenda pessoal tem grupoId=null,
// por isso usamos grupoIdAtivo derivado da agenda de unidade).

const usuarios = ref<UsuarioAPI[]>([])

watch(grupoIdAtivo, async (grupoId) => {
  try {
    usuarios.value = await usuarioService.listar(grupoId ? { grupoId } : undefined)
  } catch {
    // silencioso — o select ficará vazio e o campo ficará inválido na validação
  }
}, { immediate: true })

const usuarioOptions = computed<SelectOption[]>(() =>
  usuarios.value.map(u => ({ value: u.id, label: u.nome })),
)

/** Operador cria compromissos apenas para si mesmo. */
const somenteProprioResponsavel = computed(() => papelAtivo.value === 'operador')

/** Estagiário aparece como delegado — deve escolher outro usuário como responsável. */
const deveDelegar = computed(() => papelAtivo.value === 'estagiario')

/**
 * Opções do select de responsável filtradas pelo papel ativo (RN-004 / RN-010).
 * - operador     → apenas o próprio usuário
 * - estagiario   → todos exceto o próprio usuário
 * - outros papéis → todos os usuários
 */
const responsavelOptions = computed<SelectOption[]>(() => {
  if (somenteProprioResponsavel.value) {
    const self = usuarios.value.find(u => u.id === usuarioAtivoId.value)
    return self ? [{ value: self.id, label: self.nome }] : []
  }
  if (deveDelegar.value) {
    return usuarios.value
      .filter(u => u.id !== usuarioAtivoId.value)
      .map(u => ({ value: u.id, label: u.nome }))
  }
  return usuarioOptions.value
})

/** Opções de visibilidade disponíveis para o papel ativo + tipo de agenda (ADR-009 PM-002). */
const visibilidadeOptions = computed<SelectOption[]>(() => {
  const tipo   = props.agendaTipo ?? 'pessoal'
  const chave  = `${papelAtivo.value ?? ''}:${tipo}`
  const opcoes = VISIBILIDADE_POR_PAPEL[chave] ?? VISIBILIDADE_POR_PAPEL[papelAtivo.value ?? ''] ?? ['privado']
  return opcoes.map((v: ItemVisibilidade) => ({ value: v, label: VISIBILIDADE_LABELS[v] }))
})

// ---- Estado do formulário ----

function defaultForm() {
  const base = props.defaultDate ?? new Date()
  const fim  = new Date(base); fim.setHours(fim.getHours() + 1)
  return {
    titulo:        '',
    descricao:     '',
    tipo:          'livre' as CompromissoTipo,
    status:        'pendente' as CompromissoStatus,
    visibilidade:  'privado' as ItemVisibilidade,
    dataInicio:    toDatetimeLocal(base),
    dataFim:       toDatetimeLocal(fim),
    responsavelId: '' as string,
    outrosIds:     [] as string[],
    local:         '',
    observacoes:   '',
  }
}

const form    = reactive(defaultForm())
const errors  = reactive<Partial<Record<keyof typeof form | 'generic', string>>>({})

// ---- Alerta de conflito CONFLITO-B (RN-008) ----
const conflictAlert = ref<string | null>(null)

// ---- Confirmações via modal ----
const showDeleteConfirm = ref(false)
const showSaveConfirm   = ref(false)
const pendingPayload    = ref<CompromissoPayload | null>(null)

// ---- Alerta de feriado (RN-006) ----
const { getByDay } = useAgenda()

const feriadoAlert = computed(() => {
  if (!form.dataInicio) return null
  const date = parseLocal(form.dataInicio.length === 16 ? form.dataInicio + ':00' : form.dataInicio)
  const hits = getByDay(date).filter(
    c => c.renderizacao === 'fundo_dia',
  )
  return hits.length ? hits[0] : null
})

// ---- Alerta de final de semana ----
const weekendAlert = computed((): string | null => {
  if (!form.dataInicio || feriadoAlert.value) return null
  const date = parseLocal(form.dataInicio.length === 16 ? form.dataInicio + ':00' : form.dataInicio)
  const dow = date.getDay()
  if (dow === 0) return 'Domingo'
  if (dow === 6) return 'Sábado'
  return null
})

// Preenche o form quando o modal abre
watch(() => props.open, (open) => {
  if (!open) {
    showDeleteConfirm.value = false
    showSaveConfirm.value   = false
    pendingPayload.value    = null
    return
  }
  Object.assign(errors, {})
  conflictAlert.value = null
  if (props.compromisso) {
    const c = props.compromisso
    Object.assign(form, {
      titulo:        c.titulo,
      descricao:     c.descricao ?? '',
      tipo:          c.tipo,
      status:        c.status,
      visibilidade:  (c.visibilidade ?? 'privado') as ItemVisibilidade,
      dataInicio:    toDatetimeLocal(parseLocal(c.dataInicio)),
      dataFim:       toDatetimeLocal(parseLocal(c.dataFim)),
      responsavelId: c.responsavel?.id ?? '',
      outrosIds:     c.outrosResponsaveis.map(r => r.id),
      local:         c.local ?? '',
      observacoes:   c.observacoes ?? '',
    })
  } else {
    Object.assign(form, defaultForm())
    // Operador: responsável pré-fixado ao próprio usuário (RN-004)
    if (somenteProprioResponsavel.value && usuarioAtivoId.value) {
      form.responsavelId = usuarioAtivoId.value
    }
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
  form.outrosIds.push('')
}

function removeOutro(idx: number) {
  form.outrosIds.splice(idx, 1)
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
  if (!form.responsavelId) {
    errors.responsavelId = 'Responsável é obrigatório'
    ok = false
  }

  return ok
}

async function handleSubmit() {
  if (!validate()) return

  const responsavelUser = usuarios.value.find(u => u.id === form.responsavelId)

  // CONFLITO-B (ADR-005 / RN-008): verificar sobreposição para o responsável antes de salvar
  conflictAlert.value = null
  if (form.responsavelId && form.dataInicio && form.dataFim) {
    try {
      const conflitos = await compromissoService.verificarConflito({
        responsavelId: form.responsavelId,
        inicio:        fromDatetimeLocal(form.dataInicio),
        fim:           fromDatetimeLocal(form.dataFim),
        excluirId:     props.compromisso?.id,
      })
      if (conflitos.length) {
        conflictAlert.value = `${responsavelUser?.nome ?? 'Responsável'} já possui "${conflitos[0].titulo}" neste horário.`
      }
    } catch {
      // silencioso — não bloqueia o salvamento se o endpoint falhar
    }
  }

  const payload: CompromissoPayload = {
    titulo:            form.titulo.trim(),
    descricao:         form.descricao.trim() || undefined,
    tipo:              form.tipo,
    status:            form.status,
    visibilidade:      form.visibilidade,
    renderizacao:      'evento',
    exigePresenca:     false,
    dataInicio:        fromDatetimeLocal(form.dataInicio),
    dataFim:           fromDatetimeLocal(form.dataFim),
    responsavel:       { id: form.responsavelId, nome: responsavelUser?.nome ?? '' },
    outrosResponsaveis: form.outrosIds
      .filter(id => id)
      .map(id => {
        const u = usuarios.value.find(u => u.id === id)
        return { id, nome: u?.nome ?? '' }
      }),
    local:       form.local.trim() || undefined,
    observacoes: form.observacoes.trim() || undefined,
    agendaId:    props.agendaId ?? undefined,
  }

  if (props.compromisso) {
    // Edição: guardar payload e pedir confirmação
    pendingPayload.value  = payload
    showSaveConfirm.value = true
  } else {
    // Criação: emitir direto, sem confirmação
    emit('save', payload)
  }
}

function confirmSave() {
  if (!pendingPayload.value) return
  emit('save', pendingPayload.value, props.compromisso!.id)
  showSaveConfirm.value = false
  pendingPayload.value  = null
}
</script>

<template>
  <!--
    AppModal fornece: header (via prop title + close auto), body (slot default, scrollável),
    footer (slot #footer). A <form> usa display:contents para herdar o gap do app-modal__body.
  -->
  <AppModal
    :open="open"
    :title="modalTitle"
    size="md"
    @close="$emit('close')"
  >
    <!-- Modo somente leitura para criação (ex.: agenda da unidade) -->
    <template v-if="!canCreate && !compromisso">
      <AppAlert variant="info" title="Agenda somente leitura">
        Esta agenda é de visualização apenas. Selecione <strong>Minha Agenda</strong> para criar novos compromissos.
      </AppAlert>
    </template>

    <!-- Formulário: criação ou edição -->
    <form v-else id="comp-form" class="comp-modal__form" novalidate @submit.prevent="handleSubmit">
      <!-- Tipo -->

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

      <!-- Alerta de feriado (RN-006, CONFLITO-A) -->
      <AppAlert
        v-if="feriadoAlert"
        variant="warning"
        :title="feriadoAlert.tipo === 'feriado' ? 'Feriado' : 'Ponto Facultativo'"
      >
        {{ feriadoAlert.titulo }} está registrado nesta data.
      </AppAlert>

      <!-- Alerta de final de semana -->
      <AppAlert v-if="weekendAlert" variant="warning" title="Final de semana">
        {{ weekendAlert }} — não é um dia útil. Confirme se é intencional.
      </AppAlert>

      <!-- Alerta de conflito CONFLITO-B (RN-008) — não bloqueante -->
      <AppAlert v-if="conflictAlert" variant="warning" title="Conflito de agenda">
        {{ conflictAlert }}
      </AppAlert>

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

      <!-- Visibilidade (ADR-007 VIS-002 / ADR-009 PM-002) — opções filtradas por papel -->
      <AppSelect
        id="visibilidade"
        v-model="form.visibilidade"
        :options="visibilidadeOptions"
        label="Visibilidade"
      />

      <!-- Responsável (RN-004 / RN-010) -->
      <div class="comp-modal__responsavel">
        <AppAlert v-if="somenteProprioResponsavel" variant="info">
          Como <strong>operador</strong>, você cria compromissos apenas para você mesmo.
        </AppAlert>
        <AppAlert v-else-if="deveDelegar" variant="info">
          Como <strong>estagiário</strong>, você será registrado como delegado — selecione o responsável pelo compromisso.
        </AppAlert>

        <div v-if="somenteProprioResponsavel" class="comp-modal__field-readonly">
          <AppText tag="span" size="sm" weight="medium" class="comp-modal__field-label">Responsável</AppText>
          <AppText tag="span">{{ usuarioAtivo?.nome ?? '—' }}</AppText>
        </div>
        <AppSelect
          v-else
          id="responsavel"
          v-model="form.responsavelId"
          :options="responsavelOptions"
          label="Responsável"
          placeholder="Selecione o responsável"
          :error="errors.responsavelId"
        />
      </div>

      <!-- Outros responsáveis: indisponível para operador (cria apenas para si) -->
      <div v-if="!somenteProprioResponsavel" class="comp-modal__outros">
        <div class="comp-modal__outros-header">
          <AppText tag="span" size="sm" weight="medium">Outros responsáveis</AppText>
          <AppButton variant="ghost" size="sm" type="button" @click="addOutro">
            + Adicionar
          </AppButton>
        </div>
        <div
          v-for="(_, idx) in form.outrosIds"
          :key="idx"
          class="comp-modal__outro-row"
        >
          <AppSelect
            :id="`outro-${idx}`"
            v-model="form.outrosIds[idx]"
            :options="usuarioOptions"
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
    </form>

    <template #footer>
      <template v-if="!canCreate && !compromisso">
        <div class="comp-modal__actions">
          <AppButton variant="ghost" type="button" @click="$emit('close')">Fechar</AppButton>
        </div>
      </template>
      <template v-else>
      <AppButton
        v-if="compromisso"
        variant="danger"
        type="button"
        @click="showDeleteConfirm = true"
      >
        Excluir
      </AppButton>
      <div class="comp-modal__actions">
          <AppButton variant="ghost" type="button" @click="$emit('close')">Cancelar</AppButton>
          <AppButton variant="primary" type="submit" form="comp-form">
            {{ compromisso ? 'Salvar alterações' : 'Criar compromisso' }}
          </AppButton>
        </div>
      </template>
    </template>
  </AppModal>

  <!-- Modal de confirmação de exclusão -->
  <AppModal
    :open="showDeleteConfirm"
    title="Excluir compromisso"
    size="sm"
    @close="showDeleteConfirm = false"
  >
    <AppText>Tem certeza que deseja excluir <strong>{{ compromisso?.titulo }}</strong>? Esta ação não pode ser desfeita.</AppText>
    <template #footer>
      <div class="comp-modal__actions">
        <AppButton variant="ghost" type="button" @click="showDeleteConfirm = false">Cancelar</AppButton>
        <AppButton variant="danger" type="button" @click="$emit('delete', compromisso!.id)">
          Confirmar exclusão
        </AppButton>
      </div>
    </template>
  </AppModal>

  <!-- Modal de confirmação de alteração -->
  <AppModal
    :open="showSaveConfirm"
    title="Salvar alterações"
    size="sm"
    @close="showSaveConfirm = false"
  >
    <AppText>Deseja salvar as alterações realizadas em <strong>{{ compromisso?.titulo }}</strong>?</AppText>
    <template #footer>
      <div class="comp-modal__actions">
        <AppButton variant="ghost" type="button" @click="showSaveConfirm = false">Cancelar</AppButton>
        <AppButton variant="primary" type="button" @click="confirmSave">
          Salvar alterações
        </AppButton>
      </div>
    </template>
  </AppModal>

</template>

<style lang="scss" scoped>
@use 'styles/abstracts' as *;

// display:contents → a <form> é invisível como caixa de layout;
// o flex+gap do app-modal__body aplica-se diretamente aos filhos do form.
.comp-modal__form {
  display: contents;
}

// Grid de duas colunas para datas
.comp-modal__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-4;

  @media (max-width: 480px) { grid-template-columns: 1fr; }
}

// Lista de outros responsáveis
.comp-modal__outros {
  display: flex;
  flex-direction: column;
  gap: $spacing-2;
}

.comp-modal__outros-header {
  @include flex(row, center, space-between, $spacing-2);
}

.comp-modal__outro-row {
  @include flex(row, flex-start, flex-start, $spacing-2);
  :deep(.app-input) { flex: 1; }
}

// Campo de responsável — agrupa alerta informativo + select ou exibição estática
.comp-modal__responsavel {
  display: flex;
  flex-direction: column;
  gap: $spacing-2;
}

// Exibição estática de campo bloqueado (ex.: responsável fixo para operador)
.comp-modal__field-readonly {
  @include flex(column, flex-start, flex-start, $spacing-1);
  padding: $spacing-2 $spacing-3;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
}

.comp-modal__field-label {
  color: var(--color-text-secondary);
  font-size: $font-size-sm;
}

// Botões de ação do footer — empurra para a direita
.comp-modal__actions {
  @include flex(row, center, flex-end, $spacing-3);
  margin-left: auto;
}
</style>
