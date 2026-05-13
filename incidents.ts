import type { ARPEntry, TopologySnapshot } from '../types'
import { applyMask } from './subnet'

/**
 * Generates a deterministic fake MAC address from a nodeId and ifaceId.
 * Uses a simple hash of the combined string to produce consistent output.
 * Format: "XX:XX:XX:XX:XX:XX"
 */
export function generateDeterministicMAC(nodeId: string, ifaceId: string): string {
  const input = nodeId + ':' + ifaceId
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(31, hash) + input.charCodeAt(i)) | 0
  }

  // Spread hash bits across 6 bytes
  const bytes: number[] = []
  let h = hash >>> 0
  for (let i = 0; i < 6; i++) {
    bytes.push(h & 0xff)
    h = (h >>> 8) | ((hash << (24 - i * 8)) >>> 0)
  }

  return bytes.map(b => b.toString(16).padStart(2, '0')).join(':')
}

/**
 * Builds an ARP table for the given device by finding all neighbor interfaces
 * that share a subnet with one of the device's own interfaces.
 *
 * Requirements: 3.8
 */
export function buildARPTable(deviceId: string, topology: TopologySnapshot): ARPEntry[] {
  const device = topology.nodes.find(n => n.id === deviceId)
  if (!device) return []

  const arpEntries: ARPEntry[] = []

  for (const iface of device.data.interfaces) {
    if (!iface.ipAddress) continue

    const network = applyMask(iface.ipAddress, iface.subnetMask)

    for (const otherNode of topology.nodes) {
      if (otherNode.id === deviceId) continue

      for (const otherIface of otherNode.data.interfaces) {
        if (!otherIface.ipAddress) continue

        const otherNetwork = applyMask(otherIface.ipAddress, iface.subnetMask)

        if (network === otherNetwork) {
          arpEntries.push({
            ipAddress: otherIface.ipAddress,
            macAddress: generateDeterministicMAC(otherNode.id, otherIface.id),
            interface: iface.name,
            type: 'dynamic',
          })
        }
      }
    }
  }

  return arpEntries
}
