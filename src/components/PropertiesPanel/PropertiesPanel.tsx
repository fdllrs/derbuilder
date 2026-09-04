import { useDiagramStore } from '../../store/diagramStore'
import { useUIStore } from '../../store/uiStore'
import { EntityProps } from './EntityProps'
import { RelationshipProps } from './RelationshipProps'
import { EdgeProps } from './EdgeProps'
import { AttributeProps } from './AttributeProps'
import { HierarchyProps } from './HierarchyProps'
import styles from './PropertiesPanel.module.css'

export function PropertiesPanel() {
  const selectedIds = useUIStore((s) => s.selectedIds)
  const nodes = useDiagramStore((s) => s.diagram.nodes)
  const edges = useDiagramStore((s) => s.diagram.edges)

  if (selectedIds.length === 0) {
    return (
      <aside className={styles.panel} aria-label="Propiedades">
        <div className={styles.empty}>
          Seleccioná un elemento para editar sus propiedades
        </div>
      </aside>
    )
  }

  if (selectedIds.length > 1) {
    return (
      <aside className={styles.panel} aria-label="Propiedades">
        <div className={styles.header}>Selección múltiple</div>
        <div className={styles.section}>
          <div className={styles.infoRow}>{selectedIds.length} elementos seleccionados</div>
          <div className={styles.hint}>Del para eliminar · Arrastrá para mover</div>
        </div>
      </aside>
    )
  }

  const id = selectedIds[0]
  const node = nodes.find((n) => n.id === id)
  const edge = edges.find((e) => e.id === id)

  return (
    <aside className={styles.panel} aria-label="Propiedades">
      {node && (
        <>
          <div className={styles.header}>
            {node.type === 'entity-strong' || node.type === 'entity-weak'
              ? 'Entidad'
              : node.type === 'relationship' || node.type === 'relationship-identifying'
              ? 'Interrelación'
              : node.type.startsWith('attr')
              ? 'Atributo'
              : 'Jerarquía'}
          </div>
          {(node.type === 'entity-strong' || node.type === 'entity-weak') && (
            <EntityProps node={node} />
          )}
          {(node.type === 'relationship' || node.type === 'relationship-identifying') && (
            <RelationshipProps node={node} />
          )}
          {node.type.startsWith('attr') && <AttributeProps node={node} />}
          {node.type === 'hierarchy-node' && <HierarchyProps node={node} />}
        </>
      )}
      {edge && (
        <>
          <div className={styles.header}>Arista</div>
          <EdgeProps edge={edge} />
        </>
      )}
    </aside>
  )
}
