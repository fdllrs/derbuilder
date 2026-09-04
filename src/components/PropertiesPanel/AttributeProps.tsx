import { useDiagramStore } from '../../store/diagramStore'
import type { Node, NodeType } from '../../types/diagram'
import styles from './PropertiesPanel.module.css'

interface Props { node: Node }

const ATTR_TYPES: { type: NodeType; label: string }[] = [
  { type: 'attr-simple',       label: 'Simple' },
  { type: 'attr-identifying',  label: 'Identificatorio' },
  { type: 'attr-multivalued',  label: 'Multivaluado' },
  { type: 'attr-composite',    label: 'Compuesto' },
]

export function AttributeProps({ node }: Props) {
  const updateNode = useDiagramStore((s) => s.updateNode)
  const cycleNodeType = useDiagramStore((s) => s.cycleNodeType)

  return (
    <div className={styles.section}>
      <div>
        <div className={styles.label}>Nombre</div>
        <input
          className={styles.input}
          value={node.label}
          placeholder="Nombre del atributo"
          onChange={(e) => updateNode(node.id, { label: e.target.value })}
        />
      </div>
      <div>
        <div className={styles.label}>Tipo</div>
        <div className={styles.radioGroup}>
          {ATTR_TYPES.map(({ type, label }) => (
            <button
              key={type}
              className={`${styles.radioBtn} ${node.type === type ? styles.selected : ''}`}
              onClick={() => {
                if (node.type !== type) {
                  // Cycle until we reach desired type
                  let current = node
                  for (let i = 0; i < 4; i++) {
                    if (current.type === type) break
                    cycleNodeType(node.id)
                    // Optimistic: assume cycleNodeType changes type
                    // The actual store update will re-render
                    break
                  }
                  // Direct update is cleaner
                  updateNode(node.id, { type })
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.hint}>Clic en el atributo con herramienta A para ciclar</div>
      </div>
    </div>
  )
}
