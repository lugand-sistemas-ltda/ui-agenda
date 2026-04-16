import { ref, readonly } from 'vue'

// =============================================================================
// TIPOS EXPORTADOS — usados por AppToast e consumidores
// =============================================================================

export type ToastVariant = 'info' | 'warning' | 'error' | 'success'

export interface Toast {
  id:        number
  variant:   ToastVariant
  message:   string
  title?:    string
  /** Duração em ms. 0 = permanente (requer dismiss manual). Default: 4000 */
  duration:  number
}

// =============================================================================
// SINGLETON — estado compartilhado entre todos os componentes
// (mesmo padrão de useAgenda / useTheme)
// =============================================================================

let   nextId = 1
const toasts = ref<Toast[]>([])
const timers = new Map<number, ReturnType<typeof setTimeout>>()

// =============================================================================
// COMPOSABLE
// =============================================================================

export function useToast() {

  function add(item: Omit<Toast, 'id'>): number {
    const id       = nextId++
    const duration = item.duration ?? 4000
    toasts.value.push({ ...item, id, duration })

    if (duration > 0) {
      const timer = setTimeout(() => remove(id), duration)
      timers.set(id, timer)
    }

    return id
  }

  function remove(id: number): void {
    const timer = timers.get(id)
    if (timer !== undefined) {
      clearTimeout(timer)
      timers.delete(id)
    }
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  // Atalhos por variante
  function info(message: string, title?: string, duration = 4000): number {
    return add({ variant: 'info', message, title, duration })
  }
  function success(message: string, title?: string, duration = 4000): number {
    return add({ variant: 'success', message, title, duration })
  }
  function warning(message: string, title?: string, duration = 6000): number {
    return add({ variant: 'warning', message, title, duration })
  }
  function error(message: string, title?: string, duration = 0): number {
    return add({ variant: 'error', message, title, duration })
  }

  return {
    /** Lista reativa de toasts ativos (readonly) */
    toasts: readonly(toasts),
    add,
    remove,
    info,
    success,
    warning,
    /** Erros são permanentes por padrão (duration=0) — exigem dismiss manual */
    error,
  }
}
