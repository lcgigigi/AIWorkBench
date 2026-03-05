import type {
  AiSuggestion,
  ApiErrorBody,
  ChatRequest,
  ChatResponse,
  NewsItem,
  SubmitTaskRequest,
  SubmitTaskResponse,
  Task,
  TaskStatus,
} from '../api/types'
import { leaveScenario } from '../scenarios/leave/leaveScenario'
import type { LeaveHalf, LeaveSlots, LeaveType } from '../scenarios/leave/leaveScenario'
import { uid } from '../utils/id'

type Json = unknown

function ok(body: Json, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function err(status: number, body: ApiErrorBody) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function nowIso() {
  return new Date().toISOString()
}

function mockNews(limit: number): NewsItem[] {
  const base = Date.now()
  const titles = [
    'AI 助手进入办公流：从对话到流程编排',
    '企业工作台趋势：桌面化体验与可插拔模块',
    '多模态检索热度上升：知识库与工具调用融合',
    '低代码 + AI：交付效率的新平衡点',
    '安全与合规：生成式 AI 在企业落地的关键',
  ]
  return Array.from({ length: limit }).map((_, i) => ({
    id: uid('news'),
    title: titles[i % titles.length] ?? '热点新闻',
    source: i % 2 === 0 ? 'TechDaily' : '产品观察',
    publishedAt: new Date(base - i * 60_000 * 7).toISOString(),
  }))
}

/** AI 猜你想做：统一在 mocks 中维护，可接后续真实接口 */
export function mockAiSuggestions(limit: number): AiSuggestion[] {
  const list: AiSuggestion[] = [
    {
      id: uid('sug'),
      title: '检测到你昨日未打下班卡',
      actionText: '点击前往补假',
      actionType: 'leave',
      actionPayload: '补昨日下班卡相关请假',
    },
    {
      id: uid('sug'),
      title: '你有 1 条待审批的请假申请',
      actionText: '点击查看',
      actionType: 'leave',
      actionPayload: '请明天下午半天假',
    },
    {
      id: uid('sug'),
      title: '本周考勤异常 1 次，建议及时处理',
      actionText: '去处理',
      actionType: 'attendance',
      actionPayload: '考勤异常',
    },
  ]
  return list.slice(0, Math.max(1, Math.min(limit, 10)))
}

const dayMs = 86400_000
const slotLabelMap = Object.fromEntries(leaveScenario.slotFields.map((f) => [f.key, f.label]))

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toLeaveType(raw: string): LeaveType | undefined {
  const t = raw.trim().toLowerCase()
  if (t === 'annual' || t.includes('年假')) return 'annual'
  if (t === 'sick' || t.includes('病假')) return 'sick'
  if (t === 'personal' || t.includes('事假')) return 'personal'
  if (t === 'other' || t.includes('其他')) return 'other'
  return undefined
}

function toHalf(raw: string): LeaveHalf | undefined {
  const t = raw.trim().toUpperCase()
  if (t === 'AM' || raw.includes('上午')) return 'AM'
  if (t === 'PM' || raw.includes('下午')) return 'PM'
  if (t === 'FULL' || raw.includes('全天')) return 'FULL'
  return undefined
}

function parseDateToken(raw: string, base: Date) {
  const token = raw.trim()
  if (token.includes('今天')) return ymd(base)
  if (token.includes('明天')) return ymd(new Date(base.getTime() + dayMs))

  const ymdMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(token)
  if (ymdMatch) {
    const yyyy = Number(ymdMatch[1])
    const mm = String(Number(ymdMatch[2])).padStart(2, '0')
    const dd = String(Number(ymdMatch[3])).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const dayMatch = /(\d{1,2})\s*[号日]/.exec(token)
  if (dayMatch) {
    const day = Number(dayMatch[1])
    if (day >= 1 && day <= 31) {
      const d = new Date(base)
      if (token.includes('下个月')) d.setMonth(d.getMonth() + 1)
      d.setDate(day)
      return ymd(d)
    }
  }

  return null
}

function readLabeledUpdate(text: string, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = new RegExp(`${escaped}\\s*改为\\s*[“\"'「]?([^；。\\n」”\"']+)`).exec(text)
  return m?.[1]?.trim()
}

function parseLeaveFromText(text: string, baseSlots?: LeaveSlots) {
  const slots: LeaveSlots = {
    ...(baseSlots ?? leaveScenario.createDraft().slots),
  }
  const changedLabels = new Set<string>()
  const now = new Date()

  const setSlot = <K extends keyof LeaveSlots>(
    key: K,
    value: LeaveSlots[K] | undefined,
    label: string,
  ) => {
    if (value === undefined || value === null || value === '') return
    if (slots[key] !== value) {
      slots[key] = value
      changedLabels.add(label)
    }
  }

  // 精准解析：处理“开始日期改为…/假别改为…”类文本
  const leaveTypeVal = readLabeledUpdate(text, '假别')
  const startDateVal = readLabeledUpdate(text, '开始日期')
  const endDateVal = readLabeledUpdate(text, '结束日期')
  const startHalfVal = readLabeledUpdate(text, '开始时段')
  const endHalfVal = readLabeledUpdate(text, '结束时段')
  const reasonVal = readLabeledUpdate(text, '原因')

  setSlot('leaveType', leaveTypeVal ? toLeaveType(leaveTypeVal) : undefined, '假别')
  setSlot('startDate', startDateVal ? parseDateToken(startDateVal, now) ?? undefined : undefined, '开始日期')
  setSlot('endDate', endDateVal ? parseDateToken(endDateVal, now) ?? undefined : undefined, '结束日期')
  setSlot('startHalf', startHalfVal ? toHalf(startHalfVal) : undefined, '开始时段')
  setSlot('endHalf', endHalfVal ? toHalf(endHalfVal) : undefined, '结束时段')
  setSlot('reason', reasonVal, '原因')

  // 自然语言解析：处理“改成4号下午半天”等文本
  if (text.includes('年假')) setSlot('leaveType', 'annual', '假别')
  if (text.includes('病假')) setSlot('leaveType', 'sick', '假别')
  if (text.includes('事假')) setSlot('leaveType', 'personal', '假别')

  const dateToken =
    /(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\s*[号日]|今天|明天)/.exec(text)?.[1] ?? null
  const parsedDate = dateToken ? parseDateToken(dateToken, now) : null
  if (parsedDate) {
    setSlot('startDate', parsedDate, '开始日期')
    setSlot('endDate', parsedDate, '结束日期')
  }

  if (text.includes('全天')) {
    setSlot('startHalf', 'FULL', '开始时段')
    setSlot('endHalf', 'FULL', '结束时段')
  } else if (text.includes('上午')) {
    setSlot('startHalf', 'AM', '开始时段')
    setSlot('endHalf', 'AM', '结束时段')
  } else if (text.includes('下午')) {
    setSlot('startHalf', 'PM', '开始时段')
    setSlot('endHalf', 'PM', '结束时段')
  } else if (text.includes('半天')) {
    const half = slots.startHalf && slots.startHalf !== 'FULL' ? slots.startHalf : 'PM'
    setSlot('startHalf', half, '开始时段')
    setSlot('endHalf', half, '结束时段')
  }

  const reasonMatch =
    /(?:原因|理由)\s*(?:是|为|:|：)?\s*([^，。；\n]+)/.exec(text) ??
    /因为\s*([^，。；\n]+)/.exec(text)
  if (reasonMatch?.[1]) {
    setSlot('reason', reasonMatch[1].trim(), '原因')
  }

  // demo 默认兜底，让卡片始终可展示
  if (!slots.startDate) slots.startDate = ymd(now)
  if (!slots.endDate) slots.endDate = slots.startDate
  if (!slots.startHalf) slots.startHalf = 'FULL'
  if (!slots.endHalf) slots.endHalf = slots.startHalf ?? 'FULL'
  if (!slots.leaveType) slots.leaveType = 'annual'
  if (!slots.reason) slots.reason = '个人原因'

  return { slots, changedLabels: [...changedLabels] }
}

function isSuggestionIntent(text: string) {
  return /建议|怎么填|还缺|补齐|下一步/.test(text)
}

function buildChatReply(text: string, changed: string[], missingLabels: string[]) {
  if (isSuggestionIntent(text)) {
    if (missingLabels.length) {
      return `建议先补齐：${missingLabels.join('、')}。你可以直接说“改成4号下午半天，原因家里有事”。`
    }
    return '当前信息已齐全，可以直接执行；也可以继续说“改成4号下午半天”我会实时更新卡片。'
  }

  if (changed.length) {
    return `已按你的描述更新：${changed.join('、')}。卡片信息已重新生成，你可以继续调整或直接执行。`
  }

  return '我已刷新草稿并同步卡片。你可以继续补充，例如“改成4号下午半天，原因个人事项”。'
}

export function createMockApi() {
  const tasks = new Map<string, Task>()
  const sessionDrafts = new Map<string, ReturnType<typeof leaveScenario.createDraft>>()

  function listRecent(limit: number) {
    return [...tasks.values()].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, limit)
  }

  function scheduleStatus(taskId: string) {
    const to = (status: TaskStatus, delayMs: number) => {
      window.setTimeout(() => {
        const t = tasks.get(taskId)
        if (!t) return
        t.status = status
        t.updatedAt = nowIso()
        tasks.set(taskId, { ...t })
      }, delayMs)
    }
    to('in_progress', 1300)
    to('done', 4200)
  }

  async function handleChat(body: ChatRequest): Promise<ChatResponse> {
    const sessionId = body.sessionId || 'default'
    const msg = body.message ?? ''
    const prev = sessionDrafts.get(sessionId)
    const { slots, changedLabels } = parseLeaveFromText(msg, prev?.slots as LeaveSlots | undefined)
    const d = leaveScenario.createDraft(slots)
    if (prev) {
      d.version = prev.version + 1
      d.createdAt = prev.createdAt
      d.updatedAt = nowIso()
    }
    sessionDrafts.set(sessionId, d)

    const missingLabels = d.missingSlots.map((key) => slotLabelMap[key] ?? key)
    return {
      replyText: buildChatReply(msg, changedLabels, missingLabels),
      draft: d,
      uiHints: { openTaskPanel: true },
    }
  }

  async function handleSubmit(body: SubmitTaskRequest): Promise<SubmitTaskResponse> {
    if (!body?.draftId) {
      throw { status: 400, body: { code: 'VALIDATION_ERROR', message: 'draftId 缺失' } satisfies ApiErrorBody }
    }
    const taskId = uid('task')
    const requestId = uid('req')
    const createdAt = nowIso()

    const summary = leaveScenario.buildSummary(body.slots as any)
    const t: Task = {
      taskId,
      requestId,
      scenario: body.scenario,
      intent: body.intent,
      status: 'submitted',
      summary,
      createdAt,
      updatedAt: createdAt,
    }
    tasks.set(taskId, t)
    scheduleStatus(taskId)
    return { taskId, requestId, status: 'submitted', createdAt }
  }

  async function route(url: URL, init?: RequestInit) {
    const path = url.pathname
    const method = (init?.method ?? 'GET').toUpperCase()
    const jsonBody = init?.body ? JSON.parse(String(init.body)) : undefined

    // /api/news/hot
    if (method === 'GET' && path === '/api/news/hot') {
      const limit = Number(url.searchParams.get('limit') ?? '10')
      return ok(mockNews(Number.isFinite(limit) ? Math.max(1, Math.min(20, limit)) : 10))
    }

    // /api/ai/suggestions
    if (method === 'GET' && path === '/api/ai/suggestions') {
      const limit = Number(url.searchParams.get('limit') ?? '3')
      return ok(mockAiSuggestions(Number.isFinite(limit) ? Math.max(1, Math.min(10, limit)) : 3))
    }

    // /api/tasks/recent
    if (method === 'GET' && path === '/api/tasks/recent') {
      const limit = Number(url.searchParams.get('limit') ?? '10')
      return ok(listRecent(Number.isFinite(limit) ? Math.max(1, Math.min(50, limit)) : 10))
    }

    // /api/ai/chat
    if (method === 'POST' && path === '/api/ai/chat') {
      const data = await handleChat(jsonBody as ChatRequest)
      return ok(data)
    }

    // /api/tasks/submit
    if (method === 'POST' && path === '/api/tasks/submit') {
      try {
        const data = await handleSubmit(jsonBody as SubmitTaskRequest)
        return ok(data)
      } catch (e: any) {
        return err(e?.status ?? 500, (e?.body ?? { code: 'UNKNOWN', message: '提交失败' }) as ApiErrorBody)
      }
    }

    // /api/tasks/:taskId
    const mTask = /^\/api\/tasks\/([^/]+)$/.exec(path)
    if (method === 'GET' && mTask) {
      const taskId = decodeURIComponent(mTask[1]!)
      const t = tasks.get(taskId)
      if (!t) return err(404, { code: 'NOT_FOUND', message: '任务不存在' })
      return ok(t)
    }

    // /api/tasks/:taskId/status
    const mStatus = /^\/api\/tasks\/([^/]+)\/status$/.exec(path)
    if (method === 'GET' && mStatus) {
      const taskId = decodeURIComponent(mStatus[1]!)
      const t = tasks.get(taskId)
      if (!t) return err(404, { code: 'NOT_FOUND', message: '任务不存在' })
      return ok({ taskId, status: t.status, updatedAt: t.updatedAt })
    }

    return err(404, { code: 'NOT_FOUND', message: '未实现的 mock 路由' })
  }

  return { route }
}
