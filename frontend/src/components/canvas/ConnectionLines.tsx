import { useWorkbenchStore } from '../../store/workbenchStore';
import { defaultPaths } from '../../utils/connectionPaths';
import styles from './ConnectionLines.module.css';

export default function ConnectionLines() {
  const taskRoles = useWorkbenchStore((s) => s.taskRoles);
  const currentTask = useWorkbenchStore((s) => s.currentTask);

  // 无任务角色时不渲染任何连线
  if (taskRoles.length === 0) return null;

  const isActive = currentTask?.status === 'running' || currentTask?.status === 'completed';
  const paths = defaultPaths();

  return (
    <svg
      className={styles.connSvg}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="connGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9A84C" stopOpacity=".45" />
          <stop offset="100%" stopColor="#3d86d8" stopOpacity=".3" />
        </linearGradient>
        <linearGradient id="connGradActive" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9A84C" stopOpacity=".65" />
          <stop offset="100%" stopColor="#3d86d8" stopOpacity=".5" />
        </linearGradient>
      </defs>

      {/* 总裁 → 执行总裁 */}
      <line
        x1="50" y1="8" x2="50" y2="26"
        stroke={isActive ? 'url(#connGradActive)' : 'url(#connGrad)'}
      />

      {/* 执行总裁 → 各角色 */}
      {paths.slice(1).map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
