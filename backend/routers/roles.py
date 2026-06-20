from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from config.database import get_db
from models.role import Role
from schemas.role import RoleCreate, RoleUpdate, RoleResponse

router = APIRouter(prefix="/roles", tags=["角色管理"])

# ── 预设角色（首次初始化时插入） ──
PRESET_ROLES = [
    {"name": "执行经理", "description": "任务分发与汇总", "sort_order": 1,
     "system_prompt": "你是执行经理。你的职责是：1) 理解总裁下达的任务 2) 将任务拆解分发给各职能部门 3) 收集各部门回传结果并简明扼要地汇总。你不需要做最终决策，只做清晰的结构化汇报。"},
    {"name": "研究员", "description": "深度研究与资料收集", "sort_order": 2,
     "system_prompt": "你是一位资深研究员。请深入收集和研究相关信息，提供全面、有据可查的分析。注重数据来源的可靠性和论证的严谨性。"},
    {"name": "数据分析师", "description": "数据分析与洞察挖掘", "sort_order": 3,
     "system_prompt": "你是一位数据分析师。请从数据角度分析问题，关注关键指标、趋势变化和数据背后的洞察。提供可量化的分析结论。"},
    {"name": "策略师", "description": "商业策略与决策建议", "sort_order": 4,
     "system_prompt": "你是一位商业策略师。请从战略高度分析问题，提供可行的商业策略建议。考虑竞争格局、资源投入产出、和长期可持续性。"},
    {"name": "技术顾问", "description": "技术方案评估与代码审查", "sort_order": 5,
     "system_prompt": "你是一位技术顾问。请评估技术方案的可行性、实现复杂度和潜在风险。提供技术选型建议和实现路径。"},
    {"name": "文案策划", "description": "文案撰写与内容编辑", "sort_order": 6,
     "system_prompt": "你是一位文案策划。请从表达和传播角度优化内容，确保文字清晰、有说服力、符合目标受众的阅读习惯。"},
    {"name": "合规官", "description": "政策合规与风险把控", "sort_order": 7,
     "system_prompt": "你是一位合规官。请识别潜在的政策风险、法律风险和合规问题。确保方案在法律法规框架内安全运行。"},
    {"name": "毒舌审查员", "description": "魔鬼辩护人，找出方案漏洞", "sort_order": 8,
     "system_prompt": "你是一位毒舌审查员。你的唯一职责是找出方案中的漏洞、盲点和不合理之处。不要夸奖，不要鼓励，只找问题。"},
    {"name": "财务分析师", "description": "财务模型与投资回报分析", "sort_order": 9,
     "system_prompt": "你是一位财务分析师。请从财务角度评估方案，关注成本结构、投资回报率、现金流和财务风险。"},
]


def ensure_preset_roles(db: Session):
    """确保预设角色已插入数据库（幂等）"""
    existing = db.query(Role).filter(Role.is_preset == True).count()
    if existing == 0:
        for r in PRESET_ROLES:
            db.add(Role(**r, is_preset=True))
        db.commit()


@router.get("", response_model=list[RoleResponse])
def list_roles(db: Session = Depends(get_db)):
    """获取所有活跃角色（默认角色 + 自定义角色）"""
    return db.query(Role).filter(Role.is_active == True).order_by(Role.sort_order).all()


@router.post("", response_model=RoleResponse, status_code=201)
def create_role(payload: RoleCreate, db: Session = Depends(get_db)):
    """新增自定义角色"""
    existing = db.query(Role).filter(Role.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"角色「{payload.name}」已存在")
    role = Role(**payload.model_dump(), is_active=True, is_preset=False)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.put("/{role_id}", response_model=RoleResponse)
def update_role(role_id: int, payload: RoleUpdate, db: Session = Depends(get_db)):
    """修改自定义角色（预设角色不可修改名称）"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(role, key, value)
    db.commit()
    db.refresh(role)
    return role


@router.delete("/{role_id}", status_code=204)
def delete_role(role_id: int, db: Session = Depends(get_db)):
    """删除自定义角色（预设角色不可删，被引用的角色不可删）"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="角色不存在")
    if role.is_preset:
        raise HTTPException(status_code=403, detail="预设角色不可删除")
    db.delete(role)
    db.commit()
