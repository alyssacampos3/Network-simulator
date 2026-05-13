export function EdgeLegend() {
  return (
    <div className="absolute bottom-24 left-4 z-10 bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 shadow-xl w-56">
      <p className="text-gray-400 font-semibold uppercase tracking-widest text-[10px] mb-2">Cable Types</p>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="mt-1 w-8 h-0.5 bg-green-400 shrink-0 rounded" />
          <div>
            <p className="text-green-300 font-semibold">Ethernet (straight-through)</p>
            <p className="text-gray-500 text-[10px]">PC → Switch, Router → Switch. Most common cable in LANs.</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className="mt-1 w-8 border-t-2 border-dashed border-orange-400 shrink-0" />
          <div>
            <p className="text-orange-300 font-semibold">Serial (WAN link)</p>
            <p className="text-gray-500 text-[10px]">Router → Router over WAN. Used for point-to-point links between sites.</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className="mt-1 w-8 h-0.5 bg-sky-400 shrink-0 rounded" />
          <div>
            <p className="text-sky-300 font-semibold">Ethernet (crossover)</p>
            <p className="text-gray-500 text-[10px]">PC → PC direct, Switch → Switch. Same device type connected together.</p>
          </div>
        </div>
      </div>

      <p className="text-gray-600 text-[10px] mt-3 border-t border-gray-700 pt-2">
        Right-click any link to change its type
      </p>
    </div>
  )
}
