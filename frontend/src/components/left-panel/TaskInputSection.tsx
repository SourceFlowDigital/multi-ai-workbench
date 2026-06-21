import { useWorkbenchStore } from '../../store/workbenchStore';
import SectionHeader from '../ui/SectionHeader';
import Chips from '../ui/Chips';
import styles from './TaskInputSection.module.css';

export default function TaskInputSection() {
  const taskTitle = useWorkbenchStore((s) => s.taskTitle);
  const taskDescription = useWorkbenchStore((s) => s.taskDescription);
  const selectedModels = useWorkbenchStore((s) => s.selectedModels);
  const selectedRoles = useWorkbenchStore((s) => s.selectedRoles);
  const models = useWorkbenchStore((s) => s.models);
  const roles = useWorkbenchStore((s) => s.roles);
  const currentTask = useWorkbenchStore((s) => s.currentTask);

  const setTaskTitle = useWorkbenchStore((s) => s.setTaskTitle);
  const setTaskDescription = useWorkbenchStore((s) => s.setTaskDescription);
  const toggleModel = useWorkbenchStore((s) => s.toggleModel);
  const toggleRole = useWorkbenchStore((s) => s.toggleRole);
  const executeTask = useWorkbenchStore((s) => s.executeTask);

  const isExecuting = currentTask?.status === 'running';

  const modelItems = models.map((m) => ({ id: m.id, label: m.name }));
  // Role IDs are number in backend, but Chips uses string — convert at boundary
  const roleItems = roles.map((r) => ({ id: String(r.id), label: r.name }));
  const selectedRoleStrs = selectedRoles.map(String);

  return (
    <div className={styles.section}>
      <SectionHeader icon="▸" title="总裁下达任务" hint="Task Input" />

      <div className={styles.field}>
        <label>任务标题</label>
        <input
          type="text"
          placeholder="例：评估宁夏光伏项目投资风险"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label>任务描述</label>
        <textarea
          placeholder="详细描述你的需求，执行总裁会自动规划最优角色链路…"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label>选择模型</label>
        <Chips
          items={modelItems}
          selected={selectedModels}
          onToggle={toggleModel}
        />
      </div>

      <div className={styles.field}>
        <label>选择角色</label>
        <Chips
          items={roleItems}
          selected={selectedRoleStrs}
          onToggle={(id) => toggleRole(Number(id))}
          variant="gold"
        />
      </div>

      <button
        className={styles.btnExec}
        onClick={executeTask}
        disabled={isExecuting}
      >
        {isExecuting ? '执行中…' : '▶ 执行任务'}
      </button>
    </div>
  );
}
