import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session

from config.database import get_db
from models.role import Role
from models.task import Task
from models.task_result import TaskResult
from schemas.task import (
    TaskCreate,
    TaskCreateResponse,
    TaskDetailResponse,
    TaskItem,
    TaskListResponse,
    ReactivateRequest,
)
from services.ai_scheduler import run_task

router = APIRouter(prefix="", tags=["任务管理"])
logger = logging.getLogger(__name__)


@router.post("/task", response_model=TaskCreateResponse)
async def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    """创建任务并并行执行 —— 同步等待返回"""

    # ── 校验角色 ──
    roles = db.query(Role).filter(Role.id.in_(payload.role_ids), Role.is_active == True).all()
    found_ids = {r.id for r in roles}
    missing = set(payload.role_ids) - found_ids
    if missing:
        raise HTTPException(status_code=400, detail=f"角色不存在或已禁用: {missing}")

    # ── 校验模型与 API Key ──
    valid_models = {"claude", "deepseek", "gpt"}
    invalid = set(payload.model_ids) - valid_models
    if invalid:
        raise HTTPException(status_code=400, detail=f"不支持的模型: {invalid}")

    usable_models = [m for m in payload.model_ids if m in payload.api_keys and payload.api_keys[m]]
    if not usable_models:
        raise HTTPException(status_code=400, detail="至少需要一个有效的 API Key")

    # ── 创建 Task 记录 ──
    task = Task(
        title=payload.title,
        description=payload.description,
        selected_roles=payload.role_ids,
        selected_models=payload.model_ids,
        status="pending",
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # ── 执行调度 ──
    result = await run_task(
        db=db,
        task_model=task,
        role_records=roles,
        model_ids=usable_models,
        api_keys=payload.api_keys,
        task_title=payload.title,
        task_description=payload.description,
    )
    return result


@router.get("/tasks", response_model=TaskListResponse)
def list_tasks(page: int = 1, size: int = 20, db: Session = Depends(get_db)):
    """任务历史列表（按创建时间倒序）"""
    total = db.query(Task).count()
    tasks = (
        db.query(Task)
        .order_by(desc(Task.created_at))
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    items = []
    for t in tasks:
        items.append(TaskItem(
            id=t.id,
            title=t.title,
            status=t.status,
            role_count=len(t.selected_roles) if t.selected_roles else 0,
            duration_ms=t.duration_ms,
            created_at=t.created_at,
        ))
    return TaskListResponse(total=total, page=page, size=size, items=items)


@router.get("/tasks/{task_id}", response_model=TaskDetailResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """任务详情（含所有角色执行结果）"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    results = db.query(TaskResult).filter(TaskResult.task_id == task_id).all()
    return TaskDetailResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        status=task.status,
        summary=task.summary,
        error_message=task.error_message,
        duration_ms=task.duration_ms,
        selected_roles=task.selected_roles or [],
        selected_models=task.selected_models or [],
        reactivated_from=task.reactivated_from,
        results=results,
        created_at=task.created_at,
    )


@router.post("/tasks/{task_id}/reactivate", response_model=TaskCreateResponse)
async def reactivate_task(task_id: int, payload: ReactivateRequest, db: Session = Depends(get_db)):
    """重新激活历史任务 —— 创建新 Task 复用旧参数"""
    original = db.query(Task).filter(Task.id == task_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="原任务不存在")

    model_ids = payload.model_ids or original.selected_models or []
    role_ids = original.selected_roles or []

    roles = db.query(Role).filter(Role.id.in_(role_ids), Role.is_active == True).all()
    if not roles:
        raise HTTPException(status_code=400, detail="原任务的角色已全部失效")

    usable_models = [m for m in model_ids if m in payload.api_keys and payload.api_keys[m]]
    if not usable_models:
        raise HTTPException(status_code=400, detail="至少需要一个有效的 API Key")

    new_task = Task(
        title=original.title,
        description=original.description,
        selected_roles=role_ids,
        selected_models=model_ids,
        reactivated_from=task_id,
        status="pending",
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    result = await run_task(
        db=db,
        task_model=new_task,
        role_records=roles,
        model_ids=usable_models,
        api_keys=payload.api_keys,
        task_title=new_task.title,
        task_description=new_task.description,
    )
    return result
