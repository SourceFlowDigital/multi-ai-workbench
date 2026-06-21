import { useWorkbenchStore } from '../../store/workbenchStore';
import RoleNode from './RoleNode';
import styles from './RoleRow.module.css';

export default function RoleRow() {
  const taskRoles = useWorkbenchStore((s) => s.taskRoles);

  if (taskRoles.length === 0) return null;

  return (
    <div className={styles.roleRow}>
      {taskRoles.map((role) => (
        <RoleNode key={role.role_id} role={role} />
      ))}
    </div>
  );
}
