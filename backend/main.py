import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.task import router as task_router

app = FastAPI(title="多AI协同决策工作台")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(task_router, prefix="/api")

ROLES_PATH = Path(__file__).resolve().parent / "config" / "roles.json"


@app.get("/api/roles")
def get_roles():
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
