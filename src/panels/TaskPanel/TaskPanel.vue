<script setup lang="ts">
import { computed } from 'vue'
import { useWorkbenchStore } from '../../stores/useWorkbenchStore'
import { useTaskPanelStore } from './useTaskPanelStore'

const wb = useWorkbenchStore()
const panel = useTaskPanelStore()

const hasDraft = computed(() => !!panel.draft && !!panel.scenario)
const hasTask = computed(() => !!panel.task)

const summary = computed(() => {
  if (!panel.draft || !panel.scenario) return null
  return panel.scenario.buildSummary(panel.draft.slots)
})

const stateText = computed(() => {
  switch (panel.state) {
    case 'Draft':
      return '草稿'
    case 'Editing':
      return '编辑中'
    case 'ReadyToSubmit':
      return '待确认'
    case 'Submitted':
      return '已提交'
    case 'Failed':
      return '失败'
    default:
      return panel.state
  }
})

function statusText(status?: string | null) {
  if (!status) return '—'
  switch (status) {
    case 'draft':
      return '草稿'
    case 'ready_to_submit':
      return '待确认'
    case 'submitted':
      return '已提交'
    case 'in_progress':
      return '处理中'
    case 'done':
      return '已完成'
    case 'failed':
      return '失败'
    default:
      return status
  }
}

function onBackdrop(e: Event) {
  if (e.target === e.currentTarget) {
    wb.closeTaskPanel()
  }
}
</script>

