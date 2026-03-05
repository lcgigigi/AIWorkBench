<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useTasksStore } from '../../stores/useTasksStore'
import { useTaskPanelStore } from '../../panels/TaskPanel/useTaskPanelStore'
import { useWorkbenchStore } from '../../stores/useWorkbenchStore'
import { getTaskStatusText } from '../../utils/taskStatus'
import { registerWidgetRefreshAction } from '../headerActions'

const tasks = useTasksStore()
const panel = useTaskPanelStore()
const wb = useWorkbenchStore()

const items = computed(() => tasks.recent.slice(0, 6))

async function openTask(taskId: string) {
  await panel.openTask(taskId)
  wb.openTaskPanel()
}

onMounted(() => {
  registerWidgetRefreshAction('recent_tasks', {
    run: () => tasks.fetchRecent(10),
    isLoading: () => tasks.loading,
  })
  void tasks.fetchRecent(10)
})

onBeforeUnmount(() => {
  registerWidgetRefreshAction('recent_tasks', null)
})
</script>

<template>
  <div class="wrap">
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
  gap: 8px;
  height: 100%;
  min-height: 0;
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
  gap: 2px;
}

.item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 8px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 10px;
  box-shadow: 0 5px 12px -10px rgba(15, 23, 42, 0.32);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
  text-align: left;
}

.item:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.09), rgba(99, 102, 241, 0.03));
  border-color: #dce2f8;
  box-shadow:
    0 10px 16px -12px rgba(79, 70, 229, 0.36),
    0 6px 14px -12px rgba(15, 23, 42, 0.28);
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
  transition: color 0.2s ease;
}

.sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--wb-text-muted);
  transition: color 0.2s ease;
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

.item:hover .title {
  color: #2f3a8f;
}

.item:hover .sub {
  color: #5b657a;
}
</style>
