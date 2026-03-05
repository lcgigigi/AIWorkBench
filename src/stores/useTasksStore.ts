import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { api } from '../api'
import type { Task, TaskStatus } from '../api/types'

const MAX_RECENT_CACHE = 50

function taskTimestamp(task: Task) {
  const updated = Date.parse(task.updatedAt)
  if (!Number.isNaN(updated)) return updated
  const created = Date.parse(task.createdAt)
  return Number.isNaN(created) ? 0 : created
}

function mergeTaskLists(...lists: Task[][]) {
  const map = new Map<string, Task>()
  for (const list of lists) {
    for (const task of list) {
      const prev = map.get(task.taskId)
      if (!prev) {
        map.set(task.taskId, task)
        continue
      }
      const useNext = taskTimestamp(task) >= taskTimestamp(prev)
      map.set(task.taskId, useNext ? { ...prev, ...task } : { ...task, ...prev })
    }
  }
  return [...map.values()].sort((a, b) => taskTimestamp(b) - taskTimestamp(a))
}

export const useTasksStore = defineStore('tasks', () => {
  const recent = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentTaskId = ref<string | null>(null)

  const byId = computed(() => {
    const m = new Map<string, Task>()
    for (const t of recent.value) m.set(t.taskId, t)
    return m
  })

  async function fetchRecent(limit = 10) {
    loading.value = true
    error.value = null
    try {
      const remote = await api.recentTasks(limit)
      recent.value = mergeTaskLists(remote, recent.value).slice(0, MAX_RECENT_CACHE)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  function upsert(task: Task) {
    recent.value = mergeTaskLists([task], recent.value).slice(0, MAX_RECENT_CACHE)
  }

  function updateStatus(taskId: string, status: TaskStatus, updatedAt: string) {
    const t = byId.value.get(taskId)
    if (!t) return
    upsert({ ...t, status, updatedAt })
  }

  function selectTask(taskId: string) {
    currentTaskId.value = taskId
  }

  return { recent, loading, error, currentTaskId, fetchRecent, upsert, updateStatus, selectTask }
})
