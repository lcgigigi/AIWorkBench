<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useExecutionFlowsStore } from '../../stores/useExecutionFlowsStore'
import BaseButton from '../../components/base/BaseButton.vue'

const flows = useExecutionFlowsStore()
const router = useRouter()
const text = ref('')
const textRef = ref<HTMLTextAreaElement | null>(null)

const quickPrompts = [
  {
    label: '请假半天',
    prompt: '我明天下午请半天年假，原因家里有事',
  },
  {
    label: '申请加班',
    prompt: '我今天申请加班到晚上九点，项目上线收尾',
  },
  {
    label: '申请调休',
    prompt: '我想把上周六加班换成下周一上午调休',
  },
  {
    label: '发起补假',
    prompt: '我想补昨天的请假记录，下午半天，原因身体不适',
  },
  {
    label: '发起销假',
    prompt: '我提前结束请假，今天下午开始恢复上班，请帮我发起销假',
  },
]

const canSend = computed(() => !flows.loading && text.value.trim().length > 0)

function resizeTextarea() {
  const node = textRef.value
  if (!node) return
  node.style.height = '0px'
  const nextHeight = Math.min(Math.max(node.scrollHeight, 94), 170)
  node.style.height = `${nextHeight}px`
}

function applyPrompt(prompt: string) {
  if (flows.loading) return
  text.value = prompt
  void nextTick(() => {
    resizeTextarea()
    textRef.value?.focus()
    const pos = text.value.length
    textRef.value?.setSelectionRange(pos, pos)
  })
}

async function send() {
  if (!canSend.value) return
  const msg = text.value.trim()
  text.value = ''
  resizeTextarea()
  const flowId = await flows.startFlow(msg)
  if (flowId) {
    void router.push({ name: 'dashboardNew', query: { panel: 'tasks', flow: flowId } })
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    void send()
  }
}

watch(text, () => {
  resizeTextarea()
})

onMounted(() => {
  resizeTextarea()
})
</script>

<template>
  <div class="wrap">
    <section class="hero">
      <div class="hero-main">
        <div class="hero-title">一句话发起任务，AI 自动推进流程</div>
        <p class="hero-sub">直接描述需求，系统会自动识别意图并进入任务详情持续处理。</p>
      </div>
    </section>

    <section class="composer">
      <div class="composer-shell">
        <textarea
          ref="textRef"
          v-model="text"
          class="ta"
          rows="2"
          placeholder="例如：我明天上午请病假，原因发烧"
          @keydown="onKeydown"
        />
        <div class="composer-actions">
          <div class="kbd">Enter 发送 · Shift + Enter 换行</div>
          <BaseButton
            class="send-btn"
            variant="primary"
            size="sm"
            :disabled="!canSend"
            @click="send"
          >
            {{ flows.loading ? '发送中…' : '发送' }}
          </BaseButton>
        </div>
      </div>
    </section>

    <section class="quick">
      <div class="quick-title">快捷发起</div>
      <div class="quick-list">
        <button
          v-for="item in quickPrompts"
          :key="item.label"
          class="quick-btn"
          type="button"
          :disabled="flows.loading"
          @click="applyPrompt(item.prompt)"
        >
          {{ item.label }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.wrap::before {
  content: '';
  position: absolute;
  inset: -8px -12px auto;
  height: 92px;
  border-radius: 16px;
  background: radial-gradient(90% 70% at 0% 0%, rgba(99, 102, 241, 0.14) 0%, rgba(99, 102, 241, 0) 72%);
  pointer-events: none;
}

.hero {
  position: relative;
  z-index: 1;
  border: 1px solid #d9defc;
  border-radius: 14px;
  background: linear-gradient(135deg, #f3f5ff 0%, #f9fbff 65%, #ffffff 100%);
  box-shadow: 0 6px 18px -14px rgba(79, 70, 229, 0.35);
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.hero-main {
  min-width: 0;
}

.hero-title {
  font-size: 15px;
  font-weight: 800;
  color: #2b3288;
}

.hero-sub {
  margin: 4px 0 0;
  color: var(--wb-text-muted);
  font-size: 12px;
  line-height: 1.45;
}

<<<<<<< ours
=======
.hero-stats {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.stat-chip {
  min-height: var(--wb-chip-height);
  border-radius: 999px;
  border: 1px solid #d1d8ff;
  background: #ffffff;
  color: #4552ba;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
}

.stat-chip--active {
  border-color: #c7d2fe;
  background: #eef2ff;
  color: #3730a3;
}

.stat-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.9;
}

>>>>>>> theirs
.quick {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-title {
  font-size: 12px;
  font-weight: 700;
  color: #424fbc;
}

.quick-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-btn {
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #d5dcff;
  background: linear-gradient(180deg, #ffffff 0%, #f7f8ff 100%);
  color: #3e4ab6;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.18s ease;
}

.quick-btn:hover:not(:disabled) {
  border-color: #bec8ff;
  transform: translateY(-1px);
  box-shadow: 0 6px 14px -12px rgba(79, 70, 229, 0.55);
}

.quick-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.composer {
  position: relative;
  z-index: 1;
  display: flex;
}

.composer-shell {
  width: 100%;
  border-radius: 14px;
  border: 1px solid #d9def8;
  background: #ffffff;
  box-shadow: var(--wb-shadow-sm);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.composer-shell:focus-within {
  border-color: var(--wb-primary);
  box-shadow: 0 0 0 3px var(--wb-primary-weak);
}

.ta {
  width: 100%;
  box-sizing: border-box;
  border-radius: 10px;
  padding: 11px 12px;
  border: 1px solid var(--wb-border);
  background: var(--wb-surface-2);
  color: var(--wb-text);
  outline: none;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  min-height: 94px;
  max-height: 170px;
  transition: border-color 0.2s ease;
}

.ta:focus {
  border-color: #c7d2fe;
}

.composer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.kbd {
  font-size: 12px;
  color: var(--wb-text-muted);
  white-space: nowrap;
}

.send-btn {
  min-width: 92px;
}

@media (max-width: 980px) {
  .hero {
    padding: 10px;
  }

  .composer-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .kbd {
    width: 100%;
  }
}
</style>
