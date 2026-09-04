import type { DiagramState, Edge, Node, ValidationResult } from '../types/diagram'

/** Validate a single edge being created */
export function validateEdge(
  edge: Pick<Edge, 'sourceId' | 'targetId'>,
  nodes: Node[],
): ValidationResult[] {
  const results: ValidationResult[] = []
  const source = nodes.find((n) => n.id === edge.sourceId)
  const target = nodes.find((n) => n.id === edge.targetId)
  if (!source || !target) return results

  // Attribute → Attribute connection
  const sourceIsAttr = source.type.startsWith('attr')
  const targetIsAttr = target.type.startsWith('attr')
  if (sourceIsAttr && targetIsAttr) {
    results.push({
      message: 'Los atributos no pueden conectarse entre sí',
      edgeId: undefined,
    })
  }

  // Multivalued attribute connected to a relationship
  const sourceIsMulti = source.type === 'attr-multivalued'
  const targetIsMulti = target.type === 'attr-multivalued'
  const targetIsRelation = target.type.startsWith('relationship')
  const sourceIsRelation = source.type.startsWith('relationship')

  if (sourceIsMulti && targetIsRelation) {
    results.push({
      message: 'Los atributos multivaluados solo pueden vincularse a entidades',
    })
  }
  if (targetIsMulti && sourceIsRelation) {
    results.push({
      message: 'Los atributos multivaluados solo pueden vincularse a entidades',
    })
  }

  return results
}

/** Validate the full diagram and return all warnings */
export function validateDiagram(state: DiagramState): ValidationResult[] {
  const results: ValidationResult[] = []
  const { nodes, edges } = state

  for (const edge of edges) {
    const edgeResults = validateEdge(edge, nodes)
    for (const r of edgeResults) {
      results.push({ ...r, edgeId: edge.id })
    }
  }

  // Weak entity must connect to an identifying relationship
  for (const node of nodes) {
    if (node.type === 'entity-weak') {
      const hasIdentifying = edges.some((e) => {
        const other =
          e.sourceId === node.id
            ? nodes.find((n) => n.id === e.targetId)
            : e.targetId === node.id
            ? nodes.find((n) => n.id === e.sourceId)
            : null
        return other?.type === 'relationship-identifying'
      })
      if (!hasIdentifying) {
        results.push({
          nodeId: node.id,
          message: `La entidad débil "${node.label || node.id}" no está vinculada a una interrelación identificatoria`,
        })
      }
    }

    // Hierarchy node must have at least one superentity edge
    if (node.type === 'hierarchy-node') {
      const hasEntity = edges.some((e) => {
        const other =
          e.sourceId === node.id
            ? nodes.find((n) => n.id === e.targetId)
            : e.targetId === node.id
            ? nodes.find((n) => n.id === e.sourceId)
            : null
        return other?.type === 'entity-strong' || other?.type === 'entity-weak'
      })
      if (!hasEntity) {
        results.push({
          nodeId: node.id,
          message: 'El nodo de jerarquía necesita al menos una superentidad',
        })
      }
    }
  }

  return results
}
