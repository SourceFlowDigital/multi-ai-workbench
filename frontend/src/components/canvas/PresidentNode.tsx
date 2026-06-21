import { useWorkbenchStore } from '../../store/workbenchStore';
import { getPresidentPosition } from '../../utils/nodeLayout';
import styles from './PresidentNode.module.css';

export default function PresidentNode() {
  const taskTitle = useWorkbenchStore((s) => s.taskTitle);

  const pos = getPresidentPosition();

  return (
    <div
      className={`${styles.cn} ${styles.prez}`}
      style={{ left: pos.x, top: pos.y, transform: 'translateX(-50%)' }}
    >
      <span className={styles.ni}>👤</span>
      <span className={styles.nn}>总裁</span>
      <span className={styles.tl}>
        {taskTitle || '待下达任务'}
      </span>
    </div>
  );
}
