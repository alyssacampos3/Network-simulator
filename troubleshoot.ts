import type { DeviceHealthMetrics, TopologySnapshot } from '../types'

/**
 * Simulates device health metrics based on topology state.
 * In a real system these would come from SNMP/telemetry.
 */

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate simulated health metrics for a device.
 * Devices with issues (down interfaces, no config) get worse metrics.
 */
export function generateDeviceMetrics(
  deviceId: string,
  topology: TopologySnapshot
): DeviceHealthMetrics {
  const device = topology.nodes.find(n => n.id === deviceId)
  if (!device) {
    return {
      deviceId,
      cpuUsage: 0,
      memoryUsage: 0,
      uptime: 0,
      packetDrops: 0,
      latency: 0,
      interfaceErrors: 0,
      temperature: 0,
      lastUpdated: new Date().toISOString(),
    }
  }

  // Determine health factors
  const hasDownInterface = device.data.interfaces.some(i => !i.isUp && i.ipAddress)
  const isConfigured = device.data.interfaces.some(i => i.ipAddress)

  // Base metrics vary by device type
  let baseCpu = randomBetween(15, 45)
  let baseMem = randomBetween(30, 60)
  let baseDrops = randomBetween(0, 5)
  let baseLatency = randomBetween(1, 10)
  let baseErrors = 0
  let baseTemp = randomBetween(35, 55)

  if (device.type === 'router') {
    baseCpu = randomBetween(25, 65)
    baseMem = randomBetween(40, 70)
  } else if (device.type === 'firewall') {
    baseCpu = randomBetween(30, 70)
    baseMem = randomBetween(45, 75)
    baseTemp = randomBetween(40, 60)
  }

  // Degraded metrics for problematic devices
  if (hasDownInterface) {
    baseErrors = randomBetween(50, 200)
    baseDrops = randomBetween(20, 100)
    baseCpu += 20
  }

  if (!isConfigured) {
    baseLatency = 0
    baseDrops = 0
  }

  return {
    deviceId,
    cpuUsage: Math.min(100, baseCpu),
    memoryUsage: Math.min(100, baseMem),
    uptime: randomBetween(3600, 864000), // 1 hour to 10 days
    packetDrops: baseDrops,
    latency: baseLatency,
    interfaceErrors: baseErrors,
    temperature: baseTemp,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Generate metrics for all devices in the topology
 */
export function generateAllMetrics(topology: TopologySnapshot): DeviceHealthMetrics[] {
  return topology.nodes.map(node => generateDeviceMetrics(node.id, topology))
}

/**
 * Format uptime seconds into human-readable string
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h ${mins}m`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}
