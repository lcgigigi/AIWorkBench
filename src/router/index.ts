import type { RouteRecordRaw } from 'vue-router'
import DashboardPage from '../pages/DashboardPage.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'dashboardNew',
    component: DashboardPage,
    meta: {
      fullBleed: true,
      title: 'AI 员工工作台',
      subtitle: '对话驱动流程，任务自动推进。',
      showSearch: false,
    },
  },
]
