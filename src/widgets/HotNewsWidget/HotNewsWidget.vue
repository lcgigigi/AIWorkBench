<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { api } from '../../api'
import type { NewsItem } from '../../api/types'
import { registerWidgetRefreshAction } from '../headerActions'

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
  registerWidgetRefreshAction('hot_news', {
    run: refresh,
    isLoading: () => loading.value,
  })
  void refresh()
})

onBeforeUnmount(() => {
  registerWidgetRefreshAction('hot_news', null)
})
</script>

<template>
  <div class="wrap">
    <div v-if="error" class="error">{{ error }}</div>
    <ul v-else class="list">
      <li v-for="(n, index) in items" :key="n.id" class="item">
        <div class="item-index" :class="{ top3: index < 3 }">{{ index + 1 }}</div>
        <div class="item-content">
          <div class="t">{{ n.title }}</div>
          <div class="s">{{ n.source }} · {{ new Date(n.publishedAt).toLocaleString('zh-CN', { hour12: false }) }}</div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
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
  gap: 2px;
}
.item {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 10px 8px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  box-shadow: 0 5px 12px -10px rgba(15, 23, 42, 0.32);
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
  cursor: pointer;
}

.item:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.09), rgba(99, 102, 241, 0.03));
  border-color: #dce2f8;
  box-shadow:
    0 10px 16px -12px rgba(79, 70, 229, 0.36),
    0 6px 14px -12px rgba(15, 23, 42, 0.28);
}
.item-index {
  font-size: 13px;
  font-weight: 700;
  color: #9aa3bb;
  min-width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.item-index.top3 {
  color: #6366f1;
}
.item-content {
  flex: 1;
  min-width: 0;
}
.t {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--wb-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}
.s {
  margin-top: 4px;
  font-size: 12px;
  color: var(--wb-text-muted);
  transition: color 0.2s ease;
}

.item:hover .t {
  color: #2f3a8f;
}

.item:hover .s {
  color: #5b657a;
}
</style>
