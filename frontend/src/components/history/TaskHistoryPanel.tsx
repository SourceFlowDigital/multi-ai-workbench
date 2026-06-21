import { useEffect, useState } from 'react';
import { useWorkbenchStore } from '../../store/workbenchStore';
import type { Task } from '../../types';
import { api } from '../../api/client';
import styles from './TaskHistoryPanel.module.css';

const STATUS_LABELS: Record<string, string> = {
  pending: '待执行',
  running: '执行中',
  completed: '已完成',
  error: '异常',
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function TaskHistoryPanel({ open, onClose }: Props) {
  const taskHistory = useWorkbenchStore((s) => s.taskHistory);
  const fetchTasks = useWorkbenchStore((s) => s.fetchTasks);
  const showToast = useWorkbenchStore((s) => s.showToast);
  const [detail, setDetail] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTasks();
      setDetail(null);
    }
  }, [open, fetchTasks]);

  const handleViewDetail = async (id: number) => {
    setLoading(true);
    try {
      const task = await api.getTask(id);
      setDetail(task);
    } catch {
      showToast('加载任务详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async (id: number) => {
    showToast('重新激活功能开发中（需配置 API Key）');
    // TODO: 读取 API Keys 后调用 api.reactivateTask(id)
  };

  return (
    <div className={`${styles.overlay} ${open ? styles.on : ''}`}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.head}>
          <h2>任务历史</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        {detail ? (
          <div className={styles.detail}>
            <button className={styles.backBtn} onClick={() => setDetail(null)}>
              ← 返回列表
            </button>
            <h3>{detail.title}</h3>
            <div className={styles.meta}>
              <span className={`${styles.badge} ${detail.status}`}>
                {STATUS_LABELS[detail.status] ?? detail.status}
              </span>
              {detail.duration_ms != null && (
                <span>耗时 {(detail.duration_ms / 1000).toFixed(1)}s</span>
              )}
              <span>{new Date(detail.created_at).toLocaleString('zh-CN')}</span>
            </div>
            {detail.summary && (
              <div className={styles.summary}>
                <h4>执行经理汇总</h4>
                <p>{detail.summary}</p>
              </div>
            )}
            <h4>各部门分析结果</h4>
            {detail.results?.length > 0 ? (
              <div className={styles.results}>
                {detail.results.map((r) => (
                  <div key={r.id} className={styles.resultItem}>
                    <div className={styles.resultHead}>
                      <span>{r.role_name}</span>
                      <span className={styles.modelTag}>{r.model_id.toUpperCase()}</span>
                      <span className={`${styles.badge} ${r.status}`}>
                        {r.status === 'completed' ? '✓' : r.status === 'error' ? '✗' : '…'}
                      </span>
                    </div>
                    {r.output_content && (
                      <p className={styles.output}>{r.output_content.slice(0, 300)}{r.output_content.length > 300 ? '…' : ''}</p>
                    )}
                    {r.error_message && (
                      <p className={styles.errMsg}>{r.error_message}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>无分析结果</p>
            )}
          </div>
        ) : (
          <div className={styles.list}>
            {taskHistory.length === 0 ? (
              <div className={styles.empty}>
                <p>尚无任务记录</p>
                <p className={styles.sub}>提交第一个任务后，历史记录将显示在此处</p>
              </div>
            ) : (
              taskHistory.map((task) => (
                <div
                  key={task.id}
                  className={styles.item}
                  onClick={() => handleViewDetail(task.id)}
                >
                  <div className={styles.itemLeft}>
                    <div className={styles.itemTitle}>{task.title}</div>
                    <div className={styles.itemMeta}>
                      {task.selected_roles?.length > 0 && <span>{task.selected_roles.length} 角色</span>}
                      {task.duration_ms != null && (
                        <span>{(task.duration_ms / 1000).toFixed(1)}s</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.itemRight}>
                    <span className={`${styles.badge} ${task.status}`}>
                      {STATUS_LABELS[task.status] ?? task.status}
                    </span>
                    <span className={styles.date}>
                      {new Date(task.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {detail && (
          <div className={styles.footer}>
            <button
              className={styles.reactivateBtn}
              onClick={() => handleReactivate(detail.id)}
            >
              ↻ 重新激活
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
