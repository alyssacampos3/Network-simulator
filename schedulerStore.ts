import type { TopologySnapshot, NamedSave } from '../types'
import { serializeTopology, deserializeTopology } from './serializer'
import { isValidTopologySnapshot } from './validator'

export const STORAGE_KEY = 'network-lab:auto'
export const NAMED_SAVES_KEY = 'network-lab:named-saves'

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function saveTopology(snapshot: TopologySnapshot, onQuotaExceeded?: () => void): void {
  if (debounceTimer !== null) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeTopology(snapshot))
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        onQuotaExceeded?.()
      }
    }
  }, 500)
}

export function loadTopology(): TopologySnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = deserializeTopology(raw)
    return isValidTopologySnapshot(data) ? data : null
  } catch {
    return null
  }
}

export function saveNamedTopology(name: string, snapshot: TopologySnapshot): void {
  const saves = loadNamedTopologies()
  const idx = saves.findIndex(s => s.name === name)
  const entry: NamedSave = { name, snapshot, savedAt: new Date().toISOString() }
  if (idx >= 0) {
    saves[idx] = entry
  } else {
    saves.push(entry)
  }
  localStorage.setItem(NAMED_SAVES_KEY, JSON.stringify(saves))
}

export function loadNamedTopologies(): NamedSave[] {
  try {
    const raw = localStorage.getItem(NAMED_SAVES_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as NamedSave[]) : []
  } catch {
    return []
  }
}

export function deleteNamedTopology(name: string): void {
  const saves = loadNamedTopologies().filter(s => s.name !== name)
  localStorage.setItem(NAMED_SAVES_KEY, JSON.stringify(saves))
}
