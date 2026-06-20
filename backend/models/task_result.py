from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import relationship

from config.database import Base


class TaskResult(Base):
    __tablename__ = "task_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, comment="所属任务")
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False, comment="执行角色")
    role_name = Column(String(32), nullable=False, comment="角色名称（冗余，防角色被删后无法展示）")
    model_id = Column(String(32), nullable=False, comment="模型标识 claude/deepseek/gpt")
    system_prompt = Column(Text, nullable=True, comment="实际使用的系统提示词")
    input_prompt = Column(Text, nullable=False, comment="发给AI的用户提示词")
    output_content = Column(Text, nullable=True, comment="AI返回结果")
    status = Column(
        Enum("pending", "running", "completed", "error", name="result_status"),
        nullable=False,
        default="pending",
    )
    error_message = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=True, comment="单次调用耗时")
    token_usage = Column(JSON, nullable=True, comment='{"input": 1200, "output": 800}')
    created_at = Column(DateTime, server_default=func.now())

    task = relationship("Task", back_populates="results")
    role = relationship("Role")
