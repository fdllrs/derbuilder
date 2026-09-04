import type { Edge, Node } from '../../types/diagram'
import { getPortPosition, cardinalityLabelPos, participationCirclePos } from '../../utils/geometry'

interface EdgeShapeProps {
  edge: Edge
  nodes: Node[]
  selected: boolean
  onPointerDown: (e: React.PointerEvent) => void
  warned?: boolean  // DER rule violation — yellow tint
}

export function EdgeShape({ edge, nodes, selected, onPointerDown, warned }: EdgeShapeProps) {
  const source = nodes.find((n) => n.id === edge.sourceId)
  const target = nodes.find((n) => n.id === edge.targetId)
  if (!source || !target) return null

  const src = getPortPosition(source, edge.sourcePort)
  const tgt = getPortPosition(target, edge.targetPort)

  const isEntitySource = source.type.startsWith('entity')
  const isEntityTarget = target.type.startsWith('entity')

  const stroke = warned
    ? 'var(--warning)'
    : selected
    ? 'var(--border-selected)'
    : 'var(--border-default)'

  // Hierarchy edge: the line from superentity → circle is dashed if partial coverage
  const isHierarchyEdge =
    source.type === 'hierarchy-node' || target.type === 'hierarchy-node'
  const hierarchyNode =
    source.type === 'hierarchy-node' ? source : target.type === 'hierarchy-node' ? target : null
  const strokeDasharray =
    isHierarchyEdge && hierarchyNode?.coverage === 'partial' ? '5 3' : undefined

  return (
    <g onPointerDown={onPointerDown} style={{ cursor: 'pointer' }}>
      {/* Wider invisible hit area */}
      <line
        x1={src.x}
        y1={src.y}
        x2={tgt.x}
        y2={tgt.y}
        stroke="transparent"
        strokeWidth={12}
      />
      {/* Visible line */}
      <line
        x1={src.x}
        y1={src.y}
        x2={tgt.x}
        y2={tgt.y}
        stroke={stroke}
        strokeWidth={selected ? 2 : 1.5}
        strokeDasharray={strokeDasharray}
      />

      {/* Source side: cardinality label + participation */}
      {isEntitySource && edge.cardinalityAtSource && (
        <CardinalityLabel
          entitySide={src}
          otherSide={tgt}
          value={edge.cardinalityAtSource}
          warned={warned}
        />
      )}
      {isEntitySource && edge.participationAtSource === 'partial' && (
        <ParticipationCircle entitySide={src} otherSide={tgt} warned={warned} />
      )}

      {/* Target side: cardinality label + participation */}
      {isEntityTarget && edge.cardinalityAtTarget && (
        <CardinalityLabel
          entitySide={tgt}
          otherSide={src}
          value={edge.cardinalityAtTarget}
          warned={warned}
        />
      )}
      {isEntityTarget && edge.participationAtTarget === 'partial' && (
        <ParticipationCircle entitySide={tgt} otherSide={src} warned={warned} />
      )}

      {/* Selected highlight */}
      {selected && (
        <line
          x1={src.x}
          y1={src.y}
          x2={tgt.x}
          y2={tgt.y}
          stroke="var(--accent)"
          strokeWidth={2}
          strokeOpacity={0.3}
        />
      )}
    </g>
  )
}

function CardinalityLabel({
  entitySide,
  otherSide,
  value,
  warned,
}: {
  entitySide: { x: number; y: number }
  otherSide: { x: number; y: number }
  value: string
  warned?: boolean
}) {
  const pos = cardinalityLabelPos(entitySide, otherSide, 22, 10)
  return (
    <text
      x={pos.x}
      y={pos.y}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={13}
      fontFamily="STIX Two Text, Georgia, serif"
      fill={warned ? 'var(--warning)' : 'var(--text-primary)'}
      style={{ userSelect: 'none', pointerEvents: 'none' }}
    >
      {value}
    </text>
  )
}

function ParticipationCircle({
  entitySide,
  otherSide,
  warned,
}: {
  entitySide: { x: number; y: number }
  otherSide: { x: number; y: number }
  warned?: boolean
}) {
  const pos = participationCirclePos(entitySide, otherSide, 14)
  return (
    <circle
      cx={pos.x}
      cy={pos.y}
      r={5}
      fill="white"
      stroke={warned ? 'var(--warning)' : 'var(--border-default)'}
      strokeWidth={1.5}
      style={{ pointerEvents: 'none' }}
    />
  )
}
