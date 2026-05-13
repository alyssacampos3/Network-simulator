import type { CLIOutput, OutputLine, TopologySnapshot } from '../types'
import { findPath } from './pathfinder'
import { buildARPTable } from './arp'
import { useTrafficStore } from '../store/trafficStore'
import type { Protocol, TrafficStatus } from '../store/trafficStore'

function logTraffic(
  topology: TopologySnapshot,
  deviceId: string,
  destIp: string,
  protocol: Protocol,
  command: string,
  status: TrafficStatus,
  hopCount: number,
  bytes = 32,
  hops: import('../types').HopInfo[] = [],
  failReason?: string
) {
  const device = topology.nodes.find(n => n.id === deviceId)
  const destDevice = topology.nodes.find(n =>
    n.data.interfaces.some(i => i.ipAddress === destIp)
  )
  useTrafficStore.getState().logEvent({
    protocol,
    source: device?.data.hostname ?? deviceId,
    sourceIp: device?.data.interfaces[0]?.ipAddress ?? '',
    destination: destDevice?.data.hostname ?? destIp,
    destIp,
    command,
    status,
    hopCount,
    bytes,
    latency: status === 'success' ? '<1ms' : 'timeout',
    hops,
    hopDecisions: [],
    failReason,
  })
}

/**
 * Executes a CLI command on behalf of a device and returns formatted output lines.
 *
 * Supported commands:
 *   ping <ip>             — Tests reachability via findPath
 *   ipconfig              — Shows all interfaces (Windows style)
 *   show ip interface brief — Interface table (Cisco IOS style)
 *   show arp              — ARP table (Cisco IOS style)
 *   traceroute <ip>       — Hop-by-hop path trace
 *   help                  — Lists all supported commands
 *
 * Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
 */
export function executeCLICommand(
  command: string,
  deviceId: string,
  topology: TopologySnapshot
): CLIOutput {
  const trimmed = command.trim()
  const lower = trimmed.toLowerCase()

  if (lower.startsWith('ping ')) {
    return handlePing(trimmed.slice(5).trim(), deviceId, topology)
  }

  if (lower === 'ipconfig') {
    return handleIpconfig(deviceId, topology)
  }

  if (lower === 'show ip interface brief') {
    return handleShowIpInterfaceBrief(deviceId, topology)
  }

  if (lower === 'show arp') {
    return handleShowArp(deviceId, topology)
  }

  if (lower.startsWith('traceroute ')) {
    return handleTraceroute(trimmed.slice(11).trim(), deviceId, topology)
  }

  if (lower === 'show vlan' || lower === 'show vlan brief') {
    return handleShowVlan(deviceId, topology)
  }

  if (lower === 'show ip route') {
    return handleShowIpRoute(deviceId, topology)
  }

  if (lower === 'show interfaces' || lower === 'show interface') {
    return handleShowInterfaces(deviceId, topology)
  }

  if (lower === 'show spanning-tree') {
    return handleShowSpanningTree(deviceId, topology)
  }

  if (lower === 'show running-config' || lower === 'show run') {
    return handleShowRunningConfig(deviceId, topology)
  }

  if (lower === 'show version') {
    return handleShowVersion(deviceId, topology)
  }

  if (lower === 'show cdp neighbors') {
    return handleShowCdpNeighbors(deviceId, topology)
  }

  if (lower === 'help') {
    return handleHelp()
  }

  return {
    lines: [
      {
        text: `Unknown command: '${trimmed}'. Type 'help' for available commands.`,
        type: 'error',
      },
    ],
  }
}

// ─── Command Handlers ─────────────────────────────────────────────────────────

