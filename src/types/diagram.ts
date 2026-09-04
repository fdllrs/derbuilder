// ─── Node types ────────────────────────────────────────────────

export type NodeType =
  | 'entity-strong'
  | 'entity-weak'
  | 'relationship'
  | 'relationship-identifying'
  | 'attr-simple'
  | 'attr-identifying'
  | 'attr-multivalued'
  | 'attr-composite'
  | 'hierarchy-node'

export type Port = 'n' | 's' | 'e' | 'w'

export type Cardinality = '1' | 'n' | 'm' | 'p' | null

export type Participation = 'total' | 'partial'

export type HierarchyCoverage = 'total' | 'partial'

export type HierarchyOverlap = 'disjoint' | 'overlapping'

// ─── Diagram elements ──────────────────────────────────────────

export interface Node {
  id: string
  type: NodeType
  x: number       // center x in diagram space
  y: number       // center y in diagram space
  width: number
  height: number
  label: string
  // Hierarchy-node specific
  coverage?: HierarchyCoverage
  overlap?: HierarchyOverlap
  discriminant?: string
  // v2 aggregation hook
  groupId?: string
}

export interface Edge {
  id: string
  sourceId: string
  targetId: string
  sourcePort: Port
  targetPort: Port
  cardinalityAtSource: Cardinality
  cardinalityAtTarget: Cardinality
  participationAtSource: Participation
  participationAtTarget: Participation
}

// v2 stub — unused in v1 render, present for type completeness
export interface Aggregation {
  id: string
  nodeIds: string[]
  edgeIds: string[]
  label: string
}

// ─── Serializable diagram state ────────────────────────────────

export interface DiagramState {
  nodes: Node[]
  edges: Edge[]
  aggregations: Aggregation[]
}

// ─── UI state (not serialized) ─────────────────────────────────

export type Tool = 'pointer' | 'entity' | 'relationship' | 'attribute' | 'hierarchy'

export interface Viewport {
  x: number       // pan offset x
  y: number       // pan offset y
  scale: number   // zoom scale
}

export interface ConnectionDrag {
  active: boolean
  sourceId: string | null
  sourcePort: Port | null
  cursorX: number
  cursorY: number
}

// ─── Validation ────────────────────────────────────────────────

export interface ValidationResult {
  nodeId?: string
  edgeId?: string
  message: string
}

// ─── Default sizes ─────────────────────────────────────────────

export const DEFAULT_SIZES: Record<NodeType, { width: number; height: number }> = {
  'entity-strong':             { width: 140, height: 44 },
  'entity-weak':               { width: 140, height: 44 },
  'relationship':              { width: 80,  height: 40 },
  'relationship-identifying':  { width: 80,  height: 40 },
  'attr-simple':               { width: 110, height: 38 },
  'attr-identifying':          { width: 110, height: 38 },
  'attr-multivalued':          { width: 110, height: 38 },
  'attr-composite':            { width: 110, height: 38 },
  'hierarchy-node':            { width: 28,  height: 28 },
}
