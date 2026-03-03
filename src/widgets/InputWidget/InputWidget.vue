<script setup lang="ts">
import { computed, ref } from 'vue'
import { useChatStore } from '../../stores/useChatStore'
import BaseButton from '../../components/base/BaseButton.vue'

const chat = useChatStore()
const text = ref('')

const canSend = computed(() => !chat.loading && text.value.trim().length > 0)
const lastAssistantText = computed(() => {
  for (let i = chat.messages.length - 1; i >= 0; i--) {
    const m = chat.messages[i]
    if (m?.role === 'assistant') return m.text
  }
  return ''
})

async function send() {
  if (!canSend.value) return
  const msg = text.value
  text.value = ''
  await chat.sendMessage(msg)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    void send()
  }
}
</script>

<template>
  <div class="wrap">
    <div class="top">
      <div class="hint">输入一句话发起任务（如：我明天下午请半天年假）。</div>
      <div v-if="chat.error" class="err">{{ chat.error }}</div>
      <div v-else-if="lastAssistantText" class="reply">{{ lastAssistantText }}</div>
    </div>

    <div class="composer">
      <textarea
        v-model="text"
        class="ta"
        rows="3"
        placeholder="例如：我明天上午请病假，原因发烧"
        @keydown="onKeydown"
      />
      <div class="row">
        <div class="kbd">Ctrl/Cmd + Enter 发送</div>
        <BaseButton variant="primary" :disabled="!canSend" @click="send">
          {{ chat.loading ? '发送中…' : '发送' }}
        </BaseButton>
      </div>
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

.top {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hint {
  color: var(--wb-text-muted);
  font-size: 13px;
  line-height: 1.5;
}

.err {
  color: var(--wb-danger);
  font-size: 13px;
}

.reply {
  font-size: 13px;
  line-height: 1.5;
  color: var(--wb-text);
  background: var(--wb-surface-2);
  border: 1px solid var(--wb-border);
  border-radius: 12px;
  padding: 10px 12px;
}

.composer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.ta {
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  padding: 10px 12px;
  border: 1px solid var(--wb-border);
  background: var(--wb-surface);
  color: var(--wb-text);
  outline: none;
  font-size: 13px;
  resize: vertical;
  min-height: 80px;
  box-shadow: var(--wb-shadow-sm);
  transition: all 0.2s;
}

.ta:focus {
  border-color: var(--wb-primary);
  box-shadow: 0 0 0 3px var(--wb-primary-weak);
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.kbd {
  font-size: 12px;
  color: var(--wb-text-muted);
}
</style>

