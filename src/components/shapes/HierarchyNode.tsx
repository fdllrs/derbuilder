import type { Node } from '../../types/diagram'

interface HierarchyNodeProps {
  node: Node
  selected: boolean
  onPointerDown: (e: React.PointerEvent) => void
  onDoubleClick: () => void
  onPortPointerDown: (e: React.PointerEvent, port: 'n' | 's' | 'e' | 'w') => void
  showPorts: boolean
}

const R = 14  // circle radius

export function HierarchyNode({
  node,
  selected,
  onPointerDown,
  onDoubleClick,
  onPortPointerDown,
  showPorts,
}: HierarchyNodeProps) {
  const { x, y, coverage, overlap, discriminant } = node

  const stroke = selected ? 'var(--border-selected)' : 'var(--border-default)'
  const strokeWidth = selected ? 2 : 1.5
  const fill = selected ? 'var(--accent-light)' : 'white'

  const letter =
    overlap === 'disjoint' ? 'd' :
    overlap === 'overlapping' ? 'o' :
    ''

  const ports: Array<{ port: 'n' | 's' | 'e' | 'w'; cx: number; cy: number }> = [
    { port: 'n', cx: x, cy: y - R },
    { port: 's', cx: x, cy: y + R },
    { port: 'e', cx: x + R, cy: y },
    { port: 'w', cx: x - R, cy: y },
  ]

  return (
    <g
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      style={{ cursor: 'move' }}
      role="img"
      aria-label={`Jerarquía (${coverage === 'total' ? 'Total' : 'Parcial'}, ${overlap === 'disjoint' ? 'Disjunta' : 'Overlapping'})`}
    >
      {/* Circle */}
      <circle
        cx={x}
        cy={y}
        r={R}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Letter inside */}
      {letter && (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={12}
          fontFamily="STIX Two Text, Georgia, serif"
          fill="var(--text-primary)"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {letter}
        </text>
      )}
      {/* Discriminant label — shown to the right of the circle */}
      {discriminant && (
        <text
          x={x + R + 6}
          y={y + 4}
          textAnchor="start"
          fontSize={11}
          fontFamily="STIX Two Text, Georgia, serif"
          fill="var(--text-secondary)"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {discriminant}
        </text>
      )}
      {/* Port dots */}
      {showPorts &&
        ports.map(({ port, cx, cy }) => (
          <circle
            key={port}
            cx={cx}
            cy={cy}
            r={4}
            fill="white"
            stroke={selected ? 'var(--border-selected)' : 'var(--accent)'}
            strokeWidth={1.5}
            style={{ cursor: 'crosshair' }}
            onPointerDown={(e) => {
              e.stopPropagation()
              onPortPointerDown(e, port)
            }}
          />
        ))}
    </g>
  )
}
