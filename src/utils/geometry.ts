import type { Node, Port, Viewport } from '../types/diagram'

// ─── Port positions ─────────────────────────────────────────────

/** Returns the absolute (diagram-space) position of a port on a node */
export function getPortPosition(node: Node, port: Port): { x: number; y: number } {
  const { x, y, width, height } = node
  switch (port) {
    case 'n': return { x, y: y - height / 2 }
    case 's': return { x, y: y + height / 2 }
    case 'e': return { x: x + width / 2, y }
    case 'w': return { x: x - width / 2, y }
  }
}

/** Returns all 4 port positions for a node */
export function getAllPorts(node: Node): Record<Port, { x: number; y: number }> {
  return {
    n: getPortPosition(node, 'n'),
    s: getPortPosition(node, 's'),
    e: getPortPosition(node, 'e'),
    w: getPortPosition(node, 'w'),
  }
}

/** Finds the closest port on a node to a given point */
export function closestPort(node: Node, px: number, py: number): Port {
  const ports = getAllPorts(node)
  let bestPort: Port = 'n'
  let bestDist = Infinity
  for (const [port, pos] of Object.entries(ports) as [Port, { x: number; y: number }][]) {
    const d = Math.hypot(pos.x - px, pos.y - py)
    if (d < bestDist) {
      bestDist = d
      bestPort = port
    }
  }
  return bestPort
}

// ─── Edge path ──────────────────────────────────────────────────

/** Build an SVG path string from source to target (straight line for v1) */
export function edgePath(
  src: { x: number; y: number },
  tgt: { x: number; y: number },
): string {
  return `M ${src.x} ${src.y} L ${tgt.x} ${tgt.y}`
}

/** Midpoint of two points */
export function midpoint(
  a: { x: number; y: number },
  b: { x: number; y: number },
): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/**
 * Returns a point along the edge, close to the "entity side",
 * offset slightly perpendicular — used for cardinality labels.
 */
export function cardinalityLabelPos(
  entitySide: { x: number; y: number },
  otherSide: { x: number; y: number },
  distFromEntity = 22,
  perpOffset = 10,
): { x: number; y: number } {
  const dx = otherSide.x - entitySide.x
  const dy = otherSide.y - entitySide.y
  const len = Math.hypot(dx, dy) || 1
  // Unit vector along edge
  const ux = dx / len
  const uy = dy / len
  // Perpendicular unit vector
  const px = -uy
  const py = ux
  return {
    x: entitySide.x + ux * distFromEntity + px * perpOffset,
    y: entitySide.y + uy * distFromEntity + py * perpOffset,
  }
}

/**
 * Returns the position of the participation circle (○) on the edge,
 * near the entity-side endpoint.
 */
export function participationCirclePos(
  entitySide: { x: number; y: number },
  otherSide: { x: number; y: number },
  distFromEntity = 14,
): { x: number; y: number } {
  const dx = otherSide.x - entitySide.x
  const dy = otherSide.y - entitySide.y
  const len = Math.hypot(dx, dy) || 1
  return {
    x: entitySide.x + (dx / len) * distFromEntity,
    y: entitySide.y + (dy / len) * distFromEntity,
  }
}

// ─── Coordinate conversion ──────────────────────────────────────

/** Convert screen (client) coordinates to diagram-space coordinates */
export function screenToDiagram(
  clientX: number,
  clientY: number,
  svgRect: DOMRect,
  viewport: Viewport,
): { x: number; y: number } {
  const svgX = clientX - svgRect.left
  const svgY = clientY - svgRect.top
  return {
    x: (svgX - viewport.x) / viewport.scale,
    y: (svgY - viewport.y) / viewport.scale,
  }
}

// ─── Snap ───────────────────────────────────────────────────────

const GRID_SIZE = 10

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

export function snapPoint(x: number, y: number, snap: boolean): { x: number; y: number } {
  return snap ? { x: snapToGrid(x), y: snapToGrid(y) } : { x, y }
}

// ─── Hit testing ─────────────────────────────────────────────────

/** Check whether a point is inside a node's bounding box */
export function hitTestNode(node: Node, px: number, py: number): boolean {
  return (
    px >= node.x - node.width / 2 &&
    px <= node.x + node.width / 2 &&
    py >= node.y - node.height / 2 &&
    py <= node.y + node.height / 2
  )
}

/**
 * Check if a point is near any port of a node (within threshold).
 * Returns the port name if close, null otherwise.
 */
export function hitTestPort(
  node: Node,
  px: number,
  py: number,
  threshold = 10,
): Port | null {
  const ports = getAllPorts(node)
  for (const [port, pos] of Object.entries(ports) as [Port, { x: number; y: number }][]) {
    if (Math.hypot(pos.x - px, pos.y - py) <= threshold) return port
  }
  return null
}

// ─── Bounding box ────────────────────────────────────────────────

export interface BBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
  cx: number
  cy: number
}

export function nodeBBox(node: Node): BBox {
  const minX = node.x - node.width / 2
  const minY = node.y - node.height / 2
  const maxX = node.x + node.width / 2
  const maxY = node.y + node.height / 2
  return { minX, minY, maxX, maxY, width: node.width, height: node.height, cx: node.x, cy: node.y }
}

export function diagramBBox(nodes: Node[]): BBox | null {
  if (nodes.length === 0) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const n of nodes) {
    const b = nodeBBox(n)
    if (b.minX < minX) minX = b.minX
    if (b.minY < minY) minY = b.minY
    if (b.maxX > maxX) maxX = b.maxX
    if (b.maxY > maxY) maxY = b.maxY
  }
  const width = maxX - minX
  const height = maxY - minY
  return { minX, minY, maxX, maxY, width, height, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 }
}