function handlePing(destIp: string, deviceId: string, topology: TopologySnapshot): CLIOutput {
  const lines: OutputLine[] = []

  lines.push({ text: `Pinging ${destIp} with 32 bytes of data:`, type: 'default' })

  const result = findPath(deviceId, destIp, topology)

  if (result.reachable) {
    for (let i = 0; i < 4; i++) {
      lines.push({ text: `Reply from ${destIp}: bytes=32 time<1ms TTL=128`, type: 'success' })
    }
    lines.push({ text: '', type: 'default' })
    lines.push({ text: `Ping statistics for ${destIp}:`, type: 'default' })
    lines.push({ text: '    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)', type: 'default' })
    logTraffic(topology, deviceId, destIp, 'ICMP', `ping ${destIp}`, 'success', result.hops.length, 32, result.hops)
  } else {
    const isUnreachable = result.failReason === 'Destination host unreachable'
    for (let i = 0; i < 4; i++) {
      lines.push({ text: isUnreachable ? 'Destination host unreachable.' : 'Request timed out.', type: 'error' })
    }
    lines.push({ text: '', type: 'default' })
    lines.push({ text: `Ping statistics for ${destIp}:`, type: 'default' })
    lines.push({ text: '    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)', type: 'default' })
    logTraffic(topology, deviceId, destIp, 'ICMP', `ping ${destIp}`, isUnreachable ? 'failed' : 'timeout', result.hops.length, 32, result.hops, result.failReason)
  }

  return { lines }
}

function handleIpconfig(deviceId: string, topology: TopologySnapshot): CLIOutput {
  const lines: OutputLine[] = []
  const device = topology.nodes.find(n => n.id === deviceId)

  if (!device) {
    return { lines: [{ text: 'Device not found.', type: 'error' }] }
  }

  lines.push({ text: `Windows IP Configuration`, type: 'default' })
  lines.push({ text: '', type: 'default' })
  lines.push({ text: `   Host Name . . . . . . . . . . . . : ${device.data.hostname}`, type: 'default' })
  lines.push({ text: '', type: 'default' })

  for (const iface of device.data.interfaces) {
    lines.push({
      text: `Ethernet adapter ${iface.name}:`,
      type: 'info',
    })
    lines.push({ text: '', type: 'default' })

    if (!iface.isUp) {
      lines.push({
        text: '   Media State . . . . . . . . . . . : Media disconnected',
        type: 'default',
      })
    } else {
      lines.push({
        text: `   Connection-specific DNS Suffix  . :`,
        type: 'default',
      })
      lines.push({
        text: `   IPv4 Address. . . . . . . . . . . : ${iface.ipAddress || '0.0.0.0'}`,
        type: 'default',
      })
      lines.push({
        text: `   Subnet Mask . . . . . . . . . . . : ${iface.subnetMask || '0.0.0.0'}`,
        type: 'default',
      })
      lines.push({
        text: `   Default Gateway . . . . . . . . . : ${iface.defaultGateway || ''}`,
        type: 'default',
      })
    }

    lines.push({ text: '', type: 'default' })
  }

  return { lines }
}

function handleShowIpInterfaceBrief(deviceId: string, topology: TopologySnapshot): CLIOutput {
  const lines: OutputLine[] = []
  const device = topology.nodes.find(n => n.id === deviceId)

  if (!device) {
    return { lines: [{ text: 'Device not found.', type: 'error' }] }
  }

  // Header row
  lines.push({
    text: 'Interface              IP-Address      Status',
    type: 'info',
  })

  for (const iface of device.data.interfaces) {
    const name = iface.name.padEnd(22)
    const ip = (iface.ipAddress || 'unassigned').padEnd(15)
    const status = iface.isUp ? 'Up' : 'Down'
    lines.push({
      text: `${name} ${ip} ${status}`,
      type: iface.isUp ? 'default' : 'error',
    })
  }

  return { lines }
}

