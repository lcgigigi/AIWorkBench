import { reactive } from 'vue'
import type { WidgetId } from './types'

interface WidgetRefreshAction {
  run: () => void | Promise<void>
  isLoading?: () => boolean
}

const refreshActions = reactive<Partial<Record<WidgetId, WidgetRefreshAction>>>({})

export function registerWidgetRefreshAction(id: WidgetId, action: WidgetRefreshAction | null) {
  if (action) {
    refreshActions[id] = action
    return
  }
  delete refreshActions[id]
}

export function getWidgetRefreshAction(id: WidgetId) {
  return refreshActions[id] ?? null
}
