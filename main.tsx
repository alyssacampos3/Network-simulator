import type { NetworkNode, NetworkEdge, TopologySnapshot, PathResult, HopInfo } from '../types'
import { applyMask } from './subnet'

/**
 * Checks whether any interface on sourceDevice shares a subnet with any interface
 * on targetDevice, using sourceDevice's subnet masks.
 */
export function isL3Reachable(sourceDevice: NetworkNode, targetDevice: NetworkNode): boolean {
  for (const srcIface of sourceDevice.data.interfaces) {
    if (!srcIface.ipAddress || !srcIface.subnetMask) continue

    const srcNetwork = applyMask(srcIface.ipAddress, srcIface.subnetMask)

    for (const tgtIface of targetDevice.data.interfaces) {
      if (!tgtIface.ipAddress) continue

      const tgtNetwork = applyMask(tgtIface.ipAddress, srcIface.subnetMask)

      if (srcNetwork === tgtNetwork) {
        return true
      }
    }
  }

  return false
}

// ─── Internal BFS helpers ─────────────────────────────────────────────────────

interface Neighbor {
  device: NetworkNode
  edgeId: string
}

function getConnectedNeighbors(
  deviceId: string,
  edges: NetworkEdge[],
  nodes: NetworkNode[]
): Neighbor[] {
  const neighbors: Neighbor[] = []

  for (const edge of edges) {
    let neighborId: string | null = null

    if (edge.source === deviceId) {
      neighborId = edge.target
    } else if (edge.target === deviceId) {
      neighborId = edge.source
    }

    if (neighborId !== null) {
      const neighborDevice = nodes.find(n => n.id === neighborId)
      if (neighborDevice) {
        neighbors.push({ device: neighborDevice, edgeId: edge.id })
      }
    }
  }

  return neighbors
}

function buildHopInfo(
  path: NetworkNode[],
  edges: string[],
  destIp: string
): HopInfo[] {
  return path.map((device, index) => {
    // For the last hop (destination), use the matched destIp; otherwise use first interface IP
    const isLast = index === path.length - 1
    const ipAddress = isLast
      ? destIp
      : (device.data.interfaces[0]?.ipAddress ?? '')

    return {
      deviceId: device.id,
      hostname: device.data.hostname,
      ipAddress,
      edgeId: index === 0 ? '' : edges[index - 1],
    }
  })
}

// ─── BFS queue entry ──────────────────────────────────────────────────────────

interface QueueEntry {
  device: NetworkNode
  path: NetworkNode[]
  edges: string[]
}

/**
 * Finds a Layer-3 path from sourceId to the device owning destIp using BFS.
 * Returns PathResult with reachable=true and hops if a path exists,
 * or reachable=false with a failReason otherwise.
 */
export function findPath(
  sourceId: string,
  destIp: string,
  topology: TopologySnapshot
): PathResult {
  // Resolve destination device by IP
  const destDevice = topology.nodes.find(node =>
    node.data.interfaces.some(iface => iface.ipAddress === destIp)
  ) ?? null

  if (destDevice === null) {
    return { reachable: false, hops: [], failReason: 'Destination host unreachable' }
  }

  const sourceDevice = topology.nodes.find(n => n.id === sourceId) ?? null

  if (sourceDevice === null) {
    return { reachable: false, hops: [], failReason: 'Source device not found' }
  }

  // BFS
  const queue: QueueEntry[] = [
    { device: sourceDevice, path: [sourceDevice], edges: [] },
  ]
  const visited = new Set<string>([sourceId])

  while (queue.length > 0) {
    const current = queue.shift()!

    if (current.device.id === destDevice.id) {
      const hops = buildHopInfo(current.path, current.edges, destIp)
      return { reachable: true, hops }
    }

    const neighbors = getConnectedNeighbors(
      current.device.id,
      topology.edges,
      topology.nodes
    )

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.device.id)) {
        if (isL3Reachable(current.device, neighbor.device)) {
          visited.add(neighbor.device.id)
          queue.push({
            device: neighbor.device,
            path: [...current.path, neighbor.device],
            edges: [...current.edges, neighbor.edgeId],
          })
        }
      }
    }
  }

  return { reachable: false, hops: [], failReason: 'No route to host' }
}
