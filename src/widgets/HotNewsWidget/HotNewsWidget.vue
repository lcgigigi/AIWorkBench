<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '../../api'
import type { NewsItem } from '../../api/types'

const loading = ref(false)
const items = ref<NewsItem[]>([])
const error = ref<string | null>(null)

async function refresh() {
  loading.value = true
  error.value = null
  try {
    items.value = await api.hotNews(4)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void refresh()
})
</script>

<template>
  <div class="wrap">
    <div class="row">
      <div class="meta">{{ loading ? '加载中…' : '🔥 最近热点' }}</div>
      <button class="btn" type="button" @click="refresh">刷新</button>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
    <ul v-else class="list">
      <li v-for="(n, index) in items" :key="n.id" class="item">
        <div class="item-index" :class="{ top3: index < 3 }">{{ index + 1 }}</div>
        <div class="item-content">
          <div class="t">{{ n.title }}</div>
          <div class="s">{{ n.source }} · {{ new Date(n.publishedAt).toLocaleString() }}</div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.meta {
  font-weight: 600;
  font-size: 13px;
  color: var(--wb-accent-peach-text);
  background: var(--wb-accent-peach);
  padding: 4px 10px;
  border-radius: 99px;
  display: inline-flex;
  align-items: center;
}
.btn {
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid var(--wb-border);
  background: var(--wb-surface);
  color: var(--wb-text-muted);
  font-size: 12px;
  transition: all 0.2s;
}
.btn:hover {
  background: var(--wb-surface-2);
  color: var(--wb-primary);
  border-color: var(--wb-primary-weak);
}
.error {
  color: var(--wb-danger);
  font-size: 13px;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.item {
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: var(--wb-surface-2);
  transition: all 0.2s;
  cursor: pointer;
}
.item:hover {
  background: var(--wb-surface);
  border-color: var(--wb-border);
  box-shadow: var(--wb-shadow-card);
  transform: translateX(2px);
}
.item-index {
  font-size: 14px;
  font-weight: 800;
  color: var(--wb-text-muted);
  min-width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.item-index.top3 {
  color: var(--wb-primary);
}
.item-content {
  flex: 1;
  min-width: 0;
}
.t {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--wb-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.s {
  margin-top: 4px;
  font-size: 12px;
  color: var(--wb-text-muted);
}
</style>

