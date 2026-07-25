# IntelliAssist – Prompt Engineering AI Assistant

A professional internship submission project that demonstrates prompt engineering through four AI functions and three prompt styles.

## Functions
1. Answer Questions
2. Summarize Text
3. Generate Creative Content
4. Provide Advice

Each function supports Concise, Balanced, and Detailed prompt templates. The app also includes feedback collection, analytics, input validation, downloadable responses, and a no-key demo mode.

## Tech Stack
- React + TypeScript + Vite
- Python + FastAPI
- OpenAI Responses API
- SQLite + SQLAlchemy

## Run Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env  # Windows
# cp .env.example .env  # macOS/Linux
uvicorn main:app --reload
```

Demo mode works immediately. To enable real AI, add `OPENAI_API_KEY` to `.env` and set `DEMO_MODE=false`.

## Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Internship Requirements Covered
- At least three distinct functions: included four
- Three prompt variants per function
- User-friendly web interface
- User query input and clear responses
- Helpful/not-helpful feedback loop
- Stored feedback and analytics
- Documentation-ready project structure
