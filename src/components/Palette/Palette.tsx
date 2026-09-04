import { useUIStore } from '../../store/uiStore'
import type { Tool } from '../../types/diagram'
import styles from './Palette.module.css'

interface ToolDef {
  tool: Tool
  label: string
  key: string
  icon: React.ReactNode
}

const TOOLS: ToolDef[] = [
  {
    tool: 'pointer',
    label: 'Puntero',
    key: 'V / Esc',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path d="M4 2l12 8-7 1-3 7L4 2z" />
      </svg>
    ),
  },
  {
    tool: 'entity',
    label: 'Entidad',
    key: 'E',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <rect x="2" y="6" width="16" height="8" rx="0" />
      </svg>
    ),
  },
  {
    tool: 'relationship',
    label: 'Interrelación',
    key: 'R',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <polygon points="10,2 18,10 10,18 2,10" />
      </svg>
    ),
  },
  {
    tool: 'attribute',
    label: 'Atributo',
    key: 'A',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <ellipse cx="10" cy="10" rx="8" ry="5" />
      </svg>
    ),
  },
  {
    tool: 'hierarchy',
    label: 'Jerarquía',
    key: 'H',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="10" cy="10" r="6" />
        <text x="10" y="14" textAnchor="middle" fontSize={9} fontFamily="serif" fill="currentColor" stroke="none">d</text>
      </svg>
    ),
  },
]

export function Palette() {
  const activeTool = useUIStore((s) => s.activeTool)
  const setTool = useUIStore((s) => s.setTool)
  const gridEnabled = useUIStore((s) => s.gridEnabled)
  const toggleGrid = useUIStore((s) => s.toggleGrid)

  return (
    <aside className={styles.palette} aria-label="Herramientas">
      {TOOLS.map(({ tool, label, key, icon }) => (
        <button
          key={tool}
          className={`${styles.toolBtn} ${activeTool === tool ? styles.active : ''}`}
          onClick={() => setTool(tool)}
          aria-label={label}
          aria-pressed={activeTool === tool}
          title={`${label} (${key})`}
        >
          {icon}
          <span className={styles.tooltip}>
            {label} <span className={styles.kbd}>{key}</span>
          </span>
        </button>
      ))}

      <div className={styles.divider} />

      {/* Grid toggle */}
      <button
        className={`${styles.toolBtn} ${gridEnabled ? styles.active : ''}`}
        onClick={toggleGrid}
        aria-label="Cuadrícula"
        aria-pressed={gridEnabled}
        title="Cuadrícula (G)"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.2}>
          <line x1="7" y1="2" x2="7" y2="18" />
          <line x1="13" y1="2" x2="13" y2="18" />
          <line x1="2" y1="7" x2="18" y2="7" />
          <line x1="2" y1="13" x2="18" y2="13" />
        </svg>
        <span className={styles.tooltip}>
          Cuadrícula <span className={styles.kbd}>G</span>
        </span>
      </button>
    </aside>
  )
}
