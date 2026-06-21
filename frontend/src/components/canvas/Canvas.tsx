import { useWorkbenchStore } from '../../store/workbenchStore';
import CanvasLogo from './CanvasLogo';
import CanvasGrid from './CanvasGrid';
import ConnectionLines from './ConnectionLines';
import PresidentNode from './PresidentNode';
import RouterNode from './RouterNode';
import RoleRow from './RoleRow';
import ZoomControls from './ZoomControls';
import styles from './Canvas.module.css';

export default function Canvas() {
  const zoom = useWorkbenchStore((s) => s.canvasZoom);
  const taskRoles = useWorkbenchStore((s) => s.taskRoles);
  const hasRoles = taskRoles.length > 0;

  return (
    <div className={styles.canvas} data-canvas>
      <CanvasLogo />
      <CanvasGrid />
      <ConnectionLines />

      {/* 缩放容器 */}
      <div
        className={styles.nodes}
        style={{ transform: `scale(${zoom})`, transformOrigin: '50% 50%' }}
      >
        <PresidentNode />
        <RouterNode />
        <RoleRow />
      </div>

      {/* 空状态 —— 仅无任务角色时显示 */}
      {!hasRoles && (
        <div className={styles.emptyState}>
          <div className={styles.ebig}>⚡</div>
          <div className={styles.et}>输入任务，启动多AI协同</div>
          <div className={styles.es}>执行总裁将自动规划最优角色链路</div>
        </div>
      )}

      <div className={styles.canvasLabel}>协同画布</div>
      <ZoomControls />
    </div>
  );
}
