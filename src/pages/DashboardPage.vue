<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api } from '../api'
import type { AiSuggestion, NewsItem } from '../api/types'
import { useExecutionFlowsStore } from '../stores/useExecutionFlowsStore'
import { useTasksStore } from '../stores/useTasksStore'
import { getTaskStatusText } from '../utils/taskStatus'
import AllFunctionsPage from './AllFunctionsPage.vue'
import ComingSoonPage from './ComingSoonPage.vue'
import RecentTaskDetailsPage from './RecentTaskDetailsPage.vue'
import BaseButton from '../components/base/BaseButton.vue'

type WorkspaceView = 'overview' | 'tasks' | 'features' | 'soon'

interface NavItem {
  id: WorkspaceView
  label: string
  hint: string
  icon: string
}

const router = useRouter()
const route = useRoute()
const flows = useExecutionFlowsStore()
const tasks = useTasksStore()

const loading = ref(false)
const query = ref('')
const news = ref<NewsItem[]>([])
const suggestions = ref<AiSuggestion[]>([])
const loadError = ref<string | null>(null)

const quickLaunches = [
  '我明天下午请半天年假，原因家里有事',
  '我想补昨天的请假记录，下午半天，原因身体不适',
  '我今天申请加班到晚上九点，项目上线收尾',
  '我想把上周六加班换成下周一上午调休',
]

const teamAvatars = [
  { name: '林', color: '#dbeafe' },
  { name: '张', color: '#ffe4e6' },
  { name: '王', color: '#dcfce7' },
  { name: '周', color: '#fef3c7' },
  { name: '陈', color: '#ede9fe' },
  { name: '李', color: '#e0f2fe' },
  { name: '赵', color: '#fce7f3' },
]

