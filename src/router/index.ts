import type { RouteRecordRaw } from 'vue-router'
import WorkbenchShell from '../app/WorkbenchShell.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import AllFunctionsPage from '../pages/AllFunctionsPage.vue'
import RecentTaskDetailsPage from '../pages/RecentTaskDetailsPage.vue'
import ComingSoonPage from '../pages/ComingSoonPage.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: WorkbenchShell,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: DashboardPage,
        meta: {
          title: '晚上好，同学 👋',
          subtitle: '欢迎回到你的工作台。',
          showSearch: true,
        },
      },
      {
        path: 'features',
        name: 'allFeatures',
        component: AllFunctionsPage,
        meta: {
          title: '所有功能',
          subtitle: '请假、补假、销假、加班、调休等流程入口。',
          showSearch: false,
        },
      },
      {
        path: 'recent-tasks',
        name: 'recentTaskDetails',
        component: RecentTaskDetailsPage,
        meta: {
          title: '最近任务详情',
          subtitle: '查看任务状态、摘要和处理进度。',
          showSearch: true,
        },
      },
      {
        path: 'coming-soon',
        name: 'comingSoon',
        component: ComingSoonPage,
        meta: {
          title: '敬请期待',
          subtitle: '更多业务模块将陆续上线。',
          showSearch: false,
        },
      },
    ],
  },
]
