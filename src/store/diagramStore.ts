import { create } from 'zustand'
import { produce } from 'immer'
import { nanoid } from '../utils/nanoid'
import type {
  DiagramState,
  Node,
  Edge,
  NodeType,
  Port,
} from '../types/diagram'
import { DEFAULT_SIZES } from '../types/diagram'

const MAX_HISTORY = 50

const EMPTY_DIAGRAM: DiagramState = {
  nodes: [],
  edges: [],
  aggregations: [],
}

interface DiagramStore {
  diagram: DiagramState
  past: DiagramState[]
  future: DiagramState[]
  canUndo: boolean
  canRedo: boolean

  // Node actions
  addNode: (type: NodeType, x: number, y: number) => string
  updateNode: (id: string, patch: Partial<Node>) => void
  deleteNodes: (ids: string[]) => void
  cycleNodeType: (id: string) => void

  // Edge actions
  addEdge: (
    sourceId: string,
    sourcePort: Port,
    targetId: string,
    targetPort: Port,
  ) => string
  updateEdge: (id: string, patch: Partial<Edge>) => void
  deleteEdges: (ids: string[]) => void

  // Batch delete (nodes + their connected edges)
  deleteSelected: (ids: string[]) => void

  // History
  undo: () => void
  redo: () => void

  // Persistence
  loadDiagram: (diagram: DiagramState) => void
  clearDiagram: () => void
}

// Helper: save current diagram to past stack before mutating
function pushHistory(past: DiagramState[], diagram: DiagramState): DiagramState[] {
  const next = [...past, diagram]
  return next.length > MAX_HISTORY ? next.slice(1) : next
}

// Cycle map for node types
const CYCLE_MAP: Partial<Record<NodeType, NodeType>> = {
  'entity-strong': 'entity-weak',
  'entity-weak': 'entity-strong',
  'relationship': 'relationship-identifying',
  'relationship-identifying': 'relationship',
  'attr-simple': 'attr-identifying',
  'attr-identifying': 'attr-multivalued',
  'attr-multivalued': 'attr-composite',
  'attr-composite': 'attr-simple',
  // hierarchy cycles handled specially
  'hierarchy-node': 'hierarchy-node',
}

const HIERARCHY_CYCLE: Array<{ coverage: 'total' | 'partial'; overlap: 'disjoint' | 'overlapping' }> = [
  { coverage: 'total',   overlap: 'disjoint' },
  { coverage: 'total',   overlap: 'overlapping' },
  { coverage: 'partial', overlap: 'disjoint' },
  { coverage: 'partial', overlap: 'overlapping' },
]

