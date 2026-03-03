import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { api } from '../api'
import type { Task, TaskStatus } from '../api/types'

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
      recent.value = await api.recentTasks(limit)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  function upsert(task: Task) {
    const idx = recent.value.findIndex((t) => t.taskId === task.taskId)
    if (idx >= 0) {
      const prev = recent.value[idx]!
      recent.value[idx] = { ...prev, ...task, updatedAt: task.updatedAt ?? prev.updatedAt }
    } else {
      recent.value.unshift(task)
    }
    recent.value = [...recent.value].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
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

