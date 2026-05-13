import { useState, useEffect } from 'react'
import { useNetworkStore } from '../store/networkStore'
import { analyzeConfigRisks } from '../engine/configRisk'
import type { ConfigRisk } from '../types'

interface Props {
  onClose: () => void
}

export function ConfigRiskPanel({ onClose }: Props) {
  const nodes = useNetworkStore(s => s.nodes)
  const edges = useNetworkStore(s => s.edges)
  const labDescription = useNetworkStore(s => s.labDescription)
  const [risks, setRisks] = useState<ConfigRisk[]>([])

  useEffect(() => {
    const topology = { version: '1.0', nodes, edges, labDescription, savedAt: '' }
    setRisks(analyzeConfigRisks(topology))
  }, [nodes, edges, labDescription])

  const riskIcon = (level: string) => {
    switch (level) {
      case 'high': return '🔴'
      case 'medium': return '🟠'
      default: return '🟡'
    }
  }

  const riskBg = (level: string) => {
    switch (level) {
      case 'high': return 'border-red-500/30 bg-red-500/5'
      case 'medium': return 'border-orange-500/30 bg-orange-500/5'
      default: return 'border-yellow-500/30 bg-yellow-500/5'
    }
  }

  const highCount = risks.filter(r => r.level === 'high').length
  const medCount = risks.filter(r => r.level === 'medium').length
  const lowCount = risks.filter(r => r.level === 'low').length

  return (
    <div className="fixed inset-y-0 right-0 w-[460px] bg-gray-900 border-l border-gray-700 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-950">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <h2 className="text-sm font-semibold text-white">Configuration Risk Analyzer</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">✕</button>
      </div>

      {/* Summary */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🔴</span>
            <span className="text-xs text-gray-300">{highCount} High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🟠</span>
            <span className="text-xs text-gray-300">{medCount} Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🟡</span>
            <span className="text-xs text-gray-300">{lowCount} Low</span>
          </div>
          <span className="ml-auto text-[10px] text-gray-500">{risks.length} total risks</span>
        </div>
      </div>

      {/* Risks List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {risks.length === 0 ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
            <span className="text-3xl">✅</span>
            <p className="text-sm text-green-300 mt-2 font-medium">No configuration risks detected</p>
            <p className="text-xs text-gray-400 mt-1">Your topology configuration looks good</p>
          </div>
        ) : (
          risks.map(risk => (
            <div key={risk.id} className={`rounded-lg border p-4 ${riskBg(risk.level)}`}>
              <div className="flex items-start gap-2">
                <span className="text-sm mt-0.5">{riskIcon(risk.level)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-gray-500">{risk.id}</span>
                    <span className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">{risk.category}</span>
                  </div>
                  <p className="text-sm text-white mb-2">{risk.description}</p>
                  <div className="bg-gray-900/50 rounded p-2 mb-2">
                    <p className="text-[10px] text-gray-400 uppercase mb-0.5">Recommendation</p>
                    <p className="text-xs text-gray-300">{risk.recommendation}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {risk.affectedDevices.map((d, i) => (
                      <span key={i} className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
