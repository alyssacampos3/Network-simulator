import { useState } from 'react'
import { useLogStore } from '../store/logStore'
import type { LogLevel } from '../types'

interface Props {
  onClose: () => void
}

export function LogViewer({ onClose }: Props) {
  const logs = useLogStore(s => s.logs)
  const clearLogs = useLogStore(s => s.clearLogs)
  const [filter, setFilter] = useState<LogLevel | 'all'>('all')

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.level === filter)

  const levelColor = (level: LogLevel) => {
    switch (level) {
      case 'error': return 'text-red-400'
      case 'warning': return 'text-yellow-400'
      case 'info': return 'text-blue-400'
      case 'debug': return 'text-gray-500'
    }
  }

  const levelBg = (level: LogLevel) => {
    switch (level) {
      case 'error': return 'bg-red-500/10'
      case 'warning': return 'bg-yellow-500/10'
      case 'info': return 'bg-blue-500/10'
      case 'debug': return 'bg-gray-500/10'
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-gray-900 border-l border-gray-700 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-950">
        <div className="flex items-center gap-2">
          <span className="text-lg">📜</span>
          <h2 className="text-sm font-semibold text-white">Event Log</h2>
          <span className="text-[10px] text-gray-500">({logs.length} entries)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearLogs}
            className="text-[10px] text-gray-400 hover:text-red-400 px-2 py-1 rounded bg-gray-800"
          >
            Clear
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">✕</button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-gray-800 flex gap-1">
        {(['all', 'error', 'warning', 'info', 'debug'] as const).map(level => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
              filter === level
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {level.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Log Entries */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-8 font-sans text-sm">No log entries</p>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} className={`rounded px-2.5 py-1.5 ${levelBg(log.level)}`}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-600">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`text-[10px] uppercase font-bold ${levelColor(log.level)}`}>
                  {log.level}
                </span>
                <span className="text-[10px] text-gray-500">[{log.source}]</span>
              </div>
              <p className={`text-xs ${levelColor(log.level)} mt-0.5`}>{log.message}</p>
              {log.details && (
                <p className="text-[10px] text-gray-500 mt-0.5">{log.details}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
