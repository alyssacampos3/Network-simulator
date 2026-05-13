import { Handle, Position, type NodeProps } from '@xyflow/react'

export function PCNode({ data, selected }: NodeProps) {
  const d = data as { hostname: string; interfaces: { ipAddress: string }[] }
  const ip = d.interfaces?.[0]?.ipAddress || null
  const configured = !!ip

  return (
    <div className="flex flex-col items-center">
      <Handle type="source" id="top" position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-violet-500 !border-2 !border-gray-900 !rounded-full" />
      <Handle type="source" id="left" position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-violet-500 !border-2 !border-gray-900 !rounded-full" />

      <div className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border shadow-lg min-w-[100px] transition-all duration-150
        ${selected
          ? 'border-violet-400 bg-gradient-to-b from-violet-900 to-violet-950 shadow-violet-500/20 shadow-xl ring-1 ring-violet-400/30'
          : 'border-gray-600 bg-gradient-to-b from-gray-800 to-gray-900 hover:border-violet-500/60'}`}>

        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selected ? 'bg-violet-500/20' : 'bg-violet-500/10'}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
          </svg>
        </div>

        <span className="text-xs font-semibold text-gray-100 truncate max-w-[90px] leading-tight">{d.hostname}</span>

        {ip
          ? <span className="text-[10px] text-violet-400 font-mono bg-violet-500/10 px-1.5 py-0.5 rounded">{ip}</span>
          : <span className="text-[10px] text-gray-600">not configured</span>
        }

        <div className="flex items-center gap-1 mt-0.5">
          <div className={`w-1.5 h-1.5 rounded-full ${configured ? 'bg-green-400' : 'bg-gray-600'}`} />
          <span className="text-[9px] uppercase tracking-widest text-gray-500 font-medium">PC</span>
        </div>
      </div>

      <Handle type="source" id="bottom" position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-violet-500 !border-2 !border-gray-900 !rounded-full" />
      <Handle type="source" id="right" position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-violet-500 !border-2 !border-gray-900 !rounded-full" />
    </div>
  )
}
