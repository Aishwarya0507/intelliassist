import os
from collections import Counter
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from ai_service import generate_ai_response
from database import Base, engine, get_db
from models import Interaction
from prompt_engine import build_prompt, prompt_library
from schemas import FeedbackRequest, GenerateRequest, GenerateResponse, InteractionOut

load_dotenv()
Base.metadata.create_all(bind=engine)

app = FastAPI(title="IntelliAssist API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "IntelliAssist API is running"}


@app.post("/api/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest, db: Session = Depends(get_db)):
    try:
        prompt = build_prompt(req)
        result, demo_mode = generate_ai_response(
            prompt,
            req.function_type,
            req.user_input,
            provider=req.provider,
            model=req.model,
            api_key=req.api_key
        )
        row = Interaction(
            function_type=req.function_type,
            prompt_style=req.prompt_style,
            tone=req.tone,
            output_format=req.output_format,
            user_input=req.user_input,
            prompt_used=prompt,
            response=result,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return GenerateResponse(interaction_id=row.id, response=result, prompt_used=prompt, demo_mode=demo_mode)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Generation failed: {exc}") from exc


@app.post("/api/feedback/{interaction_id}")
def save_feedback(interaction_id: int, payload: FeedbackRequest, db: Session = Depends(get_db)):
    row = db.get(Interaction, interaction_id)
    if not row:
        raise HTTPException(status_code=404, detail="Interaction not found")
    row.helpful = payload.helpful
    db.commit()
    return {"message": "Feedback saved"}


@app.get("/api/history", response_model=list[InteractionOut])
def history(limit: int = 10, db: Session = Depends(get_db)):
    return db.query(Interaction).order_by(Interaction.created_at.desc()).limit(min(limit, 50)).all()


@app.get("/api/prompts")
def prompts():
    return prompt_library()


@app.get("/api/analytics")
def analytics(db: Session = Depends(get_db)):
    rows = db.query(Interaction).all()
    feedback = [r.helpful for r in rows if r.helpful is not None]
    return {
        "total_requests": len(rows),
        "helpful": sum(1 for x in feedback if x),
        "not_helpful": sum(1 for x in feedback if not x),
        "helpful_rate": round((sum(1 for x in feedback if x) / len(feedback) * 100), 1) if feedback else 0,
        "function_usage": dict(Counter(r.function_type for r in rows)),
        "style_usage": dict(Counter(r.prompt_style for r in rows)),
    }
