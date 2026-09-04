import type { Node, Port } from '../../types/diagram'
import { EntityShape } from '../shapes/EntityShape'
import { RelationshipShape } from '../shapes/RelationshipShape'
import { AttributeShape } from '../shapes/AttributeShape'
import { HierarchyNode } from '../shapes/HierarchyNode'

interface NodeLayerProps {
  nodes: Node[]
  selectedIds: string[]
  hoveredId: string | null
  onNodePointerDown: (e: React.PointerEvent, nodeId: string) => void
  onNodeDoubleClick: (nodeId: string) => void
  onPortPointerDown: (e: React.PointerEvent, nodeId: string, port: Port) => void
}

export function NodeLayer({
  nodes,
  selectedIds,
  hoveredId,
  onNodePointerDown,
  onNodeDoubleClick,
  onPortPointerDown,
}: NodeLayerProps) {
  return (
    <g>
      {nodes.map((node) => {
        const selected = selectedIds.includes(node.id)
        const showPorts = selected || hoveredId === node.id

        const sharedProps = {
          node,
          selected,
          showPorts,
          onPointerDown: (e: React.PointerEvent) => onNodePointerDown(e, node.id),
          onDoubleClick: () => onNodeDoubleClick(node.id),
          onPortPointerDown: (e: React.PointerEvent, port: Port) =>
            onPortPointerDown(e, node.id, port),
        }

        if (node.type === 'entity-strong' || node.type === 'entity-weak') {
          return <EntityShape key={node.id} {...sharedProps} />
        }
        if (node.type === 'relationship' || node.type === 'relationship-identifying') {
          return <RelationshipShape key={node.id} {...sharedProps} />
        }
        if (node.type.startsWith('attr')) {
          return <AttributeShape key={node.id} {...sharedProps} />
        }
        if (node.type === 'hierarchy-node') {
          return <HierarchyNode key={node.id} {...sharedProps} />
        }
        return null
      })}
    </g>
  )
}
