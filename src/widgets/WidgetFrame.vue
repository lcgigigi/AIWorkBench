<script setup lang="ts">
import { computed } from 'vue'
import type { WidgetDefinition } from './types'
import BaseButton from '../components/base/BaseButton.vue'
import { getWidgetRefreshAction } from './headerActions'

const props = withDefaults(
  defineProps<{
    def: WidgetDefinition
    collapsed: boolean
    showControls?: boolean
  }>(),
  {
    showControls: false,
  },
)

const emit = defineEmits<{
  (e: 'toggleCollapsed'): void
  (e: 'close'): void
}>()

const canCollapse = computed(() => props.showControls && props.def.collapsible !== false)
const canClose = computed(() => props.showControls && props.def.closable !== false)
const showActions = computed(() => canCollapse.value || canClose.value)
const isKeyWidget = computed(() => props.def.priority === 'key')
const refreshAction = computed(() => getWidgetRefreshAction(props.def.id))
const canRefresh = computed(() => !props.showControls && !!refreshAction.value)
const refreshing = computed(() => refreshAction.value?.isLoading?.() ?? false)

async function onRefresh() {
  if (!refreshAction.value || refreshing.value) return
  await refreshAction.value.run()
}
</script>

<template>
  <section class="card" :class="{ 'card--key': isKeyWidget }">
    <header class="head" :class="{ 'head--key': isKeyWidget }">
      <div class="title-wrap">
        <span v-if="isKeyWidget" class="key-dot" aria-hidden="true"></span>
        <div class="title" :class="{ 'title--key': isKeyWidget }">{{ def.title }}</div>
        <button
          v-if="canRefresh"
          class="refresh-icon-btn"
          type="button"
          :disabled="refreshing"
          aria-label="刷新"
          title="刷新"
          @click="onRefresh"
        >
          <svg class="refresh-icon" :class="{ spinning: refreshing }" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 12a8 8 0 11-2.34-5.66M20 4v6h-6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
      <div v-if="showActions" class="actions">
        <BaseButton v-if="canCollapse" size="sm" variant="ghost" @click="emit('toggleCollapsed')">
          {{ collapsed ? '展开' : '折叠' }}
        </BaseButton>
        <BaseButton v-if="canClose" size="sm" variant="ghost" @click="emit('close')">关闭</BaseButton>
      </div>
    </header>

    <div v-show="!collapsed" class="body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.card {
  border: none;
  border-radius: var(--wb-radius-lg);
  background: var(--wb-surface);
  overflow: hidden;
  box-shadow: var(--wb-shadow-card);
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid transparent;
}

.card--key {
  border-color: rgba(99, 102, 241, 0.26);
  box-shadow:
    0 8px 20px -10px rgba(99, 102, 241, 0.28),
    0 2px 8px rgba(99, 102, 241, 0.08);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 46px;
  padding: 7px 12px;
  border-bottom: 1px solid var(--wb-border);
}

.head--key {
  border-bottom-color: rgba(99, 102, 241, 0.18);
  background: linear-gradient(90deg, rgba(224, 231, 255, 0.62), rgba(238, 242, 255, 0));
}

.title-wrap {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title {
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title--key {
  color: #3730a3;
}

.key-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.16);
  flex-shrink: 0;
}

.refresh-icon-btn {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid var(--wb-border);
  background: var(--wb-surface);
  color: var(--wb-text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  padding: 0;
}

.refresh-icon-btn:hover:not(:disabled) {
  color: var(--wb-primary);
  border-color: #c7d2fe;
  background: #eef2ff;
}

.refresh-icon-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  width: 14px;
  height: 14px;
}

.refresh-icon.spinning {
  animation: refresh-spin 1s linear infinite;
}

@keyframes refresh-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.actions {
  display: flex;
  gap: 6px;
}

.body {
  padding: 14px;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
