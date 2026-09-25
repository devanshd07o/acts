import json
import os
from django.conf import settings
from typing import Dict, Any, Optional

DEPARTMENT_MAPPING = {
    "plumbing": "PLUMBING",
    "water": "PLUMBING",
    "electrical": "ELECTRICAL",
    "lighting": "ELECTRICAL",
    "sanitation": "SANITATION",
    "garbage": "SANITATION",
    "civil": "CIVIL",
    "road": "CIVIL",
    "pothole": "CIVIL",
    "safety": "SAFETY",
    "fire": "SAFETY",
    "general": "GENERAL",
}

def map_to_department(category_or_dept: str) -> str:
    cleaned = category_or_dept.lower().strip()
    for key, val in DEPARTMENT_MAPPING.items():
        if key in cleaned:
            return val
    return "GENERAL"

def analyze_civic_issue(raw_text: str, image_path: Optional[str] = None) -> Dict[str, Any]:
    """
    AI Triage Pipeline:
    Processes plain-text complaint + optional photo using Gemini Multimodal LLM.
    Identifies issue title, department, severity (1-10), urgency, and resolution recommendation.
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
    
    # Fallback heuristic parser if API key is not supplied
    if not api_key or api_key == 'your_gemini_api_key_here':
        dept = map_to_department(raw_text)
        return {
            "title": raw_text[:60] if raw_text else "Civic Infrastructure Issue",
            "category": dept.capitalize(),
            "department": dept,
            "severity_score": 6 if any(w in raw_text.lower() for w in ['danger', 'wire', 'fire', 'leak', 'burst', 'flood']) else 4,
            "urgency": "HIGH" if any(w in raw_text.lower() for w in ['spark', 'shock', 'hazard', 'overflow']) else "MEDIUM",
            "summary": raw_text or "Issue reported by citizen on campus.",
            "recommended_action": f"Dispatch {dept.capitalize()} team for on-site inspection."
        }

    try:
        from google import genai
        from PIL import Image

        client = genai.Client(api_key=api_key)
        contents = []

        if image_path and os.path.exists(image_path):
            try:
                pil_img = Image.open(image_path)
                contents.append(pil_img)
            except Exception:
                pass

        prompt = f"""
You are the AI triage engine for ACTS (Autonomous Civic Triage System).
Analyze this campus/civic infrastructure complaint report:

Report Description: "{raw_text}"
{'(Photo attached)' if image_path else '(No photo provided, evaluate based on description)'}

Return ONLY valid JSON formatted as:
{{
    "title": "Concise 3-6 word title of the problem (e.g. Water pipe burst near Block B)",
    "category": "Plumbing / Electrical / Sanitation / Civil / Safety / General",
    "department": "PLUMBING / ELECTRICAL / SANITATION / CIVIL / SAFETY / GENERAL",
    "severity_score": <integer 1 to 10 based on safety hazard, property damage risk, and civic disruption>,
    "urgency": "LOW / MEDIUM / HIGH / CRITICAL",
    "summary": "Clear 1-2 sentence assessment of what is broken and its impact",
    "recommended_action": "Actionable instructions for the maintenance crew"
}}
"""
        contents.append(prompt)
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=contents
        )

        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        parsed = json.loads(response_text.strip())
        if "department" in parsed:
            parsed["department"] = map_to_department(parsed["department"])
        return parsed

    except Exception as e:
        dept = map_to_department(raw_text)
        return {
            "title": raw_text[:50] or "Reported Campus Issue",
            "category": dept.capitalize(),
            "department": dept,
            "severity_score": 5,
            "urgency": "MEDIUM",
            "summary": raw_text or "Issue reported by citizen.",
            "recommended_action": "Standard department review",
            "error": str(e)
        }
