import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTasksStore } from '../../stores/useTasksStore'
import { getTaskStatusText } from '../../utils/taskStatus'
import { useTaskPanelStore } from '../../panels/TaskPanel/useTaskPanelStore'
import { useWorkbenchStore } from '../../stores/useWorkbenchStore'
import { useExecutionFlowsStore } from '../../stores/useExecutionFlowsStore'
import { getScenario } from '../../scenarios'
import type { SlotFieldType, SlotOption } from '../../scenarios/types'

interface FlowFactRow {
  key: string
  label: string
  type: SlotFieldType
  options: SlotOption[]
  missing: boolean
  rawValue: string
}

interface SummaryLine {
  label: string
  value: string
}

type ChatItem =
  | {
      id: string
      kind: 'text'
      role: 'user' | 'assistant'
      createdAt: string
      text: string
    }
  | {
      id: string
      kind: 'facts-card'
      role: 'assistant'
      createdAt: string
    }


export function useRecentTaskDetailsPage() {
  const tasks = useTasksStore()
  const panel = useTaskPanelStore()
  const wb = useWorkbenchStore()
  const route = useRoute()
  const router = useRouter()
  const flowStore = useExecutionFlowsStore()
  
  const selectedKind = ref<'flow' | 'task'>('task')
  const selectedTaskId = ref<string | null>(null)
  const followUp = ref('')
  const editingFactKey = ref<string | null>(null)
  const factEdits = ref<Record<string, string>>({})
  const messagesRef = ref<HTMLElement | null>(null)
  const typingMessageId = ref<string | null>(null)
  const typingText = ref('')
  const isTypingAssistant = ref(false)
  const seenAssistantByFlow = ref<Record<string, string | null>>({})
  let typingTimer: number | null = null
  
  const routeFlowId = computed(() =>
    typeof route.query.flow === 'string' ? route.query.flow : null,
  )
  
  const flowList = computed(() =>
    [...flowStore.flows]
      .filter((flow) => flow.status !== 'done')
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
  )
  
  const selectedTask = computed(
    () => tasks.recent.find((task) => task.taskId === selectedTaskId.value) ?? null,
  )
  
  const selectedFlow = computed(() => {
    if (selectedKind.value !== 'flow') return null
  
    if (routeFlowId.value) {
      return flowList.value.find((flow) => flow.flowId === routeFlowId.value) ?? null
    }
  
    if (flowStore.activeFlowId) {
      return flowList.value.find((flow) => flow.flowId === flowStore.activeFlowId) ?? null
    }
  
    return flowList.value[0] ?? null
  })
  
  const selectedFlowId = computed(() => selectedFlow.value?.flowId ?? null)
  
  const detailMode = computed(() => {
    if (selectedKind.value === 'flow' && selectedFlow.value) return 'flow'
    if (selectedTask.value) return 'task'
    return 'empty'
  })
  
  const hasAnyListItem = computed(
    () => flowList.value.length > 0 || tasks.recent.length > 0,
  )
  
  watch(
    routeFlowId,
    (flowId) => {
      if (!flowId) return
      const exists = flowList.value.some((flow) => flow.flowId === flowId)
      if (!exists) {
        void router.replace({ name: 'recentTaskDetails' })
        return
      }
      selectedKind.value = 'flow'
      flowStore.openFlow(flowId)
    },
    { immediate: true },
  )
  
  watch(
    () => tasks.recent,
    (items) => {
      if (!items.length) {
        selectedTaskId.value = null
        return
      }
      if (!selectedTaskId.value || !items.some((item) => item.taskId === selectedTaskId.value)) {
        selectedTaskId.value = items[0]!.taskId
      }
    },
    { immediate: true },
  )
  
  watch(
    selectedFlow,
    (flow) => {
      if (!flow) return
      if (flowStore.activeFlowId !== flow.flowId) {
        flowStore.openFlow(flow.flowId)
      }
    },
    { immediate: true },
  )
  
  watch(
    [selectedTask, selectedFlow],
    ([task, flow]) => {
      if (selectedKind.value === 'task' && !task && flow) {
        selectedKind.value = 'flow'
        return
      }
      if (selectedKind.value === 'flow' && !flow && task) {
        selectedKind.value = 'task'
      }
    },
    { immediate: true },
  )
  
  const flowDraft = computed(() => selectedFlow.value?.draft ?? null)
  const scenario = computed(() =>
    flowDraft.value ? getScenario(flowDraft.value.scenario) : undefined,
  )
  
  const factRows = computed<FlowFactRow[]>(() => {
    if (!flowDraft.value || !scenario.value) return []
    const slots = flowDraft.value.slots as Record<string, unknown>
    return scenario.value.slotFields.map((field) => {
      const raw = slots[field.key]
      return {
        key: field.key,
        label: field.label,
        type: field.type,
        options: field.options ?? [],
        missing: flowDraft.value?.missingSlots.includes(field.key) ?? false,
        rawValue: raw === null || raw === undefined ? '' : String(raw),
      }
    })
  })
  
  function resetFactEdits() {
    const next: Record<string, string> = {}
    for (const row of factRows.value) {
      next[row.key] = row.rawValue
    }
    factEdits.value = next
    editingFactKey.value = null
  }
  
  watch(
    () => `${selectedFlowId.value ?? ''}|${selectedFlow.value?.updatedAt ?? ''}`,
    () => {
      resetFactEdits()
    },
    { immediate: true },
  )
  
  const missingLabels = computed(() =>
    factRows.value.filter((item) => item.missing).map((item) => item.label),
  )
  
  const changedFacts = computed(() => {
    return factRows.value.flatMap((row) => {
      const edited = (factEdits.value[row.key] ?? '').trim()
      const current = row.rawValue.trim()
      if (edited === current) return []
      return [
        {
          key: row.key,
          label: row.label,
          before: current,
          after: edited,
        },
      ]
    })
  })
  
  const canSendFollowUp = computed(
    () => !flowStore.loading && !!selectedFlow.value && followUp.value.trim().length > 0,
  )
  
  const canApplyFactChanges = computed(
    () => !flowStore.loading && !!selectedFlow.value && changedFacts.value.length > 0,
  )
  
  const canExecuteFlow = computed(() => {
    if (!selectedFlow.value || flowStore.loading) return false
    return selectedFlow.value.status === 'ready' || selectedFlow.value.status === 'failed'
  })
  
  const flowStatusLabel = computed(() => {
    const status = selectedFlow.value?.status
    switch (status) {
      case 'collecting':
        return '信息补齐中'
      case 'ready':
        return '可执行'
      case 'submitted':
        return '已提交'
      case 'in_progress':
        return '处理中'
      case 'failed':
        return '失败'
      case 'done':
        return '已完成'
      default:
        return '等待任务'
    }
  })
  
  const flowStatusClass = computed(() => {
    const status = selectedFlow.value?.status
    return status ? `status-${status}` : ''
  })
  
  const lastAssistantMessage = computed(() => {
    const list = selectedFlow.value?.messages
    if (!list?.length) return null
    for (let i = list.length - 1; i >= 0; i--) {
      const msg = list[i]
      if (msg?.role === 'assistant') return msg
    }
    return null
  })
  
  const chatItems = computed<ChatItem[]>(() => {
    if (!selectedFlow.value) return []
    const messages = selectedFlow.value.messages
    const items: ChatItem[] = []
  
    let lastAssistantIndex = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === 'assistant') {
        lastAssistantIndex = i
        break
      }
    }
  
    messages.forEach((message, index) => {
      items.push({
        id: message.id,
        kind: 'text',
        role: message.role,
        createdAt: message.createdAt,
        text: message.text,
      })
  
      if (flowDraft.value && index === lastAssistantIndex && !isTypingAssistant.value) {
        items.push({
          id: `facts-${selectedFlow.value!.flowId}`,
          kind: 'facts-card',
          role: 'assistant',
          createdAt: selectedFlow.value!.updatedAt,
        })
      }
    })
  
    if (flowDraft.value && lastAssistantIndex === -1 && !isTypingAssistant.value) {
      items.push({
        id: `facts-${selectedFlow.value.flowId}`,
        kind: 'facts-card',
        role: 'assistant',
        createdAt: selectedFlow.value.updatedAt,
      })
    }
  
    return items
  })
  
  const lastMessageId = computed(() => {
    const list = selectedFlow.value?.messages
    if (!list?.length) return null
    return list[list.length - 1]?.id ?? null
  })
  
  function stopTypewriter() {
    if (typingTimer !== null) {
      window.clearInterval(typingTimer)
      typingTimer = null
    }
    typingMessageId.value = null
    typingText.value = ''
    isTypingAssistant.value = false
  }
  
  function startTypewriter(messageId: string, fullText: string) {
    stopTypewriter()
    const chars = Array.from(fullText)
    if (!chars.length) return
    typingMessageId.value = messageId
    typingText.value = ''
    isTypingAssistant.value = true
    let idx = 0
  
    typingTimer = window.setInterval(() => {
      idx += 1
      typingText.value = chars.slice(0, idx).join('')
      void nextTick(() => scrollToBottom('auto'))
      if (idx >= chars.length) {
        stopTypewriter()
      }
    }, 34)
  }
  
  function scrollToBottom(behavior: ScrollBehavior = 'auto') {
    const node = messagesRef.value
    if (!node) return
    node.scrollTo({ top: node.scrollHeight, behavior })
  }
  
  watch(
    selectedFlowId,
    async (flowId) => {
      stopTypewriter()
      if (flowId) {
        seenAssistantByFlow.value = {
          ...seenAssistantByFlow.value,
          [flowId]: lastAssistantMessage.value?.id ?? null,
        }
      }
      await nextTick()
      scrollToBottom('auto')
    },
    { immediate: true },
  )
  
  watch(
    lastMessageId,
    async () => {
      await nextTick()
      scrollToBottom('smooth')
    },
  )
  
  watch(
    () => [selectedFlowId.value, lastAssistantMessage.value?.id] as const,
    ([flowId, assistantId]) => {
      if (!flowId || !assistantId) return
      const seen = seenAssistantByFlow.value[flowId]
      if (seen === undefined) {
        seenAssistantByFlow.value = { ...seenAssistantByFlow.value, [flowId]: assistantId }
        return
      }
      if (seen === assistantId) return
  
      seenAssistantByFlow.value = { ...seenAssistantByFlow.value, [flowId]: assistantId }
      const fullText = lastAssistantMessage.value?.text ?? ''
      startTypewriter(assistantId, fullText)
    },
  )
  
  async function refresh() {
    await tasks.fetchRecent(20)
  }
  
  async function openTaskInPanel(taskId: string) {
    await panel.openTask(taskId)
    wb.openTaskPanel()
  }
  
  async function openInPanel() {
    if (!selectedTask.value) return
    await openTaskInPanel(selectedTask.value.taskId)
  }
  
  async function openFlowTaskInPanel() {
    const taskId = selectedFlow.value?.task?.taskId
    if (!taskId) return
    await openTaskInPanel(taskId)
  }
  
  function flowStatusText(status: string) {
    switch (status) {
      case 'collecting':
        return '补齐中'
      case 'ready':
        return '可执行'
      case 'submitted':
        return '已提交'
      case 'in_progress':
        return '处理中'
      case 'failed':
        return '失败'
      case 'done':
        return '已完成'
      default:
        return status
    }
  }
  
  function statusTextForFlowTask() {
    if (!selectedFlow.value?.task) return '—'
    return getTaskStatusText(selectedFlow.value.task.status)
  }
  
  function taskStatusHint(status: string) {
    switch (status) {
      case 'draft':
        return '草稿已创建，等待补充信息。'
      case 'ready_to_submit':
        return '信息已齐全，可随时提交。'
      case 'submitted':
        return '已提交到系统，等待处理。'
      case 'in_progress':
        return '流程处理中，请稍候。'
      case 'done':
        return '流程已完成。'
      case 'failed':
        return '处理失败，可修改后重试。'
      default:
        return '状态更新中。'
    }
  }
  
  function isLongSummaryLine(line: SummaryLine) {
    return /原因|备注|说明|补充/.test(line.label) || line.value.length > 24
  }
  
  const taskSummaryLines = computed<SummaryLine[]>(
    () => selectedTask.value?.summary.lines ?? [],
  )
  
  const taskSummaryPrimary = computed(() =>
    taskSummaryLines.value.filter((line) => !isLongSummaryLine(line)),
  )
  
  const taskSummaryLong = computed(() =>
    taskSummaryLines.value.filter((line) => isLongSummaryLine(line)),
  )
  
  function openFlow(flowId: string) {
    selectedKind.value = 'flow'
    flowStore.openFlow(flowId)
    if (routeFlowId.value !== flowId) {
      void router.replace({ name: 'recentTaskDetails', query: { flow: flowId } })
    }
  }
  
  function selectTask(taskId: string) {
    selectedKind.value = 'task'
    selectedTaskId.value = taskId
    if (routeFlowId.value) {
      void router.replace({ name: 'recentTaskDetails' })
    }
  }
  
  function formatMessageTime(value: string) {
    return new Date(value).toLocaleTimeString('zh-CN', { hour12: false })
  }
  
  function roleLabel(role: 'user' | 'assistant') {
    return role === 'assistant' ? 'AI 助手' : '你'
  }
  
  function getFactRowByKey(key: string) {
    return factRows.value.find((row) => row.key === key)
  }
  
  function beginEditFact(key: string) {
    editingFactKey.value = key
  }
  
  function saveFactEdit() {
    editingFactKey.value = null
  }
  
  function cancelFactEdit(key: string) {
    const row = getFactRowByKey(key)
    if (row) {
      factEdits.value = {
        ...factEdits.value,
        [key]: row.rawValue,
      }
    }
    editingFactKey.value = null
  }
  
  function displayFactValue(row: FlowFactRow) {
    const raw = (factEdits.value[row.key] ?? row.rawValue).trim()
    if (!raw) return '待确认'
    if (row.type === 'select') {
      return row.options.find((option) => option.value === raw)?.label ?? raw
    }
    return raw
  }
  
  async function applyFactChanges() {
    if (!selectedFlow.value || !canApplyFactChanges.value) return
  
    const updates = changedFacts.value
      .map((item) => `${item.label}改为「${item.after || '空'}」`)
      .join('；')
  
    const message = `我在清单里更新了这些字段：${updates}。请按最新信息更新草案，并告诉我是否还缺少内容。`
    editingFactKey.value = null
    await flowStore.continueFlow(selectedFlow.value.flowId, message)
  }
  
  async function askAiSuggestion() {
    if (!selectedFlow.value || flowStore.loading) return
    const message = missingLabels.value.length
      ? `请根据当前草案，继续引导我补齐这些信息：${missingLabels.value.join('、')}。`
      : '请基于当前草案给我优化建议，并确认是否可以直接执行。'
    await flowStore.continueFlow(selectedFlow.value.flowId, message)
  }
  
  async function onSendFollowUp() {
    if (!selectedFlow.value || !canSendFollowUp.value) return
    const msg = followUp.value
    followUp.value = ''
    await flowStore.continueFlow(selectedFlow.value.flowId, msg)
  }
  
  async function onExecute() {
    if (!selectedFlow.value || !canExecuteFlow.value) return
    await flowStore.executeFlow(selectedFlow.value.flowId)
  }
  
  function onFollowUpKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void onSendFollowUp()
    }
  }
  
  onMounted(() => {
    void refresh()
  })
  
  onBeforeUnmount(() => {
    stopTypewriter()
  })

  return {
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
  }
}
