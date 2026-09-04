import { useDiagramStore } from '../../store/diagramStore'
import type { Edge, Cardinality, Participation } from '../../types/diagram'
import styles from './PropertiesPanel.module.css'

interface Props { edge: Edge }

const CARDINALITIES: Cardinality[] = ['1', 'n', 'm', 'p', null]
const CARDINALITY_LABELS: Record<string, string> = { '1': '1', n: 'n', m: 'm', p: 'p', '': '—' }

function CardinalitySelect({
  value,
  onChange,
}: {
  value: Cardinality
  onChange: (v: Cardinality) => void
}) {
  return (
    <select
      className={styles.select}
      value={value ?? ''}
      onChange={(e) => onChange((e.target.value || null) as Cardinality)}
    >
      {CARDINALITIES.map((c) => (
        <option key={c ?? ''} value={c ?? ''}>
          {CARDINALITY_LABELS[c ?? '']}
        </option>
      ))}
    </select>
  )
}

function ParticipationToggle({
  value,
  onChange,
}: {
  value: Participation
  onChange: (v: Participation) => void
}) {
  return (
    <div className={styles.radioGroup}>
      <button
        className={`${styles.radioBtn} ${value === 'total' ? styles.selected : ''}`}
        onClick={() => onChange('total')}
      >
        Total
      </button>
      <button
        className={`${styles.radioBtn} ${value === 'partial' ? styles.selected : ''}`}
        onClick={() => onChange('partial')}
      >
        Parcial
      </button>
    </div>
  )
}

export function EdgeProps({ edge }: Props) {
  const updateEdge = useDiagramStore((s) => s.updateEdge)
  const nodes = useDiagramStore((s) => s.diagram.nodes)

  const sourceNode = nodes.find((n) => n.id === edge.sourceId)
  const targetNode = nodes.find((n) => n.id === edge.targetId)

  const isEntitySource = sourceNode?.type.startsWith('entity')
  const isEntityTarget = targetNode?.type.startsWith('entity')

  // If neither side is an entity, don't show any properties
  if (!isEntitySource && !isEntityTarget) {
    return (
      <div className={styles.section}>
        <div className={styles.infoRow}>Esta conexión no lleva cardinalidad.</div>
      </div>
    )
  }

  return (
    <div className={styles.section}>
      {isEntitySource && (
        <>
          <div>
            <div className={styles.label}>Cardinalidad {isEntityTarget ? '— lado origen' : ''}</div>
            <CardinalitySelect
              value={edge.cardinalityAtSource}
              onChange={(v) => updateEdge(edge.id, { cardinalityAtSource: v })}
            />
          </div>
          <div>
            <div className={styles.label}>Participación {isEntityTarget ? '— lado origen' : ''}</div>
            <ParticipationToggle
              value={edge.participationAtSource}
              onChange={(v) => updateEdge(edge.id, { participationAtSource: v })}
            />
          </div>
        </>
      )}

      {isEntitySource && isEntityTarget && (
        <div style={{ height: 1, background: 'var(--border-panel)' }} />
      )}

      {isEntityTarget && (
        <>
          <div>
            <div className={styles.label}>Cardinalidad {isEntitySource ? '— lado destino' : ''}</div>
            <CardinalitySelect
              value={edge.cardinalityAtTarget}
              onChange={(v) => updateEdge(edge.id, { cardinalityAtTarget: v })}
            />
          </div>
          <div>
            <div className={styles.label}>Participación {isEntitySource ? '— lado destino' : ''}</div>
            <ParticipationToggle
              value={edge.participationAtTarget}
              onChange={(v) => updateEdge(edge.id, { participationAtTarget: v })}
            />
          </div>
        </>
      )}

      <div className={styles.hint}>
        Atajos: 1/N/M/P para cardinalidad · T para participación
      </div>
    </div>
  )
}
