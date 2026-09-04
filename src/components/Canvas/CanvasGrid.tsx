interface CanvasGridProps {
  viewport: { x: number; y: number; scale: number }
  width: number
  height: number
}

const GRID = 20

export function CanvasGrid({ viewport, width, height }: CanvasGridProps) {
  const scaledGrid = GRID * viewport.scale
  // Offset so grid lines align with diagram-space origin
  const offsetX = ((viewport.x % scaledGrid) + scaledGrid) % scaledGrid
  const offsetY = ((viewport.y % scaledGrid) + scaledGrid) % scaledGrid

  const cols = Math.ceil(width / scaledGrid) + 1
  const rows = Math.ceil(height / scaledGrid) + 1

  const lines: React.ReactNode[] = []

  for (let i = 0; i <= cols; i++) {
    const x = offsetX + i * scaledGrid
    lines.push(
      <line
        key={`v${i}`}
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke="var(--border-panel)"
        strokeWidth={0.5}
      />,
    )
  }
  for (let j = 0; j <= rows; j++) {
    const y = offsetY + j * scaledGrid
    lines.push(
      <line
        key={`h${j}`}
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke="var(--border-panel)"
        strokeWidth={0.5}
      />,
    )
  }

  return <g pointerEvents="none">{lines}</g>
}
