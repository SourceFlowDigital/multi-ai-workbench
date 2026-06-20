/**
 * 多AI协同决策工作台 · 前端应用逻辑
 *
 * 从 Prototype-E 改造：保留品牌金蓝拓扑视觉，接入真实后端 API
 */

const API_BASE = "/api";

// ── 状态 ──
let roles = [];
let models = [];
let currentTaskId = null;
let topologyNodes = [];

// ── localStorage 持久化 API Keys ──
function getApiKeys() {
    return {
        claude: localStorage.getItem("apikey_claude") || "",
        deepseek: localStorage.getItem("apikey_deepseek") || "",
        gpt: localStorage.getItem("apikey_gpt") || "",
    };
}

function saveApiKey(model, key) {
    localStorage.setItem(`apikey_${model}`, key.trim());
}

// ── API 调用 ──
async function fetchRoles() {
    const resp = await fetch(`${API_BASE}/roles`);
    if (!resp.ok) throw new Error("获取角色失败");
    roles = await resp.json();
    return roles;
}

async function fetchModels() {
    const resp = await fetch(`${API_BASE}/models`);
    if (!resp.ok) throw new Error("获取模型失败");
    const data = await resp.json();
    models = data.models;
    return models;
}

async function fetchTasks(page = 1) {
    const resp = await fetch(`${API_BASE}/tasks?page=${page}&size=20`);
    if (!resp.ok) throw new Error("获取任务列表失败");
    return resp.json();
}

async function fetchTaskDetail(taskId) {
    const resp = await fetch(`${API_BASE}/tasks/${taskId}`);
    if (!resp.ok) throw new Error("获取任务详情失败");
    return resp.json();
}

async function createTask(title, description, roleIds, modelIds) {
    const apiKeys = getApiKeys();
    const resp = await fetch(`${API_BASE}/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title,
            description,
            role_ids: roleIds,
            model_ids: modelIds,
            api_keys: apiKeys,
        }),
    });
    if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || "任务创建失败");
    }
    return resp.json();
}

async function reactivateTask(taskId, modelIds) {
    const apiKeys = getApiKeys();
    const resp = await fetch(`${API_BASE}/tasks/${taskId}/reactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model_ids: modelIds || null,
            api_keys: apiKeys,
        }),
    });
    if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || "重新激活失败");
    }
    return resp.json();
}

// ── UI 辅助 ──
function log(text) {
    const feed = document.getElementById("feed");
    const time = new Date().toLocaleTimeString();
    feed.innerHTML = `<p>[${time}] ${text}</p>` + feed.innerHTML;
}

function setStage(text) {
    document.getElementById("stage").textContent = text;
}

function setSummary(text, isError = false) {
    const el = document.getElementById("summary");
    el.textContent = text;
    el.classList.toggle("show", true);
    if (isError) el.style.color = "var(--red)";
    else el.style.color = "";
}

function setAlerts(text) {
    document.getElementById("alerts").textContent = text;
}

function setProgress(id, pct) {
    document.getElementById(id).style.width = pct + "%";
}

// ── 拓扑节点管理 ──
const POSITIONS = [
    "president", "ceo",
    "dept n0", "dept n1", "dept n2", "dept n3",
    "dept n4", "dept n5", "dept n6", "dept n7", "dept n8",
];

function initTopology() {
    const topo = document.getElementById("topology");
    topo.innerHTML = ""; // 清空静态节点
    // 保留连线
    ["gold-line l1", "gold-line l2", "blue-particle l3", "gold-line l4", "blue-particle l5"].forEach(cls => {
        const line = document.createElement("div");
        line.className = "line " + cls;
        topo.appendChild(line);
    });
}

function renderTopologyNodes(selectedRoles) {
    const topo = document.getElementById("topology");
    // 移除旧节点
    topo.querySelectorAll(".node").forEach(n => n.remove());

    // 总裁节点（固定）
    const prez = document.createElement("div");
    prez.className = "node idle president";
    prez.dataset.index = 0;
    prez.innerHTML = "<b>总裁</b><span>指挥层</span>";
    topo.appendChild(prez);

    // 执行经理节点（固定）
    const ceo = document.createElement("div");
    ceo.className = "node idle ceo";
    ceo.dataset.index = 1;
    ceo.innerHTML = "<b>执行经理</b><span>指挥层</span>";
    topo.appendChild(ceo);

    // 选中角色节点
    selectedRoles.forEach((role, i) => {
        const node = document.createElement("div");
        node.className = "node idle " + (POSITIONS[i + 2] || "dept n0");
        node.dataset.roleId = role.id;
        node.dataset.index = i + 2;
        node.innerHTML = `<b>${role.name}</b><span>并行分析节点</span>`;
        topo.appendChild(node);
    });

    topologyNodes = topo.querySelectorAll(".node");
}

