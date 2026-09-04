import { useRef, useEffect } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useDiagramStore } from '../../store/diagramStore'

interface InlineLabelProps {
  id: string
  x: number
  y: number
  width: number
  height: number
  label: string
  fontFamily?: string
}

export function InlineLabel({ id, x, y, width, label, fontFamily }: InlineLabelProps) {
  const renamingId = useUIStore((s) => s.renamingId)
  const stopRenaming = useUIStore((s) => s.stopRenaming)
  const updateNode = useDiagramStore((s) => s.updateNode)
  const inputRef = useRef<HTMLInputElement>(null)

  const isRenaming = renamingId === id

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  if (!isRenaming) {
    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={14}
        fontFamily={fontFamily ?? 'STIX Two Text, Georgia, serif'}
        fill={label ? 'var(--text-primary)' : 'var(--text-placeholder)'}
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {label || 'nombre'}
      </text>
    )
  }

  return (
    <foreignObject x={x - width / 2 + 4} y={y - 12} width={width - 8} height={24}>
      <input
        ref={inputRef}
        defaultValue={label}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: fontFamily ?? 'STIX Two Text, Georgia, serif',
          fontSize: 14,
          textAlign: 'center',
          color: 'var(--text-primary)',
          padding: 0,
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            updateNode(id, { label: e.currentTarget.value })
            stopRenaming()
          }
          if (e.key === 'Escape') {
            stopRenaming()
          }
          e.stopPropagation() // don't trigger canvas shortcuts while typing
        }}
        onBlur={(e) => {
          updateNode(id, { label: e.currentTarget.value })
          stopRenaming()
        }}
      />
    </foreignObject>
  )
}
