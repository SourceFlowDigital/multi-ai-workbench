"""
多AI并行调度引擎

职责：
1. 接收任务描述 + 角色列表 + 模型列表
2. 并行调用多个 AI API（httpx async）
3. 收集所有响应
4. 由执行经理汇总输出
5. 写入数据库持久化
"""

import asyncio
import time
import logging
from datetime import datetime

import httpx

logger = logging.getLogger(__name__)

# ── AI Provider 配置 ──
PROVIDERS = {
    "claude": {
        "name": "Claude",
        "url": "https://api.anthropic.com/v1/messages",
        "model": "claude-sonnet-4-6",  # 可通过请求覆盖
        "version_header": "2023-06-01",
    },
    "deepseek": {
        "name": "DeepSeek",
        "url": "https://api.deepseek.com/chat/completions",
        "model": "deepseek-chat",
    },
    "gpt": {
        "name": "GPT",
        "url": "https://api.openai.com/v1/chat/completions",
        "model": "gpt-4o",
    },
}

# 执行经理汇总提示词
SUMMARY_PROMPT = """你是一位执行经理。以下是各部门针对任务「{title}」的分析结果。请做一份简明扼要的跨部门汇总：

{dept_results}

汇总要求：
1. 概述各部门核心观点（每个角色1-2句话）
2. 找出各部门观点中一致的地方（共识）
3. 指出观点分歧点和矛盾之处
4. 给出下一步行动建议（不超过3条）
5. 整体篇幅控制在500字以内

直接给出汇总内容，不需要额外说明。"""

EXEC_MANAGER_SYSTEM = "你是执行经理，负责将各部门的分析结果汇总为清晰的结构化简报。简明扼要，抓住要点。"


