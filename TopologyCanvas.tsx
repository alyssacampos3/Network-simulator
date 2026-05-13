import { useState, useCallback } from 'react'
import { useNetworkStore } from '../store/networkStore'
import { TopologyCanvas } from './TopologyCanvas'
import { encodeTopologyToURL } from '../persistence/urlEncoder'
import type { NetworkNode } from '../types'

interface PresentationModeProps {
  onExit: () => void
}

export function PresentationMode({ onExit }: PresentationModeProps) {
  const nodes = useNetworkStore(s => s.nodes)
  const edges = useNetworkStore(s => s.edges)
  const labDescription = useNetworkStore(s => s.labDescription)
  const setLabDescription = useNetworkStore(s => s.setLabDescription)
  const getSnapshot = useNetworkStore(s => s.getSnapshot)

  const [copied, setCopied] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState(labDescription)

  // Derive subnets in use from node interfaces
  const subnetsInUse = Array.from(
    new Set(
      nodes.flatMap(n =>
        n.data.interfaces
          .filter(iface => iface.ipAddress && iface.subnetMask)
          .map(iface => `${iface.ipAddress}/${iface.subnetMask}`)
      )
    )
  )

  async function handleCopyLink() {
    const url = encodeTopologyToURL(getSnapshot())
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDescBlur() {
    setEditingDesc(false)
    setLabDescription(descDraft)
  }

  // No-op handlers — canvas is read-only
  const noop = useCallback(() => {}, [])
  const noopNode = useCallback((_e: React.MouseEvent, _n: NetworkNode) => {}, [])

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col z-50">
      {/* Top summary bar */}
      <div className="flex items-center gap-6 px-6 py-3 bg-gray-900 border-b border-gray-700 shrink-0">
        <div className="flex gap-6 text-sm text-gray-300">
          <span>
            <span className="text-blue-400 font-semibold">{nodes.length}</span> devices
          </span>
          <span>
            <span className="text-green-400 font-semibold">{edges.length}</span> links
          </span>
          <span>
            <span className="text-purple-400 font-semibold">{subnetsInUse.length}</span> subnets
          </span>
        </div>

        {/* Inline-editable lab description */}
        <div className="flex-1 min-w-0">
          {editingDesc ? (
            <input
              autoFocus
              value={descDraft}
              onChange={e => setDescDraft(e.target.value)}
              onBlur={handleDescBlur}
              onKeyDown={e => e.key === 'Enter' && handleDescBlur()}
              className="w-full bg-gray-800 text-gray-200 text-sm px-2 py-1 rounded border border-blue-500 focus:outline-none"
            />
          ) : (
            <button
              onClick={() => { setDescDraft(labDescription); setEditingDesc(true) }}
              className="text-gray-400 text-sm hover:text-gray-200 truncate max-w-full text-left"
              title="Click to edit lab description"
            >
              {labDescription || 'Click to add a lab description…'}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Share Link'}
          </button>
          <button
            onClick={onExit}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
          >
            Exit Presentation
          </button>
        </div>
      </div>

      {/* Read-only canvas */}
      <div className="flex-1 overflow-hidden">
        <TopologyCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={noop as never}
          onEdgesChange={noop as never}
          onConnect={noop as never}
          onNodeClick={noopNode}
          readOnly
        />
      </div>
    </div>
  )
}
