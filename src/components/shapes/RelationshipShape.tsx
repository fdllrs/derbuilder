import type { Node } from '../../types/diagram'
import { InlineLabel } from './InlineLabel'

const INNER_INSET = 6

interface RelationshipShapeProps {
  node: Node
  selected: boolean
  onPointerDown: (e: React.PointerEvent) => void
  onDoubleClick: () => void
  onPortPointerDown: (e: React.PointerEvent, port: 'n' | 's' | 'e' | 'w') => void
  showPorts: boolean
}

/** Diamond points: top, right, bottom, left */
function diamondPoints(cx: number, cy: number, hw: number, hh: number): string {
  return `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`
}

export function RelationshipShape({
  node,
  selected,
  onPointerDown,
  onDoubleClick,
  onPortPointerDown,
  showPorts,
}: RelationshipShapeProps) {
  const { x, y, width, height, label, type, id } = node
  const hw = width / 2   // half-width
  const hh = height / 2  // half-height
  const isIdentifying = type === 'relationship-identifying'

  const stroke = selected ? 'var(--border-selected)' : 'var(--border-default)'
  const strokeWidth = selected ? 2 : 1.5
  const fill = selected ? 'var(--accent-light)' : 'white'

  const ports: Array<{ port: 'n' | 's' | 'e' | 'w'; cx: number; cy: number }> = [
    { port: 'n', cx: x, cy: y - hh },
    { port: 's', cx: x, cy: y + hh },
    { port: 'e', cx: x + hw, cy: y },
    { port: 'w', cx: x - hw, cy: y },
  ]

  const innerInset = INNER_INSET
  const innerHW = hw - innerInset
  const innerHH = hh - innerInset

  return (
    <g
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      style={{ cursor: 'move' }}
      role="img"
      aria-label={`${isIdentifying ? 'Interrelación Identificatoria' : 'Interrelación'}: ${label}`}
    >
      {/* Outer diamond */}
      <polygon
        points={diamondPoints(x, y, hw, hh)}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Inner diamond for identifying */}
      {isIdentifying && (
        <polygon
          points={diamondPoints(x, y, innerHW, innerHH)}
          fill="none"
          stroke={stroke}
          strokeWidth={1}
        />
      )}
      {/* Label */}
      <InlineLabel id={id} x={x} y={y} width={width} height={height} label={label} />
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
