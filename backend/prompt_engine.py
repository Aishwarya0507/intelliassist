from schemas import GenerateRequest

BASE_RULES = (
    "Be accurate, clear, safe, and useful. Do not invent facts. "
    "When uncertain, say so. Respect the requested tone and format."
)

TEMPLATES = {
    "question": {
        "concise": "Answer the following question directly in no more than 4 sentences: {input}",
        "balanced": "Answer the following question clearly. Include the key explanation and one helpful example where relevant: {input}",
        "detailed": "Provide a structured, accurate answer to the question below. Explain essential context, key points, an example, and any important limitation: {input}",
    },
    "summarize": {
        "concise": "Summarize the following text in 3 concise sentences: {input}",
        "balanced": "Summarize the following text, preserving the main idea, key supporting points, and conclusion: {input}",
        "detailed": "Create a structured summary of the following text with: overview, key points, important details, and conclusion. Do not add information not present in the text: {input}",
    },
    "creative": {
        "concise": "Create a short original piece based on this request: {input}",
        "balanced": "Create an engaging and original piece based on this request. Use vivid but accessible language and a clear beginning, middle, and end: {input}",
        "detailed": "Create a polished, original piece based on the request below. Establish a strong setting, coherent structure, distinctive voice, and satisfying conclusion. Avoid clichés where possible: {input}",
    },
    "advice": {
        "concise": "Give 5 practical tips for this situation: {input}",
        "balanced": "Provide practical, realistic advice for the following situation. Explain why each recommendation helps: {input}",
        "detailed": "Analyze the situation below and provide a step-by-step action plan, priorities, possible obstacles, and ways to track progress. Keep the advice realistic and supportive: {input}",
    },
}


def build_prompt(req: GenerateRequest) -> str:
    body = TEMPLATES[req.function_type][req.prompt_style].format(input=req.user_input.strip())
    format_rule = "Use bullet points." if req.output_format == "bullets" else "Use clear paragraphs."
    tone_rule = f"Use a {req.tone} tone."
    return f"{BASE_RULES}\n{tone_rule} {format_rule}\n\n{body}"


def prompt_library():
    return TEMPLATES