const navItems: NavItem[] = [
  {
    id: 'overview',
    label: '首页概览',
    hint: '返回总览',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    id: 'tasks',
    label: '任务中心',
    hint: '查看流程',
    icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 104 0M9 5a2 2 0 104 0m-6 5h6m-6 4h6m-6 4h4',
  },
  {
    id: 'features',
    label: '流程入口',
    hint: '选择能力',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  },
  {
    id: 'soon',
    label: '敬请期待',
    hint: '查看规划',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
]

const flowCount = computed(() => flows.sidebarFlows.length)
const taskCards = computed(() => tasks.recent.slice(0, 5))
const highlightNews = computed(() => news.value[0] ?? null)
const topSuggestions = computed(() => suggestions.value.slice(0, 3))
const canStart = computed(() => !loading.value && query.value.trim().length > 0)

const activeView = computed<WorkspaceView>(() => {
  const panel = typeof route.query.panel === 'string' ? route.query.panel : 'overview'
  return navItems.some((item) => item.id === panel) ? (panel as WorkspaceView) : 'overview'
})

const activeNav = computed(() => navItems.find((item) => item.id === activeView.value) ?? navItems[0]!)

const stats = computed(() => {
  const all = tasks.recent
  return {
    total: all.length,
    done: all.filter((item) => item.status === 'done').length,
    inProgress: all.filter((item) => item.status === 'in_progress' || item.status === 'submitted').length,
  }
})

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

async function refreshData() {
  loading.value = true
  loadError.value = null
  try {
    const [newsRes, suggestionRes] = await Promise.all([api.hotNews(5), api.aiSuggestions(4), tasks.fetchRecent(10)])
    news.value = newsRes
    suggestions.value = suggestionRes
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function replacePanel(panel: WorkspaceView, extraQuery?: Record<string, string | undefined>) {
  const nextQuery: Record<string, string> = {}

  if (panel !== 'overview') nextQuery.panel = panel

  if (panel === 'tasks') {
    const flow = extraQuery?.flow ?? (typeof route.query.flow === 'string' ? route.query.flow : undefined)
    const task = extraQuery?.task ?? (typeof route.query.task === 'string' ? route.query.task : undefined)
    if (flow) nextQuery.flow = flow
    if (task) nextQuery.task = task
  }

  void router.replace({ name: 'dashboardNew', query: nextQuery })
}

async function startFlowByText(text: string) {
  const value = text.trim()
  if (!value) return
  const flowId = await flows.startFlow(value)
  if (!flowId) return
  query.value = ''
  replacePanel('tasks', { flow: flowId, task: undefined })
}

function useQuickLaunch(prompt: string) {
  query.value = prompt
}

async function useSuggestion(item: AiSuggestion) {
  if (!item.actionPayload) return
  await startFlowByText(item.actionPayload)
}

function openTask(taskId: string) {
  replacePanel('tasks', { task: taskId, flow: undefined })
}

function onComposerKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    void startFlowByText(query.value)
  }
}

onMounted(() => {
  void refreshData()
})
</script>

<template>
  <section class="page">
    <div class="dashboard-shell">
      <div class="layout">
        <aside class="left-rail">
          <div class="brand">
            <div class="brand-title">AI Workbench</div>
            <div class="brand-sub">Intelligent OA Studio</div>
          </div>

          <div class="profile-card">
            <div class="avatar">LC</div>
            <div>
              <div class="hello">Hi 同学</div>
              <div class="muted">今天也很高效</div>
            </div>
          </div>

          <div class="menu-card">
            <button
              v-for="item in navItems"
              :key="item.id"
              class="menu-row"
              :class="{ active: activeView === item.id }"
              type="button"
              @click="replacePanel(item.id)"
            >
              <span class="menu-main">
                <span class="menu-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
                  </svg>
                </span>
                <span class="menu-copy">
                  <span class="menu-label">{{ item.label }}</span>
                  <span class="menu-hint">{{ item.hint }}</span>
                </span>
              </span>
              <span class="menu-arrow" aria-hidden="true">›</span>
            </button>
          </div>

          <div class="upgrade-card">
            <div class="upgrade-title">AI 办公加速中</div>
            <p class="upgrade-desc">当前进行中的智能流程：{{ flowCount }}</p>
            <BaseButton size="sm" variant="primary" @click="replacePanel('tasks')">查看流程</BaseButton>
          </div>
        </aside>

        <main class="workspace">
          <template v-if="activeView === 'overview'">
            <div class="overview-layout">
              <section class="overview-main">
                <header class="hero-head">
                  <div>
                    <h2>你的 AI 员工工作台</h2>
                    <p>一句话发起任务，对话式补齐事实，并持续推进到完成。</p>
                  </div>
                  <div class="avatar-row">
                    <span
                      v-for="(item, idx) in teamAvatars"
                      :key="`${item.name}-${idx}`"
                      class="mini-avatar"
                      :style="{ background: item.color }"
                    >
                      {{ item.name }}
                    </span>
                  </div>
                </header>

                <section class="composer-card">
                  <div class="composer-title">智能任务入口</div>
                  <div class="composer-shell">
                    <textarea
                      v-model="query"
                      class="composer-input"
                      rows="3"
                      placeholder="例如：我明天下午请半天年假，原因家里有事"
                      @keydown="onComposerKeydown"
                    />
                    <BaseButton variant="primary" :disabled="!canStart" @click="startFlowByText(query)">
                      {{ loading ? '处理中…' : '发起任务' }}
                    </BaseButton>
                  </div>
                  <div class="quick-list">
                    <button
                      v-for="prompt in quickLaunches"
                      :key="prompt"
                      class="quick-chip"
                      type="button"
                      @click="useQuickLaunch(prompt)"
                    >
                      {{ prompt }}
                    </button>
                  </div>
                </section>

                <div class="center-grid">
                  <section class="panel-card">
                    <div class="card-head">
                      <h3>AI 快捷建议</h3>
                      <button class="text-btn" type="button" @click="refreshData">刷新</button>
                    </div>
                    <p v-if="loadError" class="error">{{ loadError }}</p>
                    <div v-else class="suggest-list">
                      <button
                        v-for="item in topSuggestions"
                        :key="item.id"
                        class="suggest-item"
                        type="button"
                        @click="useSuggestion(item)"
                      >
                        <span>{{ item.title }}</span>
                        <span class="suggest-action">{{ item.actionText }}</span>
                      </button>
                    </div>
                  </section>

                  <section class="panel-card">
                    <div class="card-head">
                      <h3>任务进度追踪</h3>
                      <button class="text-btn" type="button" @click="replacePanel('tasks')">进入任务中心</button>
                    </div>
                    <div class="task-list">
                      <button
                        v-for="task in taskCards"
                        :key="task.taskId"
                        class="task-item"
                        type="button"
                        @click="openTask(task.taskId)"
                      >
                        <div class="task-main">
                          <div class="task-title">{{ task.summary.title }}</div>
                          <div class="task-time">{{ formatTime(task.updatedAt) }}</div>
                        </div>
                        <span class="task-status" :class="`status-${task.status}`">{{ getTaskStatusText(task.status) }}</span>
                      </button>
                      <p v-if="!taskCards.length" class="muted">暂无任务记录</p>
                    </div>
                  </section>
                </div>
              </section>

              <aside class="overview-side">
                <section class="panel-card news-card">
                  <div class="card-head">
                    <h3>资讯速览</h3>
                    <button class="icon-btn" type="button" :disabled="loading" @click="refreshData">⟳</button>
                  </div>
                  <div v-if="highlightNews" class="news-highlight">
                    <div class="news-title">{{ highlightNews.title }}</div>
                    <div class="news-meta">{{ highlightNews.source }} · {{ formatTime(highlightNews.publishedAt) }}</div>
                  </div>
                  <ul class="news-list">
                    <li v-for="item in news.slice(1)" :key="item.id">
                      <div class="news-item-title">{{ item.title }}</div>
                      <div class="news-item-meta">{{ item.source }}</div>
                    </li>
                  </ul>
                </section>

                <section class="stats-grid">
                  <article class="stat-card">
                    <div class="stat-value">{{ stats.total }}</div>
                    <div class="stat-label">全部任务</div>
                  </article>
                  <article class="stat-card stat-card--warm">
                    <div class="stat-value">{{ stats.inProgress }}</div>
                    <div class="stat-label">处理中</div>
                  </article>
                  <article class="stat-card stat-card--mint">
                    <div class="stat-value">{{ stats.done }}</div>
                    <div class="stat-label">已完成</div>
                  </article>
                </section>
              </aside>
            </div>
          </template>

          <template v-else>
            <section class="workspace-stage">
              <header class="stage-head">
                <div>
                  <div class="stage-title">{{ activeNav.label }}</div>
                  <div class="stage-subtitle">{{ activeNav.hint }}</div>
                </div>
                <button class="stage-back" type="button" @click="replacePanel('overview')">返回概览</button>
              </header>

              <div class="stage-body">
                <RecentTaskDetailsPage v-if="activeView === 'tasks'" />
                <AllFunctionsPage v-else-if="activeView === 'features'" />
                <ComingSoonPage v-else />
              </div>
            </section>
          </template>
        </main>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page {
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dashboard-shell {
  width: 95vw;
  height: 95vh;
  border-radius: 26px;
  overflow: hidden;
  position: relative;
  isolation: isolate;
  background:
    linear-gradient(
      135deg,
      rgba(255, 214, 102, 0.86) 0%,
      rgba(255, 228, 146, 0.66) 14%,
      rgba(255, 242, 206, 0.34) 26%,
      rgba(255, 252, 244, 0.18) 36%,
      rgba(255, 255, 255, 0.96) 48%,
      #ffffff 62%
    ),
    radial-gradient(circle at 86% 82%, rgba(147, 197, 253, 0.2), rgba(147, 197, 253, 0) 36%),
    radial-gradient(circle at 64% 22%, rgba(244, 114, 182, 0.12), rgba(244, 114, 182, 0) 32%),
    linear-gradient(180deg, #ffffff 0%, #fdfdff 100%);
  box-shadow: 0 20px 44px -28px rgba(15, 23, 42, 0.35);
}

.dashboard-shell::before {
  content: '';
  position: absolute;
  width: min(60vw, 900px);
  height: min(22vh, 260px);
  left: 22%;
  top: 56%;
  border-radius: 999px;
  background:
    radial-gradient(circle at 20% 45%, rgba(125, 211, 252, 0.24), rgba(125, 211, 252, 0.06) 42%, rgba(125, 211, 252, 0) 72%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.12));
  opacity: 0.7;
  pointer-events: none;
  z-index: 0;
  animation: cloud-drift-a 38s ease-in-out infinite alternate;
}

.dashboard-shell::after {
  content: '';
  position: absolute;
  width: min(54vw, 760px);
  height: min(20vh, 220px);
  left: 4%;
  top: 16%;
  border-radius: 999px;
  background:
    radial-gradient(circle at 65% 50%, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.04) 40%, rgba(251, 191, 36, 0) 72%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.08));
  opacity: 0.56;
  pointer-events: none;
  z-index: 0;
  animation: cloud-drift-b 52s ease-in-out infinite alternate;
}

