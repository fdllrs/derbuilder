import { useEffect } from 'react'
import { useDiagramStore } from '../store/diagramStore'
import { useUIStore } from '../store/uiStore'
import { toJSON, downloadFile } from '../utils/serialize'
import { exportSVG, exportPNG } from '../utils/export'

interface UseKeyboardOptions {
  svgRef: React.RefObject<SVGSVGElement | null>
}

export function useKeyboard({ svgRef }: UseKeyboardOptions) {
  const undo = useDiagramStore((s) => s.undo)
  const redo = useDiagramStore((s) => s.redo)
  const deleteSelected = useDiagramStore((s) => s.deleteSelected)
  const diagram = useDiagramStore((s) => s.diagram)

  const setTool = useUIStore((s) => s.setTool)
  const clearSelection = useUIStore((s) => s.clearSelection)
  const selectedIds = useUIStore((s) => s.selectedIds)
  const renamingId = useUIStore((s) => s.renamingId)
  const stopRenaming = useUIStore((s) => s.stopRenaming)
  const startRenaming = useUIStore((s) => s.startRenaming)
  const toggleGrid = useUIStore((s) => s.toggleGrid)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      const ctrl = e.ctrlKey || e.metaKey

      // Global shortcuts
      if (ctrl && e.key === 'z') { e.preventDefault(); undo(); return }
      if (ctrl && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo(); return }
      if (ctrl && e.key === 'a') { e.preventDefault(); /* handled in canvas */ return }

      if (ctrl && e.key === 's') {
        e.preventDefault()
        downloadFile(toJSON(diagram), 'diagrama.json', 'application/json')
        return
      }
      if (ctrl && e.shiftKey && e.key === 'E') {
        e.preventDefault()
        const svgEl = svgRef.current
        if (svgEl) exportPNG(svgEl).catch(console.error)
        return
      }
      if (ctrl && e.key === 'e') {
        e.preventDefault()
        const svgEl = svgRef.current
        if (svgEl) exportSVG(svgEl)
        return
      }

      // Tool switching
      if (!ctrl) {
        switch (e.key.toLowerCase()) {
          case 'v': case 'escape':
            if (renamingId) { stopRenaming(); return }
            setTool('pointer')
            clearSelection()
            return
          case 'e': setTool('entity'); return
          case 'r': setTool('relationship'); return
          case 'a': setTool('attribute'); return
          case 'h': setTool('hierarchy'); return
          case 'g': toggleGrid(); return
        }
      }

      // Selection actions
      if (selectedIds.length > 0) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault()
          if (renamingId) return // don't delete while renaming
          deleteSelected(selectedIds)
          clearSelection()
          return
        }
        if (e.key === 'Enter' && selectedIds.length === 1) {
          startRenaming(selectedIds[0])
          return
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    undo, redo, deleteSelected, diagram, setTool, clearSelection,
    selectedIds, renamingId, stopRenaming, startRenaming, toggleGrid, svgRef,
  ])
}
