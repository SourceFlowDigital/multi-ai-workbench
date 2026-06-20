from datetime import datetime

from pydantic import BaseModel, Field


class RoleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=32, description="角色名称")
    description: str = Field(..., min_length=1, max_length=128, description="角色职责简述")
    system_prompt: str | None = Field(None, max_length=4096, description="自定义系统提示词")
    sort_order: int = Field(0, ge=0)


class RoleUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=32)
    description: str | None = Field(None, min_length=1, max_length=128)
    system_prompt: str | None = Field(None, max_length=4096)
    is_active: bool | None = None
    sort_order: int | None = Field(None, ge=0)


class RoleResponse(BaseModel):
    id: int
    name: str
    description: str
    system_prompt: str | None
    is_active: bool
    is_preset: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