.layout {
  position: relative;
  z-index: 1;
  height: 100%;
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.66), rgba(255, 255, 255, 0.46));
  backdrop-filter: blur(2px);
}

.left-rail {
  padding: 18px 16px;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: auto;
}

.brand-title {
  font-size: 23px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.brand-sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--wb-text-muted);
}

.profile-card,
.menu-card,
.upgrade-card,
.panel-card,
.composer-card,
.workspace-stage {
  background: transparent;
  border: none;
  box-shadow: none;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.hello {
  font-size: 18px;
  font-weight: 700;
}

.muted {
  font-size: 12px;
  color: var(--wb-text-muted);
}

.menu-card {
  margin-top: 28px;
  padding: 10px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 12px 24px -24px rgba(15, 23, 42, 0.5);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-row {
  width: 100%;
  min-height: 50px;
  padding: 0 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #1f2937;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.16s ease, color 0.16s ease;
}

.menu-row:hover,
.menu-row.active {
  background: #f5f7fb;
  color: #111827;
}

.menu-row:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 1px #d6dfef;
}

.menu-main {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.menu-icon {
  width: 18px;
  height: 18px;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.menu-icon svg {
  width: 18px;
  height: 18px;
}

.menu-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.menu-label {
  font-size: 13px;
  font-weight: 500;
}

.menu-hint {
  font-size: 11px;
  color: #94a3b8;
}

.menu-arrow {
  font-size: 20px;
  line-height: 1;
  color: #9ca3af;
  transition: transform 0.18s ease, color 0.18s ease;
}

.menu-row:hover .menu-icon,
.menu-row.active .menu-icon {
  color: #475569;
}

.menu-row:hover .menu-arrow,
.menu-row.active .menu-arrow {
  color: #64748b;
  transform: translateX(2px);
}

.upgrade-card {
  margin-top: auto;
  width: 100%;
  max-width: 220px;
  aspect-ratio: 1 / 1;
  padding: 18px;
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 14px 28px -24px rgba(15, 23, 42, 0.45);
  display: grid;
  align-content: start;
  gap: 10px;
}

.upgrade-title {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}

.upgrade-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--wb-text-muted);
}

.workspace {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 18px 22px 22px 0;
}

.overview-layout {
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 0;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 14px 30px -24px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.overview-main {
  min-width: 0;
  display: grid;
  grid-template-rows: auto auto 1fr;
  border-right: 1px solid rgba(226, 232, 240, 0.78);
  overflow: auto;
}

.overview-side {
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.hero-head {
  background: transparent;
  padding: 20px 20px 16px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.hero-head h2 {
  margin: 0;
  font-size: 33px;
  line-height: 1.12;
  letter-spacing: -0.02em;
}

.hero-head p {
  margin: 8px 0 0;
  color: var(--wb-text-muted);
  font-size: 14px;
}

.avatar-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.mini-avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  display: grid;
  place-items: center;
  box-shadow: 0 4px 10px -8px rgba(15, 23, 42, 0.4);
}

.composer-card {
  padding: 16px 20px;
  display: grid;
  gap: 10px;
}

.composer-title {
  font-size: 16px;
  font-weight: 700;
}

.composer-shell {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.composer-input {
  width: 100%;
  min-height: 92px;
  box-sizing: border-box;
  padding: 10px 12px;
  border: none;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.05);
  color: var(--wb-text);
  font-size: 14px;
  resize: none;
}

.composer-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.2);
}

.quick-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-chip {
  min-height: 30px;
  padding: 0 10px;
  border: none;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
  font-size: 12px;
}

.quick-chip:hover {
  background: rgba(59, 130, 246, 0.12);
}

.center-grid {
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.panel-card {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.center-grid .panel-card:first-child {
  border-right: 1px solid rgba(226, 232, 240, 0.78);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.card-head h3 {
  margin: 0;
  font-size: 15px;
}

.text-btn,
.icon-btn,
.stage-back {
  min-height: 28px;
  padding: 0 10px;
  border: none;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #475569;
  font-size: 12px;
}

.suggest-list,
.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggest-item,
.task-item {
  padding: 9px 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  text-align: left;
}

.suggest-item:hover,
.task-item:hover {
  background: rgba(59, 130, 246, 0.08);
}

.suggest-action {
  color: #4f46e5;
  font-size: 12px;
}

.task-main {
  min-width: 0;
  flex: 1;
}

.task-title {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-time {
  margin-top: 3px;
  font-size: 11px;
  color: #64748b;
}

.task-status {
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}

.status-done {
  background: var(--wb-status-done-bg);
  color: var(--wb-status-done-text);
}

.status-in_progress,
.status-submitted {
  background: var(--wb-status-progress-bg);
  color: var(--wb-status-progress-text);
}

.status-ready_to_submit,
.status-draft {
  background: var(--wb-status-ready-bg);
  color: var(--wb-status-ready-text);
}

.status-failed {
  background: var(--wb-status-failed-bg);
  color: var(--wb-status-failed-text);
}

.news-card {
  border-bottom: 1px solid rgba(226, 232, 240, 0.78);
}

.news-highlight {
  padding: 11px;
}

.news-title {
  font-weight: 700;
  font-size: 14px;
  color: #0f172a;
}

.news-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.news-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.news-list li {
  padding: 9px 10px;
}

.news-item-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.news-item-meta {
  margin-top: 3px;
  font-size: 11px;
  color: #64748b;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 16px 20px;
}

.stat-card {
  padding: 14px;
}

.stat-card--mint {
  grid-column: span 2;
}

.stat-value {
  font-size: 38px;
  line-height: 1;
  font-weight: 800;
  color: #0f172a;
}

.stat-label {
  margin-top: 5px;
  color: #64748b;
  font-size: 13px;
}

.workspace-stage {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  background: rgba(255, 255, 255, 0.74);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 14px 30px -24px rgba(15, 23, 42, 0.18);
}

.stage-head {
  padding: 18px 20px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.78);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.stage-title {
  font-size: 24px;
  font-weight: 800;
  color: #111827;
}

.stage-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}

.stage-body {
  min-height: 0;
  overflow: hidden;
  padding: 16px 18px 18px;
}

.stage-body :deep(.page) {
  height: 100%;
  min-height: 0;
}

.stage-body :deep(.layout) {
  height: 100%;
}

.error {
  margin: 0;
  color: #dc2626;
  font-size: 12px;
}

@keyframes cloud-drift-a {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(20px, -10px, 0) scale(1.02);
  }
  100% {
    transform: translate3d(38px, -16px, 0) scale(1.04);
  }
}

@keyframes cloud-drift-b {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(-16px, 8px, 0) scale(1.02);
  }
  100% {
    transform: translate3d(-28px, 12px, 0) scale(1.03);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-shell::before,
  .dashboard-shell::after {
    animation: none;
  }
}

@media (max-width: 1400px) {
  .overview-layout {
    grid-template-columns: minmax(0, 1fr) 290px;
  }
}

@media (max-width: 1180px) {
  .dashboard-shell {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }

  .layout {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .overview-layout {
    grid-template-columns: 1fr;
  }

  .overview-main {
    border-right: none;
  }

  .center-grid {
    grid-template-columns: 1fr;
  }

  .center-grid .panel-card:first-child {
    border-right: none;
  }

  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .stat-card--mint {
    grid-column: span 1;
  }
}

@media (max-width: 860px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .left-rail {
    padding-bottom: 0;
  }

  .upgrade-card {
    max-width: none;
    aspect-ratio: auto;
  }

  .workspace {
    padding: 0 12px 12px;
  }

  .hero-head {
    flex-direction: column;
  }

  .composer-shell {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stage-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
