from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.utils.gemini_helper import (
    ask_gemini, 
    generate_quiz, 
    grade_quiz_answers,
    viva_start,
    viva_respond,
    viva_grade
)

router = APIRouter()

# ============ EXISTING ============
class AIRequest(BaseModel):
    query: str
    context: str = "general"

@router.post("/ask")
async def ask_ai(request: AIRequest):
    try:
        response = await ask_gemini(request.query, request.context)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
def health():
    return {"status": "AI service is healthy"}

# ============ QUIZ ============
class QuizRequest(BaseModel):
    subject: str
    chapter: str = ""
    topic: str = ""
    numMcq: int = 5
    numShort: int = 3
    difficulty: str = "medium"  # easy | medium | hard

@router.post("/quiz/generate")
async def generate_quiz_endpoint(request: QuizRequest):
    try:
        quiz = await generate_quiz(
            subject=request.subject,
            chapter=request.chapter,
            topic=request.topic,
            num_mcq=request.numMcq,
            num_short=request.numShort,
            difficulty=request.difficulty
        )
        return quiz
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class QuizGradeRequest(BaseModel):
    quiz: Dict[str, Any]
    answers: Dict[str, str]

@router.post("/quiz/grade")
async def grade_quiz_endpoint(request: QuizGradeRequest):
    try:
        result = await grade_quiz_answers(request.quiz, request.answers)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ VIVA ============
class VivaStartRequest(BaseModel):
    subject: str
    chapter: str = ""
    topic: str = ""
    difficulty: str = "medium"

@router.post("/viva/start")
async def viva_start_endpoint(request: VivaStartRequest):
    try:
        result = await viva_start(
            subject=request.subject,
            chapter=request.chapter,
            topic=request.topic,
            difficulty=request.difficulty
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class VivaRespondRequest(BaseModel):
    subject: str
    conversation: List[Dict[str, str]]
    userAnswer: str
    questionNumber: int = 1

@router.post("/viva/respond")
async def viva_respond_endpoint(request: VivaRespondRequest):
    try:
        result = await viva_respond(
            subject=request.subject,
            conversation=request.conversation,
            user_answer=request.userAnswer,
            question_number=request.questionNumber
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class VivaGradeRequest(BaseModel):
    subject: str
    conversation: List[Dict[str, str]]

@router.post("/viva/grade")
async def viva_grade_endpoint(request: VivaGradeRequest):
    try:
        result = await viva_grade(request.subject, request.conversation)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
