import { create } from 'zustand'
import { produce } from 'immer'
import type { Tool, Viewport, ConnectionDrag } from '../types/diagram'

interface UIStore {
  activeTool: Tool
  selectedIds: string[]
  viewport: Viewport
  connectionDrag: ConnectionDrag
  renamingId: string | null
  gridEnabled: boolean
  snapEnabled: boolean

  // Tool
  setTool: (tool: Tool) => void

  // Selection
  setSelected: (ids: string[]) => void
  addToSelection: (id: string) => void
  clearSelection: () => void

  // Viewport
  setViewport: (viewport: Viewport) => void
  panBy: (dx: number, dy: number) => void
  zoomTo: (scale: number, cx?: number, cy?: number) => void
  resetViewport: () => void

  // Connection drag
  startConnectionDrag: (sourceId: string, sourcePort: import('../types/diagram').Port, x: number, y: number) => void
  updateConnectionDrag: (x: number, y: number) => void
  endConnectionDrag: () => void

  // Rename
  startRenaming: (id: string) => void
  stopRenaming: () => void

  // Grid/snap
  toggleGrid: () => void
}

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, scale: 1 }

export const useUIStore = create<UIStore>((set) => ({
  activeTool: 'pointer',
  selectedIds: [],
  viewport: DEFAULT_VIEWPORT,
  connectionDrag: {
    active: false,
    sourceId: null,
    sourcePort: null,
    cursorX: 0,
    cursorY: 0,
  },
  renamingId: null,
  gridEnabled: false,
  snapEnabled: false,

  setTool: (tool) => set({ activeTool: tool }),

  setSelected: (ids) => set({ selectedIds: ids }),
  addToSelection: (id) =>
    set(
      produce((state: UIStore) => {
        if (!state.selectedIds.includes(id)) {
          state.selectedIds.push(id)
        }
      }),
    ),
  clearSelection: () => set({ selectedIds: [] }),

  setViewport: (viewport) => set({ viewport }),
  panBy: (dx, dy) =>
    set(
      produce((state: UIStore) => {
        state.viewport.x += dx
        state.viewport.y += dy
      }),
    ),
  zoomTo: (scale, cx = 0, cy = 0) =>
    set(
      produce((state: UIStore) => {
        const prev = state.viewport
        // Zoom toward the cursor point
        const ratio = scale / prev.scale
        state.viewport.x = cx - ratio * (cx - prev.x)
        state.viewport.y = cy - ratio * (cy - prev.y)
        state.viewport.scale = scale
      }),
    ),
  resetViewport: () => set({ viewport: DEFAULT_VIEWPORT }),

  startConnectionDrag: (sourceId, sourcePort, x, y) =>
    set({
      connectionDrag: { active: true, sourceId, sourcePort, cursorX: x, cursorY: y },
    }),
  updateConnectionDrag: (x, y) =>
    set(
      produce((state: UIStore) => {
        state.connectionDrag.cursorX = x
        state.connectionDrag.cursorY = y
      }),
    ),
  endConnectionDrag: () =>
    set({
      connectionDrag: { active: false, sourceId: null, sourcePort: null, cursorX: 0, cursorY: 0 },
    }),

  startRenaming: (id) => set({ renamingId: id }),
  stopRenaming: () => set({ renamingId: null }),

  toggleGrid: () =>
    set(
      produce((state: UIStore) => {
        state.gridEnabled = !state.gridEnabled
        state.snapEnabled = !state.snapEnabled
      }),
    ),
}))
