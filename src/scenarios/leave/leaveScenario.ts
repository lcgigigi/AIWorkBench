import type { AiDraft, AiDraftValidation, TaskSummary } from '../../api/types'
import { uid } from '../../utils/id'
import type { ScenarioDefinition } from '../types'

export type LeaveHalf = 'AM' | 'PM' | 'FULL'
export type LeaveType = 'annual' | 'sick' | 'personal' | 'other'

export interface LeaveSlots extends Record<string, unknown> {
  leaveType?: LeaveType
  startDate?: string // YYYY-MM-DD
  startHalf?: LeaveHalf
  endDate?: string // YYYY-MM-DD
  endHalf?: LeaveHalf
  reason?: string
}

const leaveTypeLabels: Record<LeaveType, string> = {
  annual: '年假',
  sick: '病假',
  personal: '事假',
  other: '其他',
}

const halfLabels: Record<LeaveHalf, string> = {
  AM: '上午',
  PM: '下午',
  FULL: '全天',
}

function parseYmd(s: string | undefined): number | null {
  if (!s) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0)
  const t = d.getTime()
  return Number.isFinite(t) ? t : null
}

function buildRange(slots: LeaveSlots) {
  const sd = slots.startDate ?? '—'
  const sh = slots.startHalf ? halfLabels[slots.startHalf] : '—'
  const ed = slots.endDate ?? '—'
  const eh = slots.endHalf ? halfLabels[slots.endHalf] : '—'
  return `${sd} ${sh} → ${ed} ${eh}`
}

function validateSlots(slots: LeaveSlots) {
  const missing: string[] = []
  const validations: AiDraftValidation[] = []

  const requiredKeys: Array<keyof LeaveSlots> = [
    'leaveType',
    'startDate',
    'startHalf',
    'endDate',
    'endHalf',
    'reason',
  ]
  for (const k of requiredKeys) {
    if (slots[k] === undefined || slots[k] === null || slots[k] === '') missing.push(String(k))
  }

  const startT = parseYmd(slots.startDate)
  const endT = parseYmd(slots.endDate)
  if (startT !== null && endT !== null && endT < startT) {
    validations.push({
      level: 'error',
      code: 'DATE_RANGE_INVALID',
      message: '结束日期不能早于开始日期',
      field: 'endDate',
    })
  }

  if (startT !== null && endT !== null && startT === endT) {
    const sh = slots.startHalf
    const eh = slots.endHalf
    if (sh && eh) {
      const order: Record<LeaveHalf, number> = { AM: 0, FULL: 1, PM: 2 }
      if (order[eh] < order[sh]) {
        validations.push({
          level: 'error',
          code: 'HALF_RANGE_INVALID',
          message: '同一天结束时段不能早于开始时段',
          field: 'endHalf',
        })
      }
    }
  }

  return { missingSlots: missing, validations }
}

function buildSummary(slots: LeaveSlots): TaskSummary {
  const title = '请假申请'
  const leaveType =
    slots.leaveType && leaveTypeLabels[slots.leaveType] ? leaveTypeLabels[slots.leaveType] : '—'
  const range = buildRange(slots)
  const reason = slots.reason?.trim() ? slots.reason.trim() : '—'
  return {
    title,
    lines: [
      { label: '假别', value: leaveType },
      { label: '时间', value: range },
      { label: '原因', value: reason },
    ],
  }
}

function createDraft(init?: Partial<LeaveSlots>): AiDraft<LeaveSlots> {
  const now = new Date().toISOString()
  const slots: LeaveSlots = {
    leaveType: undefined,
    startDate: undefined,
    startHalf: undefined,
    endDate: undefined,
    endHalf: undefined,
    reason: undefined,
    ...init,
  }
  const v = validateSlots(slots)
  return {
    draftId: uid('draft'),
    scenario: 'leave',
    intent: 'apply_leave',
    slots,
    missingSlots: v.missingSlots,
    validations: v.validations,
    actions: ['SUBMIT', 'OPEN_LEGACY', 'CANCEL'],
    version: 1,
    createdAt: now,
    updatedAt: now,
  }
}

export const leaveScenario: ScenarioDefinition<LeaveSlots> = {
  id: 'leave',
  title: '请假',
  intent: 'apply_leave',
  slotFields: [
    {
      key: 'leaveType',
      label: '假别',
      type: 'select',
      required: true,
      options: [
        { label: '年假', value: 'annual' },
        { label: '病假', value: 'sick' },
        { label: '事假', value: 'personal' },
        { label: '其他', value: 'other' },
      ],
    },
    { key: 'startDate', label: '开始日期', type: 'date', required: true },
    {
      key: 'startHalf',
      label: '开始时段',
      type: 'select',
      required: true,
      options: [
        { label: '上午', value: 'AM' },
        { label: '下午', value: 'PM' },
        { label: '全天', value: 'FULL' },
      ],
    },
    { key: 'endDate', label: '结束日期', type: 'date', required: true },
    {
      key: 'endHalf',
      label: '结束时段',
      type: 'select',
      required: true,
      options: [
        { label: '上午', value: 'AM' },
        { label: '下午', value: 'PM' },
        { label: '全天', value: 'FULL' },
      ],
    },
    { key: 'reason', label: '原因', type: 'textarea', required: true, placeholder: '简单说明请假原因' },
  ],
  createDraft,
  validate: validateSlots,
  buildSummary,
}

