import { useWorkbenchStore } from '../../store/workbenchStore';
import SectionHeader from '../ui/SectionHeader';
import styles from './RouterStatusSection.module.css';

/** 从 currentTask 和 taskRoles 推导路由状态 */
function useRouterDerived() {
  const currentTask = useWorkbenchStore((s) => s.currentTask);
  const taskRoles = useWorkbenchStore((s) => s.taskRoles);
  const roles = useWorkbenchStore((s) => s.roles);

  const isActive = taskRoles.length > 0;
  const statusLabel =
    currentTask?.status === 'running' ? '执行中' :
    currentTask?.status === 'completed' ? '已完成' :
    currentTask?.status === 'error' ? '异常' :
    isActive ? '执行中' : 'idle';

  const message =
    currentTask?.status === 'running' ? '任务已分发，各角色正在执行…' :
    currentTask?.status === 'completed' ? '任务执行完毕' :
    currentTask?.status === 'error' ? (currentTask.error_message ?? '任务执行异常') :
    '';

  const routePath = taskRoles.map((r) => r.role_name);

  return { isActive, statusLabel, message, routePath };
}

export default function RouterStatusSection() {
  const { isActive, message, routePath } = useRouterDerived();

  return (
    <div className={styles.section}>
      <SectionHeader icon="◎" title="执行总裁" hint="AI Router" />

      {isActive ? (
        <>
          <div className={styles.routerStatus}>
            <div className={styles.pulse} />
            <span className={styles.routerText}>
              {message || '正在分析任务，规划最优链路…'}
            </span>
          </div>

          {routePath.length > 0 && (
            <>
              <div className={styles.routerPath}>
                <span className={styles.mode}>PARALLEL</span>
                {routePath.map((role, i) => (
                  <span key={i}>
                    {i > 0 && <span className={styles.arrow}>→</span>}
                    <span className={styles.rn}>{role}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <p className={styles.idleText}>
          输入任务后，执行总裁会自动分析并规划最优角色链路
        </p>
      )}
    </div>
  );
}
