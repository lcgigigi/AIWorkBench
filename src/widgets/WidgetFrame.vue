<script setup lang="ts">
import { computed } from 'vue'
import type { WidgetDefinition } from './types'
import BaseButton from '../components/base/BaseButton.vue'

const props = defineProps<{
  def: WidgetDefinition
  collapsed: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleCollapsed'): void
  (e: 'close'): void
}>()

const canCollapse = computed(() => props.def.collapsible !== false)
const canClose = computed(() => props.def.closable !== false)
</script>

<template>
  <section class="card">
    <header class="head">
      <div class="title">{{ def.title }}</div>
      <div class="actions">
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
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--wb-border);
}

.title {
  font-weight: 700;
  font-size: 15px;
}

.actions {
  display: flex;
  gap: 8px;
}

.body {
  padding: 16px;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>

