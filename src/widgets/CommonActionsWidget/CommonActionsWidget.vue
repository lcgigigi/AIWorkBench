<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '../../api'
import type { AiSuggestion } from '../../api/types'
import { useChatStore } from '../../stores/useChatStore'
import BaseButton from '../../components/base/BaseButton.vue'

const chat = useChatStore()
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
  await chat.sendMessage(s.actionPayload)
}

onMounted(() => {
  void refresh()
})
</script>

<template>
  <div class="wrap">
    <div class="row">
      <div class="meta">{{ loading ? '加载中…' : '✨ AI 猜你想做' }}</div>
      <BaseButton size="sm" variant="ghost" :disabled="loading" @click="refresh">刷新</BaseButton>
    </div>

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
  gap: 12px;
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
  color: var(--wb-accent-purple-text);
  background: var(--wb-accent-purple);
  padding: 4px 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
}

.error {
  color: var(--wb-danger);
  font-size: 13px;
}

.list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.card {
  text-align: left;
  border: 1px solid transparent;
  background: var(--wb-surface-2);
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.card:hover {
  background: var(--wb-surface);
  border-color: var(--wb-border);
  box-shadow: var(--wb-shadow-card);
  transform: translateX(2px);
}

.t {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--wb-text);
}

.a {
  margin-top: 6px;
  font-size: 12px;
  color: var(--wb-text-muted);
}
</style>

