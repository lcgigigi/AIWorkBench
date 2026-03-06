<script setup lang="ts">
import { useRouter } from 'vue-router'

import { useExecutionFlowsStore } from '../stores/useExecutionFlowsStore'
import BaseButton from '../components/base/BaseButton.vue'

interface FunctionItem {
  id: string
  title: string
  desc: string
  status: 'available' | 'planned'
  prompt?: string
}

const router = useRouter()
const flows = useExecutionFlowsStore()

const functionItems: FunctionItem[] = [
  {
    id: 'apply-leave',
    title: '请假申请',
    desc: '通过 AI 对话整理假别、日期、时段与原因，生成可执行流程。',
    status: 'available',
    prompt: '我想请假，明天下午半天，原因家里有事',
  },
  { id: 'make-up-leave', title: '补假申请', desc: '补提历史缺失请假记录。', status: 'planned' },
  { id: 'cancel-leave', title: '销假申请', desc: '提前返岗后提交销假。', status: 'planned' },
  { id: 'apply-overtime', title: '申请加班', desc: '填写加班时段与事由。', status: 'planned' },
  { id: 'apply-timeoff', title: '申请调休', desc: '使用可用调休时长。', status: 'planned' },
]

async function openFunction(item: FunctionItem) {
  if (!item.prompt) return
  const flowId = await flows.startFlow(item.prompt)
  if (!flowId) return
  void router.replace({ name: 'dashboardNew', query: { panel: 'tasks', flow: flowId } })
}
</script>

<template>
  <section class="page">
    <div class="tips">
      <div class="tips-title">流程中心</div>
      <div class="tips-desc">当前优先接入请假流程，其余能力保留样式与入口占位，后续继续扩展。</div>
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
            v-if="item.status === 'available'"
            variant="primary"
            size="sm"
            @click="openFunction(item)"
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
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.66);
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
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
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
  line-height: 1.5;
  color: var(--wb-text-muted);
}

.actions {
  margin-top: auto;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
