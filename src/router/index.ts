import type { RouteRecordRaw } from 'vue-router'
import WorkbenchShell from '../app/WorkbenchShell.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'workbench',
    component: WorkbenchShell,
  },
]