function handleShowArp(deviceId: string, topology: TopologySnapshot): CLIOutput {
  const lines: OutputLine[] = []
  const entries = buildARPTable(deviceId, topology)

  lines.push({
    text: 'Protocol  Address          Age (min)  Hardware Addr       Type',
    type: 'info',
  })

  if (entries.length === 0) {
    lines.push({ text: 'ARP table is empty.', type: 'default' })
    return { lines }
  }

  for (const entry of entries) {
    const ip = entry.ipAddress.padEnd(16)
    const mac = entry.macAddress.padEnd(19)
    lines.push({ text: `Internet  ${ip} -          ${mac} ARPA`, type: 'default' })
    logTraffic(topology, deviceId, entry.ipAddress, 'ARP', 'show arp', 'success', 1, 28)
  }

  return { lines }
}

function handleTraceroute(destIp: string, deviceId: string, topology: TopologySnapshot): CLIOutput {
  const lines: OutputLine[] = []

  lines.push({ text: `Tracing route to ${destIp}`, type: 'default' })
  lines.push({ text: 'over a maximum of 30 hops:', type: 'default' })
  lines.push({ text: '', type: 'default' })

  const result = findPath(deviceId, destIp, topology)

  if (result.reachable) {
    for (let i = 1; i < result.hops.length; i++) {
      const hop = result.hops[i]
      const hopNum = String(i).padStart(2)
      lines.push({ text: `${hopNum}    <1 ms    <1 ms    <1 ms  ${hop.ipAddress}  (${hop.hostname})`, type: 'success' })
    }
    lines.push({ text: '', type: 'default' })
    lines.push({ text: 'Trace complete.', type: 'default' })
    logTraffic(topology, deviceId, destIp, 'ICMP', `traceroute ${destIp}`, 'success', result.hops.length, 32, result.hops)
  } else {
    const reachedHops = result.hops.length
    for (let i = 1; i < reachedHops; i++) {
      const hop = result.hops[i]
      const hopNum = String(i).padStart(2)
      lines.push({ text: `${hopNum}    <1 ms    <1 ms    <1 ms  ${hop.ipAddress}  (${hop.hostname})`, type: 'default' })
    }
    const startTimeout = reachedHops > 0 ? reachedHops : 1
    for (let i = startTimeout; i <= startTimeout + 2; i++) {
      const hopNum = String(i).padStart(2)
      lines.push({ text: `${hopNum}    *        *        *        Request timed out.`, type: 'error' })
    }
    lines.push({ text: '', type: 'default' })
    lines.push({ text: `Trace terminated. ${result.failReason ?? 'No route to host'}`, type: 'error' })
    logTraffic(topology, deviceId, destIp, 'ICMP', `traceroute ${destIp}`, 'timeout', reachedHops, 32, result.hops, result.failReason)
  }

  return { lines }
}

function handleHelp(): CLIOutput {
  return {
    lines: [
      { text: 'Available commands:', type: 'info' },
      { text: '', type: 'default' },
      { text: '  ping <ip>                  Test reachability to an IP address', type: 'default' },
      { text: '  traceroute <ip>            Show the hop-by-hop path to an IP address', type: 'default' },
      { text: '  ipconfig                   Display IP configuration for all interfaces', type: 'default' },
      { text: '  show ip interface brief    Display a summary table of interfaces and their status', type: 'default' },
      { text: '  show ip route              Display the routing table', type: 'default' },
      { text: '  show interfaces            Display detailed interface information', type: 'default' },
      { text: '  show vlan                  Display VLAN assignments', type: 'default' },
      { text: '  show spanning-tree         Display STP information', type: 'default' },
      { text: '  show running-config        Display the current configuration', type: 'default' },
      { text: '  show arp                   Display the ARP table for this device', type: 'default' },
      { text: '  show cdp neighbors         Display directly connected neighbors', type: 'default' },
      { text: '  show version               Display device version information', type: 'default' },
      { text: '  help                       Show this help message', type: 'default' },
    ],
  }
}

// ─── New Command Handlers ─────────────────────────────────────────────────────

