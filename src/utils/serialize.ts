import type { DiagramState } from '../types/diagram'

const SCHEMA_VERSION = 1

interface SerializedDiagram {
  version: number
  diagram: DiagramState
}

export function toJSON(diagram: DiagramState): string {
  const payload: SerializedDiagram = { version: SCHEMA_VERSION, diagram }
  return JSON.stringify(payload, null, 2)
}

export function fromJSON(raw: string): DiagramState {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('El archivo no es un JSON válido')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('diagram' in parsed)
  ) {
    throw new Error('El archivo no es un diagrama DERBuilder válido')
  }

  const { diagram } = parsed as SerializedDiagram

  if (!Array.isArray(diagram?.nodes) || !Array.isArray(diagram?.edges)) {
    throw new Error('El archivo no es un diagrama válido')
  }

  return {
    nodes: diagram.nodes,
    edges: diagram.edges,
    aggregations: diagram.aggregations ?? [],
  }
}

/** Trigger a browser file download */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
