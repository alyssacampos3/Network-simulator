import { useEffect, useRef } from 'react'

interface ContextMenuProps {
  x: number
  y: number
  nodeId: string
  hostname: string
  onConfigure: () => void
  onOpenTerminal: () => void
  onDelete: () => void
  onClose: () => void
}

export function ContextMenu({ x, y, hostname, onConfigure, onOpenTerminal, onDelete, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  // Adjust position so menu doesn't go off screen
  const style: React.CSSProperties = {
    position: 'fixed',
    top: y,
    left: x,
    zIndex: 9999,
  }

  return (
    <div
      ref={ref}
      style={style}
      className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl py-1 min-w-[180px] text-sm"
    >
      <div className="px-3 py-1.5 text-gray-400 text-xs border-b border-gray-700 mb-1 truncate">
        {hostname}
      </div>
      <button
        onClick={() => { onConfigure(); onClose() }}
        className="w-full text-left px-3 py-2 text-gray-200 hover:bg-gray-700 flex items-center gap-2 transition-colors"
      >
        <span>⚙️</span> Configure
      </button>
      <button
        onClick={() => { onOpenTerminal(); onClose() }}
        className="w-full text-left px-3 py-2 text-gray-200 hover:bg-gray-700 flex items-center gap-2 transition-colors"
      >
        <span>💻</span> Open Terminal
      </button>
      <div className="border-t border-gray-700 mt-1 pt-1">
        <button
          onClick={() => { onDelete(); onClose() }}
          className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-900/30 flex items-center gap-2 transition-colors"
        >
          <span>🗑️</span> Delete Device
        </button>
      </div>
    </div>
  )
}
