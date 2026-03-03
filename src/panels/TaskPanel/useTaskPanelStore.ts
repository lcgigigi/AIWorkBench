import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { api } from '../../api'
import type { AiDraft, Task, TaskStatus } from '../../api/types'
import { getScenario } from '../../scenarios'
import { uid } from '../../utils/id'
import { useTasksStore } from '../../stores/useTasksStore'

export type TaskPanelState = 'Draft' | 'Editing' | 'ReadyToSubmit' | 'Submitted' | 'Failed'

export const useTaskPanelStore = defineStore('taskPanel', () => {
  const state = ref<TaskPanelState>('Draft')
  const draft = ref<AiDraft | null>(null)
  const task = ref<Task | null>(null)
  const error = ref<string | null>(null)
  const submitting = ref(false)
  const polling = ref(false)

  const scenario = computed(() => (draft.value ? getScenario(draft.value.scenario) : undefined))

  const isValid = computed(() => {
    const d = draft.value
    const sc = scenario.value
    if (!d || !sc) return false
    const v = sc.validate(d.slots)
    return v.missingSlots.length === 0 && !v.validations.some((x) => x.level === 'error')
  })

  function setDraft(next: AiDraft) {
    draft.value = next
    task.value = null
    error.value = null
    state.value = 'Draft'
  }

  function startEditing() {
    if (!draft.value) return
    state.value = 'Editing'
  }

  function updateSlot(key: string, value: unknown) {
    if (!draft.value) return
    const sc = getScenario(draft.value.scenario)
    const now = new Date().toISOString()
    const nextSlots = { ...(draft.value.slots as Record<string, unknown>), [key]: value }

    let missingSlots = draft.value.missingSlots
    let validations = draft.value.validations
    if (sc) {
      const v = sc.validate(nextSlots)
      missingSlots = v.missingSlots
      validations = v.validations
    }

    draft.value = {
      ...draft.value,
      slots: nextSlots,
      missingSlots,
      validations,
      updatedAt: now,
      version: draft.value.version + 1,
    }
  }

  function goReadyToSubmit() {
    if (!draft.value) return
    if (!isValid.value) return
    state.value = 'ReadyToSubmit'
  }

  function backToEdit() {
    if (!draft.value) return
    state.value = 'Editing'
  }

  async function submit() {
    if (!draft.value) return
    const d = draft.value
    const sc = getScenario(d.scenario)
    if (!sc) return
    if (!isValid.value) return

    submitting.value = true
    error.value = null
    try {
      const res = await api.submitTask({
        draftId: d.draftId,
        scenario: d.scenario,
        intent: d.intent,
        slots: d.slots,
        version: d.version,
      })

      const summary = sc.buildSummary(d.slots)
      const now = new Date().toISOString()
      const nextTask: Task = {
        taskId: res.taskId,
        requestId: res.requestId,
        scenario: d.scenario,
        intent: d.intent,
        status: res.status,
        summary,
        createdAt: res.createdAt,
        updatedAt: now,
      }
      task.value = nextTask
      useTasksStore().upsert(nextTask)
      state.value = 'Submitted'
      void pollStatus(nextTask.taskId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '提交失败'
      state.value = 'Failed'
    } finally {
      submitting.value = false
    }
  }

  async function pollStatus(taskId: string) {
    if (polling.value) return
    polling.value = true
    try {
      // 简单轮询：最多 20 次，每次 1.2s
      for (let i = 0; i < 20; i++) {
        const s = await api.taskStatus(taskId)
        useTasksStore().updateStatus(taskId, s.status as TaskStatus, s.updatedAt)
        if (task.value?.taskId === taskId) {
          task.value = { ...(task.value as Task), status: s.status as TaskStatus, updatedAt: s.updatedAt }
        }
        if (s.status === 'done' || s.status === 'failed') break
        await new Promise((r) => setTimeout(r, 1200))
      }
    } catch {
      // 轮询失败不打断主流程
    } finally {
      polling.value = false
    }
  }

  function resetToDraft() {
    if (!draft.value) return
    error.value = null
    task.value = null
    state.value = 'Draft'
  }

  function createMockDraftFromScenario(scenarioId: string) {
    const sc = getScenario(scenarioId)
    if (!sc) return
    setDraft(sc.createDraft() as AiDraft)
  }

  async function openTask(taskId: string) {
    error.value = null
    submitting.value = false
    try {
      const t = await api.task(taskId)
      task.value = t
      state.value = 'Submitted'
      void pollStatus(taskId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载任务失败'
      state.value = 'Failed'
    }
  }

  // 仅用于 UI：展示 requestId 缺省值
  const requestId = computed(() => task.value?.requestId ?? uid('req'))

  return {
    state,
    draft,
    scenario,
    task,
    error,
    submitting,
    polling,
    isValid,
    requestId,
    setDraft,
    startEditing,
    updateSlot,
    goReadyToSubmit,
    backToEdit,
    submit,
    resetToDraft,
    createMockDraftFromScenario,
    openTask,
  }
})

