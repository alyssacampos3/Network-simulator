import { useState, useEffect, useRef } from 'react'
import { useNetworkStore } from '../store/networkStore'
import { saveNamedTopology, loadNamedTopologies, deleteNamedTopology, STORAGE_KEY } from '../persistence/storage'
import { isValidTopologySnapshot } from '../persistence/validator'
import type { NamedSave, TopologySnapshot } from '../types'

export function LabTabs() {
  const getSnapshot = useNetworkStore(s => s.getSnapshot)
  const loadTopology = useNetworkStore(s => s.loadTopology)
  const nodes = useNetworkStore(s => s.nodes)
  const edges = useNetworkStore(s => s.edges)

  const [saves, setSaves] = useState<NamedSave[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [recovered, setRecovered] = useState<TopologySnapshot | null>(null)
  const [showRecovery, setShowRecovery] = useState(false)
  const [saveIndicator, setSaveIndicator] = useState(false)

  const activeTabRef = useRef<string | null>(null)
  activeTabRef.current = activeTab

  // Auto-save active named tab whenever topology changes
  useEffect(() => {
    if (!activeTabRef.current) return
    const timer = setTimeout(() => {
      const name = activeTabRef.current
      if (!name) return
      saveNamedTopology(name, getSnapshot())
      setSaves(loadNamedTopologies())
      setSaveIndicator(true)
      setTimeout(() => setSaveIndicator(false), 1500)
    }, 800)
    return () => clearTimeout(timer)
  }, [nodes, edges, getSnapshot])

  useEffect(() => {
    setSaves(loadNamedTopologies())
    // Check if there's auto-saved data that might be recoverable
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (isValidTopologySnapshot(parsed) && parsed.nodes.length > 0) {
          setRecovered(parsed)
        }
      }
    } catch { /* ignore */ }
  }, [])

  function handleSave() {
    const name = newName.trim()
    if (!name) return
    saveNamedTopology(name, getSnapshot())
    const updated = loadNamedTopologies()
    setSaves(updated)
    setActiveTab(name)
    setNewName('')
    setAdding(false)
  }

  function handleLoad(save: NamedSave) {
    loadTopology(save.snapshot)
    setActiveTab(save.name)
  }

  function handleDelete(name: string, e: React.MouseEvent) {
    e.stopPropagation()
    deleteNamedTopology(name)
    const updated = loadNamedTopologies()
    setSaves(updated)
    if (activeTab === name) setActiveTab(updated[0]?.name ?? null)
  }

  return (
    <div className="flex flex-col shrink-0">
      {/* Recovery banner */}
      {recovered && recovered.nodes.length > 0 && showRecovery === false && useNetworkStore.getState().nodes.length === 0 && (
        <div className="flex items-center gap-3 px-3 py-1.5 bg-yellow-900/30 border-b border-yellow-700/40 text-xs text-yellow-300">
          <span>⚠ Auto-saved lab found ({recovered.nodes.length} devices) —</span>
          <button
            onClick={() => {
              loadTopology(recovered)
              // Also save it as a named tab so it shows up
              const name = `Recovered Lab ${new Date().toLocaleTimeString()}`
              saveNamedTopology(name, recovered)
              setSaves(loadNamedTopologies())
              setActiveTab(name)
              setRecovered(null)
            }}
            className="text-yellow-200 underline hover:text-white font-semibold"
          >
            Restore it
          </button>
          <span className="text-yellow-600">— it will be saved as a tab automatically</span>
          <button
            onClick={() => setShowRecovery(true)}
            className="text-yellow-600 hover:text-yellow-400 ml-auto"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="flex items-center gap-1 px-2 border-b border-gray-700 overflow-x-auto" style={{ background: '#111827' }}>
      {/* New Lab button */}
      <button
        onClick={() => {
          const current = useNetworkStore.getState()
          if (current.nodes.length > 0) {
            const name = window.prompt('Save current lab before creating new one? Enter a name to save, or cancel to discard:')
            if (name && name.trim()) {
              saveNamedTopology(name.trim(), current.getSnapshot())
              setSaves(loadNamedTopologies())
            }
          }
          useNetworkStore.setState({ nodes: [], edges: [], labDescription: '' })
          setActiveTab(null)
        }}
        className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded-t transition-colors whitespace-nowrap border-b-2 border-transparent"
      >
        + New Lab
      </button>

      {/* Saved lab tabs */}
      {saves.map(save => (
        <div
          key={save.name}
          onClick={() => handleLoad(save)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t cursor-pointer transition-colors whitespace-nowrap border-b-2 group ${
            activeTab === save.name
              ? 'bg-gray-800 text-white border-blue-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-800 border-transparent'
          }`}
        >
          <span>📁</span>
          <span>{save.name}</span>
          <button
            onClick={(e) => handleDelete(save.name, e)}
            className="ml-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity leading-none"
            title="Delete lab"
          >
            ✕
          </button>
        </div>
      ))}

      {/* Save current lab */}
      {adding ? (
        <div className="flex items-center gap-1 px-2">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setAdding(false) }}
            placeholder="Lab name..."
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white w-28 focus:outline-none focus:border-blue-500"
          />
          <button onClick={handleSave} className="text-xs text-green-400 hover:text-green-300 px-1">Save</button>
          <button onClick={() => setAdding(false)} className="text-xs text-gray-500 hover:text-gray-300 px-1">✕</button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-blue-400 transition-colors whitespace-nowrap"
          title="Save current lab"
        >
          💾 Save Lab
        </button>
      )}

      {/* Autosave indicator */}
      {saveIndicator && (
        <span className="text-[10px] text-green-500 ml-2 animate-pulse">✓ autosaved</span>
      )}

      {/* Unsaved indicator */}
      {!activeTab && nodes.length > 0 && (
        <span className="text-[10px] text-yellow-600 ml-2">● unsaved</span>
      )}
    </div>
    </div>
  )
}
