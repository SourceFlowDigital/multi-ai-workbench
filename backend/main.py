import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config.database import engine, Base, SessionLocal
from routers.task import router as task_router
from routers.roles import router as roles_router, ensure_preset_roles

load_dotenv()

# ── 日志 ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("workbench")

# ── 应用 ──
app = FastAPI(title="多AI协同决策工作台", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 路由 ──
app.include_router(roles_router, prefix="/api")
app.include_router(task_router, prefix="/api")

# ── 静态模型/角色配置（兼容旧接口）──
ROLES_PATH = Path(__file__).resolve().parent / "config" / "roles.json"


@app.get("/api/roles-static")
def get_roles_static():
    """静态角色（兼容旧前端，新前端建议用 GET /api/roles）"""
    with open(ROLES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/api/models")
def get_models():
    return {
        "models": [
            {"id": "claude", "name": "Claude", "provider": "Anthropic"},
            {"id": "deepseek", "name": "DeepSeek", "provider": "DeepSeek"},
            {"id": "gpt", "name": "GPT", "provider": "OpenAI"},
        ]
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "multi-ai-workbench"}


# ── 全局异常处理 ──
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"未捕获异常: {request.method} {request.url.path}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"服务器内部错误: {str(exc)}"},
    )


# ── 启动事件 ──
@app.on_event("startup")
def on_startup():
    """创建表 + 插入预设角色"""
    logger.info("正在创建数据库表...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ensure_preset_roles(db)
        logger.info("预设角色检查完成")
    finally:
        db.close()
    logger.info(f"服务启动完成，端口 {os.getenv('APP_PORT', '8002')}")
