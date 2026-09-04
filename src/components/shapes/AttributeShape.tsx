import type { Node } from '../../types/diagram'
import { InlineLabel } from './InlineLabel'

const INNER_INSET = 5

interface AttributeShapeProps {
  node: Node
  selected: boolean
  onPointerDown: (e: React.PointerEvent) => void
  onDoubleClick: () => void
  onPortPointerDown: (e: React.PointerEvent, port: 'n' | 's' | 'e' | 'w') => void
  showPorts: boolean
}

export function AttributeShape({
  node,
  selected,
  onPointerDown,
  onDoubleClick,
  onPortPointerDown,
  showPorts,
}: AttributeShapeProps) {
  const { x, y, width, height, label, type, id } = node
  const rx = width / 2
  const ry = height / 2
  const isIdentifying = type === 'attr-identifying'
  const isMultivalued = type === 'attr-multivalued'
  const isComposite = type === 'attr-composite'

  const stroke = selected ? 'var(--border-selected)' : 'var(--border-default)'
  const strokeWidth = selected ? 2 : 1.5
  const fill = selected ? 'var(--accent-light)' : 'white'
  const strokeDasharray = isComposite ? '5 3' : undefined

  const ports: Array<{ port: 'n' | 's' | 'e' | 'w'; cx: number; cy: number }> = [
    { port: 'n', cx: x, cy: y - ry },
    { port: 's', cx: x, cy: y + ry },
    { port: 'e', cx: x + rx, cy: y },
    { port: 'w', cx: x - rx, cy: y },
  ]

  const typeLabel =
    type === 'attr-simple' ? 'Atributo Simple' :
    type === 'attr-identifying' ? 'Atributo Identificatorio' :
    type === 'attr-multivalued' ? 'Atributo Multivaluado' :
    'Atributo Compuesto'

  return (
    <g
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      style={{ cursor: 'move' }}
      role="img"
      aria-label={`${typeLabel}: ${label}`}
    >
      {/* Outer ellipse */}
      <ellipse
        cx={x}
        cy={y}
        rx={rx}
        ry={ry}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
      />
      {/* Inner ellipse for multivalued */}
      {isMultivalued && (
        <ellipse
          cx={x}
          cy={y}
          rx={rx - INNER_INSET}
          ry={ry - INNER_INSET}
          fill="none"
          stroke={stroke}
          strokeWidth={1}
        />
      )}
      {/* Label — with underline for identifying attribute */}
      {isIdentifying ? (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={14}
          fontFamily="STIX Two Text, Georgia, serif"
          fill={label ? 'var(--text-primary)' : 'var(--text-placeholder)'}
          textDecoration="underline"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {label || 'nombre'}
        </text>
      ) : (
        <InlineLabel id={id} x={x} y={y} width={width} height={height} label={label} />
      )}
      {/* Port dots */}
      {showPorts &&
        ports.map(({ port, cx, cy }) => (
          <circle
            key={port}
            cx={cx}
            cy={cy}
            r={5}
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
