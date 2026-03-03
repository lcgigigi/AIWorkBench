export type ScenarioId = 'leave' | (string & {})

export type IntentId = 'apply_leave' | (string & {})

export type AiDraftValidationLevel = 'warn' | 'error'

export interface AiDraftValidation {
  level: AiDraftValidationLevel
  code: string
  message: string
  field?: string
}

export type AiDraftAction = 'SUBMIT' | 'OPEN_LEGACY' | 'CANCEL'

export interface AiDraft<Slots = Record<string, unknown>> {
  draftId: string
  scenario: ScenarioId
  intent: IntentId
  slots: Slots
  missingSlots: string[]
  validations: AiDraftValidation[]
  actions: AiDraftAction[]
  version: number
  createdAt: string
  updatedAt: string
}

export type TaskStatus =
  | 'draft'
  | 'ready_to_submit'
  | 'submitted'
  | 'in_progress'
  | 'done'
  | 'failed'

export interface TaskSummary {
  title: string
  lines: Array<{ label: string; value: string }>
}

export interface Task {
  taskId: string
  requestId: string
  scenario: ScenarioId
  intent: IntentId
  status: TaskStatus
  summary: TaskSummary
  createdAt: string
  updatedAt: string
}

export interface NewsItem {
  id: string
  title: string
  source: string
  publishedAt: string
  url?: string
}

/** AI 猜你想做：一条推荐文案 + 操作按钮文案，可选关联场景或链接 */
export interface AiSuggestion {
  id: string
  title: string
  actionText: string
  /** 可选：'leave' | 'task' | 等，用于前端跳转或填充输入 */
  actionType?: string
  /** 可选：如场景 id、预填文案等 */
  actionPayload?: string
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_AUTHORIZED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'UPSTREAM_UNAVAILABLE'
  | 'UNKNOWN'

export interface ApiErrorBody {
  code: ApiErrorCode
  message: string
  details?: unknown
  requestId?: string
}

export interface ApiOk<T> {
  ok: true
  data: T
}

export interface ApiErr {
  ok: false
  error: ApiErrorBody
  httpStatus?: number
}

export type ApiResult<T> = ApiOk<T> | ApiErr

export interface ChatRequest {
  sessionId: string
  message: string
  context?: Record<string, unknown>
}

export interface ChatResponse {
  replyText: string
  draft?: AiDraft
  uiHints?: { openTaskPanel?: boolean }
}

export interface SubmitTaskRequest {
  draftId: string
  scenario: ScenarioId
  intent: IntentId
  slots: Record<string, unknown>
  version: number
}

export interface SubmitTaskResponse {
  taskId: string
  requestId: string
  status: TaskStatus
  createdAt: string
}
