import { useWorkbenchStore } from '../../store/workbenchStore';
import type { TaskRole } from '../../types';
import styles from './RoleNode.module.css';

interface RoleNodeProps {
  role: TaskRole;
}

const stateLabels: Record<TaskRole['status'], string> = {
  idle: '待命',
  running: '运行中',
  done: '已完成',
  failed: '失败',
};

export default function RoleNode({ role }: RoleNodeProps) {
  const openResult = useWorkbenchStore((s) => s.openResult);
  const currentTask = useWorkbenchStore((s) => s.currentTask);
  const fetchTask = useWorkbenchStore((s) => s.fetchTask);

  const handleClick = () => {
    if (role.status === 'done' && currentTask) {
      // Fetch latest task data before opening result
      fetchTask(currentTask.id);
      openResult(role.role_id);
    }
  };

  return (
    <div
      className={`${styles.cn} ${styles[role.status]}`}
      onClick={handleClick}
    >
      <span className={styles.ni}>{role.model_id === 'claude' ? '🧠' : role.model_id === 'deepseek' ? '🔍' : '🤖'}</span>
      <span className={styles.nn}>{role.role_name}</span>
      <span className={styles.badge}>{stateLabels[role.status]}</span>
    </div>
  );
}
