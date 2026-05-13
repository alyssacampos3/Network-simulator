import type { TopologySnapshot } from '../types'

export function serializeTopology(snapshot: TopologySnapshot): string {
  return JSON.stringify(snapshot)
}

export function deserializeTopology(raw: string): TopologySnapshot {
  return JSON.parse(raw) as TopologySnapshot
}
