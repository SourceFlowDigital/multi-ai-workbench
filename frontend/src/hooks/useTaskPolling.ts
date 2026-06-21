import { useEffect, useRef } from 'react';
import { useWorkbenchStore } from '../store/workbenchStore';

/**
 * 任务轮询 hook —— 组件挂载时启动，卸载时清理
 */
export function useTaskPolling(taskId: number | null) {
  const fetchTask = useWorkbenchStore((s) => s.fetchTask);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!taskId) return;

    // 立即取一次
    fetchTask(taskId);

    // 每 2 秒轮询
    intervalRef.current = setInterval(() => {
      fetchTask(taskId);
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [taskId, fetchTask]);
}