function handleShowVlan(deviceId: string, topology: TopologySnapshot): CLIOutput {
  const lines: OutputLine[] = []
  const device = topology.nodes.find(n => n.id === deviceId)
  if (!device) return { lines: [{ text: 'Device not found.', type: 'error' }] }

  lines.push({ text: 'VLAN Name                             Status    Ports', type: 'info' })
  lines.push({ text: '---- -------------------------------- --------- -------------------------------', type: 'default' })

  // Default VLAN 1
  const ports = device.data.interfaces.map(i => i.name).join(', ')
  lines.push({ text: `1    default                          active    ${ports}`, type: 'default' })

  // If device has VLAN config
  const vlan = device.data.deviceConfig.vlan
  if (vlan && vlan !== 1) {
    lines.push({ text: `${String(vlan).padEnd(4)} VLAN${String(vlan).padEnd(28)} active    ${ports}`, type: 'default' })
  }

  lines.push({ text: '', type: 'default' })
  lines.push({ text: '1002 fddi-default                     act/unsup', type: 'default' })
  lines.push({ text: '1003 token-ring-default               act/unsup', type: 'default' })
  lines.push({ text: '1004 fddinet-default                  act/unsup', type: 'default' })
  lines.push({ text: '1005 trnet-default                    act/unsup', type: 'default' })

  return { lines }
}

function handleShowIpRoute(deviceId: string, topology: TopologySnapshot): CLIOutput {
  const lines: OutputLine[] = []
  const device = topology.nodes.find(n => n.id === deviceId)
  if (!device) return { lines: [{ text: 'Device not found.', type: 'error' }] }

  lines.push({ text: 'Codes: C - connected, S - static, O - OSPF, * - candidate default', type: 'info' })
  lines.push({ text: '', type: 'default' })
  lines.push({ text: 'Gateway of last resort is not set', type: 'default' })
  lines.push({ text: '', type: 'default' })

  // Connected routes from interfaces
  for (const iface of device.data.interfaces) {
    if (!iface.ipAddress || !iface.isUp) continue
    const maskParts = iface.subnetMask.split('.').map(Number)
    const prefix = maskParts.reduce((acc, octet) => acc + octet.toString(2).split('1').length - 1, 0)
    const network = iface.ipAddress.split('.').map((o, i) => (Number(o) & maskParts[i]).toString()).join('.')
    lines.push({ text: `C    ${network}/${prefix} is directly connected, ${iface.name}`, type: 'success' })
  }

  // Static routes from routing table
  if (device.data.deviceConfig.routingTable) {
    for (const route of device.data.deviceConfig.routingTable) {
      lines.push({ text: `S    ${route.network}/${route.mask} [1/0] via ${route.nextHop}`, type: 'default' })
    }
  }

  if (device.data.interfaces.filter(i => i.ipAddress && i.isUp).length === 0) {
    lines.push({ text: '  No routes configured.', type: 'default' })
  }

  return { lines }
}

function handleShowInterfaces(deviceId: string, topology: TopologySnapshot): CLIOutput {
  const lines: OutputLine[] = []
  const device = topology.nodes.find(n => n.id === deviceId)
  if (!device) return { lines: [{ text: 'Device not found.', type: 'error' }] }

  for (const iface of device.data.interfaces) {
    const status = iface.isUp ? 'up' : 'administratively down'
    const protocol = iface.isUp ? 'up' : 'down'
    lines.push({ text: `${iface.name} is ${status}, line protocol is ${protocol}`, type: iface.isUp ? 'success' : 'error' })
    lines.push({ text: `  Hardware is FastEthernet, address is ${generateSimpleMAC(deviceId, iface.id)}`, type: 'default' })
    if (iface.ipAddress) {
      lines.push({ text: `  Internet address is ${iface.ipAddress}/${maskToPrefix(iface.subnetMask)}`, type: 'default' })
    }
    lines.push({ text: `  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec`, type: 'default' })
    lines.push({ text: `  Encapsulation ARPA, loopback not set`, type: 'default' })
    const inputPkts = Math.floor(Math.random() * 50000)
    const outputPkts = Math.floor(Math.random() * 45000)
    lines.push({ text: `  ${inputPkts} packets input, ${inputPkts * 64} bytes`, type: 'default' })
    lines.push({ text: `  ${outputPkts} packets output, ${outputPkts * 64} bytes`, type: 'default' })
    lines.push({ text: `  0 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored`, type: 'default' })
    lines.push({ text: '', type: 'default' })
  }

  return { lines }
}

