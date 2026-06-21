/* ══════ Zustand 全局状态 ══════
 * v0.3 — 对齐后端 API
 */

import { create } from 'zustand';
import type { ApiKeys, ChatMessage, Model, Role, Task, TaskResultItem, TaskRole } from '../types';
import { api } from '../api/client';

/** 从 localStorage 读取 API Keys */
function loadApiKeys(): ApiKeys {
  try {
    const raw = localStorage.getItem('workbench-api-keys');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** 保存 API Keys 到 localStorage */
function saveApiKeys(keys: ApiKeys) {
  try {
    localStorage.setItem('workbench-api-keys', JSON.stringify(keys));
  } catch { /* ignore */ }
}

/** TaskResultItem → TaskRole 映射（画布节点用） */
function toTaskRole(r: TaskResultItem): TaskRole {
  const statusMap: Record<string, TaskRole['status']> = {
    pending: 'idle',
    running: 'running',
    completed: 'done',
    error: 'failed',
  };
  return {
    role_id: r.role_id,
    role_name: r.role_name,
    model_id: r.model_id,
    status: statusMap[r.status] ?? 'idle',
    output_content: r.output_content,
    error_message: r.error_message,
    duration_ms: r.duration_ms,
  };
}

// ── State Shape ──
export interface WorkbenchState {
  // Task Input Form
  taskTitle: string;
  taskDescription: string;
  selectedModels: string[];
  selectedRoles: number[];

  // API Keys
  apiKeys: ApiKeys;

  // Data from API
  models: Model[];
  roles: Role[];
  currentTask: Task | null;
  taskHistory: Task[];

  // Canvas
  taskRoles: TaskRole[];

  // Result Panel
  resultPanelOpen: boolean;
  activeResultRoleId: number | null;

  // Chat
  chatMessages: Record<number, ChatMessage[]>;

  // Zoom
  canvasZoom: number;

  // Guide
  guideSeen: boolean;
  guideOpen: boolean;

  // Toast
  toastMessage: string | null;

  // Polling
  pollingTimer: ReturnType<typeof setInterval> | null;
}

export interface WorkbenchActions {
  // Form actions
  setTaskTitle: (t: string) => void;
  setTaskDescription: (d: string) => void;
  toggleModel: (id: string) => void;
  toggleRole: (id: number) => void;

  // API Keys
  setApiKey: (model: keyof ApiKeys, key: string) => void;
  clearApiKeys: () => void;

  // API actions
  fetchModels: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  executeTask: () => Promise<void>;
  fetchTask: (id: number) => Promise<void>;
  fetchTasks: () => Promise<void>;

  // UI actions
  openResult: (roleId: number) => void;
  closeResult: () => void;
  sendChat: (roleId: number, message: string) => void;
  setZoom: (z: number) => void;
  dismissGuide: () => void;
  showGuide: () => void;
  showToast: (msg: string) => void;
  clearToast: () => void;

  // Internal
  _startPolling: (taskId: number) => void;
  _stopPolling: () => void;
}

export type WorkbenchStore = WorkbenchState & WorkbenchActions;

export const useWorkbenchStore = create<WorkbenchStore>((set, get) => ({
  // ── Initial State ──
  taskTitle: '',
  taskDescription: '',
  selectedModels: [],
  selectedRoles: [],
  apiKeys: loadApiKeys(),
  models: [],
  roles: [],
  currentTask: null,
  taskHistory: [],
  taskRoles: [],
  resultPanelOpen: false,
  activeResultRoleId: null,
  chatMessages: {},
  canvasZoom: 1,
  guideSeen: false,
  guideOpen: false,
  toastMessage: null,
  pollingTimer: null,

  // ── Form Actions ──
  setTaskTitle: (t) => set({ taskTitle: t }),
  setTaskDescription: (d) => set({ taskDescription: d }),
  toggleModel: (id) =>
    set((s) => ({
      selectedModels: s.selectedModels.includes(id)
        ? s.selectedModels.filter((m) => m !== id)
        : [...s.selectedModels, id],
    })),
  toggleRole: (id) =>
    set((s) => ({
      selectedRoles: s.selectedRoles.includes(id)
        ? s.selectedRoles.filter((r) => r !== id)
        : [...s.selectedRoles, id],
    })),

  // ── API Keys ──
  setApiKey: (model, key) => {
    const next = { ...get().apiKeys, [model]: key };
    if (!key) delete next[model];
    saveApiKeys(next);
    set({ apiKeys: next });
  },
  clearApiKeys: () => {
    saveApiKeys({});
    set({ apiKeys: {} });
  },

  // ── API Actions ──
  fetchModels: async () => {
    try {
      const res = await api.getModels();
      set({ models: res.models ?? [] });
    } catch (e) {
      console.error('Failed to fetch models:', e);
    }
  },

  fetchRoles: async () => {
    try {
      const roles = await api.getRoles();
      set({ roles: roles ?? [] });
    } catch (e) {
      console.error('Failed to fetch roles:', e);
    }
  },

  executeTask: async () => {
    const s = get();
    if (!s.taskTitle.trim()) {
      set({ toastMessage: '请输入任务标题' });
      return;
    }
    if (s.selectedRoles.length === 0) {
      set({ toastMessage: '请至少选择一个角色' });
      return;
    }
    const keys = s.apiKeys;
    const hasKey = keys.claude || keys.deepseek || keys.gpt;
    if (!hasKey) {
      set({ toastMessage: '请至少配置一个 API Key' });
      return;
    }

    // 过滤：只发送有 key 的模型
    const activeModels = s.selectedModels.filter((m) => keys[m as keyof ApiKeys]);
    if (activeModels.length === 0) {
      set({ toastMessage: '所选模型均未配置 API Key' });
      return;
    }

    try {
      set({ toastMessage: '任务已提交，正在执行…' });
      const result = await api.createTask({
        title: s.taskTitle,
        description: s.taskDescription,
        role_ids: s.selectedRoles,
        model_ids: activeModels,
        api_keys: keys,
      });

      const taskRoles = result.results.map(toTaskRole);

      set({
        currentTask: {
          id: result.task_id,
          title: s.taskTitle,
          description: s.taskDescription,
          status: result.status as Task['status'],
          summary: result.summary,
          error_message: null,
          duration_ms: result.duration_ms,
          selected_roles: s.selectedRoles,
          selected_models: activeModels,
          reactivated_from: null,
          results: result.results,
          created_at: new Date().toISOString(),
        },
        taskRoles,
        resultPanelOpen: false,
        activeResultRoleId: null,
      });

      // 同步完成，停止等候
      if (result.status === 'completed' || result.status === 'error') {
        set({ toastMessage: result.status === 'completed' ? '任务执行完毕' : `任务执行异常: ${result.summary ?? '未知错误'}` });
      }
    } catch (e) {
      console.error('Execute task failed:', e);
      const msg = e instanceof Error ? e.message : '任务提交失败';
      set({ toastMessage: msg });
    }
  },

  fetchTask: async (id) => {
    try {
      const task = await api.getTask(id);
      set({
        currentTask: task,
        taskRoles: task.results?.map(toTaskRole) ?? [],
      });
    } catch (e) {
      console.error('Failed to fetch task:', e);
    }
  },

  fetchTasks: async () => {
    try {
      const res = await api.getTasks(1, 50);
      set({
        taskHistory: res.items.map((item) => ({
          id: item.id,
          title: item.title,
          status: item.status,
          summary: null,
          error_message: null,
          duration_ms: item.duration_ms,
          selected_roles: [],
          selected_models: [],
          reactivated_from: null,
          results: [],
          created_at: item.created_at,
          description: '',
        })),
      });
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
    }
  },

  // ── UI Actions ──
  openResult: (roleId) => {
    set({ resultPanelOpen: true, activeResultRoleId: roleId });
  },

  closeResult: () => set({ resultPanelOpen: false, activeResultRoleId: null }),

  sendChat: (roleId, message) => {
    const s = get();
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    const existing = s.chatMessages[roleId] ?? [];
    set({
      chatMessages: {
        ...s.chatMessages,
        [roleId]: [...existing, msg],
      },
    });
  },

  setZoom: (z) => set({ canvasZoom: Math.max(0.3, Math.min(2, z)) }),

  dismissGuide: () => {
    localStorage.setItem('workbench-guide-seen', 'true');
    set({ guideSeen: true, guideOpen: false });
  },

  showGuide: () => set({ guideOpen: true }),

  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => set({ toastMessage: null }), 4000);
  },

  clearToast: () => set({ toastMessage: null }),

  // ── Polling（用于异步任务，当前任务同步返回故保留兼容）──
  _startPolling: (taskId) => {
    const s = get();
    if (s.pollingTimer) clearInterval(s.pollingTimer);

    const timer = setInterval(async () => {
      try {
        const task = await api.getTask(taskId);
        const taskRoles = task.results?.map(toTaskRole) ?? [];
        set({ currentTask: task, taskRoles });

        const allDone = taskRoles.every(
          (r) => r.status === 'done' || r.status === 'failed',
        );
        if (allDone || task.status === 'completed' || task.status === 'error') {
          set({ toastMessage: task.status === 'completed' ? '任务执行完毕' : '任务执行异常' });
          get()._stopPolling();
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 2000);

    set({ pollingTimer: timer });
  },

  _stopPolling: () => {
    const s = get();
    if (s.pollingTimer) {
      clearInterval(s.pollingTimer);
      set({ pollingTimer: null });
    }
  },
}));
