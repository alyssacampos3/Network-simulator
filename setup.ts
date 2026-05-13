import type { TopologySnapshot } from '../types'

export function isValidTopologySnapshot(data: unknown): data is TopologySnapshot {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return (
    typeof d.version === 'string' &&
    Array.isArray(d.nodes) &&
    Array.isArray(d.edges) &&
    typeof d.labDescription === 'string' &&
    typeof d.savedAt === 'string'
  )
}
