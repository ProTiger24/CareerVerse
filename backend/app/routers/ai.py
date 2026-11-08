from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.utils.gemini_helper import (
    ask_gemini, generate_quiz, grade_quiz_answers,
    viva_start, viva_respond, viva_grade
)

router = APIRouter()

class AIRequest(BaseModel):
    query: str
    context: str = "general"

@router.post("/ask")
async def ask_ai(request: AIRequest):
    try:
        response = await ask_gemini(request.query, request.context)
        return {"response": response}
    except Exception as e:
        # যদি জেমিনি কল ফেইল করে, তবে 502 Bad Gateway দেবে
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/health")
def health():
    return {"status": "AI service is healthy"}

# ... (বাকি এন্ডপয়েন্টগুলো আগের মতোই থাকবে, তবে সেগুলোতেও try-except রাখবেন) ...
