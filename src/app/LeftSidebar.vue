<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkbenchStore } from '../stores/useWorkbenchStore'
import { useTasksStore } from '../stores/useTasksStore'

const route = useRoute()
const router = useRouter()
const wb = useWorkbenchStore()
const tasks = useTasksStore()

const menuItems = [
  {
    id: 'dashboard',
    label: '工作台',
    shortLabel: '工作台',
    routeName: 'dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    id: 'features',
    label: '所有功能',
    shortLabel: '功能',
    routeName: 'allFeatures',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  },
  {
    id: 'tasks',
    label: '最近任务详情',
    shortLabel: '任务',
    routeName: 'recentTaskDetails',
    icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 104 0M9 5a2 2 0 104 0m-6 5h6m-6 4h6m-6 4h4',
  },
  {
    id: 'coming-soon',
    label: '敬请期待',
    shortLabel: '期待',
    routeName: 'comingSoon',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
]

const activeRouteName = computed(() => String(route.name ?? ''))
const layoutButtonLabel = computed(() => (wb.layoutEditing ? '完成布局编辑' : '编辑首页布局'))
const layoutButtonShortLabel = computed(() => (wb.layoutEditing ? '完成' : '布局'))
const taskBadgeCount = computed(() => tasks.recent.length)

function openPage(routeName: string) {
  void router.push({ name: routeName })
}

onMounted(() => {
  if (!tasks.recent.length && !tasks.loading) {
    void tasks.fetchRecent(20)
  }
})
</script>

<template>
  <aside class="sidebar">
    <div class="logo">
      <div class="logo-bg">
        <svg class="logo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
    </div>

    <nav class="nav">
      <button
        v-for="item in menuItems"
        :key="item.id"
        class="nav-item"
        :class="{ active: activeRouteName === item.routeName }"
        :aria-label="item.label"
        :title="item.label"
        @click="openPage(item.routeName)"
      >
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
        </svg>
        <span
          v-if="item.id === 'tasks' && taskBadgeCount > 0"
          class="task-badge"
          :title="`最近任务：${taskBadgeCount}`"
        >
          {{ taskBadgeCount > 9 ? '9+' : taskBadgeCount }}
        </span>
        <div v-if="activeRouteName === item.routeName" class="indicator" />
        <span class="item-text">{{ item.shortLabel }}</span>
      </button>
    </nav>

    <div class="bottom-actions">
      <button
        class="layout-btn"
        :class="{ active: wb.layoutEditing }"
        :aria-label="layoutButtonLabel"
        :title="layoutButtonLabel"
        type="button"
        @click="wb.toggleLayoutEditing()"
      >
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h10M4 12h16M4 18h8m10-14v4m-6 2v4m-6 2v4"
          />
        </svg>
        <span class="item-text">{{ layoutButtonShortLabel }}</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 80px;
  height: 100%;
  box-sizing: border-box;
  background: var(--wb-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0 12px;
  border-right: 1px solid var(--wb-border);
  flex-shrink: 0;
  z-index: 20;
}

.logo {
  margin-bottom: 28px;
}

.logo-bg {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #fce7f3 0%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.03);
}

.logo-icon {
  width: 26px;
  height: 26px;
  color: var(--wb-primary);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  align-items: center;
}

.nav-item {
  position: relative;
  width: 44px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--wb-text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-item:hover {
  color: var(--wb-primary);
  background: var(--wb-primary-weak);
  transform: translateY(-2px);
}

.nav-item.active {
  color: var(--wb-primary);
  background: linear-gradient(135deg, var(--wb-primary-weak) 0%, #f3e8ff 100%);
  box-shadow: var(--wb-shadow-sm);
}

.icon {
  width: 20px;
  height: 20px;
}

.item-text {
  font-size: 10px;
  line-height: 1;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.task-badge {
  position: absolute;
  right: -5px;
  top: 6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #4f46e5;
  color: #fff;
  border: 1px solid #fff;
  box-shadow: var(--wb-shadow-sm);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.indicator {
  position: absolute;
  left: -16px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: var(--wb-primary);
  border-radius: 0 4px 4px 0;
}

.bottom-actions {
  width: 100%;
  flex-shrink: 0;
  margin-top: auto;
  padding-top: 10px;
  display: flex;
  justify-content: center;
  border-top: 1px solid var(--wb-border);
}

.layout-btn {
  position: relative;
  width: 44px;
  height: 56px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--wb-text-muted);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.layout-btn:hover {
  color: var(--wb-primary);
  background: var(--wb-primary-weak);
}

.layout-btn.active {
  color: var(--wb-primary);
  background: linear-gradient(135deg, var(--wb-primary-weak) 0%, #f3e8ff 100%);
  box-shadow: var(--wb-shadow-sm);
}
</style>
