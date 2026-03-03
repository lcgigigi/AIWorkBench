import { defineStore } from 'pinia'
import { ref } from 'vue'
import { uid } from '../utils/id'

export type ToastVariant = 'default' | 'success' | 'error' | 'warn'

export interface ToastItem {
  id: string
  text: string
  variant: ToastVariant
  createdAt: string
}

export const useToastStore = defineStore('toast', () => {
  const items = ref<ToastItem[]>([])

  function push(text: string, variant: ToastVariant = 'default', durationMs = 2400) {
    const id = uid('toast')
    items.value = [{ id, text, variant, createdAt: new Date().toISOString() }, ...items.value].slice(0, 3)
    window.setTimeout(() => dismiss(id), durationMs)
  }

  function dismiss(id: string) {
    items.value = items.value.filter((t) => t.id !== id)
  }

  return { items, push, dismiss }
})

