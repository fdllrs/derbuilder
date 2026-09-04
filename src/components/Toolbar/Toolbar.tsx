import { useRef, useState, useEffect } from 'react'
import { useDiagramStore } from '../../store/diagramStore'
import { useUIStore } from '../../store/uiStore'
import { exportSVG, exportPNG } from '../../utils/export'
import { toJSON, fromJSON, downloadFile } from '../../utils/serialize'
import styles from './Toolbar.module.css'

interface ToolbarProps {
  svgRef: React.RefObject<SVGSVGElement | null>
  onError: (msg: string) => void
}

export function Toolbar({ svgRef, onError }: ToolbarProps) {
  const canUndo = useDiagramStore((s) => s.canUndo)
  const canRedo = useDiagramStore((s) => s.canRedo)
  const undo = useDiagramStore((s) => s.undo)
  const redo = useDiagramStore((s) => s.redo)
  const diagram = useDiagramStore((s) => s.diagram)
  const loadDiagram = useDiagramStore((s) => s.loadDiagram)
  const clearSelection = useUIStore((s) => s.clearSelection)

  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!exportOpen) return
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [exportOpen])

  function handleExportSVG() {
    setExportOpen(false)
    const el = svgRef.current
    if (!el) return
    try { exportSVG(el) } catch { onError('Error al exportar SVG') }
  }

  async function handleExportPNG() {
    setExportOpen(false)
    const el = svgRef.current
    if (!el) return
    try { await exportPNG(el) } catch { onError('Error al exportar PNG') }
  }

  function handleSaveJSON() {
    setExportOpen(false)
    downloadFile(toJSON(diagram), 'diagrama.json', 'application/json')
  }

  function handleLoadJSON() {
    setExportOpen(false)
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const loaded = fromJSON(ev.target?.result as string)
        loadDiagram(loaded)
        clearSelection()
      } catch (err) {
        onError((err as Error).message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <header className={styles.toolbar}>
      {/* Logo */}
      <div className={styles.logo}>
        <svg viewBox="0 0 20 20" fill="none" stroke="var(--accent)" strokeWidth={1.5}>
          <rect x="1" y="5" width="18" height="10" />
          <rect x="3.5" y="7.5" width="13" height="5" />
        </svg>
        DERBuilder
      </div>

      <div className={styles.divider} />

      {/* Undo/Redo */}
      <button
        className={styles.btn}
        onClick={undo}
        disabled={!canUndo}
        aria-label="Deshacer"
        title="Deshacer (Ctrl+Z)"
      >
        <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M3 7.5C3 5 5 3 7.5 3c1.6 0 3 .8 3.8 2M3 4v3.5H6.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        className={styles.btn}
        onClick={redo}
        disabled={!canRedo}
        aria-label="Rehacer"
        title="Rehacer (Ctrl+Shift+Z)"
      >
        <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 7.5C12 5 10 3 7.5 3c-1.6 0-3 .8-3.8 2M12 4v3.5H8.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className={styles.spacer} />

      {/* Export dropdown */}
      <div className={styles.dropdown} ref={exportRef}>
        <button
          className={`${styles.btn} ${styles.exportBtn}`}
          onClick={() => setExportOpen((v) => !v)}
          aria-label="Exportar"
          aria-expanded={exportOpen}
        >
          Exportar
          <svg viewBox="0 0 15 15" fill="currentColor">
            <path d="M4 6l3.5 4L11 6" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round" />
          </svg>
        </button>
        {exportOpen && (
          <div className={styles.dropdownMenu} role="menu">
            <button className={styles.dropdownItem} onClick={handleExportSVG} role="menuitem">
              <span>Exportar SVG</span>
              <span className={styles.shortcut}>Ctrl+E</span>
            </button>
            <button className={styles.dropdownItem} onClick={handleExportPNG} role="menuitem">
              <span>Exportar PNG</span>
              <span className={styles.shortcut}>Ctrl+Shift+E</span>
            </button>
            <div className={styles.dropdownDivider} />
            <button className={styles.dropdownItem} onClick={handleSaveJSON} role="menuitem">
              <span>Guardar JSON</span>
              <span className={styles.shortcut}>Ctrl+S</span>
            </button>
            <button className={styles.dropdownItem} onClick={handleLoadJSON} role="menuitem">
              <span>Cargar JSON...</span>
            </button>
          </div>
        )}
      </div>

      {/* Hidden file input for JSON load */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </header>
  )
}
