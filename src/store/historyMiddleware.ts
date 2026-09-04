import { produce } from 'immer'
import type { StateCreator, StoreMutatorIdentifier } from 'zustand'
import type { DiagramState } from '../types/diagram'

const MAX_HISTORY = 50

export interface HistorySlice {
  past: DiagramState[]
  future: DiagramState[]
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  _pushHistory: (snapshot: DiagramState) => void
}

type WithHistory<T> = T & HistorySlice

// Middleware that adds undo/redo to any store that exposes `diagram` state
export function withHistory<
  T extends { diagram: DiagramState },
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, Mps, Mcs>,
): StateCreator<WithHistory<T>, Mps, Mcs> {
  return (set, get, store) => {
    const base = initializer(set as Parameters<typeof initializer>[0], get as Parameters<typeof initializer>[1], store as Parameters<typeof initializer>[2])

    return {
      ...base,
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,

      _pushHistory: (snapshot: DiagramState) => {
        set((state) =>
          produce(state, (draft) => {
            draft.past.push(snapshot)
            if (draft.past.length > MAX_HISTORY) draft.past.shift()
            draft.future = []
            draft.canUndo = true
            draft.canRedo = false
          }),
        )
      },

      undo: () => {
        const { past, diagram } = get() as WithHistory<T>
        if (past.length === 0) return
        const previous = past[past.length - 1]
        set((state) =>
          produce(state, (draft) => {
            draft.past.pop()
            draft.future.unshift(diagram)
            draft.diagram = previous as DiagramState
            draft.canUndo = draft.past.length > 0
            draft.canRedo = true
          }),
        )
      },

      redo: () => {
        const { future, diagram } = get() as WithHistory<T>
        if (future.length === 0) return
        const next = future[0]
        set((state) =>
          produce(state, (draft) => {
            draft.future.shift()
            draft.past.push(diagram)
            draft.diagram = next as DiagramState
            draft.canUndo = true
            draft.canRedo = draft.future.length > 0
          }),
        )
      },
    } as WithHistory<T>
  }
}
