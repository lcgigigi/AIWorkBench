<script setup lang="ts">
import BaseButton from '../components/base/BaseButton.vue'
import { useRecentTaskDetailsPage } from './recent-task-details/useRecentTaskDetailsPage'

const {
  tasks,
  flowStore,
  detailMode,
  hasAnyListItem,
  flowList,
  selectedKind,
  selectedFlowId,
  selectedTaskId,
  selectedFlow,
  selectedTask,
  flowStatusLabel,
  flowStatusClass,
  flowStatusText,
  refresh,
  openFlow,
  selectTask,
  openInPanel,
  openFlowTaskInPanel,
  getTaskStatusText,
  chatItems,
  messagesRef,
  typingMessageId,
  typingText,
  roleLabel,
  formatMessageTime,
  factRows,
  editingFactKey,
  factEdits,
  saveFactEdit,
  cancelFactEdit,
  beginEditFact,
  displayFactValue,
  missingLabels,
  canApplyFactChanges,
  askAiSuggestion,
  applyFactChanges,
  canExecuteFlow,
  onExecute,
  followUp,
  canSendFollowUp,
  onSendFollowUp,
  onFollowUpKeydown,
  statusTextForFlowTask,
  taskStatusHint,
  taskSummaryPrimary,
  taskSummaryLong,
} = useRecentTaskDetailsPage()
</script>

