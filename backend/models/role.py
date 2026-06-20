from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, func

from config.database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(32), nullable=False, unique=True, comment="角色名称")
    description = Column(String(128), nullable=False, comment="角色职责简述")
    system_prompt = Column(Text, nullable=True, comment="自定义系统提示词，为空则用默认")
    is_active = Column(Boolean, nullable=False, default=True, comment="启用/禁用")
    is_preset = Column(Boolean, nullable=False, default=False, comment="是否为预置角色")
    sort_order = Column(Integer, default=0, comment="排序")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
