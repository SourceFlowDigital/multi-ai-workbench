/* ══════ API 客户端 ══════
 * 开发环境 Vite proxy 处理 /api → http://127.0.0.1:8002
 * 生产环境 Nginx 代理 /api → 127.0.0.1:8002（同源，base 为空）
 * v0.3 — 对齐后端 API schemas
 */

import type {
  HealthResponse,
  ModelsResponse,
  Role,
  RoleInput,
  Task,
  TaskCreateResponse,
  TaskInput,
  TaskListResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

class ApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`API Error ${status}: ${body}`);
    this.status = status;
    this.body = body;
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json();
}

export const api = {
  // ── 健康检查 ──
  getHealth: () => request<HealthResponse>('/api/health'),

  // ── 模型 ──
  getModels: () => request<ModelsResponse>('/api/models'),

  // ── 角色 ──
  getRoles: () => request<Role[]>('/api/roles'),
  createRole: (data: RoleInput) =>
    request<Role>('/api/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRole: (id: number, data: Partial<RoleInput>) =>
    request<Role>(`/api/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteRole: (id: number) =>
    request<void>(`/api/roles/${id}`, { method: 'DELETE' }),

  // ── 任务 ──
  createTask: (data: TaskInput) =>
    request<TaskCreateResponse>('/api/task', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTasks: (page = 1, size = 20) =>
    request<TaskListResponse>(`/api/tasks?page=${page}&size=${size}`),
  getTask: (id: number) => request<Task>(`/api/tasks/${id}`),
  reactivateTask: (id: number) =>
    request<TaskCreateResponse>(`/api/tasks/${id}/reactivate`, {
      method: 'POST',
      body: JSON.stringify({ api_keys: {} }),
    }),
};

export { ApiError };
