import type { Edge, Node } from '../../types/diagram'
import { EdgeShape } from '../shapes/EdgeShape'

interface EdgeLayerProps {
  edges: Edge[]
  nodes: Node[]
  selectedIds: string[]
  warnedEdgeIds: Set<string>
  onEdgePointerDown: (e: React.PointerEvent, edgeId: string) => void
}

export function EdgeLayer({ edges, nodes, selectedIds, warnedEdgeIds, onEdgePointerDown }: EdgeLayerProps) {
  return (
    <g>
      {edges.map((edge) => (
        <EdgeShape
          key={edge.id}
          edge={edge}
          nodes={nodes}
          selected={selectedIds.includes(edge.id)}
          warned={warnedEdgeIds.has(edge.id)}
          onPointerDown={(e) => onEdgePointerDown(e, edge.id)}
        />
      ))}
    </g>
  )
}
