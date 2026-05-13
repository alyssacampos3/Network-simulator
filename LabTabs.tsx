import { useState, useEffect } from 'react'
import { useNetworkStore } from '../store/networkStore'
import { generateAllMetrics, formatUptime } from '../engine/healthMetrics'
import { getHealthScore } from '../engine/troubleshoot'
import type { DeviceHealthMetrics } from '../types'

interface Props {
  onClose: () => void
}

export function HealthDashboard({ onClose }: Props) {
  const nodes = useNetworkStore(s => s.nodes)
  const edges = useNetworkStore(s => s.edges)
  const labDescription = useNetworkStore(s => s.labDescription)
  const [metrics, setMetrics] = useState<DeviceHealthMetrics[]>([])
  const [healthScore, setHealthScore] = useState(100)

  useEffect(() => {
    const topology = { version: '1.0', nodes, edges, labDescription, savedAt: '' }
    setMetrics(generateAllMetrics(topology))
    setHealthScore(getHealthScore(topology))
  }, [nodes, edges, labDescription])

  // Refresh metrics every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const topology = { version: '1.0', nodes, edges, labDescription, savedAt: '' }
      setMetrics(generateAllMetrics(topology))
      setHealthScore(getHealthScore(topology))
    }, 5000)
    return () => clearInterval(interval)
  }, [nodes, edges, labDescription])

  const scoreColor = healthScore >= 80 ? 'text-green-400' : healthScore >= 50 ? 'text-yellow-400' : 'text-red-400'
  const scoreBg = healthScore >= 80 ? 'bg-green-500/10' : healthScore >= 50 ? 'bg-yellow-500/10' : 'bg-red-500/10'

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-gray-900 border-l border-gray-700 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-950">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h2 className="text-sm font-semibold text-white">Device Health Dashboard</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">✕</button>
      </div>

      {/* Network Health Score */}
      <div className={`mx-4 mt-4 p-4 rounded-xl border border-gray-700 ${scoreBg}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Network Health Score</p>
            <p className={`text-3xl font-bold ${scoreColor}`}>{healthScore}/100</p>
          </div>
          <div className={`w-16 h-16 rounded-full border-4 ${healthScore >= 80 ? 'border-green-500' : healthScore >= 50 ? 'border-yellow-500' : 'border-red-500'} flex items-center justify-center`}>
            <span className="text-2xl">{healthScore >= 80 ? '✓' : healthScore >= 50 ? '⚠' : '✗'}</span>
          </div>
        </div>
        <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${healthScore >= 80 ? 'bg-green-500' : healthScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${healthScore}%` }}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 px-4 mt-4">
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <p className="text-[10px] text-gray-500 uppercase">Devices</p>
          <p className="text-lg font-bold text-white">{nodes.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <p className="text-[10px] text-gray-500 uppercase">Links</p>
          <p className="text-lg font-bold text-white">{edges.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <p className="text-[10px] text-gray-500 uppercase">Online</p>
          <p className="text-lg font-bold text-green-400">
            {nodes.filter(n => n.data.interfaces.some(i => i.ipAddress && i.isUp)).length}
          </p>
        </div>
      </div>

      {/* Device Metrics Table */}
      <div className="flex-1 overflow-y-auto px-4 mt-4 pb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Device Metrics</h3>
        <div className="space-y-2">
          {metrics.map(m => {
            const device = nodes.find(n => n.id === m.deviceId)
            if (!device) return null
            return (
              <div key={m.deviceId} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${m.cpuUsage < 80 ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-sm font-medium text-white">{device.data.hostname}</span>
                    <span className="text-[10px] text-gray-500 uppercase">{device.type}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{formatUptime(m.uptime)}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <MetricBar label="CPU" value={m.cpuUsage} />
                  <MetricBar label="MEM" value={m.memoryUsage} />
                  <MetricMini label="Drops" value={m.packetDrops} unit="" warn={m.packetDrops > 20} />
                  <MetricMini label="Latency" value={m.latency} unit="ms" warn={m.latency > 50} />
                </div>
              </div>
            )
          })}
          {metrics.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No devices in topology</p>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const color = value < 60 ? 'bg-green-500' : value < 80 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function MetricMini({ label, value, unit, warn }: { label: string; value: number; unit: string; warn: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className={`text-xs font-mono ${warn ? 'text-red-400' : 'text-gray-200'}`}>{value}{unit}</p>
    </div>
  )
}
