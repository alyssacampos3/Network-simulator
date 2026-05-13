import { useNetworkStore } from '../store/networkStore'
import { useTrafficStore } from '../store/trafficStore'
import { applyMask } from '../engine/subnet'

export function StatusBar() {
  const nodes = useNetworkStore(s => s.nodes)
  const edges = useNetworkStore(s => s.edges)
  const events = useTrafficStore(s => s.events)

  const configuredNodes = nodes.filter(n => n.data.interfaces.some(i => i.ipAddress))
  const activeLinks = edges.length

  // Unique subnets
  const subnets = new Set<string>()
  for (const node of nodes) {
    for (const iface of node.data.interfaces) {
      if (iface.ipAddress && iface.subnetMask) {
        subnets.add(applyMask(iface.ipAddress, iface.subnetMask) + '/' + iface.subnetMask)
      }
    }
  }

  const recentSuccess = events.slice(0, 10).filter(e => e.status === 'success').length
  const recentTotal = Math.min(events.length, 10)
  const successRate = recentTotal > 0 ? Math.round((recentSuccess / recentTotal) * 100) : null

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 bg-gray-950 border-t border-gray-800 text-[11px] text-gray-500 font-mono shrink-0">
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${nodes.length > 0 ? 'bg-green-400' : 'bg-gray-600'}`} />
        <span>{nodes.length} devices</span>
      </div>

      <div className="w-px h-3 bg-gray-800" />

      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${activeLinks > 0 ? 'bg-blue-400' : 'bg-gray-600'}`} />
        <span>{activeLinks} links</span>
      </div>

      <div className="w-px h-3 bg-gray-800" />

      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${subnets.size > 0 ? 'bg-purple-400' : 'bg-gray-600'}`} />
        <span>{subnets.size} subnet{subnets.size !== 1 ? 's' : ''}</span>
      </div>

      <div className="w-px h-3 bg-gray-800" />

      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${configuredNodes.length > 0 ? 'bg-yellow-400' : 'bg-gray-600'}`} />
        <span>{configuredNodes.length}/{nodes.length} configured</span>
      </div>

      {successRate !== null && (
        <>
          <div className="w-px h-3 bg-gray-800" />
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${successRate >= 80 ? 'bg-green-400' : successRate >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`} />
            <span>{successRate}% success rate</span>
          </div>
        </>
      )}

      <div className="ml-auto text-gray-700">
        Network Lab Simulator · CCNA Study Tool
      </div>
    </div>
  )
}
