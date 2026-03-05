import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

import { api } from '../api'
import type { AiDraft, ChatResponse, Task, TaskStatus } from '../api/types'
import { uid } from '../utils/id'
import { getScenario } from '../scenarios'
import { useTasksStore } from './useTasksStore'

export type FlowStatus =
  | 'collecting'
  | 'ready'
  | 'submitted'
  | 'in_progress'
  | 'failed'
  | 'done'

export interface FlowMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
}

export interface ExecutionFlow {
  flowId: string
  sessionId: string
  title: string
  originText: string
  status: FlowStatus
  messages: FlowMessage[]
  draft: AiDraft | null
  task: Task | null
  error: string | null
  createdAt: string
  updatedAt: string
}

function nowIso() {
  return new Date().toISOString()
}

function summarizeTitle(originText: string, draft?: AiDraft | null) {
  const sc = draft?.scenario ? getScenario(draft.scenario) : undefined
  if (sc?.title) return `${sc.title}流程`
  const t = originText.trim()
  if (!t) return 'AI 执行流程'
  return t.length > 10 ? `${t.slice(0, 10)}…` : t
}

function deriveStatusFromDraft(draft: AiDraft | null): FlowStatus {
  if (!draft) return 'collecting'
  const sc = getScenario(draft.scenario)
  if (!sc) return draft.missingSlots.length ? 'collecting' : 'ready'
  const v = sc.validate(draft.slots)
  const hasError = v.validations.some((x) => x.level === 'error')
  return !v.missingSlots.length && !hasError ? 'ready' : 'collecting'
}

function mapTaskStatus(status: TaskStatus): FlowStatus {
  switch (status) {
    case 'draft':
    case 'ready_to_submit':
      return 'collecting'
    case 'submitted':
      return 'submitted'
    case 'in_progress':
      return 'in_progress'
    case 'done':
      return 'done'
    case 'failed':
      return 'failed'
    default:
      return 'collecting'
  }
}

