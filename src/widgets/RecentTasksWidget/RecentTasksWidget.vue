<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTasksStore } from '../../stores/useTasksStore'
import { useTaskPanelStore } from '../../panels/TaskPanel/useTaskPanelStore'
import { useWorkbenchStore } from '../../stores/useWorkbenchStore'
import BaseButton from '../../components/base/BaseButton.vue'
import { getTaskStatusText } from '../../utils/taskStatus'

const tasks = useTasksStore()
const panel = useTaskPanelStore()
const wb = useWorkbenchStore()

const items = computed(() => tasks.recent.slice(0, 6))

async function openTask(taskId: string) {
  await panel.openTask(taskId)
  wb.openTaskPanel()
}

onMounted(() => {
  void tasks.fetchRecent(10)
})
</script>

<template>
  <div class="wrap">
    <div class="row">
      <div class="meta">{{ tasks.loading ? '加载中…' : '🕘 最近任务' }}</div>
      <BaseButton size="sm" variant="ghost" :disabled="tasks.loading" @click="tasks.fetchRecent(10)">
        刷新
      </BaseButton>
    </div>

    <div v-if="tasks.error" class="error">{{ tasks.error }}</div>

    <div v-else-if="!items.length" class="empty">还没有任务记录。</div>

    <div v-else class="list">
      <button v-for="t in items" :key="t.taskId" class="item" type="button" @click="openTask(t.taskId)">
        <div class="left">
          <div class="title">{{ t.summary?.title ?? '任务' }}</div>
          <div class="sub">{{ new Date(t.updatedAt ?? t.createdAt).toLocaleString() }}</div>
        </div>
        <div class="status" :class="t.status">{{ getTaskStatusText(t.status) }}</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.meta {
  font-weight: 600;
  font-size: 13px;
  color: var(--wb-accent-mint-text);
  background: var(--wb-accent-mint);
  min-height: var(--wb-chip-height);
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
}

.error {
  color: var(--wb-danger);
  font-size: 13px;
}

.empty {
  color: var(--wb-text-muted);
  font-size: 13px;
  padding: 8px 0;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: var(--wb-surface-2);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.item:hover {
  background: var(--wb-surface);
  border-color: var(--wb-border);
  box-shadow: var(--wb-shadow-card);
  transform: translateX(2px);
}

.left {
  flex: 1;
  min-width: 0;
}

.title {
  font-size: 13px;
  font-weight: 600;
  color: var(--wb-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--wb-text-muted);
}

.status {
  font-size: 12px;
  font-weight: 700;
  min-height: var(--wb-chip-height);
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--wb-border);
  color: var(--wb-text-muted);
  background: var(--wb-surface);
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
}

.status.done {
  background: var(--wb-status-done-bg);
  color: var(--wb-status-done-text);
  border-color: transparent;
}
.status.failed {
  background: var(--wb-status-failed-bg);
  color: var(--wb-status-failed-text);
  border-color: transparent;
}
.status.draft {
  background: var(--wb-status-draft-bg);
  color: var(--wb-status-draft-text);
  border-color: transparent;
}
.status.ready_to_submit {
  background: var(--wb-status-ready-bg);
  color: var(--wb-status-ready-text);
  border-color: transparent;
}
.status.in_progress {
  background: var(--wb-status-progress-bg);
  color: var(--wb-status-progress-text);
  border-color: transparent;
}
.status.submitted {
  background: var(--wb-status-submitted-bg);
  color: var(--wb-status-submitted-text);
  border-color: transparent;
}
</style>
