# IntelliAssist – Prompt Engineering AI Assistant
## Comprehensive User Guide & PPT Outline

This user guide details the design, architecture, and usage of the **IntelliAssist Prompt Engineering AI Assistant**. It satisfies all project requirements defined in the internship assignment and serves as a direct source for your presentation slides (PPT).

---

## 1. Project Overview & Objective
IntelliAssist is a web-based prompt engineering studio built to showcase how structured templates, tones, and formatting instructions affect AI-generated outputs.

### Key Learning Objectives Covered:
*   **Prompt Structuring**: Applying systematic rules, formatting constraints, and stylistic tones.
*   **Multi-Functionality**: Implementing four distinct assistant tasks.
*   **Feedback Loops**: Storing user telemetry (Helpful / Not Helpful) in a local database and displaying it on a real-time analytics dashboard.
*   **API Agility**: Supporting both OpenAI and Google Gemini keys with client-side override storage.

---

## 2. Supported Functions & Prompt Design
Each function supports three prompt variants (Concise, Balanced, Detailed) combined with user-selected tones (Neutral, Formal, Casual, Creative) and formats (Paragraph, Bullets).

### Function 1: Answer Questions
*   **Concise**: `Answer the following question directly in no more than 4 sentences: {input}`
*   **Balanced**: `Answer the following question clearly. Include the key explanation and one helpful example where relevant: {input}`
*   **Detailed**: `Provide a structured, accurate answer to the question below. Explain essential context, key points, an example, and any important limitation: {input}`

### Function 2: Summarize Text
*   **Concise**: `Summarize the following text in 3 concise sentences: {input}`
*   **Balanced**: `Summarize the following text, preserving the main idea, key supporting points, and conclusion: {input}`
*   **Detailed**: `Create a structured summary of the following text with: overview, key points, important details, and conclusion. Do not add information not present in the text: {input}`

### Function 3: Creative Content
*   **Concise**: `Create a short original piece based on this request: {input}`
*   **Balanced**: `Create an engaging and original piece based on this request. Use vivid but accessible language and a clear beginning, middle, and end: {input}`
*   **Detailed**: `Create a polished, original piece based on the request below. Establish a strong setting, coherent structure, distinctive voice, and satisfying conclusion. Avoid clichés where possible: {input}`

### Function 4: Get Advice
*   **Concise**: `Give 5 practical tips for this situation: {input}`
*   **Balanced**: `Provide practical, realistic advice for the following situation. Explain why each recommendation helps: {input}`
*   **Detailed**: `Analyze the situation below and provide a step-by-step action plan, priorities, possible obstacles, and ways to track progress. Keep the advice realistic and supportive: {input}`

---

## 3. Technology Stack & Architecture
IntelliAssist separates concerns into frontend (presentation/state) and backend (API routing/database/AI services):

```
+--------------------------------------------------------+
|                      React Frontend                    |
|       (TypeScript + Vite + Recharts + CSS Grid)       |
+-------------------------------------------+------------+
                                            | POST /api/generate
                                            v
+--------------------------------------------------------+
|                     FastAPI Backend                    |
|            (Python + SQLAlchemy + Uvicorn)             |
+------------+------------------------------+------------+
             |                              |
             v                              v
+------------+------------+    +-----------+------------+
|      SQLite Database     |    |      AI Service Client |
|      (interactions.db)   |    | (Direct HTTP Rest API) |
+-------------------------+    +------------+-----------+
                                            |
                                            v
                                 +----------+----------+
                                 | OpenAI & Gemini API |
                                 +---------------------+
```

*   **Frontend**: React (v18), TypeScript, Vite, Recharts (for charts), Lucide React (for icons).
*   **Backend**: Python (3.10+), FastAPI (framework), Uvicorn (web server), SQLAlchemy (ORM), HTTPX (API client).
*   **Database**: SQLite (local database `intelliassist.db`).

---

## 4. How to Use the Application

### Step 1: Select a Function
Click on one of the four function cards in the **Studio Workspace** (e.g., *Answer Questions* or *Summarize Text*).

### Step 2: Configure Parameters
*   **Prompt Style**: Toggle between *Concise*, *Balanced*, or *Detailed* to see how the base prompt instruction structures the model's output constraints.
*   **Output Tone**: Pick from *Neutral*, *Formal*, *Casual*, or *Creative*.
*   **Output Format**: Select *Standard Paragraphs* or *Structured Bullet Points*.

### Step 3: View the structured Prompt (Optional)
Click **View Under-The-Hood Prompt** to see the exact structured text that gets sent to the AI model. This displays how the system combines parameters and base rules behind the scenes.

### Step 4: Generate & Interact
*   Type your input text in the textarea and click **Generate Response**.
*   Click **Copy** to save the output to your clipboard, or **Download** to save it as a text file.
*   Rate the output as **Helpful** or **Not Helpful** to feed the analytics loop.

### Step 5: Adjust AI Engine Settings
*   Open **AI Settings** in the sidebar.
*   Toggle between **OpenAI** or **Google Gemini**.
*   Enter your custom API Key (stored locally in browser storage) and choose a model (e.g., `gemini-1.5-flash` or `gpt-4o-mini`).

---

## 5. Developer Guide: How to Start the App

### 1. Start the Backend:
```bash
cd backend
# Activate the Python virtual environment
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Start the Frontend:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.
