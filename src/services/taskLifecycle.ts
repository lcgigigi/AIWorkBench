import { api } from '../api'
import type { AiDraft, Task, TaskStatus } from '../api/types'
import { getScenario } from '../scenarios'

interface PollOptions {
  attempts?: number
  intervalMs?: number
  onUpdate?: (status: TaskStatus, updatedAt: string) => void
  shouldStop?: () => boolean
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function submitDraftToTask(draft: AiDraft): Promise<Task> {
  const scenario = getScenario(draft.scenario)
  if (!scenario) {
    throw new Error('当前流程场景未注册')
  }

  const res = await api.submitTask({
    draftId: draft.draftId,
    scenario: draft.scenario,
    intent: draft.intent,
    slots: draft.slots,
    version: draft.version,
  })

  return {
    taskId: res.taskId,
    requestId: res.requestId,
    scenario: draft.scenario,
    intent: draft.intent,
    status: res.status,
    summary: scenario.buildSummary(draft.slots),
    createdAt: res.createdAt,
    updatedAt: new Date().toISOString(),
  }
}

export async function pollTaskStatus(taskId: string, options?: PollOptions) {
  const attempts = options?.attempts ?? 20
  const intervalMs = options?.intervalMs ?? 1200

  for (let i = 0; i < attempts; i++) {
    if (options?.shouldStop?.()) return

    const status = await api.taskStatus(taskId)
    options?.onUpdate?.(status.status, status.updatedAt)

    if (status.status === 'done' || status.status === 'failed') {
      return
    }

    await sleep(intervalMs)
  }
}