<template>
  <div v-if="wb.taskPanelOpen" class="backdrop" @mousedown="onBackdrop">
    <section class="panel">
      <header class="head">
        <div class="title">任务面板</div>
        <button class="close-btn" type="button" @click="wb.closeTaskPanel()">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div class="content">
        <div class="state">
          <span class="pill" :class="`pill-${panel.state.toLowerCase()}`">{{ stateText }}</span>
          <span v-if="panel.polling" class="pill pill-muted">状态更新中…</span>
        </div>

        <div v-if="!hasDraft && !hasTask" class="empty">
          <div class="hint">还没有任务。你可以在首页输入一句话发起请假。</div>
          <button class="btn primary" type="button" @click="panel.createMockDraftFromScenario('leave');">
            生成请假草稿（mock）
          </button>
        </div>

        <template v-else>
          <div v-if="hasDraft && panel.state === 'Draft'" class="block">
            <div class="hint">已解析出草稿，请补全缺失字段后提交。</div>
            <div v-if="panel.draft?.missingSlots.length" class="missing">
              缺失：<span v-for="k in panel.draft.missingSlots" :key="k" class="tag">{{ k }}</span>
            </div>
            <div v-if="panel.draft?.validations.length" class="val">
              <div v-for="(v, i) in panel.draft.validations" :key="i" class="val-item" :class="{ err: v.level === 'error' }">
                {{ v.message }}
              </div>
            </div>
            <button class="btn primary" type="button" @click="panel.startEditing()">补全字段</button>
          </div>

          <div v-else-if="hasDraft && panel.state === 'Editing'" class="block">
            <div class="form">
              <div
                v-for="f in panel.scenario!.slotFields"
                :key="f.key"
                class="field"
                :class="{ miss: panel.draft!.missingSlots.includes(f.key) }"
              >
                <label class="label">
                  {{ f.label }}
                  <span v-if="f.required" class="req">*</span>
                </label>

                <div v-if="f.type === 'date'" class="date-wrap">
                  <input
                    class="control control-date"
                    type="date"
                    :placeholder="f.placeholder"
                    :value="(panel.draft!.slots as any)[f.key] ?? ''"
                    @input="panel.updateSlot(f.key, ($event.target as HTMLInputElement).value)"
                  />
                  <div class="date-addon">
                    <svg class="date-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span class="date-tag">
                      {{ f.key === 'startDate' ? '开始' : f.key === 'endDate' ? '结束' : '' }}
                    </span>
                  </div>
                </div>

                <input
                  v-else-if="f.type === 'text'"
                  class="control"
                  type="text"
                  :placeholder="f.placeholder"
                  :value="(panel.draft!.slots as any)[f.key] ?? ''"
                  @input="panel.updateSlot(f.key, ($event.target as HTMLInputElement).value)"
                />

                <textarea
                  v-else-if="f.type === 'textarea'"
                  class="control control--ta"
                  rows="3"
                  :placeholder="f.placeholder"
                  :value="(panel.draft!.slots as any)[f.key] ?? ''"
                  @input="panel.updateSlot(f.key, ($event.target as HTMLTextAreaElement).value)"
                />

                <div class="select-wrap" v-else-if="f.type === 'select'">
                  <select
                    class="control"
                    :value="(panel.draft!.slots as any)[f.key] ?? ''"
                    @change="panel.updateSlot(f.key, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="" disabled>请选择</option>
                    <option v-for="op in f.options ?? []" :key="op.value" :value="op.value">
                      {{ op.label }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div v-if="panel.draft?.validations.length" class="val">
              <div v-for="(v, i) in panel.draft.validations" :key="i" class="val-item" :class="{ err: v.level === 'error' }">
                {{ v.message }}
              </div>
            </div>

            <div class="footer">
              <button class="btn" type="button" @click="panel.resetToDraft()">返回</button>
              <button class="btn primary" type="button" :disabled="!panel.isValid" @click="panel.goReadyToSubmit()">
                下一步：确认提交
              </button>
            </div>
          </div>

          <div v-else-if="hasDraft && panel.state === 'ReadyToSubmit'" class="block">
            <div class="hint">请确认提交摘要（会产生真实业务变更）。</div>
            <div v-if="summary" class="summary">
              <div class="sum-title">{{ summary.title }}</div>
              <div class="sum-lines">
                <div v-for="(l, i) in summary.lines" :key="i" class="sum-line">
                  <div class="k">{{ l.label }}</div>
                  <div class="v">{{ l.value }}</div>
                </div>
              </div>
            </div>
            <div class="footer">
              <button class="btn" type="button" @click="panel.backToEdit()">返回编辑</button>
              <button class="btn primary" type="button" :disabled="panel.submitting" @click="panel.submit()">
                {{ panel.submitting ? '提交中…' : '确认提交' }}
              </button>
            </div>
          </div>

          <div v-else-if="panel.state === 'Submitted'" class="block">
            <div class="hint">已提交，正在获取状态。</div>
            <div class="summary">
              <div class="sum-title">{{ panel.task?.summary.title ?? '—' }}</div>
              <div class="sum-lines">
                <div class="sum-line">
                  <div class="k">请求 ID</div>
                  <div class="v mono">{{ panel.task?.requestId ?? panel.requestId }}</div>
                </div>
                <div class="sum-line">
                  <div class="k">状态</div>
                  <div class="v status-val" :class="panel.task?.status?.toLowerCase()">
                    {{ statusText(panel.task?.status) }}
                  </div>
                </div>
              </div>
            </div>
            <div class="footer">
              <button class="btn primary" type="button" @click="wb.closeTaskPanel()">完成</button>
            </div>
          </div>

          <div v-else-if="panel.state === 'Failed'" class="block">
            <div class="error-box">
              <div class="err-title">失败</div>
              <div class="err-msg">{{ panel.error ?? '操作失败' }}</div>
            </div>
            <div class="footer">
              <button v-if="hasDraft" class="btn" type="button" @click="panel.backToEdit()">返回编辑</button>
              <button v-if="hasDraft" class="btn primary" type="button" :disabled="panel.submitting" @click="panel.submit()">
                {{ panel.submitting ? '重试中…' : '重试提交' }}
              </button>
              <button v-else class="btn primary" type="button" @click="wb.closeTaskPanel()">关闭</button>
            </div>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.panel {
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  background: var(--wb-surface);
  color: var(--wb-text);
  border-radius: var(--wb-radius-xl);
  box-shadow: var(--wb-shadow-lg), 0 20px 40px -10px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid var(--wb-border);
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--wb-border);
  background: linear-gradient(to right, var(--wb-surface-2), #eef2ff);
}

.title {
  font-weight: 700;
  font-size: 16px;
  color: var(--wb-text);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--wb-text-muted);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--wb-border);
  color: var(--wb-text);
}

