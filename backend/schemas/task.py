from datetime import datetime

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=256)
    description: str = Field(..., min_length=1)
    role_ids: list[int] = Field(..., min_length=1, max_length=20, description="选中角色 ID 列表")
    model_ids: list[str] = Field(..., min_length=1, max_length=5, description="选中模型列表")
    api_keys: dict[str, str] = Field(..., description='{"claude": "sk-...", "deepseek": "sk-...", "gpt": "sk-..."}')


class ReactivateRequest(BaseModel):
    model_ids: list[str] | None = Field(None, min_length=1, max_length=5, description="可选覆盖模型配置")
    api_keys: dict[str, str] = Field(..., description="同 TaskCreate，前端从 localStorage 读取并传入")


class TaskResultItem(BaseModel):
    id: int
    role_id: int
    role_name: str
    model_id: str
    output_content: str | None
    status: str
    error_message: str | None
    duration_ms: int | None
    token_usage: dict | None
    created_at: datetime

    class Config:
        from_attributes = True


class TaskItem(BaseModel):
    """任务列表中的简要信息"""
    id: int
    title: str
    status: str
    role_count: int
    duration_ms: int | None
    created_at: datetime

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[TaskItem]


class TaskDetailResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    summary: str | None
    error_message: str | None
    duration_ms: int | None
    selected_roles: list = []
    selected_models: list = []
    reactivated_from: int | None
    results: list[TaskResultItem] = []
    created_at: datetime

    class Config:
        from_attributes = True


class TaskCreateResponse(BaseModel):
    task_id: int
    status: str
    duration_ms: int
    summary: str | None
    results: list[TaskResultItem]
