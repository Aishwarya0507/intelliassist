from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field

FunctionType = Literal["question", "summarize", "creative", "advice"]
PromptStyle = Literal["concise", "balanced", "detailed"]
Tone = Literal["neutral", "formal", "casual", "creative"]
OutputFormat = Literal["paragraph", "bullets"]


class GenerateRequest(BaseModel):
    function_type: FunctionType
    prompt_style: PromptStyle
    tone: Tone = "neutral"
    output_format: OutputFormat = "paragraph"
    user_input: str = Field(min_length=3, max_length=12000)
    provider: str | None = None
    model: str | None = None
    api_key: str | None = None


class GenerateResponse(BaseModel):
    interaction_id: int
    response: str
    prompt_used: str
    demo_mode: bool


class FeedbackRequest(BaseModel):
    helpful: bool


class InteractionOut(BaseModel):
    id: int
    function_type: str
    prompt_style: str
    user_input: str
    response: str
    helpful: bool | None
    created_at: datetime

    model_config = {"from_attributes": True}
