import { useWorkbenchStore } from '../../store/workbenchStore';
import ReportBlock from './ReportBlock';
import ChatSection from './ChatSection';
import styles from './ResultPanel.module.css';

export default function ResultPanel() {
  const open = useWorkbenchStore((s) => s.resultPanelOpen);
  const taskRoles = useWorkbenchStore((s) => s.taskRoles);
  const activeRoleId = useWorkbenchStore((s) => s.activeResultRoleId);
  const currentTask = useWorkbenchStore((s) => s.currentTask);
  const closeResult = useWorkbenchStore((s) => s.closeResult);

  const activeRole = taskRoles.find((r) => r.role_id === activeRoleId);
  const icon = activeRole?.model_id === 'claude' ? '🧠' :
    activeRole?.model_id === 'deepseek' ? '🔍' : '🤖';

  return (
    <div className={`${styles.resultOverlay} ${open ? styles.on : ''}`}>
      <div className={styles.backdrop} onClick={closeResult} />
      <div className={styles.resultPanel} data-result-panel>
        <div className={styles.rpPad}>
          <div className={styles.rpHead}>
            <div>
              <span style={{ fontSize: '22px', verticalAlign: 'middle', marginRight: '8px' }}>
                {icon}
              </span>
              <h3 style={{ display: 'inline' }}>
                {activeRole?.role_name ?? '角色'} · {activeRole?.model_id?.toUpperCase() ?? ''} 分析报告
              </h3>
              <div className={styles.rpSub}>
                任务：{currentTask?.title ?? '—'}
              </div>
            </div>
            <button className={styles.rpClose} onClick={closeResult}>
              ✕
            </button>
          </div>

          {activeRole?.error_message ? (
            <ReportBlock
              type="conclusion"
              title="错误"
              content={activeRole.error_message}
            />
          ) : (
            <ReportBlock
              type="conclusion"
              title="分析结果"
              content={activeRole?.output_content ?? '（无结果）'}
            />
          )}

          <ChatSection />
        </div>
      </div>
    </div>
  );
}
