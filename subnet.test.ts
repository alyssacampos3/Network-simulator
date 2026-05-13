import type { ConfigRisk, TopologySnapshot } from '../types'
import { applyMask } from './subnet'

/**
 * Configuration Risk Analyzer
 * Validates topology configuration and identifies potential risks
 */

let riskCounter = 0

function createRisk(
  level: ConfigRisk['level'],
  category: string,
  description: string,
  affectedDevices: string[],
  recommendation: string
): ConfigRisk {
  return {
    id: `RISK-${String(++riskCounter).padStart(3, '0')}`,
    level,
    category,
    description,
    affectedDevices,
    recommendation,
  }
}

/**
 * Analyze the topology for configuration risks
 */
export function analyzeConfigRisks(topology: TopologySnapshot): ConfigRisk[] {
  const risks: ConfigRisk[] = []
  riskCounter = 0

  // Check for duplicate IPs
  const ipMap = new Map<string, string[]>()
  for (const node of topology.nodes) {
    for (const iface of node.data.interfaces) {
      if (!iface.ipAddress) continue
      const hosts = ipMap.get(iface.ipAddress) || []
      hosts.push(node.data.hostname)
      ipMap.set(iface.ipAddress, hosts)
    }
  }
  for (const [ip, hosts] of ipMap) {
    if (hosts.length > 1) {
      risks.push(createRisk(
        'high',
        'IP Conflict',
        `Duplicate IP address ${ip} assigned to: ${hosts.join(', ')}`,
        hosts,
        'Assign unique IP addresses to each interface. Use "show arp" to identify conflicts.'
      ))
    }
  }

  // Check for subnet mismatches on connected links
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
      risks.push(createRisk(
        'high',
        'Subnet Mismatch',
        `${src.data.hostname} (${srcIface.ipAddress}/${srcIface.subnetMask}) and ${tgt.data.hostname} (${tgtIface.ipAddress}/${tgtIface.subnetMask}) are on different subnets but directly connected`,
        [src.data.hostname, tgt.data.hostname],
        'Ensure both interfaces are configured with IPs in the same subnet, or add a router between them.'
      ))
    }
  }

  // Check for missing gateways on PCs
  for (const node of topology.nodes) {
    if (node.type !== 'pc') continue
    for (const iface of node.data.interfaces) {
      if (iface.ipAddress && !iface.defaultGateway) {
        risks.push(createRisk(
          'medium',
          'Missing Gateway',
          `${node.data.hostname} has no default gateway configured`,
          [node.data.hostname],
          'Configure a default gateway pointing to the nearest router interface IP.'
        ))
        break
      }
    }
  }

  // Check for single points of failure (devices with many connections)
  const connectionCount = new Map<string, number>()
  for (const edge of topology.edges) {
    connectionCount.set(edge.source, (connectionCount.get(edge.source) || 0) + 1)
    connectionCount.set(edge.target, (connectionCount.get(edge.target) || 0) + 1)
  }
  for (const [nodeId, count] of connectionCount) {
    if (count >= 4) {
      const node = topology.nodes.find(n => n.id === nodeId)
      if (node) {
        risks.push(createRisk(
          'medium',
          'Single Point of Failure',
          `${node.data.hostname} has ${count} connections — failure would isolate multiple segments`,
          [node.data.hostname],
          'Consider adding redundant links or a backup device to prevent single point of failure.'
        ))
      }
    }
  }

  // Check for unconfigured devices that are connected
  for (const node of topology.nodes) {
    if (node.type === 'cloud') continue
    const hasIp = node.data.interfaces.some(i => i.ipAddress)
    const isConnected = topology.edges.some(e => e.source === node.id || e.target === node.id)
    if (!hasIp && isConnected) {
      risks.push(createRisk(
        'low',
        'Unconfigured Device',
        `${node.data.hostname} is connected but has no IP configuration`,
        [node.data.hostname],
        'Configure at least one interface with an IP address for the device to participate in the network.'
      ))
    }
  }

  return risks
}
