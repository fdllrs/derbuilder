import { useDiagramStore } from '../../store/diagramStore'
import type { Node } from '../../types/diagram'
import styles from './PropertiesPanel.module.css'

interface Props { node: Node }

export function HierarchyProps({ node }: Props) {
  const updateNode = useDiagramStore((s) => s.updateNode)

  return (
    <div className={styles.section}>
      <div>
        <div className={styles.label}>Discriminante</div>
        <input
          className={styles.input}
          value={node.discriminant ?? ''}
          placeholder="ej. tipo"
          onChange={(e) => updateNode(node.id, { discriminant: e.target.value })}
        />
      </div>
      <div>
        <div className={styles.label}>Cobertura</div>
        <div className={styles.radioGroup}>
          <button
            className={`${styles.radioBtn} ${node.coverage === 'total' ? styles.selected : ''}`}
            onClick={() => node.coverage !== 'total' && updateNode(node.id, { coverage: 'total' })}
          >
            Total
          </button>
          <button
            className={`${styles.radioBtn} ${node.coverage === 'partial' ? styles.selected : ''}`}
            onClick={() => node.coverage !== 'partial' && updateNode(node.id, { coverage: 'partial' })}
          >
            Parcial
          </button>
        </div>
      </div>
      <div>
        <div className={styles.label}>Solapamiento</div>
        <div className={styles.radioGroup}>
          <button
            className={`${styles.radioBtn} ${node.overlap === 'disjoint' ? styles.selected : ''}`}
            onClick={() => node.overlap !== 'disjoint' && updateNode(node.id, { overlap: 'disjoint' })}
          >
            Disjunta
          </button>
          <button
            className={`${styles.radioBtn} ${node.overlap === 'overlapping' ? styles.selected : ''}`}
            onClick={() => node.overlap !== 'overlapping' && updateNode(node.id, { overlap: 'overlapping' })}
          >
            Overlapping
          </button>
        </div>
      </div>
      <div className={styles.hint}>
        Clic con herramienta H para ciclar entre las 4 variantes
      </div>
    </div>
  )
}
