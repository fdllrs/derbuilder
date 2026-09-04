import { useRef, useState, useCallback, useMemo } from 'react'
import { Toolbar } from './components/Toolbar/Toolbar'
import { Palette } from './components/Palette/Palette'
import { Canvas } from './components/Canvas/Canvas'
import { PropertiesPanel } from './components/PropertiesPanel/PropertiesPanel'
import { Toast } from './components/Toast/Toast'
import { useDiagramStore } from './store/diagramStore'
import { validateDiagram } from './utils/validation'
import styles from './App.module.css'

interface ToastState {
  id: number
  message: string
  variant: 'warning' | 'error' | 'default'
}

let toastCounter = 0

export default function App() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [toasts, setToasts] = useState<ToastState[]>([])

  const diagram = useDiagramStore((s) => s.diagram)

  const showToast = useCallback((message: string, variant: ToastState['variant'] = 'warning') => {
    const id = ++toastCounter
    setToasts((prev) => [...prev, { id, message, variant }])
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Compute warned edge IDs from diagram validation
  const warnedEdgeIds = useMemo(() => {
    const results = validateDiagram(diagram)
    return new Set(results.filter((r) => r.edgeId).map((r) => r.edgeId!))
  }, [diagram])

  return (
    <div className={styles.app}>
      <Toolbar svgRef={svgRef} onError={(msg) => showToast(msg, 'error')} />
      <div className={styles.body}>
        <Palette />
        <Canvas
          onValidationWarning={(msg) => showToast(msg, 'warning')}
          warnedEdgeIds={warnedEdgeIds}
        />
        <PropertiesPanel />
      </div>
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          variant={t.variant}
          onDismiss={() => dismissToast(t.id)}
        />
      ))}
    </div>
  )
}
