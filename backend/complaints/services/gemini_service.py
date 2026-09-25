import json
import os
import re
from typing import Dict, Any, Optional
from django.conf import settings

DEPARTMENT_MAPPING = {
    "plumbing": "PLUMBING",
    "water": "PLUMBING",
    "drain": "PLUMBING",
    "pipe": "PLUMBING",
    "leak": "PLUMBING",
    "electrical": "ELECTRICAL",
    "lighting": "ELECTRICAL",
    "wire": "ELECTRICAL",
    "light": "ELECTRICAL",
    "power": "ELECTRICAL",
    "sanitation": "SANITATION",
    "garbage": "SANITATION",
    "trash": "SANITATION",
    "cleaning": "SANITATION",
    "waste": "SANITATION",
    "civil": "CIVIL",
    "road": "CIVIL",
    "pothole": "CIVIL",
    "wall": "CIVIL",
    "floor": "CIVIL",
    "ceiling": "CIVIL",
    "structural": "CIVIL",
    "safety": "SAFETY",
    "fire": "SAFETY",
    "hazard": "SAFETY",
    "security": "SAFETY",
    "general": "GENERAL",
}

def map_to_department(category_or_dept: str) -> str:
    if not category_or_dept:
        return "GENERAL"
    cleaned = category_or_dept.lower().strip()
    for key, val in DEPARTMENT_MAPPING.items():
        if key in cleaned:
            return val
    return "GENERAL"

def _clean_json_text(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if match:
        return match.group(0).strip()
    return cleaned.strip()

def analyze_civic_issue(raw_text: str, image_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Production Dual-Engine AI Triage:
    - Primary Vision & Multimodal: Gemini 1.5/2.5 Flash via google.generativeai
    - Ultra-Fast NLP & Resilient Backup: Groq (openai/gpt-oss-120b)
    - Instant Local Heuristic fallback
    """
    gemini_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
    groq_key = getattr(settings, 'GROQ_API_KEY', '') or os.getenv('GROQ_API_KEY', '')

    prompt = f"""You are the official Campus Infrastructure & Civic Triage Engine for ACTS (Automated Civic Triage System).
Analyze this student/faculty campus defect report and return ONLY valid JSON:

Report Description: "{raw_text}"
Photo Attachment: {'Present' if (image_path and os.path.exists(image_path)) else 'None'}

Return ONLY a JSON object with this exact structure:
{{
    "title": "Concise 3-6 word problem headline (e.g. Broken Road Slab Near Aryabhata Block)",
    "category": "Plumbing | Electrical | Sanitation | Civil | Safety | General",
    "department": "PLUMBING | ELECTRICAL | SANITATION | CIVIL | SAFETY | GENERAL",
    "severity_score": <integer from 1 to 10 based on risk of injury, physical structural damage, or disruption>,
    "urgency": "LOW | MEDIUM | HIGH | CRITICAL",
    "is_emergency": <true if severity >= 8 or life/physical safety hazard, otherwise false>,
    "summary": "Precise 1-2 sentence assessment of the damage and its immediate campus impact",
    "recommended_action": "Actionable instructions and required tools for the repair squad"
}}
"""

    # 1. Try Gemini Vision (best for multimodal photos & deep diagnostics)
    if gemini_key:
        try:
            import google.generativeai as genai
            from PIL import Image

            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel('gemini-flash-latest')

            contents = []
            if image_path and os.path.exists(image_path):
                try:
                    pil_img = Image.open(image_path)
                    contents.append(pil_img)
                except Exception as img_err:
                    print(f"[Gemini Image Open Warning]: {img_err}")

            contents.append(prompt)
            response = model.generate_content(contents)
            parsed = json.loads(_clean_json_text(response.text))

            parsed["department"] = map_to_department(parsed.get("department", ""))
            parsed["engine_used"] = "gemini-flash-latest"
            return parsed
        except Exception as gemini_err:
            print(f"[Gemini Triage Failed, falling back to Groq]: {gemini_err}")

    # 2. Try Groq (high-speed fallback or text triage)
    if groq_key:
        try:
            from groq import Groq
            groq_client = Groq(api_key=groq_key)
            completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a campus infrastructure maintenance AI that returns strictly valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                model="openai/gpt-oss-120b",
                response_format={"type": "json_object"}
            )
            raw_content = completion.choices[0].message.content
            parsed = json.loads(raw_content)
            parsed["department"] = map_to_department(parsed.get("department", ""))
            parsed["engine_used"] = "groq-openai-gpt-oss-120b"
            return parsed
        except Exception as groq_err:
            print(f"[Groq Triage Failed]: {groq_err}")

    # 3. Deterministic Local Heuristic Fallback (Never crashes)
    dept = map_to_department(raw_text)
    is_emergency = any(w in raw_text.lower() for w in ['spark', 'shock', 'fire', 'burst', 'flood', 'exposed', 'danger'])
    severity = 8 if is_emergency else (6 if any(w in raw_text.lower() for w in ['pothole', 'leak', 'broken', 'crack']) else 4)

    return {
        "title": raw_text[:50].strip() or "Civic Defect Report",
        "category": dept.capitalize(),
        "department": dept,
        "severity_score": severity,
        "urgency": "HIGH" if is_emergency else "MEDIUM",
        "is_emergency": is_emergency,
        "summary": raw_text.strip() or "Campus defect reported by institutional member.",
        "recommended_action": f"Dispatch {dept.capitalize()} engineering squad for on-site assessment.",
        "engine_used": "local-heuristic"
    }