function handleShowSpanningTree(deviceId: string, topology: TopologySnapshot): CLIOutput {
  const lines: OutputLine[] = []
  const device = topology.nodes.find(n => n.id === deviceId)
  if (!device) return { lines: [{ text: 'Device not found.', type: 'error' }] }

  if (device.type !== 'switch') {
    return { lines: [{ text: 'Spanning-tree is not enabled on this device type.', type: 'info' }] }
  }

  const vlan = device.data.deviceConfig.vlan || 1

  lines.push({ text: `VLAN${String(vlan).padStart(4, '0')}`, type: 'info' })
  lines.push({ text: `  Spanning tree enabled protocol rstp`, type: 'default' })
  lines.push({ text: `  Root ID    Priority    32769`, type: 'default' })
  lines.push({ text: `             Address     ${generateSimpleMAC(deviceId, 'root')}`, type: 'default' })
  lines.push({ text: `             This bridge is the root`, type: 'success' })
  lines.push({ text: '', type: 'default' })
  lines.push({ text: `  Bridge ID  Priority    32769`, type: 'default' })
  lines.push({ text: `             Address     ${generateSimpleMAC(deviceId, 'bridge')}`, type: 'default' })
  lines.push({ text: '', type: 'default' })
  lines.push({ text: 'Interface        Role Sts Cost      Prio.Nbr Type', type: 'info' })
  lines.push({ text: '---------------- ---- --- --------- -------- ----', type: 'default' })

  for (const iface of device.data.interfaces) {
    const role = 'Desg'
    const sts = iface.isUp ? 'FWD' : 'BLK'
    lines.push({ text: `${iface.name.padEnd(16)} ${role} ${sts} 19        128.1    P2p`, type: iface.isUp ? 'default' : 'error' })
  }

  return { lines }
}

function handleShowRunningConfig(deviceId: string, topology: TopologySnapshot): CLIOutput {
  const lines: OutputLine[] = []
  const device = topology.nodes.find(n => n.id === deviceId)
  if (!device) return { lines: [{ text: 'Device not found.', type: 'error' }] }

  lines.push({ text: 'Building configuration...', type: 'info' })
  lines.push({ text: '', type: 'default' })
  lines.push({ text: 'Current configuration:', type: 'default' })
  lines.push({ text: '!', type: 'default' })
  lines.push({ text: `hostname ${device.data.hostname}`, type: 'default' })
  lines.push({ text: '!', type: 'default' })

  for (const iface of device.data.interfaces) {
    lines.push({ text: `interface ${iface.name}`, type: 'info' })
    if (iface.ipAddress) {
      lines.push({ text: ` ip address ${iface.ipAddress} ${iface.subnetMask}`, type: 'default' })
    } else {
      lines.push({ text: ' no ip address', type: 'default' })
    }
    if (!iface.isUp) {
      lines.push({ text: ' shutdown', type: 'error' })
    }
    lines.push({ text: '!', type: 'default' })
  }

  if (device.data.deviceConfig.routingTable && device.data.deviceConfig.routingTable.length > 0) {
    lines.push({ text: '!', type: 'default' })
    for (const route of device.data.deviceConfig.routingTable) {
      lines.push({ text: `ip route ${route.network} ${route.mask} ${route.nextHop}`, type: 'default' })
    }
  }

  lines.push({ text: '!', type: 'default' })
  lines.push({ text: 'end', type: 'default' })

  return { lines }
}