export const useDiagramStore = create<DiagramStore>((set, get) => ({
  diagram: EMPTY_DIAGRAM,
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  // ─── Helpers ────────────────────────────────────────────────

  addNode: (type, x, y) => {
    const id = nanoid()
    const size = DEFAULT_SIZES[type]
    const node: Node = {
      id,
      type,
      x,
      y,
      width: size.width,
      height: size.height,
      label: '',
      ...(type === 'hierarchy-node'
        ? { coverage: 'total', overlap: 'disjoint', discriminant: '' }
        : {}),
    }
    set(
      produce((state: DiagramStore) => {
        state.past = pushHistory(state.past, state.diagram)
        state.future = []
        state.canUndo = true
        state.canRedo = false
        state.diagram.nodes.push(node)
      }),
    )
    return id
  },

  updateNode: (id, patch) => {
    set(
      produce((state: DiagramStore) => {
        const node = state.diagram.nodes.find((n) => n.id === id)
        if (!node) return
        state.past = pushHistory(state.past, state.diagram)
        state.future = []
        state.canUndo = true
        state.canRedo = false
        Object.assign(node, patch)
      }),
    )
  },

  deleteNodes: (ids) => {
    set(
      produce((state: DiagramStore) => {
        state.past = pushHistory(state.past, state.diagram)
        state.future = []
        state.canUndo = true
        state.canRedo = false
        const idSet = new Set(ids)
        state.diagram.nodes = state.diagram.nodes.filter((n) => !idSet.has(n.id))
        state.diagram.edges = state.diagram.edges.filter(
          (e) => !idSet.has(e.sourceId) && !idSet.has(e.targetId),
        )
      }),
    )
  },

  cycleNodeType: (id) => {
    set(
      produce((state: DiagramStore) => {
        const node = state.diagram.nodes.find((n) => n.id === id)
        if (!node) return
        state.past = pushHistory(state.past, state.diagram)
        state.future = []
        state.canUndo = true
        state.canRedo = false

        if (node.type === 'hierarchy-node') {
          const current = HIERARCHY_CYCLE.findIndex(
            (v) => v.coverage === node.coverage && v.overlap === node.overlap,
          )
          const next = HIERARCHY_CYCLE[(current + 1) % HIERARCHY_CYCLE.length]
          node.coverage = next.coverage
          node.overlap = next.overlap
        } else {
          const next = CYCLE_MAP[node.type]
          if (next) {
            node.type = next
            const newSize = DEFAULT_SIZES[next]
            node.width = newSize.width
            node.height = newSize.height
          }
        }
      }),
    )
  },

  addEdge: (sourceId, sourcePort, targetId, targetPort) => {
    const id = nanoid()
    const { diagram } = get()
    const source = diagram.nodes.find((n) => n.id === sourceId)
    const target = diagram.nodes.find((n) => n.id === targetId)

    // Default cardinality/participation based on connected types
    const isEntitySource = source?.type.startsWith('entity')
    const isEntityTarget = target?.type.startsWith('entity')

    const edge: Edge = {
      id,
      sourceId,
      sourcePort,
      targetId,
      targetPort,
      cardinalityAtSource: isEntitySource ? 'n' : null,
      cardinalityAtTarget: isEntityTarget ? 'n' : null,
      participationAtSource: 'total',
      participationAtTarget: 'total',
    }

    set(
      produce((state: DiagramStore) => {
        state.past = pushHistory(state.past, state.diagram)
        state.future = []
        state.canUndo = true
        state.canRedo = false
        state.diagram.edges.push(edge)
      }),
    )
    return id
  },

  updateEdge: (id, patch) => {
    set(
      produce((state: DiagramStore) => {
        const edge = state.diagram.edges.find((e) => e.id === id)
        if (!edge) return
        state.past = pushHistory(state.past, state.diagram)
        state.future = []
        state.canUndo = true
        state.canRedo = false
        Object.assign(edge, patch)
      }),
    )
  },

  deleteEdges: (ids) => {
    set(
      produce((state: DiagramStore) => {
        state.past = pushHistory(state.past, state.diagram)
        state.future = []
        state.canUndo = true
        state.canRedo = false
        const idSet = new Set(ids)
        state.diagram.edges = state.diagram.edges.filter((e) => !idSet.has(e.id))
      }),
    )
  },

  deleteSelected: (ids) => {
    const { diagram } = get()
    const idSet = new Set(ids)
    const nodeIds = ids.filter((id) => diagram.nodes.some((n) => n.id === id))
    const edgeIds = ids.filter((id) => diagram.edges.some((e) => e.id === id))

    set(
      produce((state: DiagramStore) => {
        state.past = pushHistory(state.past, state.diagram)
        state.future = []
        state.canUndo = true
        state.canRedo = false

        // Delete edges first (explicit + connected to deleted nodes)
        const edgeIdSet = new Set(edgeIds)
        const nodeIdSet = new Set(nodeIds)
        state.diagram.edges = state.diagram.edges.filter(
          (e) =>
            !edgeIdSet.has(e.id) &&
            !nodeIdSet.has(e.sourceId) &&
            !nodeIdSet.has(e.targetId),
        )
        state.diagram.nodes = state.diagram.nodes.filter((n) => !idSet.has(n.id))
      }),
    )
  },

  undo: () => {
    const { past, diagram, future } = get()
    if (past.length === 0) return
    const previous = past[past.length - 1]
    set(
      produce((state: DiagramStore) => {
        state.past = past.slice(0, -1)
        state.future = [diagram, ...future].slice(0, MAX_HISTORY)
        state.diagram = previous
        state.canUndo = state.past.length > 0
        state.canRedo = true
      }),
    )
  },

  redo: () => {
    const { past, diagram, future } = get()
    if (future.length === 0) return
    const next = future[0]
    set(
      produce((state: DiagramStore) => {
        state.past = [...past, diagram].slice(-MAX_HISTORY)
        state.future = future.slice(1)
        state.diagram = next
        state.canUndo = true
        state.canRedo = state.future.length > 0
      }),
    )
  },

  loadDiagram: (diagram) => {
    set(
      produce((state: DiagramStore) => {
        state.past = []
        state.future = []
        state.canUndo = false
        state.canRedo = false
        state.diagram = diagram
      }),
    )
  },

  clearDiagram: () => {
    set(
      produce((state: DiagramStore) => {
        state.past = pushHistory(state.past, state.diagram)
        state.future = []
        state.canUndo = true
        state.canRedo = false
        state.diagram = { nodes: [], edges: [], aggregations: [] }
      }),
    )
  },
}))