export const useExecutionFlowsStore = defineStore('executionFlows', () => {
  const tasksStore = useTasksStore()
  const flows = useStorage<ExecutionFlow[]>('wb.execution.flows.v1', [])
  const activeFlowId = useStorage<string | null>('wb.execution.activeId.v1', null)

  const loading = ref(false)
  const activePolling = ref<Record<string, boolean>>({})

  const flowMap = computed(() => {
    const m = new Map<string, ExecutionFlow>()
    for (const f of flows.value) m.set(f.flowId, f)
    return m
  })

  const activeFlow = computed(() =>
    activeFlowId.value ? flowMap.value.get(activeFlowId.value) ?? null : null,
  )

  const sidebarFlows = computed(() =>
    [...flows.value]
      .filter((f) => f.status !== 'done')
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .slice(0, 6),
  )

  function syncTasksFromFlows() {
    for (const flow of flows.value) {
      if (flow.task) tasksStore.upsert(flow.task)
    }
  }

  watch(
    flows,
    () => {
      syncTasksFromFlows()
    },
    { immediate: true, deep: true },
  )

  function upsertFlow(next: ExecutionFlow) {
    const idx = flows.value.findIndex((f) => f.flowId === next.flowId)
    if (idx >= 0) {
      flows.value[idx] = next
      flows.value = [...flows.value]
      return
    }
    flows.value = [next, ...flows.value]
  }

  function patchFlow(flowId: string, patch: Partial<ExecutionFlow>) {
    const prev = flowMap.value.get(flowId)
    if (!prev) return
    upsertFlow({ ...prev, ...patch, flowId: prev.flowId, sessionId: prev.sessionId })
  }

  function appendMessage(flowId: string, role: 'user' | 'assistant', text: string) {
    const prev = flowMap.value.get(flowId)
    if (!prev) return
    const msg: FlowMessage = {
      id: uid('flow_msg'),
      role,
      text,
      createdAt: nowIso(),
    }
    patchFlow(flowId, { messages: [...prev.messages, msg], updatedAt: msg.createdAt })
  }

  function openFlow(flowId: string) {
    if (!flowMap.value.get(flowId)) return
    activeFlowId.value = flowId
  }

  async function startFlow(originText: string) {
    const prompt = originText.trim()
    if (!prompt) return null

    const flowId = uid('flow')
    const createdAt = nowIso()
    const draftPlaceholder: ExecutionFlow = {
      flowId,
      sessionId: uid('sess_flow'),
      title: summarizeTitle(prompt, null),
      originText: prompt,
      status: 'collecting',
      messages: [],
      draft: null,
      task: null,
      error: null,
      createdAt,
      updatedAt: createdAt,
    }
    upsertFlow(draftPlaceholder)
    activeFlowId.value = flowId

    appendMessage(flowId, 'user', prompt)
    loading.value = true
    try {
      const res = await api.chat({ sessionId: draftPlaceholder.sessionId, message: prompt })
      applyChatResponse(flowId, res)
      return flowId
    } catch (e) {
      const msg = e instanceof Error ? e.message : '请求失败'
      patchFlow(flowId, { error: msg, status: 'failed', updatedAt: nowIso() })
      return flowId
    } finally {
      loading.value = false
    }
  }

  function applyChatResponse(flowId: string, res: ChatResponse) {
    appendMessage(flowId, 'assistant', res.replyText)
    const prev = flowMap.value.get(flowId)
    if (!prev) return

    const draft = res.draft ?? prev.draft
    const nextStatus = deriveStatusFromDraft(draft ?? null)
    patchFlow(flowId, {
      draft: draft ?? null,
      status: nextStatus,
      title: summarizeTitle(prev.originText, draft ?? null),
      error: null,
      updatedAt: nowIso(),
    })
  }

  async function continueFlow(flowId: string, text: string) {
    const prev = flowMap.value.get(flowId)
    if (!prev) return false
    const prompt = text.trim()
    if (!prompt) return false

    appendMessage(flowId, 'user', prompt)
    patchFlow(flowId, { error: null })

    loading.value = true
    try {
      const res = await api.chat({ sessionId: prev.sessionId, message: prompt })
      applyChatResponse(flowId, res)
      return true
    } catch (e) {
      patchFlow(flowId, {
        error: e instanceof Error ? e.message : '请求失败',
        updatedAt: nowIso(),
      })
      return false
    } finally {
      loading.value = false
    }
  }

  async function executeFlow(flowId: string) {
    const flow = flowMap.value.get(flowId)
    if (!flow?.draft) return false

    const sc = getScenario(flow.draft.scenario)
    if (!sc) {
      patchFlow(flowId, { error: '当前流程场景未注册', status: 'failed', updatedAt: nowIso() })
      return false
    }
    const validation = sc.validate(flow.draft.slots)
    const hasError = validation.validations.some((x) => x.level === 'error')
    if (validation.missingSlots.length || hasError) {
      patchFlow(flowId, {
        draft: {
          ...flow.draft,
          missingSlots: validation.missingSlots,
          validations: validation.validations,
        },
        status: 'collecting',
        error: '信息尚未补齐，请继续通过对话完善事实。',
        updatedAt: nowIso(),
      })
      return false
    }

    patchFlow(flowId, { status: 'submitted', error: null, updatedAt: nowIso() })
    loading.value = true
    try {
      const res = await api.submitTask({
        draftId: flow.draft.draftId,
        scenario: flow.draft.scenario,
        intent: flow.draft.intent,
        slots: flow.draft.slots,
        version: flow.draft.version,
      })

      const task: Task = {
        taskId: res.taskId,
        requestId: res.requestId,
        scenario: flow.draft.scenario,
        intent: flow.draft.intent,
        status: res.status,
        summary: sc.buildSummary(flow.draft.slots),
        createdAt: res.createdAt,
        updatedAt: nowIso(),
      }

      patchFlow(flowId, {
        status: mapTaskStatus(task.status),
        task,
        updatedAt: task.updatedAt,
      })
      tasksStore.upsert(task)
      void pollTask(flowId, task.taskId)
      return true
    } catch (e) {
      patchFlow(flowId, {
        error: e instanceof Error ? e.message : '执行失败',
        status: 'failed',
        updatedAt: nowIso(),
      })
      return false
    } finally {
      loading.value = false
    }
  }

  async function pollTask(flowId: string, taskId: string) {
    if (activePolling.value[flowId]) return
    activePolling.value = { ...activePolling.value, [flowId]: true }
    try {
      for (let i = 0; i < 24; i++) {
        const s = await api.taskStatus(taskId)
        const prev = flowMap.value.get(flowId)
        if (!prev?.task) break
        const nextTask: Task = {
          ...prev.task,
          status: s.status,
          updatedAt: s.updatedAt,
        }
        patchFlow(flowId, {
          task: nextTask,
          status: mapTaskStatus(s.status),
          updatedAt: s.updatedAt,
        })
        tasksStore.updateStatus(taskId, s.status, s.updatedAt)
        if (s.status === 'done' || s.status === 'failed') break
        await new Promise((r) => setTimeout(r, 1200))
      }
    } catch {
      // 轮询失败不打断主流程
    } finally {
      const next = { ...activePolling.value }
      delete next[flowId]
      activePolling.value = next
    }
  }

  function closeFlow(flowId: string) {
    flows.value = flows.value.filter((f) => f.flowId !== flowId)
    if (activeFlowId.value === flowId) {
      activeFlowId.value = sidebarFlows.value[0]?.flowId ?? null
    }
  }

  return {
    flows,
    activeFlowId,
    activeFlow,
    sidebarFlows,
    loading,
    openFlow,
    startFlow,
    continueFlow,
    executeFlow,
    closeFlow,
  }
})
