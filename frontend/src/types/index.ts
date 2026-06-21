/* ══════ 多AI协同决策工作台 · 类型定义 ══════
 * v0.3 — 对齐后端 API schemas（2026-06-21）
 */

// ── 模型 ──
export interface Model {
  id: string;
  name: string;
  provider: string;
}

// ── 角色（对齐后端 RoleResponse）──
export interface Role {
  id: number;
  name: string;
  description: string;
  system_prompt: string | null;
  is_active: boolean;
  is_preset: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RoleInput {
  name: string;
  description: string;
  system_prompt?: string;
  sort_order?: number;
}

// ── API Keys ──
export interface ApiKeys {
  claude?: string;
  deepseek?: string;
  gpt?: string;
}

// ── 任务 ──
export interface TaskInput {
  title: string;
  description: string;
  role_ids: number[];
  model_ids: string[];
  api_keys: ApiKeys;
}

export interface TaskResultItem {
  id: number;
  role_id: number;
  role_name: string;
  model_id: string;
  output_content: string | null;
  status: 'pending' | 'running' | 'completed' | 'error';
  error_message: string | null;
  duration_ms: number | null;
  token_usage: { input: number; output: number } | null;
  created_at: string;
}

export interface TaskCreateResponse {
  task_id: number;
  status: string;
  duration_ms: number;
  summary: string | null;
  results: TaskResultItem[];
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  summary: string | null;
  error_message: string | null;
  duration_ms: number | null;
  selected_roles: number[];
  selected_models: string[];
  reactivated_from: number | null;
  results: TaskResultItem[];
  created_at: string;
}

export interface TaskSummary {
  id: number;
  title: string;
  status: TaskStatus;
  role_count: number;
  duration_ms: number | null;
  created_at: string;
}

export interface TaskListResponse {
  total: number;
  page: number;
  size: number;
  items: TaskSummary[];
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'error';

// ── 画布角色节点（前端专用，从 TaskResultItem 映射）──
export interface TaskRole {
  role_id: number;
  role_name: string;
  model_id: string;
  status: 'idle' | 'running' | 'done' | 'failed';
  output_content?: string | null;
  error_message?: string | null;
  duration_ms?: number | null;
}

// ── 聊天消息 ──
export interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
}

// ── API 通用响应 ──
export interface HealthResponse {
  status: string;
  service: string;
}

export interface ModelsResponse {
  models: Model[];
}