async def _call_claude(api_key: str, system_prompt: str, user_message: str, model: str | None = None) -> dict:
    """调用 Claude API"""
    model_id = model or PROVIDERS["claude"]["model"]
    headers = {
        "x-api-key": api_key,
        "anthropic-version": PROVIDERS["claude"]["version_header"],
        "content-type": "application/json",
    }
    body = {
        "model": model_id,
        "max_tokens": 4096,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_message}],
    }
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(PROVIDERS["claude"]["url"], headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()
        return {
            "output": data["content"][0]["text"],
            "token_usage": {
                "input": data["usage"]["input_tokens"],
                "output": data["usage"]["output_tokens"],
            },
        }


async def _call_deepseek(api_key: str, system_prompt: str, user_message: str, model: str | None = None) -> dict:
    """调用 DeepSeek API（OpenAI 兼容格式）"""
    model_id = model or PROVIDERS["deepseek"]["model"]
    headers = {
        "Authorization": f"Bearer {api_key}",
        "content-type": "application/json",
    }
    body = {
        "model": model_id,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "max_tokens": 4096,
    }
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(PROVIDERS["deepseek"]["url"], headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()
        return {
            "output": data["choices"][0]["message"]["content"],
            "token_usage": {
                "input": data["usage"]["prompt_tokens"],
                "output": data["usage"]["completion_tokens"],
            },
        }


async def _call_gpt(api_key: str, system_prompt: str, user_message: str, model: str | None = None) -> dict:
    """调用 OpenAI GPT API"""
    model_id = model or PROVIDERS["gpt"]["model"]
    headers = {
        "Authorization": f"Bearer {api_key}",
        "content-type": "application/json",
    }
    body = {
        "model": model_id,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "max_tokens": 4096,
    }
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(PROVIDERS["gpt"]["url"], headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()
        return {
            "output": data["choices"][0]["message"]["content"],
            "token_usage": {
                "input": data["usage"]["prompt_tokens"],
                "output": data["usage"]["completion_tokens"],
            },
        }


CALLERS = {
    "claude": _call_claude,
    "deepseek": _call_deepseek,
    "gpt": _call_gpt,
}


async def _call_single_ai(
    model_id: str,
    api_key: str,
    system_prompt: str,
    user_message: str,
) -> dict:
    """调用单个 AI，返回统一格式。失败时返回 error 标记"""
    caller = CALLERS.get(model_id)
    if not caller:
        return {"output": None, "error": f"不支持的模型: {model_id}", "duration_ms": 0, "token_usage": None}
    t0 = time.perf_counter()
    try:
        result = await caller(api_key, system_prompt, user_message)
        return {
            **result,
            "error": None,
            "duration_ms": int((time.perf_counter() - t0) * 1000),
        }
    except httpx.HTTPError as e:
        duration_ms = int((time.perf_counter() - t0) * 1000)
        logger.error(f"AI call failed [{model_id}]: {e}")
        return {"output": None, "error": f"API 调用失败: {e}", "duration_ms": duration_ms, "token_usage": None}


async def run_task(
    db,  # SQLAlchemy Session
    task_model,       # Task ORM instance
    role_records,     # list of Role ORM instances
    model_ids: list[str],
    api_keys: dict[str, str],  # {"claude": "sk-...", "deepseek": "sk-...", "gpt": "sk-..."}
    task_title: str,
    task_description: str,
) -> dict:
    """
    核心调度入口：
    1. 对每个 (role, model) 组合创建 TaskResult
    2. 并行调用所有 AI
    3. 各 TaskResult 写入 DB
    4. 调用执行经理汇总
    5. 更新 Task 状态和汇总结果
    """
    from models.task_result import TaskResult

    # ── 按角色构造提示词 ──
    def build_prompt(role) -> str:
        """为每个角色构造输入"""
        return f"任务：{task_title}\n\n详情：{task_description}\n\n请以{role.name}的身份，按照你的职责完成此任务的分析。"

    # ── 创建所有 TaskResult 记录 ──
    task_results = []
    for role in role_records:
        for mid in model_ids:
            if mid not in api_keys or not api_keys[mid]:
                continue  # 跳过无 API Key 的模型
            tr = TaskResult(
                task_id=task_model.id,
                role_id=role.id,
                role_name=role.name,
                model_id=mid,
                system_prompt=role.system_prompt,
                input_prompt=build_prompt(role),
                status="pending",
            )
            db.add(tr)
            task_results.append((tr, role, mid))
    db.commit()

    # ── 更新 Task 状态为 running ──
    task_model.status = "running"
    db.commit()

    # ── 并行调用 ──
    async def call_one(tr: TaskResult, role, mid: str):
        tr.status = "running"
        db.commit()
        result = await _call_single_ai(
            model_id=mid,
            api_key=api_keys[mid],
            system_prompt=role.system_prompt or f"你是{role.name}，{role.description}",
            user_message=build_prompt(role),
        )
        tr.output_content = result.get("output")
        tr.status = "error" if result.get("error") else "completed"
        tr.error_message = result.get("error")
        tr.duration_ms = result.get("duration_ms", 0)
        tr.token_usage = result.get("token_usage")
        db.commit()
        return tr

    await asyncio.gather(*[call_one(tr, role, mid) for tr, role, mid in task_results])

    # ── 执行经理汇总 ──
    summary = None
    exec_keys = [k for k in ["claude", "deepseek", "gpt"] if k in api_keys and api_keys[k]]
    if exec_keys:
        dept_text = "\n\n---\n\n".join([
            f"【{tr.role_name}·{tr.model_id}】\n{tr.output_content or '(无结果)'}"
            for tr, _, _ in task_results
        ])
        summary_msg = SUMMARY_PROMPT.format(title=task_title, dept_results=dept_text)
        summ_result = await _call_single_ai(
            model_id=exec_keys[0],
            api_key=api_keys[exec_keys[0]],
            system_prompt=EXEC_MANAGER_SYSTEM,
            user_message=summary_msg,
        )
        summary = summ_result.get("output")

    # ── 更新 Task 最终状态 ──
    error_count = sum(1 for tr, _, _ in task_results if tr.status == "error")
    total_count = len(task_results)
    t0 = task_model.created_at.timestamp() if task_model.created_at else time.time()

    if error_count == total_count:
        task_model.status = "error"
        task_model.error_message = f"全部 {total_count} 个调用均失败"
    elif error_count > 0:
        task_model.status = "completed"
        task_model.error_message = f"{error_count}/{total_count} 个调用失败"
    else:
        task_model.status = "completed"

    task_model.summary = summary
    task_model.duration_ms = int((time.time() - t0) * 1000)
    db.commit()

    # ── 构建返回结果 ──
    return {
        "task_id": task_model.id,
        "status": task_model.status,
        "duration_ms": task_model.duration_ms,
        "summary": summary,
        "results": [
            {
                "id": tr.id,
                "role_id": tr.role_id,
                "role_name": tr.role_name,
                "model_id": tr.model_id,
                "output_content": tr.output_content,
                "status": tr.status,
                "error_message": tr.error_message,
                "duration_ms": tr.duration_ms,
                "token_usage": tr.token_usage,
                "created_at": tr.created_at.isoformat(),
            }
            for tr, _, _ in task_results
        ],
    }