<template>
  <section class="page">
    <div class="layout">
      <div class="list-panel">
        <div class="head">
          <div class="title">任务列表（含 AI 流程）</div>
          <BaseButton size="sm" variant="ghost" :disabled="tasks.loading" @click="refresh">
            刷新
          </BaseButton>
        </div>
        <div v-if="tasks.error" class="error">{{ tasks.error }}</div>
        <div v-else-if="!hasAnyListItem" class="empty">暂无任务记录。</div>
        <div v-else class="list">
          <div v-if="flowList.length" class="section-label">进行中的 AI 流程</div>
          <button
            v-for="flow in flowList"
            :key="flow.flowId"
            class="item item--flow"
            :class="[`flow-${flow.status}`, { active: selectedKind === 'flow' && selectedFlowId === flow.flowId }]"
            type="button"
            @click="openFlow(flow.flowId)"
          >
            <div class="item-title">{{ flow.title }}</div>
            <div class="item-time">{{ flow.messages.length }} 条对话 · {{ new Date(flow.updatedAt).toLocaleTimeString('zh-CN', { hour12: false }) }}</div>
            <div class="item-status flow-state">{{ flowStatusText(flow.status) }}</div>
          </button>

          <div v-if="tasks.recent.length" class="section-label">任务记录</div>
          <button
            v-for="task in tasks.recent"
            :key="task.taskId"
            class="item"
            :class="{ active: selectedKind === 'task' && selectedTaskId === task.taskId }"
            type="button"
            @click="selectTask(task.taskId)"
          >
            <div class="item-title">{{ task.summary.title }}</div>
            <div class="item-time">{{ new Date(task.updatedAt).toLocaleString('zh-CN', { hour12: false }) }}</div>
            <div class="item-status" :class="`status-${task.status}`">{{ getTaskStatusText(task.status) }}</div>
          </button>
        </div>
      </div>

      <div class="detail-panel">
        <div v-if="detailMode === 'empty'" class="empty">请选择左侧任务查看详情。</div>

        <template v-else-if="detailMode === 'flow' && selectedFlow">
          <div class="head">
            <div class="title-wrap">
              <div class="title">{{ selectedFlow.title }}</div>
              <span class="item-status flow-chip" :class="flowStatusClass">{{ flowStatusLabel }}</span>
            </div>
            <BaseButton
              size="sm"
              variant="ghost"
              :disabled="!selectedFlow.task"
              @click="openFlowTaskInPanel"
            >
              在任务面板打开
            </BaseButton>
          </div>

          <section class="flow-chat-stage">
            <div ref="messagesRef" class="messages">
              <article
                v-for="item in chatItems"
                :key="item.id"
                class="msg"
                :class="[`msg-${item.role}`, item.kind !== 'text' ? 'msg-card' : '']"
              >
                <div class="meta">
                  <span>{{ roleLabel(item.role) }}</span>
                  <span>{{ formatMessageTime(item.createdAt) }}</span>
                </div>

                <div v-if="item.kind === 'text'" class="body">
                  <template v-if="item.role === 'assistant' && item.id === typingMessageId">
                    {{ typingText }}<span class="typing-cursor">|</span>
                  </template>
                  <template v-else>
                    {{ item.text }}
                  </template>
                </div>

                <div v-else-if="item.kind === 'facts-card'" class="ai-card">
                  <div class="ai-card-title">事实清单（AI 已整理）</div>
                  <div class="fact-list">
                    <div
                      v-for="fact in factRows"
                      :key="fact.key"
                      class="fact-item"
                      :class="{ missing: fact.missing }"
                    >
                      <span class="k">{{ fact.label }}</span>

                      <div class="fact-value-wrap">
                        <template v-if="editingFactKey === fact.key">
                          <select
                            v-if="fact.type === 'select'"
                            v-model="factEdits[fact.key]"
                            class="fact-input"
                          >
                            <option value="">请选择</option>
                            <option
                              v-for="option in fact.options"
                              :key="option.value"
                              :value="option.value"
                            >
                              {{ option.label }}
                            </option>
                          </select>
                          <textarea
                            v-else-if="fact.type === 'textarea'"
                            v-model="factEdits[fact.key]"
                            class="fact-input fact-input-ta"
                            rows="2"
                          />
                          <input
                            v-else
                            v-model="factEdits[fact.key]"
                            class="fact-input"
                            :type="fact.type === 'date' ? 'date' : 'text'"
                          />
                          <div class="fact-inline-actions">
                            <button type="button" class="mini-btn" @click="saveFactEdit">完成</button>
                            <button type="button" class="mini-btn ghost" @click="cancelFactEdit(fact.key)">取消</button>
                          </div>
                        </template>

                        <template v-else>
                          <span class="v">{{ displayFactValue(fact) }}</span>
                          <button type="button" class="mini-link" @click="beginEditFact(fact.key)">
                            修改
                          </button>
                        </template>
                      </div>
                    </div>
                  </div>

                  <div v-if="missingLabels.length" class="missing-note">
                    仍需补齐：{{ missingLabels.join('、') }}
                  </div>

                  <div class="card-divider" />
                  <div class="exec-title">执行信息</div>
                  <div class="exec-row">
                    <span class="k">执行状态</span>
                    <span class="v">{{ flowStatusLabel }}</span>
                  </div>
                  <div class="exec-row">
                    <span class="k">任务状态</span>
                    <span class="v" :class="selectedFlow.task ? `status-${selectedFlow.task.status}` : ''">
                      {{ statusTextForFlowTask() }}
                    </span>
                  </div>
                  <div class="exec-row">
                    <span class="k">当前进展</span>
                    <span class="v">{{ selectedFlow.task ? taskStatusHint(selectedFlow.task.status) : '等待执行任务。' }}</span>
                  </div>
                  <div class="exec-row">
                    <span class="k">最近更新</span>
                    <span class="v">{{ new Date(selectedFlow.updatedAt).toLocaleString('zh-CN', { hour12: false }) }}</span>
                  </div>
                  <div v-if="selectedFlow.error" class="error">{{ selectedFlow.error }}</div>

                  <div class="card-actions card-actions--flow">
                    <BaseButton size="sm" variant="ghost" :disabled="flowStore.loading" @click="askAiSuggestion">
                      请 AI 给建议
                    </BaseButton>
                    <BaseButton
                      size="sm"
                      variant="ghost"
                      :disabled="!canApplyFactChanges"
                      @click="applyFactChanges"
                    >
                      应用修改并告诉 AI
                    </BaseButton>
                    <BaseButton variant="primary" :disabled="!canExecuteFlow" @click="onExecute">
                      {{ flowStore.loading ? '执行中…' : '执行任务' }}
                    </BaseButton>
                  </div>
                </div>
              </article>
            </div>

            <div class="composer">
              <div class="composer-inline">
                <textarea
                  v-model="followUp"
                  class="ta"
                  rows="2"
                  placeholder="继续告诉 AI：例如“改成下周一上午，原因写正式一些”"
                  @keydown="onFollowUpKeydown"
                />
                <BaseButton
                  class="composer-send"
                  size="sm"
                  variant="primary"
                  :disabled="!canSendFollowUp"
                  @click="onSendFollowUp"
                >
                  {{ flowStore.loading ? '处理中…' : '继续推进' }}
                </BaseButton>
              </div>
            </div>
          </section>
        </template>

        <template v-else-if="selectedTask">
          <div class="head">
            <div class="title">{{ selectedTask.summary.title }}</div>
            <BaseButton size="sm" variant="primary" @click="openInPanel">在任务面板打开</BaseButton>
          </div>

          <div class="detail-grid">
            <div class="row">
              <span class="k">当前状态</span>
              <span class="v" :class="`status-${selectedTask.status}`">{{ getTaskStatusText(selectedTask.status) }}</span>
            </div>
            <div class="row">
              <span class="k">当前进展</span>
              <span class="v">{{ taskStatusHint(selectedTask.status) }}</span>
            </div>
            <div class="row">
              <span class="k">提交时间</span>
              <span class="v">{{ new Date(selectedTask.createdAt).toLocaleString('zh-CN', { hour12: false }) }}</span>
            </div>
            <div class="row">
              <span class="k">最近更新</span>
              <span class="v">{{ new Date(selectedTask.updatedAt).toLocaleString('zh-CN', { hour12: false }) }}</span>
            </div>
          </div>

          <div class="summary">
            <div class="summary-head">
              <div class="summary-title">申请信息</div>
              <div class="summary-sub">系统已自动结构化整理</div>
            </div>

            <div v-if="taskSummaryPrimary.length" class="summary-grid">
              <div
                v-for="line in taskSummaryPrimary"
                :key="`${line.label}-${line.value}`"
                class="summary-tile"
              >
                <div class="tile-k">{{ line.label }}</div>
                <div class="tile-v">{{ line.value }}</div>
              </div>
            </div>

            <div v-if="taskSummaryLong.length" class="summary-long-list">
              <div
                v-for="line in taskSummaryLong"
                :key="`${line.label}-${line.value}`"
                class="summary-long-item"
              >
                <div class="long-k">{{ line.label }}</div>
                <div class="long-v">{{ line.value }}</div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped src="./recent-task-details/RecentTaskDetailsPage.css"></style>
