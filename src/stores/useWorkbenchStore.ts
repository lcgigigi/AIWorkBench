import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { defaultWidgetStates } from '../widgets/registry'
import type { WidgetId, WidgetState } from '../widgets/types'

export const useWorkbenchStore = defineStore('workbench', () => {
  const taskPanelPinned = useStorage<boolean>('wb.taskPanel.pinned', false)
  const taskPanelOpen = ref(false)
  const taskPanelWidth = useStorage<number>('wb.taskPanel.width', 480)

  const taskPanelMinWidth = 420
  const taskPanelMaxWidth = 560

  const normalizedTaskPanelWidth = computed(() =>
    Math.max(taskPanelMinWidth, Math.min(taskPanelMaxWidth, taskPanelWidth.value)),
  )

  function openTaskPanel() {
    taskPanelOpen.value = true
  }

  function closeTaskPanel() {
    taskPanelOpen.value = false
  }

  function togglePinned() {
    taskPanelPinned.value = !taskPanelPinned.value
    if (taskPanelPinned.value) taskPanelOpen.value = true
  }

  function setTaskPanelWidth(width: number) {
    taskPanelWidth.value = width
  }

  const widgetsRaw = useStorage<WidgetState[]>('wb.widgets.v1', defaultWidgetStates)

  const widgets = computed<WidgetState[]>(() => {
    const byId = new Map<WidgetId, WidgetState>()
    for (const s of defaultWidgetStates) byId.set(s.id, { ...s })
    for (const s of widgetsRaw.value) byId.set(s.id, { ...byId.get(s.id), ...s } as WidgetState)
    return Array.from(byId.values()).sort((a, b) => a.order - b.order)
  })

  function updateWidget(id: WidgetId, patch: Partial<WidgetState>) {
    const next = [...widgets.value]
    const idx = next.findIndex((w) => w.id === id)
    if (idx < 0) return
    const prev = next[idx]!
    next[idx] = { ...prev, ...patch, id: prev.id }
    widgetsRaw.value = next
  }

  function toggleWidgetCollapsed(id: WidgetId) {
    const cur = widgets.value.find((w) => w.id === id)
    if (!cur) return
    updateWidget(id, { collapsed: !cur.collapsed })
  }

  function closeWidget(id: WidgetId) {
    updateWidget(id, { hidden: true })
  }

  function resetWidgets() {
    widgetsRaw.value = defaultWidgetStates
  }

  return {
    taskPanelPinned,
    taskPanelOpen,
    normalizedTaskPanelWidth,
    openTaskPanel,
    closeTaskPanel,
    togglePinned,
    setTaskPanelWidth,
    widgets,
    toggleWidgetCollapsed,
    closeWidget,
    resetWidgets,
  }
})