function setAllNodes(status) {
    topologyNodes.forEach(n => {
        n.classList.remove("idle", "running", "done", "error");
        n.classList.add(status);
    });
}

function setNodeByRoleId(roleId, status) {
    const node = document.querySelector(`.node[data-role-id="${roleId}"]`);
    if (node) {
        node.classList.remove("idle", "running", "done", "error");
        node.classList.add(status);
    }
}

function setNodeByIndex(index, status) {
    const node = document.querySelector(`.node[data-index="${index}"]`);
    if (node) {
        node.classList.remove("idle", "running", "done", "error");
        node.classList.add(status);
    }
}

// ── 执行任务（核心流程）──
async function executeTask(title, description, roleIds, modelIds) {
    const allRoles = roles.filter(r => roleIds.includes(r.id));

    // 初始化拓扑
    renderTopologyNodes(allRoles);
    setAllNodes("idle");
    setStage("准备");
    setSummary("执行中：等待各部门回传。");
    setAlerts("暂无异常。");
    setProgress("p1", 0);
    setProgress("p2", 0);

    log("总裁任务已接收，执行经理开始拆解。");
    setNodeByIndex(1, "running");

    // 步骤1：拆解（前端动画）
    await sleep(300);
    setProgress("p1", 100);
    setStage("分发");
    setNodeByIndex(1, "done");
    log(`任务拆解完成，${allRoles.length} 个角色 × ${modelIds.length} 个模型进入并行执行。`);

    // 点亮所有角色节点
    allRoles.forEach(r => setNodeByRoleId(r.id, "running"));

    // 步骤2：调用后端
    try {
        const result = await createTask(title, description, roleIds, modelIds);
        currentTaskId = result.task_id;

        // 动画：逐个完成
        let completed = 0;
        const totalResults = result.results.length;
        for (const r of result.results) {
            await sleep(200 + Math.random() * 400);
            setNodeByRoleId(r.role_id, r.status === "error" ? "error" : "done");
            log(`${r.role_name}·${r.model_id} ${r.status === "error" ? "失败" : "已完成"} (${r.duration_ms}ms)`);
            completed++;
            if (r.status === "error") {
                setAlerts(`${r.role_name}·${r.model_id}: ${r.error_message}`);
            }
        }

        setProgress("p2", 100);
        setStage("汇总");

        // 汇总完成
        await sleep(500);
        setNodeByIndex(0, "done");
        setStage("完成");
        setSummary(result.summary || "(无汇总)");
        log("执行经理汇总完成。");

        // 显示 token 统计
        const totalTokens = result.results.reduce((sum, r) => {
            return sum + (r.token_usage ? (r.token_usage.input || 0) + (r.token_usage.output || 0) : 0);
        }, 0);
        if (totalTokens > 0) {
            setAlerts(`总 Token 消耗: ${totalTokens.toLocaleString()} | 耗时: ${(result.duration_ms / 1000).toFixed(1)}s`);
        }

        // 刷新历史列表
        loadHistory();
    } catch (err) {
        setAllNodes("error");
        setStage("错误");
        setSummary(err.message, true);
        setAlerts("执行失败，请检查 API Key 是否正确。");
        log(`错误: ${err.message}`);
    }
}

// ── 历史任务 ──
async function loadHistory() {
    try {
        const data = await fetchTasks(1);
        const list = document.getElementById("history-list");
        if (!list) return;
        if (data.items.length === 0) {
            list.innerHTML = '<div class="hist-item"><span>暂无历史任务</span></div>';
            return;
        }
        list.innerHTML = data.items.map(t => `
            <div class="hist-item" data-id="${t.id}" onclick="viewHistoryDetail(${t.id})"
                 style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;
                        border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer;transition:background .2s">
                <div style="flex:1;min-width:0">
                    <div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(t.title)}</div>
                    <div style="font-size:11px;color:var(--muted);margin-top:4px">
                        ${t.created_at ? new Date(t.created_at).toLocaleString() : ""} · ${t.role_count}角色 · ${t.status}
                    </div>
                </div>
                <button onclick="event.stopPropagation();reactivateFromHistory(${t.id})"
                        style="margin-left:10px;padding:6px 12px;border:1px solid var(--line);border-radius:14px;
                               background:rgba(255,255,255,.06);color:var(--gold);cursor:pointer;font-size:11px;
                               white-space:nowrap;transition:all .2s"
                        onmouseover="this.style.background='rgba(232,200,111,.15)'"
                        onmouseout="this.style.background='rgba(255,255,255,.06)'">
                    重新激活
                </button>
            </div>
        `).join("");
    } catch (err) {
        console.error("加载历史失败:", err);
    }
}

