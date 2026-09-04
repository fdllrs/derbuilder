import { useDiagramStore } from '../../store/diagramStore'
import type { Node } from '../../types/diagram'
import styles from './PropertiesPanel.module.css'

interface Props { node: Node }

export function RelationshipProps({ node }: Props) {
  const updateNode = useDiagramStore((s) => s.updateNode)
  const cycleNodeType = useDiagramStore((s) => s.cycleNodeType)
  const edges = useDiagramStore((s) => s.diagram.edges)
  const nodes = useDiagramStore((s) => s.diagram.nodes)

  // Derive degree from edges
  const entityEdges = edges.filter((e) => {
    const other =
      e.sourceId === node.id
        ? nodes.find((n) => n.id === e.targetId)
        : e.targetId === node.id
        ? nodes.find((n) => n.id === e.sourceId)
        : null
    return other?.type.startsWith('entity')
  })
  const degree =
    entityEdges.length === 1 ? 'Unaria' :
    entityEdges.length === 2 ? 'Binaria' :
    entityEdges.length === 3 ? 'Ternaria' :
    `${entityEdges.length} entidades`

  return (
    <div className={styles.section}>
      <div>
        <div className={styles.label}>Nombre</div>
        <input
          className={styles.input}
          value={node.label}
          placeholder="Nombre de la interrelación"
          onChange={(e) => updateNode(node.id, { label: e.target.value })}
        />
      </div>
      <div>
        <div className={styles.label}>Tipo</div>
        <div className={styles.radioGroup}>
          <button
            className={`${styles.radioBtn} ${node.type === 'relationship' ? styles.selected : ''}`}
            onClick={() => node.type !== 'relationship' && cycleNodeType(node.id)}
          >
            Regular
          </button>
          <button
            className={`${styles.radioBtn} ${node.type === 'relationship-identifying' ? styles.selected : ''}`}
            onClick={() => node.type !== 'relationship-identifying' && cycleNodeType(node.id)}
          >
            Identificatoria
          </button>
        </div>
      </div>
      <div className={styles.infoRow}>
        Grado: <strong>{degree}</strong>
        <div className={styles.hint}>Derivado de las entidades conectadas</div>
      </div>
    </div>
  )
}
