import os
import httpx


def is_demo_mode() -> bool:
    return os.getenv("DEMO_MODE", "true").lower() == "true" or not os.getenv("OPENAI_API_KEY")


def generate_ai_response(
    prompt: str,
    function_type: str,
    user_input: str,
    provider: str | None = None,
    model: str | None = None,
    api_key: str | None = None
) -> tuple[str, bool]:
    active_provider = (provider or os.getenv("AI_PROVIDER", "openai")).lower()
    
    # Retrieve API key
    if active_provider == "gemini":
        active_key = api_key or os.getenv("GEMINI_API_KEY")
    else:
        active_key = api_key or os.getenv("OPENAI_API_KEY")
        
    if active_key:
        active_key = active_key.strip()

    # Determine if we should fallback to Demo Mode:
    # 1. If active_key is empty/None
    # 2. Or if DEMO_MODE env var is true AND no custom client key was passed
    demo_mode_env = os.getenv("DEMO_MODE", "true").lower() == "true"
    if not active_key or (demo_mode_env and not api_key):
        samples = {
            "question": f"Demo response: The answer to your question about '{user_input[:70]}' would be presented here with a clear explanation and relevant context.",
            "summarize": "Demo summary: The text's central idea is identified, the most important supporting points are condensed, and unnecessary repetition is removed.",
            "creative": "Demo creative response: A fresh idea unfolds with a clear setting, an engaging conflict, and a satisfying conclusion tailored to your request.",
            "advice": "Demo advice: Define the goal, break it into manageable steps, prioritize the highest-impact action, track progress, and adjust the plan based on results.",
        }
        return samples.get(function_type, "Demo response text."), True

    try:
        if active_provider == "gemini":
            # Temporary diagnostics: list available models for this key
            try:
                debug_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={active_key}"
                with httpx.Client(timeout=10.0) as client:
                    debug_res = client.get(debug_url)
                    with open("gemini_models_debug.txt", "w") as f:
                        f.write(debug_res.text)
            except Exception as de:
                with open("gemini_models_debug.txt", "w") as f:
                    f.write(f"Debug listing failed: {de}")

            active_model = model or os.getenv("GEMINI_MODEL", "gemini-flash-latest")
            
            # Map aliases to the exact model names supported by the API key
            if active_model == "gemini-1.5-flash":
                active_model = "gemini-flash-latest"
            elif active_model == "gemini-1.5-pro":
                active_model = "gemini-pro-latest"
                
            api_version = "v1beta"
            url = f"https://generativelanguage.googleapis.com/{api_version}/models/{active_model}:generateContent?key={active_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
            with httpx.Client(timeout=30.0) as client:
                response = client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    raise Exception(f"Gemini API returned error {response.status_code}: {response.text}")
                data = response.json()
                try:
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    return text, False
                except (KeyError, IndexError):
                    raise Exception(f"Failed to parse Gemini response: {data}")
        else:
            # Default to OpenAI
            active_model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {active_key}"
            }
            payload = {
                "model": active_model,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7
            }
            with httpx.Client(timeout=30.0) as client:
                response = client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    raise Exception(f"OpenAI API returned error {response.status_code}: {response.text}")
                data = response.json()
                try:
                    text = data["choices"][0]["message"]["content"]
                    return text, False
                except (KeyError, IndexError):
                    raise Exception(f"Failed to parse OpenAI response: {data}")
    except Exception as e:
        # Fall back to sandbox mode if using system default credentials and the request failed
        if not api_key:
            samples = {
                "question": (
                    f"Sandbox Mode (Default API key has exceeded its quota):\n\n"
                    f"The answer to your question about '{user_input[:80]}' would be shown here. "
                    f"To make real AI requests, please open 'AI Settings' in the sidebar and enter your own API key. "
                    f"You can get a free Gemini API key in 30 seconds from Google AI Studio."
                ),
                "summarize": (
                    f"Sandbox Mode (Default API key has exceeded its quota):\n\n"
                    f"A structured summary of your input text would be shown here. "
                    f"Please enter your own API key in the 'AI Settings' panel in the sidebar to enable live AI responses."
                ),
                "creative": (
                    f"Sandbox Mode (Default API key has exceeded its quota):\n\n"
                    f"Your requested creative story or poem about '{user_input[:80]}' would be generated here. "
                    f"Configure your own OpenAI or Gemini API key in the 'AI Settings' sidebar to experience live generation."
                ),
                "advice": (
                    f"Sandbox Mode (Default API key has exceeded its quota):\n\n"
                    f"5 structured tips and practical action steps for your situation would be generated here. "
                    f"Please configure a valid API key in the 'AI Settings' panel to get live AI responses."
                ),
            }
            return samples.get(function_type, "Demo response text."), True
        raise e
