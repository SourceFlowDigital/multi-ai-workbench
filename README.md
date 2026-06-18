# 多AI协同决策工作台

> 为用AI运转一人制公司的创业者，提供极简的多AI角色协同平台。

## 架构

```
frontend/   → 单文件 HTML（品牌金蓝拓扑，Prototype-E 定稿）
backend/    → FastAPI（main.py + routers/ + services/ + config/）
```

## 本地启动

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8002 --reload
```

## 端口

- 本地开发：`localhost:8002`
- 服务器部署：`47.116.2.115:8002`（待部署）

## 状态

⏸️ 后端开发中（project-gate 第五阶段已完成，代码骨架就绪）

## 相关文件

- 立项文档：`E:\多AI协同决策工作台\多AI协同决策工作台-项目立项文档.md`
- 原型迭代：`E:\多AI协同决策工作台\prototype-*.html`
