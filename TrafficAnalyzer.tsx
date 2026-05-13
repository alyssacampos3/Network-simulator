import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import type { OutputLine } from '../types'
import { executeCLICommand } from '../engine/cli'
import { useNetworkStore } from '../store/networkStore'

function lineColor(type: OutputLine['type']): string {
  switch (type) {
    case 'success': return 'text-green-400'
    case 'error':   return 'text-red-400'
    case 'info':    return 'text-yellow-400'
    default:        return 'text-gray-300'
  }
}

interface Props {
  onClose: () => void
  initialDeviceId?: string | null
}

export function TerminalPanel({ onClose, initialDeviceId }: Props) {
  const nodes = useNetworkStore(s => s.nodes)

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    initialDeviceId ?? nodes[0]?.id ?? ''
  )
  const [output, setOutput] = useState<OutputLine[]>([
    { text: "Network Lab CLI — select a device and type 'help' for commands", type: 'info' },
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [_historyIndex, setHistoryIndex] = useState(-1)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedDevice = nodes.find(n => n.id === selectedDeviceId)

  // Auto-scroll on new output
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [output])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // When device changes, add a separator line
  function handleDeviceChange(id: string) {
    const device = nodes.find(n => n.id === id)
    if (!device) return
    setSelectedDeviceId(id)
    setOutput(prev => [
      ...prev,
      { text: `--- Switched to ${device.data.hostname} ---`, type: 'info' },
    ])
    inputRef.current?.focus()
  }

  function runCommand(cmd: string) {
    const trimmed = cmd.trim()
    if (!trimmed || !selectedDevice) return

    const topology = useNetworkStore.getState().getSnapshot()
    const result = executeCLICommand(trimmed, selectedDeviceId, topology)

    setOutput(prev => [
      ...prev,
      { text: `${selectedDevice.data.hostname}> ${trimmed}`, type: 'default' },
      ...result.lines,
    ])

    setHistory(prev => [trimmed, ...prev])
    setHistoryIndex(-1)
    setInput('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { runCommand(input); return }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHistoryIndex(prev => {
        const next = Math.min(prev + 1, history.length - 1)
        setInput(history[next] ?? '')
        return next
      })
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHistoryIndex(prev => {
        const next = Math.max(prev - 1, -1)
        setInput(next === -1 ? '' : (history[next] ?? ''))
        return next
      })
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-64 bg-black border-t border-gray-700 flex flex-col z-40 font-mono text-sm">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-gray-700 bg-gray-900 shrink-0">
        <span className="text-green-400 text-xs font-semibold">Terminal</span>

        {/* Device selector */}
        <select
          value={selectedDeviceId}
          onChange={e => handleDeviceChange(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs text-gray-200 focus:outline-none focus:border-green-500"
        >
          {nodes.length === 0 && (
            <option value="">No devices — add one to the canvas</option>
          )}
          {nodes.map(n => (
            <option key={n.id} value={n.id}>
              {n.data.hostname} ({n.type}) {n.data.interfaces[0]?.ipAddress ? `— ${n.data.interfaces[0].ipAddress}` : '— no IP'}
            </option>
          ))}
        </select>

        <span className="text-gray-600 text-xs">double-click a device on canvas to auto-select it here</span>

        <button
          onClick={() => setOutput([{ text: "Terminal cleared.", type: 'info' }])}
          className="ml-auto text-gray-500 hover:text-gray-300 text-xs transition-colors"
        >
          clear
        </button>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white text-base leading-none ml-1"
          aria-label="Close terminal"
        >
          ✕
        </button>
      </div>

      {/* Output */}
      <div
        className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5"
        onClick={() => inputRef.current?.focus()}
      >
        {output.map((line, i) => (
          <div key={i} className={lineColor(line.type)}>
            {line.text || '\u00A0'}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="flex items-center px-3 py-2 border-t border-gray-800 shrink-0">
        <span className="text-green-400 mr-2 select-none">
          {selectedDevice ? `${selectedDevice.data.hostname}>` : '$'}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!selectedDevice}
          placeholder={!selectedDevice ? 'Add a device to the canvas first...' : ''}
          className="flex-1 bg-transparent text-green-300 outline-none caret-green-400 placeholder-gray-600"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  )
}
