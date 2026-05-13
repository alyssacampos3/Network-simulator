import { useState } from 'react'
import type { PathResult } from '../types'
import { findPath } from '../engine/pathfinder'
import { useNetworkStore } from '../store/networkStore'
import { useAnimationStore } from '../store/animationStore'
import { useTrafficStore } from '../store/trafficStore'

interface Props {
  onClose: () => void
}

export function PacketVisualizer({ onClose }: Props) {
  const nodes = useNetworkStore(s => s.nodes)
  const edges = useNetworkStore(s => s.edges)
  const startAnimation = useAnimationStore(s => s.startAnimation)
  const pulseEdge = useAnimationStore(s => s.pulseEdge)
  const logEvent = useTrafficStore(s => s.logEvent)

  const [sourceId, setSourceId] = useState('')
  const [destId, setDestId] = useState('')
  const [result, setResult] = useState<PathResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [animating, setAnimating] = useState(false)

  function handleSendPacket() {
    setResult(null)
    setError(null)

    if (!sourceId || !destId) { setError('Please select both source and destination devices.'); return }
    if (sourceId === destId) { setError('Source and destination must be different devices.'); return }

    const topology = useNetworkStore.getState().getSnapshot()
    const destNode = nodes.find(n => n.id === destId)
    if (!destNode) { setError('Destination device not found.'); return }

    const destIp = destNode.data.interfaces[0]?.ipAddress
    if (!destIp) { setError('Destination device has no IP address configured.'); return }

    const pathResult = findPath(sourceId, destIp, topology)
    setResult(pathResult)

    // Build edge list from hops
    const edgeIds: string[] = []
    for (const hop of pathResult.hops) {
      if (hop.edgeId) {
        edgeIds.push(hop.edgeId)
        pulseEdge(hop.edgeId)
      }
    }

    // If no hop edge IDs, find edges connecting the path nodes directly
    if (edgeIds.length === 0 && pathResult.hops.length >= 2) {
      for (let i = 0; i < pathResult.hops.length - 1; i++) {
        const fromId = pathResult.hops[i].deviceId
        const toId = pathResult.hops[i + 1].deviceId
        const edge = edges.find(e =>
          (e.source === fromId && e.target === toId) ||
          (e.source === toId && e.target === fromId)
        )
        if (edge) edgeIds.push(edge.id)
      }
    }

    if (edgeIds.length > 0) {
      setAnimating(true)
      startAnimation(edgeIds, pathResult.reachable)
      setTimeout(() => setAnimating(false), edgeIds.length * 400 + 500)
    }

    // Log to traffic analyzer
    const sourceNode = nodes.find(n => n.id === sourceId)
    logEvent({
      protocol: 'ICMP',
      source: sourceNode?.data.hostname ?? sourceId,
      sourceIp: sourceNode?.data.interfaces[0]?.ipAddress ?? '',
      destination: destNode.data.hostname,
      destIp,
      command: `packet-sim ${sourceNode?.data.hostname} → ${destNode.data.hostname}`,
      status: pathResult.reachable ? 'success' : 'failed',
      hopCount: pathResult.hops.length,
      bytes: 32,
      latency: pathResult.reachable ? '<1ms' : 'timeout',
      hops: pathResult.hops,
      hopDecisions: [],
      failReason: pathResult.failReason,
    })
  }

  return (
    <div className="fixed top-16 right-4 w-[480px] bg-gray-900 text-white border border-gray-700 rounded-xl shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${animating ? 'bg-blue-400 animate-pulse' : 'bg-gray-600'}`} />
          <h2 className="text-sm font-semibold">Packet Simulator</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">✕</button>
      </div>

      <div className="px-4 py-4 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Source</label>
            <select
              value={sourceId}
              onChange={e => { setSourceId(e.target.value); setResult(null); setError(null) }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">— select —</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.data.hostname}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-2 text-gray-600">→</div>
          <div className="flex-1">
            <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Destination</label>
            <select
              value={destId}
              onChange={e => { setDestId(e.target.value); setResult(null); setError(null) }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">— select —</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.data.hostname}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSendPacket}
          disabled={animating}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          {animating ? '⬡ Sending...' : '⬡ Send Packet'}
        </button>
      </div>

      {error && (
        <div className="mx-4 mb-3 px-3 py-2 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-xs">{error}</div>
      )}

      {result && (
        <div className="px-4 pb-4 space-y-3">
          <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${
            result.reachable
              ? 'bg-green-900/20 border-green-700 text-green-300'
              : 'bg-red-900/20 border-red-700 text-red-300'
          }`}>
            {result.reachable ? '✓ Packet delivered successfully' : `✗ ${result.failReason ?? 'Delivery failed'}`}
          </div>

          {result.hops.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Path ({result.hops.length} hops)</p>
              <div className="flex flex-wrap items-center gap-1">
                {result.hops.map((hop, i) => (
                  <span key={hop.deviceId} className="flex items-center gap-1">
                    <span className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono">
                      <span className="text-gray-200">{hop.hostname}</span>
                      {hop.ipAddress && <span className="text-gray-500 ml-1">{hop.ipAddress}</span>}
                    </span>
                    {i < result.hops.length - 1 && <span className="text-gray-600 text-xs">→</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
