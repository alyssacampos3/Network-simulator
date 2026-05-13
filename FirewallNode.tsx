import { BaseEdge, EdgeLabelRenderer, getStraightPath, type EdgeProps } from '@xyflow/react'
import { useAnimationStore } from '../store/animationStore'

type LinkType = 'ethernet' | 'serial' | 'crossover'

const LINK_STYLES: Record<LinkType, { stroke: string; strokeDasharray?: string; label: string }> = {
  ethernet:  { stroke: '#22c55e', label: 'Ethernet' },
  serial:    { stroke: '#f97316', strokeDasharray: '6 3', label: 'Serial' },
  crossover: { stroke: '#38bdf8', label: 'Crossover' },
}

export function NetworkEdgeComponent({
  id, sourceX, sourceY, targetX, targetY, data, selected,
}: EdgeProps) {
  const linkType: LinkType = (data as { linkType?: LinkType })?.linkType ?? 'ethernet'
  const style = LINK_STYLES[linkType]

  const animations = useAnimationStore(s => s.animations)
  const activeEdges = useAnimationStore(s => s.activeEdges)

  const isActive = activeEdges.has(id)
  const packetOnEdge = animations.find(a => a.active && a.edgeIds[a.currentEdge] === id)

  const [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY })

  // Midpoint for packet dot
  const midX = (sourceX + targetX) / 2
  const midY = (sourceY + targetY) / 2

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isActive ? '#ffffff' : style.stroke,
          strokeWidth: selected ? 3 : isActive ? 2.5 : 1.5,
          strokeDasharray: style.strokeDasharray,
          filter: isActive
            ? `drop-shadow(0 0 6px ${style.stroke})`
            : selected
            ? `drop-shadow(0 0 3px ${style.stroke})`
            : undefined,
          transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
          opacity: 0.85,
        }}
      />

      {/* Animated packet dot */}
      {packetOnEdge && (
        <circle
          cx={midX}
          cy={midY}
          r={5}
          fill={packetOnEdge.success ? '#4ade80' : '#f87171'}
          style={{
            filter: `drop-shadow(0 0 6px ${packetOnEdge.success ? '#4ade80' : '#f87171'})`,
            animation: 'pulse 0.4s ease-in-out',
          }}
        />
      )}

      {/* Selected label */}
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
            className="absolute pointer-events-none bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-[10px] font-semibold font-mono"
          >
            <span style={{ color: style.stroke }}>{style.label}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const edgeTypes = {
  networkEdge: NetworkEdgeComponent,
}
