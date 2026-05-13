import LZString from 'lz-string'
import type { TopologySnapshot } from '../types'
import { isValidTopologySnapshot } from './validator'

const HASH_PREFIX = '#topo='

export function encodeTopologyToURL(snapshot: TopologySnapshot): string {
  const json = JSON.stringify(snapshot)
  const encoded = LZString.compressToEncodedURIComponent(json)
  return `${window.location.origin}${window.location.pathname}${HASH_PREFIX}${encoded}`
}

export function decodeTopologyFromURL(hash: string): TopologySnapshot | null {
  try {
    if (!hash.startsWith(HASH_PREFIX)) return null
    const encoded = hash.slice(HASH_PREFIX.length)
    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const data: unknown = JSON.parse(json)
    return isValidTopologySnapshot(data) ? data : null
  } catch {
    return null
  }
}
