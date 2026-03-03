import type { ScenarioDefinition } from './types'
import { leaveScenario } from './leave/leaveScenario'

export const scenarioRegistry = {
  leave: leaveScenario,
} satisfies Record<string, ScenarioDefinition>

export type ScenarioKey = keyof typeof scenarioRegistry

export function getScenario(id: string): ScenarioDefinition | undefined {
  return Object.prototype.hasOwnProperty.call(scenarioRegistry, id)
    ? (scenarioRegistry as Record<string, ScenarioDefinition>)[id]
    : undefined
}

