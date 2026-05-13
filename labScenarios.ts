import { useRef, useState, useEffect } from 'react'
import { useNetworkStore } from '../store/networkStore'
import { serializeTopology } from '../persistence/serializer'
import { isValidTopologySnapshot } from '../persistence/validator'
import { saveNamedTopology, loadNamedTopologies, deleteNamedTopology } from '../persistence/storage'
import type { NamedSave } from '../types'

export function TopologyIO() {
  const getSnapshot = useNetworkStore(s => s.getSnapshot)
  const loadTopology = useNetworkStore(s => s.loadTopology)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [saveName, setSaveName] = useState('')
  const [saves, setSaves] = useState<NamedSave[]>([])

  useEffect(() => {
    setSaves(loadNamedTopologies())
  }, [])

  // ── Export ──────────────────────────────────────────────────────────────────
  function handleExport() {
    const json = serializeTopology(getSnapshot())
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'topology.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Import ──────────────────────────────────────────────────────────────────
  function handleImportClick() {
    setImportError(null)
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const raw = ev.target?.result as string
        const parsed: unknown = JSON.parse(raw)
        if (!isValidTopologySnapshot(parsed)) {
          setImportError('Invalid topology file.')
          return
        }
        loadTopology(parsed)
        setImportError(null)
      } catch {
        setImportError('Failed to parse file.')
      }
    }
    reader.readAsText(file)
    // Reset so the same file can be re-imported
    e.target.value = ''
  }

  // ── Named saves ─────────────────────────────────────────────────────────────
  function handleSave() {
    const name = saveName.trim()
    if (!name) return
    saveNamedTopology(name, getSnapshot())
    setSaves(loadNamedTopologies())
    setSaveName('')
  }

  function handleLoad(save: NamedSave) {
    loadTopology(save.snapshot)
  }

  function handleDelete(name: string) {
    deleteNamedTopology(name)
    setSaves(loadNamedTopologies())
  }

  return (
    <div className="flex flex-col gap-3 p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 w-64">
      {/* Export / Import row */}
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 px-2 py-1.5 bg-blue-700 hover:bg-blue-600 rounded text-white transition-colors"
        >
          Export
        </button>
        <button
          onClick={handleImportClick}
          className="flex-1 px-2 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
        >
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {importError && (
        <p className="text-red-400 text-xs">{importError}</p>
      )}

      {/* Named save input */}
      <div className="flex gap-2">
        <input
          value={saveName}
          onChange={e => setSaveName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="Save name…"
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={handleSave}
          disabled={!saveName.trim()}
          className="px-3 py-1 bg-green-700 hover:bg-green-600 disabled:opacity-40 rounded text-white transition-colors"
        >
          Save
        </button>
      </div>

      {/* Saves list */}
      {saves.length > 0 && (
        <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {saves.map(s => (
            <li
              key={s.name}
              className="flex items-center gap-1 bg-gray-800 rounded px-2 py-1"
            >
              <span className="flex-1 truncate text-gray-300 text-xs" title={s.name}>
                {s.name}
              </span>
              <button
                onClick={() => handleLoad(s)}
                className="text-blue-400 hover:text-blue-300 text-xs px-1 transition-colors"
              >
                Load
              </button>
              <button
                onClick={() => handleDelete(s.name)}
                className="text-red-400 hover:text-red-300 text-xs px-1 transition-colors"
              >
                Del
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
