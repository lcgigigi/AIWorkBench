<script setup lang="ts">
import { computed } from 'vue'
import type { WidgetDefinition } from './types'
import BaseButton from '../components/base/BaseButton.vue'

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
</script>

<template>
  <section class="card">
    <header class="head">
      <div class="title">{{ def.title }}</div>
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
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 54px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--wb-border);
}

.title {
  font-weight: 700;
  font-size: 15px;
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
