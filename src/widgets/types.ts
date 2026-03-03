import type { Component } from 'vue'

export type WidgetId = 'input' | 'hot_news' | 'common_actions' | 'recent_tasks' | 'coming_soon'

export interface WidgetLayoutHint {
  spanCols?: 1 | 2 | 3
}

export interface WidgetDefinition {
  id: WidgetId
  title: string
  component: Component
  layout?: WidgetLayoutHint
  closable?: boolean
  collapsible?: boolean
}

export interface WidgetState {
  id: WidgetId
  order: number
  collapsed: boolean
  hidden: boolean
}

