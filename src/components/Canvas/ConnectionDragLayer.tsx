interface ConnectionDragLayerProps {
  active: boolean
  x1: number
  y1: number
  x2: number
  y2: number
}

export function ConnectionDragLayer({ active, x1, y1, x2, y2 }: ConnectionDragLayerProps) {
  if (!active) return null
  return (
    <g pointerEvents="none">
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="var(--accent)"
        strokeWidth={1.5}
        strokeDasharray="5 3"
        strokeOpacity={0.8}
      />
      <circle cx={x2} cy={y2} r={4} fill="var(--accent)" opacity={0.6} />
    </g>
  )
}
