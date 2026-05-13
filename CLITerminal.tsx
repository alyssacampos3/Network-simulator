import { useCallback, useState } from 'react'
import { ReactFlowProvider, applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import type { NodeChange, EdgeChange, Connection } from '@xyflow/react'

import { useNetworkStore } from './store/networkStore'
import { TopologyCanvas } from './components/TopologyCanvas'
import { DeviceSidebar } from './components/DeviceSidebar'
import { DeviceConfigPanel } from './components/DeviceConfigPanel'
import { TerminalPanel } from './components/TerminalPanel'
import { PacketVisualizer } from './components/PacketVisualizer'
import { LabNotesPanel } from './components/LabNotesPanel'
import { PresentationMode } from './components/PresentationMode'
import { TopologyIO } from './components/TopologyIO'
import { ContextMenu } from './components/ContextMenu'
import { LabTabs } from './components/LabTabs'
import { EdgeLegend } from './components/EdgeLegend'
import { CommandCheatSheet } from './components/CommandCheatSheet'
import { TrafficAnalyzer } from './components/TrafficAnalyzer'
import { StatusBar } from './components/StatusBar'
import { PortfolioPanel } from './components/PortfolioPanel'
import { OnCallScheduler } from './components/OnCallScheduler'
import { HealthDashboard } from './components/HealthDashboard'
import { TroubleshootPanel } from './components/TroubleshootPanel'
import { ConfigRiskPanel } from './components/ConfigRiskPanel'
import { EducationalPanel } from './components/EducationalPanel'
import { LogViewer } from './components/LogViewer'
import type { NetworkNode, NetworkEdge } from './types'

interface ContextMenuState {
  x: number
  y: number
  nodeId: string
  hostname: string
}

function AppInner() {
  const nodes = useNetworkStore(s => s.nodes)
  const edges = useNetworkStore(s => s.edges)
  const selectedNodeId = useNetworkStore(s => s.selectedNodeId)
  const activeTerminalDeviceId = useNetworkStore(s => s.activeTerminalDeviceId)
  const presentationMode = useNetworkStore(s => s.presentationMode)

  const removeNode = useNetworkStore(s => s.removeNode)
  const addEdge = useNetworkStore(s => s.addEdge)
  const setSelectedNode = useNetworkStore(s => s.setSelectedNode)
  const setActiveTerminal = useNetworkStore(s => s.setActiveTerminal)
  const setPresentationMode = useNetworkStore(s => s.setPresentationMode)

  const [showNotes, setShowNotes] = useState(false)
  const [showPacket, setShowPacket] = useState(false)
  const [showIO, setShowIO] = useState(false)
  const [showCheatSheet, setShowCheatSheet] = useState(false)
  const [showTerminal, setShowTerminal] = useState(false)
  const [showTraffic, setShowTraffic] = useState(false)
  const [showPortfolio, setShowPortfolio] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)
  const [showHealth, setShowHealth] = useState(false)
  const [showTroubleshoot, setShowTroubleshoot] = useState(false)
  const [showConfigRisk, setShowConfigRisk] = useState(false)
  const [showEducational, setShowEducational] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [edgeMenu, setEdgeMenu] = useState<{ x: number; y: number; edgeId: string } | null>(null)
  const [showLegend, setShowLegend] = useState(false)

  // ── React Flow change handlers ──────────────────────────────────────────────
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const current = useNetworkStore.getState().nodes
      const updated = applyNodeChanges(changes, current as unknown as Parameters<typeof applyNodeChanges>[1])
      useNetworkStore.setState({ nodes: updated as unknown as NetworkNode[] })
    },
    []
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const current = useNetworkStore.getState().edges
      const updated = applyEdgeChanges(changes, current as unknown as Parameters<typeof applyEdgeChanges>[1])
      useNetworkStore.setState({ edges: updated as unknown as NetworkEdge[] })
    },
    []
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: NetworkEdge = {
        id: crypto.randomUUID(),
        source: connection.source ?? '',
        target: connection.target ?? '',
        sourceHandle: connection.sourceHandle ?? '',
        targetHandle: connection.targetHandle ?? '',
        data: { linkType: 'ethernet' },
      }
      addEdge(newEdge)
    },
    [addEdge]
  )

  // ── Node interaction ────────────────────────────────────────────────────────
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: NetworkNode) => {
      setSelectedNode(node.id)
    },
    [setSelectedNode]
  )

  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: NetworkNode) => {
      setActiveTerminal(node.id)
      setShowTerminal(true)
    },
    [setActiveTerminal]
  )

  const onNodeRightClick = useCallback(
    (event: React.MouseEvent, node: NetworkNode) => {
      event.preventDefault()
      setEdgeMenu(null)
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
        hostname: node.data.hostname,
      })
    },
    []
  )

  const onEdgeRightClick = useCallback(
    (event: React.MouseEvent, edgeId: string) => {
      event.preventDefault()
      setContextMenu(null)
      setEdgeMenu({ x: event.clientX, y: event.clientY, edgeId })
    },
    []
  )

  // ── Derived state ───────────────────────────────────────────────────────────
  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null

  if (presentationMode) {
    return <PresentationMode onExit={() => setPresentationMode(false)} />
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-gray-950 border-b border-gray-800 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white text-sm leading-tight">Network Lab</p>
              <p className="text-[10px] text-gray-500 leading-tight">Simulator</p>
            </div>
          </div>
          <div className="w-px h-6 bg-gray-800" />
          <p className="text-[11px] text-gray-600 hidden lg:block">click to configure · double-click for terminal · right-click for options</p>
        </div>

        <div className="flex items-center gap-1.5 relative">
          {[
            { key: 'notes', label: 'Notes', active: showNotes, onClick: () => setShowNotes(v => !v), icon: '📓' },
            { key: 'commands', label: 'Commands', active: showCheatSheet, onClick: () => setShowCheatSheet(v => !v), icon: '📋' },
            { key: 'terminal', label: 'Terminal', active: showTerminal, onClick: () => setShowTerminal(v => !v), icon: '>_', mono: true },
            { key: 'packet', label: 'Packet Sim', active: showPacket, onClick: () => setShowPacket(v => !v), icon: '⬡' },
            { key: 'traffic', label: 'Traffic', active: showTraffic, onClick: () => setShowTraffic(v => !v), icon: '📡' },
            { key: 'health', label: 'Health', active: showHealth, onClick: () => setShowHealth(v => !v), icon: '📊' },
            { key: 'troubleshoot', label: 'AI Diag', active: showTroubleshoot, onClick: () => setShowTroubleshoot(v => !v), icon: '🤖' },
            { key: 'configrisk', label: 'Risks', active: showConfigRisk, onClick: () => setShowConfigRisk(v => !v), icon: '⚠️' },
            { key: 'educational', label: 'Learn', active: showEducational, onClick: () => setShowEducational(v => !v), icon: '📚' },
            { key: 'logs', label: 'Logs', active: showLogs, onClick: () => setShowLogs(v => !v), icon: '📜' },
            { key: 'portfolio', label: 'Portfolio', active: showPortfolio, onClick: () => setShowPortfolio(v => !v), icon: '🎯' },
            { key: 'scheduler', label: 'On-Call', active: showScheduler, onClick: () => setShowScheduler(v => !v), icon: '📅' },
          ].map(btn => (
            <button
              key={btn.key}
              onClick={btn.onClick}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
                btn.active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 hover:border-gray-600'
              }`}
            >
              <span className={btn.mono ? 'font-mono' : ''}>{btn.icon}</span>
              {btn.label}
            </button>
          ))}

          <div className="w-px h-5 bg-gray-800 mx-1" />

          <button
            onClick={() => setPresentationMode(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 hover:border-gray-600 transition-all duration-150 flex items-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
            Present
          </button>

          <button
            onClick={() => setShowIO(v => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
              showIO
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 hover:border-gray-600'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Save / Load
          </button>

          {showIO && (
            <div className="absolute top-full right-0 mt-2 z-50">
              <TopologyIO />
            </div>
          )}
        </div>
      </header>

      {/* ── Main area ───────────────────────────────────────────────────────── */}
      <LabTabs />
      <div className="flex flex-1 overflow-hidden">
        {/* Device sidebar */}
        <DeviceSidebar />

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <TopologyCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeRightClick={onNodeRightClick}
            onEdgeRightClick={onEdgeRightClick}
          />
          {showLegend && <EdgeLegend />}
          <button
            onClick={() => setShowLegend(v => !v)}
            className="absolute bottom-24 right-4 z-10 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            title="Toggle cable type legend"
          >
            🔌 Cable Guide
          </button>
        </div>
      </div>

      {/* ── Overlay panels ──────────────────────────────────────────────────── */}
      {selectedNode && (
        <DeviceConfigPanel
          device={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {showNotes && (
        <LabNotesPanel onClose={() => setShowNotes(false)} />
      )}

      {showCheatSheet && (
        <CommandCheatSheet onClose={() => setShowCheatSheet(false)} />
      )}

      {showTraffic && (
        <TrafficAnalyzer onClose={() => setShowTraffic(false)} />
      )}

      {showPortfolio && (
        <PortfolioPanel onClose={() => setShowPortfolio(false)} />
      )}

      {showScheduler && (
        <OnCallScheduler onClose={() => setShowScheduler(false)} />
      )}

      {showHealth && (
        <HealthDashboard onClose={() => setShowHealth(false)} />
      )}

      {showTroubleshoot && (
        <TroubleshootPanel onClose={() => setShowTroubleshoot(false)} />
      )}

      {showConfigRisk && (
        <ConfigRiskPanel onClose={() => setShowConfigRisk(false)} />
      )}

      {showEducational && (
        <EducationalPanel onClose={() => setShowEducational(false)} />
      )}

      {showLogs && (
        <LogViewer onClose={() => setShowLogs(false)} />
      )}

      {showPacket && (
        <PacketVisualizer onClose={() => setShowPacket(false)} />
      )}

      {showTerminal && (
        <TerminalPanel
          onClose={() => setShowTerminal(false)}
          initialDeviceId={activeTerminalDeviceId}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          hostname={contextMenu.hostname}
          onConfigure={() => setSelectedNode(contextMenu.nodeId)}
          onOpenTerminal={() => setActiveTerminal(contextMenu.nodeId)}
          onDelete={() => { removeNode(contextMenu.nodeId); setSelectedNode(null); setActiveTerminal(null) }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {edgeMenu && (        <div
          className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl py-1 min-w-[200px] text-sm"
          style={{ top: edgeMenu.y, left: edgeMenu.x }}
        >
          <div className="px-3 py-1.5 text-gray-400 text-xs border-b border-gray-700 mb-1">Change Cable Type</div>
          {([
            { type: 'ethernet' as const,  color: 'text-green-400',  label: '━━ Ethernet',  desc: 'PC↔Switch, Router↔Switch' },
            { type: 'serial' as const,    color: 'text-orange-400', label: '╌╌ Serial',    desc: 'Router↔Router (WAN)' },
          ]).map(({ type, color, label, desc }) => (
            <button
              key={type}
              onClick={() => {
                useNetworkStore.setState(state => ({
                  edges: state.edges.map(e =>
                    e.id === edgeMenu.edgeId
                      ? { ...e, data: { ...e.data, linkType: type } }
                      : e
                  )
                }))
                setEdgeMenu(null)
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors"
            >
              <span className={`font-mono font-bold ${color}`}>{label}</span>
              <span className="text-gray-500 text-xs ml-2">{desc}</span>
            </button>
          ))}
          <div className="border-t border-gray-700 mt-1 pt-1">
            <button
              onClick={() => {
                useNetworkStore.getState().removeEdge(edgeMenu.edgeId)
                setEdgeMenu(null)
              }}
              className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-900/30 transition-colors"
            >
              🗑️ Delete Link
            </button>
          </div>
          <button
            onClick={() => setEdgeMenu(null)}
            className="absolute top-1 right-2 text-gray-500 hover:text-white text-xs"
          >✕</button>
        </div>
      )}
      <StatusBar />
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppInner />
    </ReactFlowProvider>
  )
}
