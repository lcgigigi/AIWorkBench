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

function parseLeaveFromText(text: string) {
  // 极简解析：用于 demo（不要当成真实规则）
  const slots = leaveScenario.createDraft().slots

  if (text.includes('年假')) slots.leaveType = 'annual'
  if (text.includes('病假')) slots.leaveType = 'sick'
  if (text.includes('事假')) slots.leaveType = 'personal'

  if (text.includes('半天')) {
    slots.startHalf = 'PM'
    slots.endHalf = 'PM'
  }

  // 默认用今天/明天填充，保证能快速演示进入确认页
  const today = new Date()
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const tomorrow = new Date(today.getTime() + 86400_000)

  if (text.includes('明天')) {
    slots.startDate = ymd(tomorrow)
    slots.endDate = ymd(tomorrow)
  } else {
    slots.startDate = ymd(today)
    slots.endDate = ymd(today)
  }

  if (!slots.startHalf) slots.startHalf = 'FULL'
  if (!slots.endHalf) slots.endHalf = 'FULL'
  if (!slots.leaveType) slots.leaveType = 'annual'
  if (!slots.reason) slots.reason = '个人原因'

  return slots
}

export function createMockApi() {
  const tasks = new Map<string, Task>()

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
    const msg = body.message ?? ''
    const slots = parseLeaveFromText(msg)
    const d = leaveScenario.createDraft(slots)
    return {
      replyText: '已为你解析出请假草稿（mock），请在右侧补全/确认后提交。',
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

