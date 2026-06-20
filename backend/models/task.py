from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import relationship

from config.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(256), nullable=False, comment="任务标题")
    description = Column(Text, nullable=False, comment="任务详细描述")
    status = Column(
        Enum("pending", "running", "completed", "error", name="task_status"),
        nullable=False,
        default="pending",
        comment="任务状态",
    )
    selected_roles = Column(JSON, nullable=False, comment="选中的角色ID列表")
    selected_models = Column(JSON, nullable=False, comment="选中的模型ID列表")
    summary = Column(Text, nullable=True, comment="执行经理汇总输出")
    error_message = Column(Text, nullable=True, comment="异常信息")
    duration_ms = Column(Integer, nullable=True, comment="总耗时（毫秒）")
    reactivated_from = Column(
        Integer,
        ForeignKey("tasks.id", ondelete="SET NULL"),
        nullable=True,
        comment="从哪个任务重新激活",
    )
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    results = relationship("TaskResult", back_populates="task", cascade="all, delete-orphan")
