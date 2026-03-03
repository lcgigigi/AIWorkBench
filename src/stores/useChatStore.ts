import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'

import { api } from '../api'
import type { AiDraft, ChatResponse } from '../api/types'
import { uid } from '../utils/id'
import { useWorkbenchStore } from './useWorkbenchStore'
import { useTaskPanelStore } from '../panels/TaskPanel/useTaskPanelStore'

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  createdAt: string
}

export const useChatStore = defineStore('chat', () => {
  const sessionId = useStorage<string>('wb.sessionId', uid('sess'))
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastResponse = ref<ChatResponse | null>(null)
  const currentDraft = ref<AiDraft | null>(null)

  async function sendMessage(message: string) {
    const trimmed = message.trim()
    if (!trimmed) return

    error.value = null
    loading.value = true
    messages.value.push({ id: uid('msg'), role: 'user', text: trimmed, createdAt: new Date().toISOString() })

    try {
      const res = await api.chat({ sessionId: sessionId.value, message: trimmed })
      lastResponse.value = res
      messages.value.push({
        id: uid('msg'),
        role: 'assistant',
        text: res.replyText,
        createdAt: new Date().toISOString(),
      })

      if (res.draft) {
        currentDraft.value = res.draft
        const wb = useWorkbenchStore()
        const panel = useTaskPanelStore()
        panel.setDraft(res.draft)
        if (res.uiHints?.openTaskPanel !== false) wb.openTaskPanel()
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '请求失败'
    } finally {
      loading.value = false
    }
  }

  return { sessionId, messages, loading, error, lastResponse, currentDraft, sendMessage }
})

