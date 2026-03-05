import type { WidgetDefinition, WidgetId, WidgetState } from './types'

import InputWidget from './InputWidget/InputWidget.vue'
import HotNewsWidget from './HotNewsWidget/HotNewsWidget.vue'
import CommonActionsWidget from './CommonActionsWidget/CommonActionsWidget.vue'
import RecentTasksWidget from './RecentTasksWidget/RecentTasksWidget.vue'
import ComingSoonWidget from './ComingSoonWidget/ComingSoonWidget.vue'

export const widgetRegistry: Record<WidgetId, WidgetDefinition> = {
  input: {
    id: 'input',
    title: '智能任务入口',
    component: InputWidget,
    layout: { spanCols: 3 },
    priority: 'key',
    collapsible: true,
    closable: false,
  },
  hot_news: {
    id: 'hot_news',
    title: '资讯速览',
    component: HotNewsWidget,
    layout: { spanCols: 3 },
    collapsible: true,
    closable: true,
  },
  common_actions: {
    id: 'common_actions',
    title: 'AI 快捷建议',
    component: CommonActionsWidget,
    layout: { spanCols: 2 },
    collapsible: true,
    closable: true,
  },
  recent_tasks: {
    id: 'recent_tasks',
    title: '任务进度追踪',
    component: RecentTasksWidget,
    layout: { spanCols: 2 },
    collapsible: true,
    closable: false,
  },
  coming_soon: {
    id: 'coming_soon',
    title: '能力孵化区',
    component: ComingSoonWidget,
    layout: { spanCols: 2 },
    collapsible: true,
    closable: true,
  },
}

export const defaultWidgetStates: WidgetState[] = [
  { id: 'input', order: 0, collapsed: false, hidden: false },
  { id: 'hot_news', order: 1, collapsed: false, hidden: false },
  { id: 'common_actions', order: 2, collapsed: false, hidden: false },
  { id: 'recent_tasks', order: 3, collapsed: false, hidden: false },
  { id: 'coming_soon', order: 4, collapsed: false, hidden: false },
]
