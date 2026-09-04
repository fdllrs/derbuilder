import { useDiagramStore } from '../../store/diagramStore'
import type { Node } from '../../types/diagram'
import styles from './PropertiesPanel.module.css'

interface Props { node: Node }

export function EntityProps({ node }: Props) {
  const updateNode = useDiagramStore((s) => s.updateNode)
  const cycleNodeType = useDiagramStore((s) => s.cycleNodeType)

  return (
    <div className={styles.section}>
      <div>
        <div className={styles.label}>Nombre</div>
        <input
          className={styles.input}
          value={node.label}
          placeholder="Nombre de la entidad"
          onChange={(e) => updateNode(node.id, { label: e.target.value })}
        />
      </div>
      <div>
        <div className={styles.label}>Tipo</div>
        <div className={styles.radioGroup}>
          <button
            className={`${styles.radioBtn} ${node.type === 'entity-strong' ? styles.selected : ''}`}
            onClick={() => node.type !== 'entity-strong' && cycleNodeType(node.id)}
          >
            Fuerte
          </button>
          <button
            className={`${styles.radioBtn} ${node.type === 'entity-weak' ? styles.selected : ''}`}
            onClick={() => node.type !== 'entity-weak' && cycleNodeType(node.id)}
          >
            Débil
          </button>
        </div>
      </div>
    </div>
  )
}
