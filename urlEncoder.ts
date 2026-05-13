import type { TopologySnapshot, TroubleshootingSuggestion } from '../types'
import { applyMask } from './subnet'

/**
 * AI-Assisted Troubleshooting Engine
 * Analyzes topology state and generates diagnostic suggestions
 */

interface Issue {
  check: (topology: TopologySnapshot) => TroubleshootingSuggestion | null
}

const issueChecks: Issue[] = [
  // Check for interfaces that are down
  {
    check(topology) {
      const downInterfaces: string[] = []
      for (const node of topology.nodes) {
        for (const iface of node.data.interfaces) {
          if (!iface.isUp && iface.ipAddress) {
            downInterfaces.push(`${node.data.hostname}:${iface.name}`)
          }
        }
      }
      if (downInterfaces.length === 0) return null
      return {
        issue: `Interface(s) DOWN: ${downInterfaces.join(', ')}`,
        possibleCauses: [
          'Cable disconnected or faulty',
          'Interface administratively shut down',
          'Duplex/speed mismatch',
          'Hardware failure',
          'Incorrect VLAN assignment',
        ],
        recommendedCommands: [
          'show interfaces',
          'show ip interface brief',
          'show vlan',
          'show spanning-tree',
        ],
        explanation: 'A down interface breaks connectivity for all traffic that would traverse it. This can cascade to affect routing adjacencies, VLAN reachability, and end-to-end communication.',
        severity: 'critical',
      }
    },
  },

  // Check for devices with no IP configured
  {
    check(topology) {
      const unconfigured: string[] = []
      for (const node of topology.nodes) {
        if (node.type === 'cloud') continue
        const hasIp = node.data.interfaces.some(i => i.ipAddress)
        if (!hasIp) {
          unconfigured.push(node.data.hostname)
        }
      }
      if (unconfigured.length === 0) return null
      return {
        issue: `Device(s) with no IP address: ${unconfigured.join(', ')}`,
        possibleCauses: [
          'Interface not configured',
          'DHCP server unreachable',
          'Incorrect VLAN assignment preventing DHCP',
          'Manual configuration missed',
        ],
        recommendedCommands: [
          'show ip interface brief',
          'ipconfig',
          'show running-config',
        ],
        explanation: 'Without an IP address, a device cannot participate in Layer 3 communication. It will be unreachable via ping and cannot route traffic.',
        severity: 'warning',
      }
    },
  },

  // Check for subnet mismatches between connected devices
  {
    check(topology) {
      const mismatches: string[] = []
      for (const edge of topology.edges) {
        const src = topology.nodes.find(n => n.id === edge.source)
        const tgt = topology.nodes.find(n => n.id === edge.target)
        if (!src || !tgt) continue

        const srcIface = src.data.interfaces.find(i => i.ipAddress && i.isUp)
        const tgtIface = tgt.data.interfaces.find(i => i.ipAddress && i.isUp)
        if (!srcIface || !tgtIface) continue

        const srcNet = applyMask(srcIface.ipAddress, srcIface.subnetMask)
        const tgtNet = applyMask(tgtIface.ipAddress, tgtIface.subnetMask || srcIface.subnetMask)

        if (srcNet !== tgtNet) {
          mismatches.push(`${src.data.hostname} ↔ ${tgt.data.hostname}`)
        }
      }
      if (mismatches.length === 0) return null
      return {
        issue: `Subnet mismatch between connected devices: ${mismatches.join(', ')}`,
        possibleCauses: [
          'Incorrect IP address configuration',
          'Wrong subnet mask applied',
          'Devices on different VLANs without routing',
          'Misconfigured inter-VLAN routing',
        ],
        recommendedCommands: [
          'show ip interface brief',
          'show ip route',
          'show vlan',
          'ping <neighbor-ip>',
        ],
        explanation: 'Devices on different subnets cannot communicate directly at Layer 2. They need a router or Layer 3 switch to forward traffic between subnets.',
        severity: 'critical',
      }
    },
  },

  // Check for duplicate IPs
  {
    check(topology) {
      const ipMap = new Map<string, string[]>()
      for (const node of topology.nodes) {
        for (const iface of node.data.interfaces) {
          if (!iface.ipAddress) continue
          const existing = ipMap.get(iface.ipAddress) || []
          existing.push(node.data.hostname)
          ipMap.set(iface.ipAddress, existing)
        }
      }
      const duplicates: string[] = []
      for (const [ip, hosts] of ipMap) {
        if (hosts.length > 1) {
          duplicates.push(`${ip} (${hosts.join(', ')})`)
        }
      }
      if (duplicates.length === 0) return null
      return {
        issue: `Duplicate IP addresses detected: ${duplicates.join('; ')}`,
        possibleCauses: [
          'Manual IP assignment conflict',
          'DHCP scope overlap',
          'Device moved without updating config',
          'Copy-paste configuration error',
        ],
        recommendedCommands: [
          'show ip interface brief',
          'show arp',
          'ping <duplicate-ip>',
        ],
        explanation: 'Duplicate IPs cause intermittent connectivity issues. ARP tables become inconsistent, and traffic may be delivered to the wrong device unpredictably.',
        severity: 'critical',
      }
    },
  },

  // Check for isolated devices (no connections)
  {
    check(topology) {
      const connectedIds = new Set<string>()
      for (const edge of topology.edges) {
        connectedIds.add(edge.source)
        connectedIds.add(edge.target)
      }
      const isolated = topology.nodes
        .filter(n => !connectedIds.has(n.id) && n.type !== 'cloud')
        .map(n => n.data.hostname)

      if (isolated.length === 0) return null
      return {
        issue: `Isolated device(s) with no links: ${isolated.join(', ')}`,
        possibleCauses: [
          'Cable not connected',
          'Port disabled on switch',
          'Device not yet cabled into topology',
        ],
        recommendedCommands: [
          'show interfaces',
          'show cdp neighbors',
        ],
        explanation: 'An isolated device has no physical connectivity to the network. It cannot send or receive any traffic until a link is established.',
        severity: 'warning',
      }
    },
  },

  // Check for missing default gateway on PCs
  {
    check(topology) {
      const missing: string[] = []
      for (const node of topology.nodes) {
        if (node.type !== 'pc') continue
        for (const iface of node.data.interfaces) {
          if (iface.ipAddress && !iface.defaultGateway) {
            missing.push(node.data.hostname)
            break
          }
        }
      }
      if (missing.length === 0) return null
      return {
        issue: `PC(s) missing default gateway: ${missing.join(', ')}`,
        possibleCauses: [
          'Gateway not configured',
          'DHCP not providing gateway',
          'Wrong gateway IP entered',
        ],
        recommendedCommands: [
          'ipconfig',
          'ping <gateway-ip>',
          'traceroute <remote-ip>',
        ],
        explanation: 'Without a default gateway, a PC can only communicate with devices on its own subnet. All traffic to remote networks will fail.',
        severity: 'warning',
      }
    },
  },
]

