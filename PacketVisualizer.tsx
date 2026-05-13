import { Handle, Position, type NodeProps } from '@xyflow/react'

export function RouterNode({ data, selected }: NodeProps) {
  const d = data as { hostname: string; interfaces: { ipAddress: string }[] }
  const ip = d.interfaces?.[0]?.ipAddress || null
  const configured = !!ip

  return (
    <div className="flex flex-col items-center">
      <Handle type="source" id="top" position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-gray-900 !rounded-full" />
      <Handle type="source" id="left" position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-gray-900 !rounded-full" />

      <div className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border shadow-lg min-w-[100px] transition-all duration-150
        ${selected
          ? 'border-blue-400 bg-gradient-to-b from-blue-900 to-blue-950 shadow-blue-500/20 shadow-xl ring-1 ring-blue-400/30'
          : 'border-gray-600 bg-gradient-to-b from-gray-800 to-gray-900 hover:border-blue-500/60'}`}>

        {/* Icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selected ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
          </svg>
        </div>

        <span className="text-xs font-semibold text-gray-100 truncate max-w-[90px] leading-tight">{d.hostname}</span>

        {ip
          ? <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">{ip}</span>
          : <span className="text-[10px] text-gray-600">not configured</span>
        }

        <div className="flex items-center gap-1 mt-0.5">
          <div className={`w-1.5 h-1.5 rounded-full ${configured ? 'bg-green-400' : 'bg-gray-600'}`} />
          <span className="text-[9px] uppercase tracking-widest text-gray-500 font-medium">Router</span>
        </div>
      </div>

      <Handle type="source" id="bottom" position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-gray-900 !rounded-full" />
      <Handle type="source" id="right" position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-gray-900 !rounded-full" />
    </div>
  )
}
