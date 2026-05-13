import { Handle, Position, type NodeProps } from '@xyflow/react'

export function FirewallNode({ data, selected }: NodeProps) {
  const d = data as { hostname: string; interfaces: { ipAddress: string }[] }
  const ip = d.interfaces?.[0]?.ipAddress || null
  const configured = !!ip

  return (
    <div className="flex flex-col items-center">
      <Handle type="source" id="top" position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-red-500 !border-2 !border-gray-900 !rounded-full" />
      <Handle type="source" id="left" position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-red-500 !border-2 !border-gray-900 !rounded-full" />

      <div className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border shadow-lg min-w-[100px] transition-all duration-150
        ${selected
          ? 'border-red-400 bg-gradient-to-b from-red-900 to-red-950 shadow-red-500/20 shadow-xl ring-1 ring-red-400/30'
          : 'border-gray-600 bg-gradient-to-b from-gray-800 to-gray-900 hover:border-red-500/60'}`}>

        {/* Icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selected ? 'bg-red-500/20' : 'bg-red-500/10'}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
          </svg>
        </div>

        <span className="text-xs font-semibold text-gray-100 truncate max-w-[90px] leading-tight">{d.hostname}</span>

        {ip
          ? <span className="text-[10px] text-red-400 font-mono bg-red-500/10 px-1.5 py-0.5 rounded">{ip}</span>
          : <span className="text-[10px] text-gray-600">not configured</span>
        }

        <div className="flex items-center gap-1 mt-0.5">
          <div className={`w-1.5 h-1.5 rounded-full ${configured ? 'bg-green-400' : 'bg-gray-600'}`} />
          <span className="text-[9px] uppercase tracking-widest text-gray-500 font-medium">Firewall</span>
        </div>
      </div>

      <Handle type="source" id="bottom" position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-red-500 !border-2 !border-gray-900 !rounded-full" />
      <Handle type="source" id="right" position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-red-500 !border-2 !border-gray-900 !rounded-full" />
    </div>
  )
}
