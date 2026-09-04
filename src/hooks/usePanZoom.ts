import { useEffect, useRef } from 'react'
import { useUIStore } from '../store/uiStore'
import { useDiagramStore } from '../store/diagramStore'
import { diagramBBox } from '../utils/geometry'

const MIN_SCALE = 0.1
const MAX_SCALE = 4

export function usePanZoom(svgRef: React.RefObject<SVGSVGElement | null>) {
  const setViewport = useUIStore((s) => s.setViewport)
  const panBy = useUIStore((s) => s.panBy)
  const zoomTo = useUIStore((s) => s.zoomTo)
  const viewport = useUIStore((s) => s.viewport)
  const nodes = useDiagramStore((s) => s.diagram.nodes)

  const isPanning = useRef(false)
  const lastPan = useRef({ x: 0, y: 0 })
  const spaceHeld = useRef(false)

  // Keyboard space = pan mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        spaceHeld.current = true
        document.body.style.cursor = 'grab'
      }
      // Zoom shortcuts
      if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setViewport({ x: 0, y: 0, scale: 1 })
      }
      if (e.key === 'f' || e.key === 'F') {
        zoomToFit()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeld.current = false
        document.body.style.cursor = ''
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [nodes]) // eslint-disable-line react-hooks/exhaustive-deps

  function zoomToFit() {
    const svgEl = svgRef.current
    if (!svgEl) return
    const bbox = diagramBBox(nodes)
    if (!bbox) return
    const rect = svgEl.getBoundingClientRect()
    const padding = 60
    const scaleX = (rect.width - padding * 2) / bbox.width
    const scaleY = (rect.height - padding * 2) / bbox.height
    const scale = Math.min(Math.min(scaleX, scaleY), MAX_SCALE)
    const x = rect.width / 2 - bbox.cx * scale
    const y = rect.height / 2 - bbox.cy * scale
    setViewport({ x, y, scale })
  }

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = svgEl.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top

      if (e.ctrlKey || e.metaKey) {
        // Pinch-to-zoom
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewport.scale * delta))
        zoomTo(newScale, cx, cy)
      } else {
        // Scroll = pan
        panBy(-e.deltaX, -e.deltaY)
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 1 || spaceHeld.current) {
        // Middle-click or Space+drag = pan
        e.preventDefault()
        isPanning.current = true
        lastPan.current = { x: e.clientX, y: e.clientY }
        svgEl.setPointerCapture(e.pointerId)
        document.body.style.cursor = 'grabbing'
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isPanning.current) return
      const dx = e.clientX - lastPan.current.x
      const dy = e.clientY - lastPan.current.y
      lastPan.current = { x: e.clientX, y: e.clientY }
      panBy(dx, dy)
    }

    const onPointerUp = () => {
      if (isPanning.current) {
        isPanning.current = false
        document.body.style.cursor = spaceHeld.current ? 'grab' : ''
      }
    }

    svgEl.addEventListener('wheel', onWheel, { passive: false })
    svgEl.addEventListener('pointerdown', onPointerDown)
    svgEl.addEventListener('pointermove', onPointerMove)
    svgEl.addEventListener('pointerup', onPointerUp)

    return () => {
      svgEl.removeEventListener('wheel', onWheel)
      svgEl.removeEventListener('pointerdown', onPointerDown)
      svgEl.removeEventListener('pointermove', onPointerMove)
      svgEl.removeEventListener('pointerup', onPointerUp)
    }
  }, [viewport, nodes]) // eslint-disable-line react-hooks/exhaustive-deps

  return { zoomToFit }
}
