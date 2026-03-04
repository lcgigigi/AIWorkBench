<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BaseButton from '../components/base/BaseButton.vue'
import { useTasksStore } from '../stores/useTasksStore'
import { getTaskStatusText } from '../utils/taskStatus'
import { useTaskPanelStore } from '../panels/TaskPanel/useTaskPanelStore'
import { useWorkbenchStore } from '../stores/useWorkbenchStore'

const tasks = useTasksStore()
const panel = useTaskPanelStore()
const wb = useWorkbenchStore()
const selectedTaskId = ref<string | null>(null)

const selectedTask = computed(
  () => tasks.recent.find((task) => task.taskId === selectedTaskId.value) ?? null,
)

watch(
  () => tasks.recent,
  (items) => {
    if (!items.length) {
      selectedTaskId.value = null
      return
    }
    if (!selectedTaskId.value || !items.some((item) => item.taskId === selectedTaskId.value)) {
      selectedTaskId.value = items[0]!.taskId
    }
  },
  { immediate: true },
)

async function refresh() {
  await tasks.fetchRecent(20)
}

async function openInPanel() {
  if (!selectedTaskId.value) return
  await panel.openTask(selectedTaskId.value)
  wb.openTaskPanel()
}

onMounted(() => {
  void refresh()
})
</script>

<template>
  <section class="page">
    <div class="layout">
      <div class="list-panel">
        <div class="head">
          <div class="title">任务列表</div>
          <BaseButton size="sm" variant="ghost" :disabled="tasks.loading" @click="refresh">
            刷新
          </BaseButton>
        </div>
        <div v-if="tasks.error" class="error">{{ tasks.error }}</div>
        <div v-else-if="!tasks.recent.length" class="empty">暂无任务记录。</div>
        <div v-else class="list">
          <button
            v-for="task in tasks.recent"
            :key="task.taskId"
            class="item"
            :class="{ active: selectedTaskId === task.taskId }"
            type="button"
            @click="selectedTaskId = task.taskId"
          >
            <div class="item-title">{{ task.summary.title }}</div>
            <div class="item-time">{{ new Date(task.updatedAt).toLocaleString() }}</div>
            <div class="item-status" :class="`status-${task.status}`">{{ getTaskStatusText(task.status) }}</div>
          </button>
        </div>
      </div>

      <div class="detail-panel">
        <div v-if="!selectedTask" class="empty">请选择左侧任务查看详情。</div>
        <template v-else>
          <div class="head">
            <div class="title">{{ selectedTask.summary.title }}</div>
            <BaseButton size="sm" variant="primary" @click="openInPanel">在任务面板打开</BaseButton>
          </div>

          <div class="detail-grid">
            <div class="row">
              <span class="k">任务 ID</span>
              <span class="v mono">{{ selectedTask.taskId }}</span>
            </div>
            <div class="row">
              <span class="k">请求 ID</span>
              <span class="v mono">{{ selectedTask.requestId }}</span>
            </div>
            <div class="row">
              <span class="k">状态</span>
              <span class="v" :class="`status-${selectedTask.status}`">{{ getTaskStatusText(selectedTask.status) }}</span>
            </div>
            <div class="row">
              <span class="k">创建时间</span>
              <span class="v">{{ new Date(selectedTask.createdAt).toLocaleString() }}</span>
            </div>
            <div class="row">
              <span class="k">更新时间</span>
              <span class="v">{{ new Date(selectedTask.updatedAt).toLocaleString() }}</span>
            </div>
          </div>

          <div class="summary">
            <div v-for="line in selectedTask.summary.lines" :key="line.label" class="sum-row">
              <span class="sum-k">{{ line.label }}</span>
              <span class="sum-v">{{ line.value }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page {
  height: 100%;
  min-height: 0;
}

.layout {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 12px;
}

.list-panel,
.detail-panel {
  border-radius: var(--wb-radius-lg);
  background: var(--wb-surface);
  border: 1px solid var(--wb-border);
  box-shadow: var(--wb-shadow-sm);
  padding: 12px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.title {
  font-size: 15px;
  font-weight: 700;
  color: var(--wb-text);
}

.list {
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item {
  text-align: left;
  border-radius: 12px;
  border: 1px solid transparent;
  background: var(--wb-surface-2);
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.item:hover {
  border-color: var(--wb-border);
}

.item.active {
  border-color: var(--wb-primary);
  box-shadow: 0 0 0 2px var(--wb-primary-weak);
}

.item-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--wb-text);
}

.item-time,
.item-status {
  margin-top: 4px;
  font-size: 12px;
  color: var(--wb-text-muted);
}

.item-status {
  width: fit-content;
  border-radius: 999px;
  padding: 0 8px;
  min-height: 22px;
  display: inline-flex;
  align-items: center;
  border: 1px solid transparent;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-radius: 10px;
  background: var(--wb-surface-2);
  padding: 8px 10px;
}

.k {
  font-size: 12px;
  color: var(--wb-text-muted);
}

.v {
  font-size: 13px;
  color: var(--wb-text);
}

.v[class*='status-'] {
  border-radius: 999px;
  padding: 2px 8px;
  font-weight: 700;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.summary {
  margin-top: 12px;
  border-top: 1px dashed var(--wb-border);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sum-row {
  display: flex;
  gap: 14px;
}

.sum-k {
  width: 72px;
  font-size: 12px;
  color: var(--wb-text-muted);
}

.sum-v {
  flex: 1;
  font-size: 13px;
  color: var(--wb-text);
}

.empty {
  color: var(--wb-text-muted);
  font-size: 13px;
  margin-top: 8px;
}

.error {
  color: var(--wb-danger);
  font-size: 13px;
}

.status-draft {
  background: var(--wb-status-draft-bg);
  color: var(--wb-status-draft-text);
}

.status-ready_to_submit {
  background: var(--wb-status-ready-bg);
  color: var(--wb-status-ready-text);
}

.status-submitted {
  background: var(--wb-status-submitted-bg);
  color: var(--wb-status-submitted-text);
}

.status-in_progress {
  background: var(--wb-status-progress-bg);
  color: var(--wb-status-progress-text);
}

.status-done {
  background: var(--wb-status-done-bg);
  color: var(--wb-status-done-text);
}

.status-failed {
  background: var(--wb-status-failed-bg);
  color: var(--wb-status-failed-text);
}

@media (max-width: 980px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
