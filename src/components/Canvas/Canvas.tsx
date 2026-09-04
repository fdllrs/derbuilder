import { useRef, useState, useCallback } from 'react'
import { useDiagramStore } from '../../store/diagramStore'
import { useUIStore } from '../../store/uiStore'
import { usePanZoom } from '../../hooks/usePanZoom'
import { useKeyboard } from '../../hooks/useKeyboard'
import { useEdgeKeyboard } from '../../hooks/useEdgeKeyboard'
import { screenToDiagram, closestPort, hitTestPort, getPortPosition, snapPoint } from '../../utils/geometry'
import { validateEdge } from '../../utils/validation'
import { CanvasGrid } from './CanvasGrid'
import { AggregationLayer } from './AggregationLayer'
import { EdgeLayer } from './EdgeLayer'
import { NodeLayer } from './NodeLayer'
import { ConnectionDragLayer } from './ConnectionDragLayer'
import { DEFAULT_SIZES, type NodeType, type Port } from '../../types/diagram'
import styles from './Canvas.module.css'

interface CanvasProps {
  onValidationWarning: (message: string) => void
  warnedEdgeIds: Set<string>
}

export function Canvas({ onValidationWarning, warnedEdgeIds }: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  // Store
  const nodes = useDiagramStore((s) => s.diagram.nodes)
  const edges = useDiagramStore((s) => s.diagram.edges)
  const addNode = useDiagramStore((s) => s.addNode)
  const addEdge = useDiagramStore((s) => s.addEdge)
  const cycleNodeType = useDiagramStore((s) => s.cycleNodeType)
  const updateNode = useDiagramStore((s) => s.updateNode)

  const activeTool = useUIStore((s) => s.activeTool)
  const setTool = useUIStore((s) => s.setTool)
  const selectedIds = useUIStore((s) => s.selectedIds)
  const setSelected = useUIStore((s) => s.setSelected)
  const addToSelection = useUIStore((s) => s.addToSelection)
  const clearSelection = useUIStore((s) => s.clearSelection)
  const viewport = useUIStore((s) => s.viewport)
  const connectionDrag = useUIStore((s) => s.connectionDrag)
  const startConnectionDrag = useUIStore((s) => s.startConnectionDrag)
  const updateConnectionDrag = useUIStore((s) => s.updateConnectionDrag)
  const endConnectionDrag = useUIStore((s) => s.endConnectionDrag)
  const startRenaming = useUIStore((s) => s.startRenaming)
  const snapEnabled = useUIStore((s) => s.snapEnabled)
  const gridEnabled = useUIStore((s) => s.gridEnabled)

  // Hooks
  usePanZoom(svgRef)
  useKeyboard({ svgRef })
  useEdgeKeyboard()

  // Local UI state
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  // Drag-move state
  const dragState = useRef<{
    nodeId: string
    startDiagX: number
    startDiagY: number
    origX: number
    origY: number
  } | null>(null)
  // Rubber-band select state
  const rubberState = useRef<{ startX: number; startY: number } | null>(null)
  const [rubberBand, setRubberBand] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  // Canvas cursor
  const cursor =
    activeTool !== 'pointer' ? 'crosshair' : 'default'

  // ─── Convert event to diagram coords ────────────────────────

  function toDiag(e: React.PointerEvent | React.MouseEvent) {
    const rect = svgRef.current!.getBoundingClientRect()
    return screenToDiagram(e.clientX, e.clientY, rect, viewport)
  }

  // ─── Tool click on canvas (empty area) ─────────────────────

  const TOOL_TYPE_MAP: Partial<Record<typeof activeTool, NodeType>> = {
    entity: 'entity-strong',
    relationship: 'relationship',
    attribute: 'attr-simple',
    hierarchy: 'hierarchy-node',
  }

  const handleCanvasClick = useCallback(
    (e: React.PointerEvent) => {
      if (activeTool === 'pointer') {
        clearSelection()
        return
      }
      const nodeType = TOOL_TYPE_MAP[activeTool]
      if (!nodeType) return
      const pos = toDiag(e)
      const snapped = snapPoint(pos.x, pos.y, snapEnabled)
      const id = addNode(nodeType, snapped.x, snapped.y)
      setSelected([id])
      // Auto-enter rename after a tick (let the node render first)
      setTimeout(() => startRenaming(id), 0)
    },
    [activeTool, clearSelection, addNode, setSelected, startRenaming, snapEnabled, viewport],
  )
  // ─── Node interactions ───────────────────────────────────────

  const handleNodePointerDown = useCallback(
    (e: React.PointerEvent, nodeId: string) => {
      e.stopPropagation()
      if (e.button !== 0) return

      if (activeTool !== 'pointer') {
        // Tool click on existing node = cycle type
        cycleNodeType(nodeId)
        return
      }

      // Pointer tool: start move drag or selection
      const pos = toDiag(e)
      const node = nodes.find((n) => n.id === nodeId)!

      if (e.shiftKey) {
        addToSelection(nodeId)
      } else if (!selectedIds.includes(nodeId)) {
        setSelected([nodeId])
      }

      dragState.current = {
        nodeId,
        startDiagX: pos.x,
        startDiagY: pos.y,
        origX: node.x,
        origY: node.y,
      }
      ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    },
    [activeTool, nodes, selectedIds, cycleNodeType, addToSelection, setSelected, snapEnabled, viewport],
  )

  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      setSelected([nodeId])
      startRenaming(nodeId)
    },
    [setSelected, startRenaming],
  )

  // ─── Port drag (start connection) ───────────────────────────

  const handlePortPointerDown = useCallback(
    (e: React.PointerEvent, nodeId: string, port: Port) => {
      e.stopPropagation()
      const portPos = getPortPosition(nodes.find((n) => n.id === nodeId)!, port)
      startConnectionDrag(nodeId, port, portPos.x, portPos.y)
      ;(svgRef.current!).setPointerCapture(e.pointerId)
    },
    [nodes, startConnectionDrag],
  )

  // ─── Edge click ──────────────────────────────────────────────

  const handleEdgePointerDown = useCallback(
    (e: React.PointerEvent, edgeId: string) => {
      e.stopPropagation()
      if (e.shiftKey) addToSelection(edgeId)
      else setSelected([edgeId])
    },
    [setSelected, addToSelection],
  )

  // ─── SVG pointer events ──────────────────────────────────────

  const handleSVGPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const pos = toDiag(e)

      // Update connection drag
      if (connectionDrag.active) {
        updateConnectionDrag(pos.x, pos.y)
        return
      }

      // Move drag
      if (dragState.current) {
        const dx = pos.x - dragState.current.startDiagX
        const dy = pos.y - dragState.current.startDiagY
        const newX = snapEnabled
          ? snapPoint(dragState.current.origX + dx, 0, true).x
          : dragState.current.origX + dx
        const newY = snapEnabled
          ? snapPoint(0, dragState.current.origY + dy, true).y
          : dragState.current.origY + dy
        updateNode(dragState.current.nodeId, { x: newX, y: newY })
        return
      }

      // Rubber band
      if (rubberState.current) {
        const { startX, startY } = rubberState.current
        setRubberBand({
          x: Math.min(startX, pos.x),
          y: Math.min(startY, pos.y),
          w: Math.abs(pos.x - startX),
          h: Math.abs(pos.y - startY),
        })
        return
      }

      // Hover: show ports when near a node
      const hovered = nodes.find((n) => {
        const portHit = hitTestPort(n, pos.x, pos.y, 16)
        return portHit !== null
      })
      setHoveredNodeId(hovered?.id ?? null)
    },
    [connectionDrag.active, nodes, updateConnectionDrag, updateNode, snapEnabled, viewport],
  )

  const handleSVGPointerUp = useCallback(
    (e: React.PointerEvent) => {
      // Finish connection drag
      if (connectionDrag.active && connectionDrag.sourceId) {
        const pos = toDiag(e)
        const targetNode = nodes.find((n) => {
          // Find the node under the cursor (rough hit test)
          return (
            n.id !== connectionDrag.sourceId &&
            Math.abs(n.x - pos.x) <= n.width / 2 + 12 &&
            Math.abs(n.y - pos.y) <= n.height / 2 + 12
          )
        })

        if (targetNode && connectionDrag.sourcePort) {
          const targetPort = closestPort(targetNode, pos.x, pos.y)
          const sourceNode = nodes.find((n) => n.id === connectionDrag.sourceId)!

          const sourceIsEntity = sourceNode.type.startsWith('entity')
          const targetIsEntity = targetNode.type.startsWith('entity')

          if (sourceIsEntity && targetIsEntity) {
            // Auto-insert Relationship between entities
            const midX = (sourceNode.x + targetNode.x) / 2
            const midY = (sourceNode.y + targetNode.y) / 2
            const snapped = snapEnabled ? snapPoint(midX, midY, true) : { x: midX, y: midY }
            const relId = addNode('relationship', snapped.x, snapped.y)

            const mockRel = { ...DEFAULT_SIZES['relationship'], x: snapped.x, y: snapped.y } as any
            const relPortForSource = closestPort(mockRel, sourceNode.x, sourceNode.y)
            const relPortForTarget = closestPort(mockRel, targetNode.x, targetNode.y)

            addEdge(sourceNode.id, connectionDrag.sourcePort, relId, relPortForSource)
            addEdge(relId, relPortForTarget, targetNode.id, targetPort)

            setSelected([relId])
            setTimeout(() => startRenaming(relId), 0)
          } else {
            // Validate before creating
            const warnings = validateEdge(
              { sourceId: sourceNode.id, targetId: targetNode.id },
              nodes,
            )
            if (warnings.length > 0) {
              onValidationWarning(warnings[0].message)
            }
            // Still create even with warnings (soft warnings)
            const edgeId = addEdge(
              connectionDrag.sourceId,
              connectionDrag.sourcePort,
              targetNode.id,
              targetPort,
            )
            setSelected([edgeId])
          }

          // Switch to pointer tool after any successful connection
          setTool('pointer')
        }
        endConnectionDrag()
        return
      }

      // Finish move drag — clear, updateNode was already called incrementally
      if (dragState.current) {
        dragState.current = null
        return
      }

      // Finish rubber band
      if (rubberState.current && rubberBand) {
        const inBand = nodes
          .filter((n) => {
            return (
              n.x >= rubberBand.x &&
              n.x <= rubberBand.x + rubberBand.w &&
              n.y >= rubberBand.y &&
              n.y <= rubberBand.y + rubberBand.h
            )
          })
          .map((n) => n.id)
        if (inBand.length > 0) setSelected(inBand)
        rubberState.current = null
        setRubberBand(null)
      }
    },
    [connectionDrag, nodes, addEdge, endConnectionDrag, setSelected, rubberBand, onValidationWarning],
  )

  const handleSVGPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Middle mouse handled by usePanZoom
      if (e.button === 1) return
      if (e.button !== 0) return

      const pos = toDiag(e)

      // If clicked on empty canvas area and tool is pointer → start rubber band
      if (activeTool === 'pointer') {
        clearSelection()
        rubberState.current = { startX: pos.x, startY: pos.y }
      } else {
        // Placed a new node
        handleCanvasClick(e)
      }
    },
    // We need handleCanvasClick dependencies here, which we can just inline or rely on the fact that handleCanvasClick is already available.
    // wait, handleCanvasClick is defined above this block.
    [activeTool, viewport, handleCanvasClick],
  )

  // Connection drag source port absolute position
  const connSrcPos =
    connectionDrag.active && connectionDrag.sourceId && connectionDrag.sourcePort
      ? getPortPosition(
          nodes.find((n) => n.id === connectionDrag.sourceId)!,
          connectionDrag.sourcePort,
        )
      : null

  const svgW = svgRef.current?.clientWidth ?? window.innerWidth
  const svgH = svgRef.current?.clientHeight ?? window.innerHeight

  return (
    <div className={styles.canvas}>
      {nodes.length === 0 && !connectionDrag.active && (
        <div className={styles.emptyHint}>
          Presioná E para agregar una entidad, o arrastrá desde la paleta
        </div>
      )}
      <svg
        ref={svgRef}
        style={{ cursor }}
        onPointerDown={handleSVGPointerDown}
        onPointerMove={handleSVGPointerMove}
        onPointerUp={handleSVGPointerUp}
        tabIndex={0}
      >
        {/* Screen-space grid (rendered before transform group) */}
        {gridEnabled && <CanvasGrid viewport={viewport} width={svgW} height={svgH} />}

        {/* Diagram-space group — everything inside uses diagram coordinates */}
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.scale})`}>
          <AggregationLayer />
          <EdgeLayer
            edges={edges}
            nodes={nodes}
            selectedIds={selectedIds}
            warnedEdgeIds={warnedEdgeIds}
            onEdgePointerDown={handleEdgePointerDown}
          />
          <NodeLayer
            nodes={nodes}
            selectedIds={selectedIds}
            hoveredId={hoveredNodeId}
            onNodePointerDown={handleNodePointerDown}
            onNodeDoubleClick={handleNodeDoubleClick}
            onPortPointerDown={handlePortPointerDown}
          />
          {/* Rubber band selection rect */}
          {rubberBand && (
            <rect
              x={rubberBand.x}
              y={rubberBand.y}
              width={rubberBand.w}
              height={rubberBand.h}
              fill="var(--accent)"
              fillOpacity={0.08}
              stroke="var(--accent)"
              strokeWidth={1}
              strokeDasharray="4 2"
              pointerEvents="none"
            />
          )}
          {/* Connection drag line */}
          {connectionDrag.active && connSrcPos && (
            <ConnectionDragLayer
              active={true}
              x1={connSrcPos.x}
              y1={connSrcPos.y}
              x2={connectionDrag.cursorX}
              y2={connectionDrag.cursorY}
            />
          )}
        </g>
      </svg>
    </div>
  )
}
