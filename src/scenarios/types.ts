import type { AiDraft, AiDraftValidation, IntentId, ScenarioId, TaskSummary } from '../api/types'

export type SlotFieldType = 'text' | 'textarea' | 'date' | 'select'

export interface SlotOption {
  label: string
  value: string
}

export interface SlotFieldDefinition {
  key: string
  label: string
  type: SlotFieldType
  required?: boolean
  placeholder?: string
  options?: SlotOption[]
}

export interface ScenarioValidationResult {
  missingSlots: string[]
  validations: AiDraftValidation[]
}

export interface ScenarioDefinition<Slots = Record<string, unknown>> {
  id: ScenarioId
  title: string
  intent: IntentId
  slotFields: SlotFieldDefinition[]
  createDraft: (init?: Partial<Slots>) => AiDraft<Slots>
  validate: (slots: Slots) => ScenarioValidationResult
  buildSummary: (slots: Slots) => TaskSummary
}

