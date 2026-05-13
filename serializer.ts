import { describe, it, expect } from 'vitest'
import { isValidIPv4, applyMask, resolveDeviceByIp } from './subnet'
import type { NetworkNode } from '../types'

// ─── isValidIPv4 ─────────────────────────────────────────────────────────────

describe('isValidIPv4', () => {
  it('accepts valid addresses', () => {
    expect(isValidIPv4('192.168.1.1')).toBe(true)
    expect(isValidIPv4('0.0.0.0')).toBe(true)
    expect(isValidIPv4('255.255.255.255')).toBe(true)
    expect(isValidIPv4('10.0.0.1')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isValidIPv4('')).toBe(false)
  })

  it('rejects wrong octet count', () => {
    expect(isValidIPv4('192.168.1')).toBe(false)
    expect(isValidIPv4('192.168.1.1.1')).toBe(false)
    expect(isValidIPv4('192')).toBe(false)
  })

  it('rejects out-of-range octets', () => {
    expect(isValidIPv4('256.0.0.0')).toBe(false)
    expect(isValidIPv4('192.168.1.300')).toBe(false)
    expect(isValidIPv4('-1.0.0.0')).toBe(false)
  })

  it('rejects leading zeros', () => {
    expect(isValidIPv4('01.0.0.0')).toBe(false)
    expect(isValidIPv4('192.168.01.1')).toBe(false)
    expect(isValidIPv4('192.168.1.001')).toBe(false)
  })

  it('rejects non-numeric parts', () => {
    expect(isValidIPv4('abc.def.ghi.jkl')).toBe(false)
    expect(isValidIPv4('192.168.1.x')).toBe(false)
  })

  it('rejects partial addresses', () => {
    expect(isValidIPv4('192.168.')).toBe(false)
    expect(isValidIPv4('.168.1.1')).toBe(false)
  })
})

// ─── applyMask ────────────────────────────────────────────────────────────────

describe('applyMask', () => {
  it('returns correct network address for /24', () => {
    expect(applyMask('192.168.1.100', '255.255.255.0')).toBe('192.168.1.0')
  })

  it('returns correct network address for /16', () => {
    expect(applyMask('10.20.30.40', '255.255.0.0')).toBe('10.20.0.0')
  })

  it('returns correct network address for /8', () => {
    expect(applyMask('172.16.5.1', '255.0.0.0')).toBe('172.0.0.0')
  })

  it('returns host address unchanged with /32 mask', () => {
    expect(applyMask('192.168.1.1', '255.255.255.255')).toBe('192.168.1.1')
  })

  it('returns 0.0.0.0 with all-zeros mask', () => {
    expect(applyMask('192.168.1.1', '0.0.0.0')).toBe('0.0.0.0')
  })

  it('is idempotent — applying mask twice gives same result', () => {
    const ip = '192.168.1.55'
    const mask = '255.255.255.0'
    const network = applyMask(ip, mask)
    expect(applyMask(network, mask)).toBe(network)
  })
})

// ─── resolveDeviceByIp ────────────────────────────────────────────────────────

function makeNode(id: string, ips: string[]): NetworkNode {
  return {
    id,
    type: 'router',
    position: { x: 0, y: 0 },
    data: {
      hostname: `host-${id}`,
      interfaces: ips.map((ip, i) => ({
        id: `eth${i}`,
        name: `eth${i}`,
        ipAddress: ip,
        subnetMask: '255.255.255.0',
        defaultGateway: '',
        isUp: true,
      })),
      deviceConfig: {
        hostname: `host-${id}`,
        interfaces: [],
      },
    },
  }
}

describe('resolveDeviceByIp', () => {
  const nodes = [
    makeNode('a', ['192.168.1.1', '10.0.0.1']),
    makeNode('b', ['192.168.2.1']),
    makeNode('c', ['172.16.0.1']),
  ]

  it('finds a node by its first interface IP', () => {
    expect(resolveDeviceByIp('192.168.1.1', nodes)?.id).toBe('a')
  })

  it('finds a node by its second interface IP', () => {
    expect(resolveDeviceByIp('10.0.0.1', nodes)?.id).toBe('a')
  })

  it('finds a different node', () => {
    expect(resolveDeviceByIp('192.168.2.1', nodes)?.id).toBe('b')
  })

  it('returns null when IP is not found', () => {
    expect(resolveDeviceByIp('1.2.3.4', nodes)).toBeNull()
  })

  it('returns null for empty node list', () => {
    expect(resolveDeviceByIp('192.168.1.1', [])).toBeNull()
  })
})
