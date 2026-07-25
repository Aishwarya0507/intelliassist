from datetime import datetime
from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Interaction(Base):
    __tablename__ = "interactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    function_type: Mapped[str] = mapped_column(String(40), index=True)
    prompt_style: Mapped[str] = mapped_column(String(20), index=True)
    tone: Mapped[str] = mapped_column(String(20), default="neutral")
    output_format: Mapped[str] = mapped_column(String(20), default="paragraph")
    user_input: Mapped[str] = mapped_column(Text)
    prompt_used: Mapped[str] = mapped_column(Text)
    response: Mapped[str] = mapped_column(Text)
    helpful: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