.content {
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-width: 0;
}

.state {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  background: var(--wb-surface-2);
  color: var(--wb-text-muted);
  border: 1px solid var(--wb-border);
}

.pill-editing {
  background: var(--wb-accent-blue);
  color: var(--wb-accent-blue-text);
  border-color: transparent;
}

.pill-readytosubmit {
  background: var(--wb-accent-purple);
  color: var(--wb-accent-purple-text);
  border-color: transparent;
}

.pill-muted {
  background: var(--wb-surface-2);
  color: var(--wb-text-muted);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.hint {
  color: var(--wb-text-muted);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 8px;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  gap: 16px;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.missing {
  font-size: 13px;
  color: var(--wb-warn);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--wb-surface-2);
  color: var(--wb-text);
  border: 1px solid var(--wb-border);
  font-size: 12px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.date-wrap {
  position: relative;
  width: 100%;
  min-width: 0;
}

.control-date {
  padding-right: 96px;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.date-addon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  pointer-events: none;
}

.date-icon {
  width: 18px;
  height: 18px;
  color: var(--wb-primary);
}

.date-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--wb-primary-weak);
  color: var(--wb-primary-text);
}

.label {
  font-size: 13px;
  font-weight: 600;
  color: var(--wb-text);
}

.req {
  color: var(--wb-danger);
  margin-left: 4px;
}

.control {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border-radius: var(--wb-radius-sm);
  padding: 10px 14px;
  border: 1px solid var(--wb-border);
  background: var(--wb-surface);
  color: var(--wb-text);
  outline: none;
  font-size: 14px;
  transition: all 0.2s;
  box-shadow: var(--wb-shadow-sm);
}

.control:focus {
  border-color: var(--wb-primary);
  box-shadow: 0 0 0 3px var(--wb-primary-weak);
}

.control--ta {
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
  max-width: 100%;
}

select.control {
  appearance: none;
  cursor: pointer;
}

.select-wrap {
  position: relative;
  width: 100%;
  min-width: 0;
}

.select-wrap::after {
  content: '';
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 6px;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  pointer-events: none;
}

.miss .control {
  border-color: var(--wb-danger);
  background: var(--wb-danger-weak);
}

.val {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--wb-danger-weak);
  padding: 10px 12px;
  border-radius: 8px;
}

.val-item {
  font-size: 13px;
  color: var(--wb-danger);
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--wb-border);
}

.btn {
  border: 1px solid var(--wb-border);
  background: var(--wb-surface);
  color: var(--wb-text);
  font-weight: 500;
  border-radius: 999px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  box-shadow: var(--wb-shadow-sm);
}

.btn:hover {
  background: var(--wb-surface-2);
}

.btn.primary {
  border-color: transparent;
  background: linear-gradient(135deg, var(--wb-primary), #a855f7);
  color: white;
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
}

.btn.primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(99, 102, 241, 0.4);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.summary {
  border: 1px solid var(--wb-primary-weak);
  border-radius: var(--wb-radius-md);
  background: linear-gradient(to bottom right, var(--wb-surface), var(--wb-primary-weak));
  padding: 16px;
}

.sum-title {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 12px;
  color: var(--wb-primary-text);
}

.sum-lines {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sum-line {
  display: flex;
  gap: 12px;
  align-items: baseline;
}

.k {
  color: var(--wb-text-muted);
  font-size: 13px;
  width: 80px;
  flex-shrink: 0;
}

.v {
  font-size: 14px;
  color: var(--wb-text);
  font-weight: 500;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

.status-val.completed { color: var(--wb-accent-mint-text); }
.status-val.failed { color: var(--wb-danger); }
.status-val.processing { color: var(--wb-warn); }

.error-box {
  border: 1px solid var(--wb-danger);
  background: var(--wb-danger-weak);
  border-radius: var(--wb-radius-md);
  padding: 16px;
}

.err-title {
  font-weight: 700;
  color: var(--wb-danger);
  margin-bottom: 6px;
}

.err-msg {
  color: var(--wb-danger);
  font-size: 14px;
  line-height: 1.5;
}
</style>

