import { fetchJson } from './client'
import type {
  AiSuggestion,
  ChatRequest,
  ChatResponse,
  NewsItem,
  SubmitTaskRequest,
  SubmitTaskResponse,
  Task,
  TaskStatus,
} from './types'

export const api = {
  chat: (req: ChatRequest) => fetchJson<ChatResponse>('/api/ai/chat', { method: 'POST', json: req }),
  submitTask: (req: SubmitTaskRequest) =>
    fetchJson<SubmitTaskResponse>('/api/tasks/submit', { method: 'POST', json: req }),
  recentTasks: (limit = 10) => fetchJson<Task[]>(`/api/tasks/recent?limit=${encodeURIComponent(String(limit))}`),
  task: (taskId: string) => fetchJson<Task>(`/api/tasks/${encodeURIComponent(taskId)}`),
  taskStatus: (taskId: string) =>
    fetchJson<{ taskId: string; status: TaskStatus; updatedAt: string }>(
      `/api/tasks/${encodeURIComponent(taskId)}/status`,
    ),
  hotNews: (limit = 10) => fetchJson<NewsItem[]>(`/api/news/hot?limit=${encodeURIComponent(String(limit))}`),
  /** AI 猜你想做：返回 2～3 条推荐 */
  aiSuggestions: (limit = 3) =>
    fetchJson<AiSuggestion[]>(`/api/ai/suggestions?limit=${encodeURIComponent(String(limit))}`),
}

