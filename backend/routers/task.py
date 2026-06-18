from fastapi import APIRouter

router = APIRouter()


@router.post("/task")
def create_task():
    """创建任务 → 后端并行调多个 AI → 返回结果（待实现）"""
    return {"message": "任务接口待实现", "task_id": None}
