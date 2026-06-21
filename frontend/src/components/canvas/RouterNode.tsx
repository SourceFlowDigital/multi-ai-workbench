import { useWorkbenchStore } from '../../store/workbenchStore';
import { getRouterPosition } from '../../utils/nodeLayout';
import styles from './RouterNode.module.css';

export default function RouterNode() {
  const currentTask = useWorkbenchStore((s) => s.currentTask);
  const taskRoles = useWorkbenchStore((s) => s.taskRoles);

  const pos = getRouterPosition();

  const status = currentTask?.status;
  const badgeText =
    status === 'running' ? '执行中' :
    status === 'completed' ? '已完成' :
    status === 'error' ? '异常' :
    taskRoles.length > 0 ? '运行中' : '待命';

  return (
    <div
      className={`${styles.cn} ${styles.route}`}
      style={{ left: pos.x, top: pos.y, transform: 'translateX(-50%)' }}
    >
      <span className={styles.ni}>⚡</span>
      <span className={styles.nn}>执行总裁</span>
      <span className={styles.badge}>{badgeText}</span>
    </div>
  );
}