/**
 * Run all diagnostic checks against the current topology
 */
export function runDiagnostics(topology: TopologySnapshot): TroubleshootingSuggestion[] {
  const results: TroubleshootingSuggestion[] = []
  for (const check of issueChecks) {
    const result = check.check(topology)
    if (result) results.push(result)
  }
  return results
}

/**
 * Get a network health score (0-100) based on issues found
 */
export function getHealthScore(topology: TopologySnapshot): number {
  const issues = runDiagnostics(topology)
  let score = 100
  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical': score -= 25; break
      case 'warning': score -= 10; break
      case 'info': score -= 5; break
    }
  }
  return Math.max(0, score)
}

/**
 * Perform root cause analysis by correlating multiple symptoms
 */
export function analyzeRootCause(topology: TopologySnapshot): {
  rootCause: string
  confidence: number
  symptoms: string[]
  recommendation: string
} | null {
  const issues = runDiagnostics(topology)
  if (issues.length === 0) return null

  const criticalIssues = issues.filter(i => i.severity === 'critical')
  
  // Correlate: if we have both interface down AND subnet mismatch, likely a config issue
  const hasInterfaceDown = issues.some(i => i.issue.includes('DOWN'))
  const hasSubnetMismatch = issues.some(i => i.issue.includes('Subnet mismatch'))
  const hasDuplicateIp = issues.some(i => i.issue.includes('Duplicate IP'))

  if (hasInterfaceDown && hasSubnetMismatch) {
    return {
      rootCause: 'Interface failure causing downstream subnet isolation. Connected devices cannot reach each other due to the broken link combined with misconfigured subnets.',
      confidence: 85,
      symptoms: issues.map(i => i.issue),
      recommendation: 'First bring the interface back up, then verify subnet configurations match on both ends of each link.',
    }
  }

  if (hasDuplicateIp) {
    return {
      rootCause: 'IP address conflict causing intermittent connectivity. ARP tables are inconsistent across the network.',
      confidence: 90,
      symptoms: issues.map(i => i.issue),
      recommendation: 'Resolve duplicate IP addresses immediately. Use "show arp" to identify conflicting MAC addresses and reassign unique IPs.',
    }
  }

  if (criticalIssues.length > 0) {
    return {
      rootCause: criticalIssues[0].issue,
      confidence: 70,
      symptoms: issues.map(i => i.issue),
      recommendation: criticalIssues[0].explanation,
    }
  }

  return {
    rootCause: 'Multiple minor configuration issues detected',
    confidence: 50,
    symptoms: issues.map(i => i.issue),
    recommendation: 'Address warnings to improve network reliability.',
  }
}
