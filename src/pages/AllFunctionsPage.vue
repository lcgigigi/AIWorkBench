<script setup lang="ts">
import { useWorkbenchStore } from '../stores/useWorkbenchStore'
import { useTaskPanelStore } from '../panels/TaskPanel/useTaskPanelStore'
import BaseButton from '../components/base/BaseButton.vue'

interface FunctionItem {
  id: string
  title: string
  desc: string
  status: 'available' | 'planned'
}

const wb = useWorkbenchStore()
const panel = useTaskPanelStore()

const functionItems: FunctionItem[] = [
  { id: 'apply-leave', title: '请假申请', desc: '发起请假并提交审批。', status: 'available' },
  { id: 'make-up-leave', title: '补假申请', desc: '补提历史缺失请假记录。', status: 'planned' },
  { id: 'cancel-leave', title: '销假申请', desc: '提前返岗后提交销假。', status: 'planned' },
  { id: 'apply-overtime', title: '申请加班', desc: '填写加班时段与事由。', status: 'planned' },
  { id: 'apply-timeoff', title: '申请调休', desc: '使用可用调休时长。', status: 'planned' },
]

function openLeaveFlow() {
  panel.createMockDraftFromScenario('leave')
  wb.openTaskPanel()
}
</script>

<template>
  <section class="page">
    <div class="tips">
      <div class="tips-title">流程中心</div>
      <div class="tips-desc">你可以从这里统一进入各类业务流程，当前已接入请假示例流程。</div>
    </div>

    <div class="grid">
      <article v-for="item in functionItems" :key="item.id" class="card">
        <div class="head">
          <h3 class="title">{{ item.title }}</h3>
          <span class="badge" :class="`badge-${item.status}`">
            {{ item.status === 'available' ? '可用' : '规划中' }}
          </span>
        </div>
        <p class="desc">{{ item.desc }}</p>
        <div class="actions">
          <BaseButton
            v-if="item.id === 'apply-leave'"
            variant="primary"
            size="sm"
            @click="openLeaveFlow"
          >
            立即发起
          </BaseButton>
          <BaseButton v-else variant="ghost" size="sm" disabled>即将支持</BaseButton>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.page {
  height: 100%;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tips {
  border-radius: var(--wb-radius-lg);
  background: var(--wb-surface);
  border: 1px solid var(--wb-border);
  box-shadow: var(--wb-shadow-sm);
  padding: 14px 16px;
}

.tips-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--wb-text);
}

.tips-desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--wb-text-muted);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.card {
  border-radius: var(--wb-radius-lg);
  background: var(--wb-surface);
  border: 1px solid var(--wb-border);
  box-shadow: var(--wb-shadow-sm);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.title {
  margin: 0;
  font-size: 16px;
  color: var(--wb-text);
}

.badge {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
}

.badge-available {
  background: var(--wb-accent-mint);
  color: var(--wb-accent-mint-text);
}

.badge-planned {
  background: var(--wb-accent-blue);
  color: var(--wb-accent-blue-text);
}

.desc {
  margin: 0;
  min-height: 40px;
  font-size: 13px;
  color: var(--wb-text-muted);
  line-height: 1.5;
}

.actions {
  margin-top: 6px;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
