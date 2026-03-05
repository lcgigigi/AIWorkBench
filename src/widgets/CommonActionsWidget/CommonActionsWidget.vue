<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../api'
import type { AiSuggestion } from '../../api/types'
import { useExecutionFlowsStore } from '../../stores/useExecutionFlowsStore'
import { registerWidgetRefreshAction } from '../headerActions'

const router = useRouter()
const flows = useExecutionFlowsStore()
const loading = ref(false)
const error = ref<string | null>(null)
const items = ref<AiSuggestion[]>([])

async function refresh() {
  loading.value = true
  error.value = null
  try {
    items.value = await api.aiSuggestions(3)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function runSuggestion(s: AiSuggestion) {
  if (!s.actionPayload) return
  const flowId = await flows.startFlow(s.actionPayload)
  if (flowId) {
    void router.push({ name: 'recentTaskDetails', query: { flow: flowId } })
  }
}

onMounted(() => {
  registerWidgetRefreshAction('common_actions', {
    run: refresh,
    isLoading: () => loading.value,
  })
  void refresh()
})

onBeforeUnmount(() => {
  registerWidgetRefreshAction('common_actions', null)
})
</script>

<template>
  <div class="wrap">
    <div v-if="error" class="error">{{ error }}</div>

    <div v-else class="list">
      <button v-for="s in items" :key="s.id" class="card" type="button" @click="runSuggestion(s)">
        <div class="t">{{ s.title }}</div>
        <div class="a">{{ s.actionText ?? '去执行' }}</div>
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

.list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card {
  position: relative;
  width: 100%;
  text-align: left;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 10px;
  padding: 10px 8px;
  box-shadow: 0 5px 12px -10px rgba(15, 23, 42, 0.32);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
}

.card:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.09), rgba(99, 102, 241, 0.03));
  border-color: #dce2f8;
  box-shadow:
    0 10px 16px -12px rgba(79, 70, 229, 0.36),
    0 6px 14px -12px rgba(15, 23, 42, 0.28);
}

.t {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--wb-text);
  transition: color 0.2s ease;
}

.a {
  margin-top: 6px;
  font-size: 12px;
  color: var(--wb-text-muted);
  transition: color 0.2s ease;
}

.card:hover .t {
  color: #2f3a8f;
}

.card:hover .a {
  color: #5b657a;
}
</style>
