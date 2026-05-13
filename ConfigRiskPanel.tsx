import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import type { OutputLine } from '../types'
import { executeCLICommand } from '../engine/cli'
import { useNetworkStore } from '../store/networkStore'

interface Props {
  deviceId: string
  deviceHostname: string
  onClose: () => void
}

const WELCOME_LINE: OutputLine = {
  text: "Network Lab CLI — type 'help' for commands",
  type: 'info',
}

function lineColor(type: OutputLine['type']): string {
  switch (type) {
    case 'success': return 'text-green-400'
    case 'error':   return 'text-red-400'
    case 'info':    return 'text-yellow-400'
    default:        return 'text-gray-300'
  }
}

export function CLITerminal({ deviceId, deviceHostname, onClose }: Props) {
  const [output, setOutput] = useState<OutputLine[]>([WELCOME_LINE])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [_historyIndex, setHistoryIndex] = useState(-1)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll on new output
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [output])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function runCommand(cmd: string) {
    const trimmed = cmd.trim()
    if (!trimmed) return

    const topology = useNetworkStore.getState().getSnapshot()
    const result = executeCLICommand(trimmed, deviceId, topology)

    setOutput(prev => [
      ...prev,
      { text: `${deviceHostname}> ${trimmed}`, type: 'default' },
      ...result.lines,
    ])

    setHistory(prev => [trimmed, ...prev])
    setHistoryIndex(-1)
    setInput('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      runCommand(input)
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHistoryIndex(prev => {
        const next = Math.min(prev + 1, history.length - 1)
        setInput(history[next] ?? '')
        return next
      })
      return
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
    <div className="fixed bottom-0 left-0 right-0 h-64 bg-black border-t border-gray-700 flex flex-col z-50 font-mono text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-gray-700 bg-gray-900">
        <span className="text-green-400 text-xs">{deviceHostname} — CLI</span>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white text-base leading-none"
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
      <div className="flex items-center px-3 py-2 border-t border-gray-800">
        <span className="text-green-400 mr-2 select-none">{deviceHostname}&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-green-300 outline-none caret-green-400"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
        />
      </div>
    </div>
  )
}
