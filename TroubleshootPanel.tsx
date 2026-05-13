import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Node,
} from '@xyflow/react'
// @ts-ignore
import '@xyflow/react/dist/style.css'
import { nodeTypes } from './nodes'
import { edgeTypes } from './NetworkEdge'
import { useNetworkStore } from '../store/networkStore'
import type { NetworkNode, NetworkEdge, DeviceType } from '../types'


interface TopologyCanvasProps {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  onNodeClick: (event: React.MouseEvent, node: NetworkNode) => void
  onNodeDoubleClick?: (event: React.MouseEvent, node: NetworkNode) => void
  onNodeRightClick?: (event: React.MouseEvent, node: NetworkNode) => void
  onEdgeRightClick?: (event: React.MouseEvent, edgeId: string) => void
  readOnly?: boolean
}

export function TopologyCanvas({
  nodes, edges, onNodesChange, onEdgesChange, onConnect,
  onNodeClick, onNodeDoubleClick, onNodeRightClick, onEdgeRightClick,
  readOnly = false,
}: TopologyCanvasProps) {
  const addNode = useNetworkStore(s => s.addNode)

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const deviceType = event.dataTransfer.getData('application/network-lab-device') as DeviceType
      if (!deviceType) return

      const reactFlowBounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      }

      const id = crypto.randomUUID()
      const hostname = `${deviceType}-${id.slice(0, 4)}`
      const newNode: NetworkNode = {
        id,
        type: deviceType,
        position,
        data: {
          hostname,
          interfaces: [],
          deviceConfig: { hostname, interfaces: [] },
        },
      }
      addNode(newNode)
    },
    [addNode]
  )

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeClick(event, node as unknown as NetworkNode)
    },
    [onNodeClick]
  )

  const handleNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeDoubleClick?.(event, node as unknown as NetworkNode)
    },
    [onNodeDoubleClick]
  )

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault()
      onNodeRightClick?.(event, node as unknown as NetworkNode)
    },
    [onNodeRightClick]
  )

  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: { id: string }) => {
      event.preventDefault()
      onEdgeRightClick?.(event, edge.id)
    },
    [onEdgeRightClick]
  )

  return (
    <div className="w-full h-full bg-gray-900">
      <ReactFlow
        nodes={nodes as unknown as Node[]}
        edges={edges.map(e => ({ ...e, type: 'networkEdge' }))}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu as never}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        connectionMode={ConnectionMode.Loose}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        deleteKeyCode="Delete"
      >
        <Background color="#374151" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const type = node.type as DeviceType
            const colors: Record<DeviceType, string> = {
              router: '#3b82f6',
              switch: '#22c55e',
              pc: '#a855f7',
              cloud: '#38bdf8',
              firewall: '#ef4444',
            }
            return colors[type] ?? '#6b7280'
          }}
          style={{ background: '#1f2937' }}
        />
      </ReactFlow>
    </div>
  )
}
