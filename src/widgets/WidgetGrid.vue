<script setup lang="ts">
import { computed } from 'vue'
import { useWorkbenchStore } from '../stores/useWorkbenchStore'
import { widgetRegistry } from './registry'
import WidgetFrame from './WidgetFrame.vue'
import BaseButton from '../components/base/BaseButton.vue'

const wb = useWorkbenchStore()

const visibleWidgets = computed(() =>
  wb.widgets
    .filter((w) => !w.hidden)
    .map((state) => ({ state, def: widgetRegistry[state.id] }))
    .filter((x) => !!x.def),
)

const hasAnyWidget = computed(() => visibleWidgets.value.length > 0)
const hiddenCount = computed(() => wb.widgets.filter((w) => w.hidden).length)
const canRestore = computed(() => hiddenCount.value > 0)

function getGridSpan(spanCols?: 1 | 2 | 3) {
  return spanCols ?? 2
}

function onResetLayout() {
  wb.resetWidgets()
  wb.setLayoutEditing(false)
}
</script>

<template>
  <div class="wrap">
    <div v-if="canRestore" class="toolbar">
      <div class="tip">已关闭 {{ hiddenCount }} 个模块</div>
      <BaseButton size="sm" variant="primary" @click="onResetLayout()">恢复默认布局</BaseButton>
    </div>

    <div v-if="!hasAnyWidget" class="empty">
      <div class="t">暂无小组件</div>
      <div class="s">你可以恢复默认布局重新展示模块。</div>
      <BaseButton variant="primary" @click="onResetLayout()">恢复默认</BaseButton>
    </div>

    <div v-else class="grid">
      <div
        v-for="({ state, def }) in visibleWidgets"
        :key="def.id"
        class="item"
        :style="{ gridColumn: `span ${getGridSpan(def.layout?.spanCols)}` }"
      >
        <WidgetFrame
          :def="def"
          :collapsed="wb.layoutEditing ? state.collapsed : false"
          :show-controls="wb.layoutEditing"
          @toggleCollapsed="wb.toggleWidgetCollapsed(def.id)"
          @close="wb.closeWidget(def.id)"
        >
          <component :is="def.component" />
        </WidgetFrame>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tip {
  font-size: 12px;
  color: var(--wb-text-muted);
}

.empty {
  flex: 1;
  border: 1px dashed var(--wb-border);
  border-radius: var(--wb-radius-lg);
  background: var(--wb-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  text-align: center;
}
.empty .t {
  font-weight: 800;
  font-size: 16px;
}
.empty .s {
  color: var(--wb-text-muted);
  font-size: 13px;
  line-height: 1.5;
  max-width: 520px;
}

.grid {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
  padding: 2px;
}

.item {
  min-height: 220px;
}

@media (max-width: 980px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .item {
    grid-column: span 1 !important;
  }
}

@media (max-width: 680px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .item {
    grid-column: span 1 !important;
  }
}
</style>
