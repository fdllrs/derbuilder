import { useEffect } from 'react'
import { useDiagramStore } from '../store/diagramStore'
import { useUIStore } from '../store/uiStore'
import type { Cardinality } from '../types/diagram'

/**
 * When a single edge is selected, keyboard shortcuts set cardinality/participation.
 * 1/N/M/P → source cardinality
 * Shift+1/N/M/P → target cardinality
 * T → toggle participation at source
 * Shift+T → toggle participation at target
 */
export function useEdgeKeyboard() {
  const selectedIds = useUIStore((s) => s.selectedIds)
  const updateEdge = useDiagramStore((s) => s.updateEdge)
  const edges = useDiagramStore((s) => s.diagram.edges)
  const nodes = useDiagramStore((s) => s.diagram.nodes)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (selectedIds.length !== 1) return

      const edgeId = selectedIds[0]
      const edge = edges.find((ed) => ed.id === edgeId)
      if (!edge) return

      const sourceNode = nodes.find((n) => n.id === edge.sourceId)
      const targetNode = nodes.find((n) => n.id === edge.targetId)
      const isEntitySource = sourceNode?.type.startsWith('entity')
      const isEntityTarget = targetNode?.type.startsWith('entity')

      const key = e.key.toLowerCase()
      const shift = e.shiftKey

      let applySide = shift ? 'target' : 'source'
      if (isEntitySource && !isEntityTarget) applySide = 'source'
      if (!isEntitySource && isEntityTarget) applySide = 'target'
      // If neither is entity, applySide doesn't really matter, it won't render anyway

      const cardMap: Record<string, Cardinality> = { '1': '1', n: 'n', m: 'm', p: 'p' }

      if (key in cardMap) {
        e.preventDefault()
        if (applySide === 'target') {
          updateEdge(edgeId, { cardinalityAtTarget: cardMap[key] })
        } else {
          updateEdge(edgeId, { cardinalityAtSource: cardMap[key] })
        }
        return
      }

      if (key === 't') {
        e.preventDefault()
        if (applySide === 'target') {
          updateEdge(edgeId, {
            participationAtTarget: edge.participationAtTarget === 'total' ? 'partial' : 'total',
          })
        } else {
          updateEdge(edgeId, {
            participationAtSource: edge.participationAtSource === 'total' ? 'partial' : 'total',
          })
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedIds, edges, nodes, updateEdge])
}