async function viewHistoryDetail(taskId) {
    try {
        const detail = await fetchTaskDetail(taskId);
        document.getElementById("task-input-title").value = detail.title;
        document.getElementById("task-input-desc").value = detail.description;
        document.getElementById("q").value = detail.description;

        // 选中历史任务的 role 和 model
        document.querySelectorAll("#role-checklist input").forEach(cb => {
            cb.checked = detail.selected_roles.includes(parseInt(cb.value));
        });
        document.querySelectorAll("#model-checklist input").forEach(cb => {
            cb.checked = detail.selected_models.includes(cb.value);
        });

        setSummary(detail.summary || "(无汇总)");
        setAlerts(`查看历史任务 #${taskId} · 状态: ${detail.status}`);
        log(`已加载历史任务: ${detail.title}`);
    } catch (err) {
        setAlerts("加载详情失败: " + err.message);
    }
}

async function reactivateFromHistory(taskId) {
    const modelCheckboxes = document.querySelectorAll("#model-checklist input:checked");
    const modelIds = Array.from(modelCheckboxes).map(cb => cb.value);
    if (modelIds.length === 0) {
        setAlerts("请至少选择一个模型");
        return;
    }
    const title = document.getElementById("task-input-title").value;
    const desc = document.getElementById("task-input-desc").value;

    setStage("重新激活");
    setAlerts("正在重新激活历史任务...");

    try {
        const result = await reactivateTask(taskId, modelIds);
        currentTaskId = result.task_id;
        // ... 显示结果（简化版，细节同 executeTask）
        setStage("完成");
        setSummary(result.summary || "(无汇总)");
        loadHistory();
    } catch (err) {
        setAlerts("重新激活失败: " + err.message);
    }
}

// ── 工具函数 ──
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// ── 初始化 ──
async function init() {
    // API Key 面板
    const keys = getApiKeys();
    document.getElementById("apikey-claude").value = keys.claude;
    document.getElementById("apikey-deepseek").value = keys.deepseek;
    document.getElementById("apikey-gpt").value = keys.gpt;

    document.querySelectorAll(".apikey-input").forEach(input => {
        input.addEventListener("change", () => {
            saveApiKey(input.dataset.model, input.value);
        });
    });

    // 加载角色和模型
    try {
        await fetchRoles();
        await fetchModels();
        renderRoleCheckboxes();
        renderModelCheckboxes();
        document.getElementById("count-roles").textContent = roles.length;
        document.getElementById("count-models").textContent = models.length;
        log("系统就绪，已加载 " + roles.length + " 个角色和 " + models.length + " 个模型。");
    } catch (err) {
        log("⚠️ 无法连接后端服务: " + err.message);
    }

    // 历史面板
    loadHistory();

    // 时钟
    setInterval(() => {
        document.getElementById("clock").textContent = new Date().toLocaleString();
    }, 1000);
    document.getElementById("clock").textContent = new Date().toLocaleString();

    // 发送按钮
    document.getElementById("start").addEventListener("click", async () => {
        const title = document.getElementById("task-input-title").value.trim();
        const desc = document.getElementById("task-input-desc").value.trim();
        if (!title || !desc) {
            setAlerts("请输入任务标题和详细描述");
            return;
        }

        const selectedRoles = Array.from(
            document.querySelectorAll("#role-checklist input:checked")
        ).map(cb => parseInt(cb.value));

        const selectedModels = Array.from(
            document.querySelectorAll("#model-checklist input:checked")
        ).map(cb => cb.value);

        if (selectedRoles.length === 0) {
            setAlerts("请至少选择一个角色");
            return;
        }
        if (selectedModels.length === 0) {
            setAlerts("请至少选择一个模型");
            return;
        }

        // 检查是否有对应 API Key
        const keys = getApiKeys();
        const missingKeys = selectedModels.filter(m => !keys[m]);
        if (missingKeys.length > 0) {
            setAlerts(`缺少 API Key: ${missingKeys.join(", ")}。请在左侧面板配置。`);
            return;
        }

        await executeTask(title, desc, selectedRoles, selectedModels);
    });

    // 初始化拓扑
    initTopology();
}

function renderRoleCheckboxes() {
    const container = document.getElementById("role-checklist");
    container.innerHTML = roles.map(r => `
        <label style="display:flex;align-items:center;padding:6px 0;cursor:pointer;font-size:12px;gap:6px">
            <input type="checkbox" value="${r.id}" ${r.is_preset ? "checked" : ""}>
            <span>${r.name}</span>
            <span style="color:var(--muted);font-size:10px">${r.description}</span>
        </label>
    `).join("");
}

function renderModelCheckboxes() {
    const container = document.getElementById("model-checklist");
    container.innerHTML = models.map(m => `
        <label style="display:flex;align-items:center;padding:4px 0;cursor:pointer;font-size:11px;gap:5px">
            <input type="checkbox" value="${m.id}" checked>
            <span style="color:var(--gold-light);font-weight:600">${m.name}</span>
            <span style="color:var(--muted)">${m.provider}</span>
        </label>
    `).join("");
}

document.addEventListener("DOMContentLoaded", init);