function handleShowVersion(deviceId: string, topology: TopologySnapshot): CLIOutput {
  const lines: OutputLine[] = []
  const device = topology.nodes.find(n => n.id === deviceId)
  if (!device) return { lines: [{ text: 'Device not found.', type: 'error' }] }

  const typeLabel = device.type.charAt(0).toUpperCase() + device.type.slice(1)
  const uptime = `${Math.floor(Math.random() * 30)} days, ${Math.floor(Math.random() * 24)} hours, ${Math.floor(Math.random() * 60)} minutes`

  lines.push({ text: `Network Lab Simulated IOS (${typeLabel})`, type: 'info' })
  lines.push({ text: `Version 15.2(4)M, RELEASE SOFTWARE`, type: 'default' })
  lines.push({ text: '', type: 'default' })
  lines.push({ text: `${device.data.hostname} uptime is ${uptime}`, type: 'default' })
  lines.push({ text: `System image file is "flash:c2900-universalk9-mz.SPA.152-4.M.bin"`, type: 'default' })
  lines.push({ text: '', type: 'default' })
  lines.push({ text: `Processor board ID SIM${deviceId.slice(0, 8).toUpperCase()}`, type: 'default' })
  lines.push({ text: `${device.data.interfaces.length} FastEthernet interfaces`, type: 'default' })
  lines.push({ text: `256K bytes of NVRAM.`, type: 'default' })
  lines.push({ text: `64016K bytes of processor board System flash`, type: 'default' })

  return { lines }
}

function handleShowCdpNeighbors(deviceId: string, topology: TopologySnapshot): CLIOutput {
  const lines: OutputLine[] = []
  const device = topology.nodes.find(n => n.id === deviceId)
  if (!device) return { lines: [{ text: 'Device not found.', type: 'error' }] }

  lines.push({ text: 'Capability Codes: R - Router, S - Switch, H - Host, F - Firewall', type: 'info' })
  lines.push({ text: '', type: 'default' })
  lines.push({ text: 'Device ID        Local Intrfce     Holdtme    Capability  Platform  Port ID', type: 'info' })

  // Find connected neighbors via edges
  for (const edge of topology.edges) {
    let neighborId: string | null = null
    if (edge.source === deviceId) neighborId = edge.target
    else if (edge.target === deviceId) neighborId = edge.source
    if (!neighborId) continue

    const neighbor = topology.nodes.find(n => n.id === neighborId)
    if (!neighbor) continue

    const cap = neighbor.type === 'router' ? 'R' : neighbor.type === 'switch' ? 'S' : neighbor.type === 'firewall' ? 'F' : 'H'
    const localIface = device.data.interfaces[0]?.name || 'Fa0/0'
    const remoteIface = neighbor.data.interfaces[0]?.name || 'Fa0/0'

    lines.push({
      text: `${neighbor.data.hostname.padEnd(16)} ${localIface.padEnd(17)} 160        ${cap}           ${neighbor.type.padEnd(9)} ${remoteIface}`,
      type: 'default',
    })
  }

  if (topology.edges.filter(e => e.source === deviceId || e.target === deviceId).length === 0) {
    lines.push({ text: '  No CDP neighbors found.', type: 'default' })
  }

  return { lines }
}

// ─── Utility functions ────────────────────────────────────────────────────────

function generateSimpleMAC(nodeId: string, ifaceId: string): string {
  let hash = 0
  const input = nodeId + ':' + ifaceId
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(31, hash) + input.charCodeAt(i)) | 0
  }
  const bytes: number[] = []
  let h = hash >>> 0
  for (let i = 0; i < 6; i++) {
    bytes.push(h & 0xff)
    h = (h >>> 8) | ((hash << (24 - i * 8)) >>> 0)
  }
  return bytes.map(b => b.toString(16).padStart(2, '0')).join(':')
}

function maskToPrefix(mask: string): number {
  if (!mask) return 24
  return mask.split('.').reduce((acc, octet) => acc + Number(octet).toString(2).split('1').length - 1, 0)
}
