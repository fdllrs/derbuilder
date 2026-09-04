import type { Node } from '../../types/diagram'
import { InlineLabel } from './InlineLabel'

const INNER_INSET = 5

interface EntityShapeProps {
  node: Node
  selected: boolean
  onPointerDown: (e: React.PointerEvent) => void
  onDoubleClick: () => void
  onPortPointerDown: (e: React.PointerEvent, port: 'n' | 's' | 'e' | 'w') => void
  showPorts: boolean
}

export function EntityShape({
  node,
  selected,
  onPointerDown,
  onDoubleClick,
  onPortPointerDown,
  showPorts,
}: EntityShapeProps) {
  const { x, y, width, height, label, type, id } = node
  const left = x - width / 2
  const top = y - height / 2
  const isWeak = type === 'entity-weak'

  const stroke = selected ? 'var(--border-selected)' : 'var(--border-default)'
  const strokeWidth = selected ? 2 : 1.5
  const fill = selected ? 'var(--accent-light)' : 'white'

  const ports: Array<{ port: 'n' | 's' | 'e' | 'w'; cx: number; cy: number }> = [
    { port: 'n', cx: x, cy: top },
    { port: 's', cx: x, cy: top + height },
    { port: 'e', cx: left + width, cy: y },
    { port: 'w', cx: left, cy: y },
  ]

  return (
    <g
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      style={{ cursor: 'move' }}
      role="img"
      aria-label={`${isWeak ? 'Entidad Débil' : 'Entidad Fuerte'}: ${label}`}
    >
      {/* Main rect */}
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Inner rect for weak entity */}
      {isWeak && (
        <rect
          x={left + INNER_INSET}
          y={top + INNER_INSET}
          width={width - INNER_INSET * 2}
          height={height - INNER_INSET * 2}
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
