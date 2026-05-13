import type { NetworkNode } from '../types'

/**
 * Validates an IPv4 address string.
 * Rejects leading zeros, out-of-range octets, and malformed input.
 */
export function isValidIPv4(input: string): boolean {
  const parts = input.split('.')

  if (parts.length !== 4) {
    return false
  }

  for (const part of parts) {
    const n = parseInt(part, 10)
    if (isNaN(n) || n < 0 || n > 255) {
      return false
    }
    // Reject leading zeros (e.g. "01", "001")
    if (part !== String(n)) {
      return false
    }
  }

  return true
}

/**
 * Applies a subnet mask to an IP address via bitwise AND.
 * Returns the network address string.
 * Precondition: both ip and mask must pass isValidIPv4.
 */
export function applyMask(ip: string, mask: string): string {
  const ipParts = ip.split('.').map(Number)
  const maskParts = mask.split('.').map(Number)

  return ipParts
    .map((octet, i) => (octet & maskParts[i]) >>> 0)
    .join('.')
}

/**
 * Finds the NetworkNode that owns the given IP address across all its interfaces.
 * Returns null if no node has a matching interface IP.
 */
export function resolveDeviceByIp(ip: string, nodes: NetworkNode[]): NetworkNode | null {
  for (const node of nodes) {
    for (const iface of node.data.interfaces) {
      if (iface.ipAddress === ip) {
        return node
      }
    }
  }
  return null
}
