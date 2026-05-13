import { useState, useEffect } from 'react'
import { useNetworkStore } from '../store/networkStore'
import { runDiagnostics, analyzeRootCause } from '../engine/troubleshoot'
import { generateIncidentTimeline, formatTimestamp } from '../engine/incidents'
import type { TroubleshootingSuggestion } from '../types'

interface Props {
  onClose: () => void
}

export function TroubleshootPanel({ onClose }: Props) {
  const nodes = useNetworkStore(s => s.nodes)
  const edges = useNetworkStore(s => s.edges)
  const labDescription = useNetworkStore(s => s.labDescription)
  const [issues, setIssues] = useState<TroubleshootingSuggestion[]>([])
  const [rootCause, setRootCause] = useState<ReturnType<typeof analyzeRootCause>>(null)
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null)
  const [showTimeline, setShowTimeline] = useState(false)

  useEffect(() => {
    const topology = { version: '1.0', nodes, edges, labDescription, savedAt: '' }
    setIssues(runDiagnostics(topology))
    setRootCause(analyzeRootCause(topology))
  }, [nodes, edges, labDescription])

  const severityIcon = (s: string) => {
    switch (s) {
      case 'critical': return '🔴'
      case 'warning': return '🟡'
      default: return '🔵'
    }
  }

  const severityBorder = (s: string) => {
    switch (s) {
      case 'critical': return 'border-red-500/30'
      case 'warning': return 'border-yellow-500/30'
      default: return 'border-blue-500/30'
    }
  }

  // Generate a sample timeline for the first critical issue
  const timeline = showTimeline && nodes.length > 0
    ? generateIncidentTimeline('interface_down', nodes[0].data.hostname, nodes[0].id)
    : []

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] bg-gray-900 border-l border-gray-700 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-950">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h2 className="text-sm font-semibold text-white">AI Troubleshooting Engine</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Root Cause Analysis */}
        {rootCause && (
          <div className="bg-gray-800 rounded-xl p-4 border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🎯</span>
              <h3 className="text-sm font-semibold text-white">Root Cause Analysis</h3>
              <span className="ml-auto text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">
                {rootCause.confidence}% confidence
              </span>
            </div>
            <p className="text-sm text-gray-300 mb-2">{rootCause.rootCause}</p>
            <p className="text-xs text-gray-400 italic">{rootCause.recommendation}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {rootCause.symptoms.map((s, i) => (
                <span key={i} className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                  {s.slice(0, 50)}...
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Issues List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Detected Issues ({issues.length})
            </h3>
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className="text-[10px] text-blue-400 hover:text-blue-300"
            >
              {showTimeline ? 'Hide' : 'Show'} Timeline
            </button>
          </div>

          {issues.length === 0 ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
              <span className="text-3xl">✅</span>
              <p className="text-sm text-green-300 mt-2 font-medium">Network is healthy</p>
              <p className="text-xs text-gray-400 mt-1">No issues detected in current topology</p>
            </div>
          ) : (
            <div className="space-y-2">
              {issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`bg-gray-800 rounded-lg border ${severityBorder(issue.severity)} overflow-hidden`}
                >
                  <button
                    onClick={() => setExpandedIssue(expandedIssue === idx ? null : idx)}
                    className="w-full text-left px-4 py-3 flex items-start gap-2 hover:bg-gray-750 transition-colors"
                  >
                    <span className="text-sm mt-0.5">{severityIcon(issue.severity)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{issue.issue}</p>
                      <p className="text-[10px] text-gray-500 uppercase mt-0.5">{issue.severity}</p>
                    </div>
                    <span className="text-gray-500 text-xs">{expandedIssue === idx ? '▼' : '▶'}</span>
                  </button>

                  {expandedIssue === idx && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-700 pt-3">
                      {/* Possible Causes */}
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Possible Causes</p>
                        <ul className="space-y-1">
                          {issue.possibleCauses.map((cause, i) => (
                            <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                              <span className="text-gray-600 mt-0.5">•</span>
                              {cause}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommended Commands */}
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Recommended Commands</p>
                        <div className="space-y-1">
                          {issue.recommendedCommands.map((cmd, i) => (
                            <code key={i} className="block text-xs text-green-400 bg-gray-900 px-2 py-1 rounded font-mono">
                              {cmd}
                            </code>
                          ))}
                        </div>
                      </div>

                      {/* Explanation */}
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Explanation</p>
                        <p className="text-xs text-gray-300 leading-relaxed">{issue.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incident Timeline */}
        {showTimeline && timeline.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Incident Timeline
            </h3>
            <div className="relative pl-4 border-l-2 border-gray-700 space-y-3">
              {timeline.map((event, idx) => (
                <div key={idx} className="relative">
                  <div className={`absolute -left-[21px] w-3 h-3 rounded-full border-2 border-gray-900 ${
                    event.severity === 'critical' ? 'bg-red-500' :
                    event.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="bg-gray-800 rounded-lg p-2.5 ml-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] text-gray-500 font-mono">{formatTimestamp(event.timestamp)}</span>
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                        event.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                        event.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'
                      }`}>{event.severity}</span>
                    </div>
                    <p className="text-xs text-gray-200">{event.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
