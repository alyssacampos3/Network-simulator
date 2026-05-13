import type { DeviceType } from '../types'

interface DeviceTile {
  type: DeviceType
  label: string
  description: string
  color: string
  icon: React.ReactNode
}

const DEVICE_TILES: DeviceTile[] = [
  {
    type: 'router',
    label: 'Router',
    description: 'Layer 3 — routes between networks',
    color: 'border-blue-500/40 hover:border-blue-400 hover:bg-blue-500/5',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
      </svg>
    ),
  },
  {
    type: 'switch',
    label: 'Switch',
    description: 'Layer 2 — connects devices in a LAN',
    color: 'border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/5',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    type: 'pc',
    label: 'PC',
    description: 'End device — workstation or server',
    color: 'border-violet-500/40 hover:border-violet-400 hover:bg-violet-500/5',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
      </svg>
    ),
  },
  {
    type: 'cloud',
    label: 'Cloud',
    description: 'Internet / external network',
    color: 'border-sky-500/40 hover:border-sky-400 hover:bg-sky-500/5',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    ),
  },
  {
    type: 'firewall',
    label: 'Firewall',
    description: 'Security — filters traffic',
    color: 'border-red-500/40 hover:border-red-400 hover:bg-red-500/5',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
      </svg>
    ),
  },
]

export function DeviceSidebar() {
  const onDragStart = (event: React.DragEvent, deviceType: DeviceType) => {
    event.dataTransfer.setData('application/network-lab-device', deviceType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside className="flex flex-col w-44 bg-gray-950 border-r border-gray-800 select-none shrink-0">
      <div className="px-3 pt-3 pb-2 border-b border-gray-800">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Devices</p>
        <p className="text-[10px] text-gray-600 mt-0.5">Drag onto canvas</p>
      </div>

      <div className="flex flex-col gap-1.5 p-2 flex-1">
        {DEVICE_TILES.map(({ type, label, description, color, icon }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg border bg-gray-900 text-white cursor-grab active:cursor-grabbing transition-all duration-150 group ${color}`}
          >
            <div className="shrink-0">{icon}</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-200 leading-tight">{label}</p>
              <p className="text-[10px] text-gray-500 leading-tight mt-0.5 truncate">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 py-2 border-t border-gray-800">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Click to configure<br />
          Double-click for terminal<br />
          Right-click for options
        </p>
      </div>
    </aside>
  )
}
