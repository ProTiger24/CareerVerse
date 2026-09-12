import os
import json
import time
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Multiple models - fallback order
MODELS = [
    "gemini-flash-latest",
    "gemini-3.7-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
]


def _call_gemini(prompt: str, json_mode: bool = False) -> str:
    """Try each model in order until one works."""
    last_error = None
    for model_name in MODELS:
        try:
            model = genai.GenerativeModel(model_name)
            if json_mode:
                generation_config = {"response_mime_type": "application/json"}
                response = model.generate_content(prompt, generation_config=generation_config)
            else:
                response = model.generate_content(prompt)
            print(f"[AI] Used model: {model_name}")
            return response.text
        except Exception as e:
            err = str(e)
            # If quota error, try next model
            if "429" in err or "quota" in err.lower():
                print(f"[AI] {model_name} quota exceeded, trying next...")
                last_error = e
                continue
            # Other errors - raise immediately
            raise e
    # All models failed
    raise Exception(f"All models failed. Last error: {last_error}")


# ============================================
# BASIC AI CHAT
# ============================================
async def ask_gemini(query: str, context: str = "general") -> str:
    prompt = f"You are an AI Career Coach for software engineers. Context: {context}.\n\nUser: {query}\n\nAssistant:"
    return _call_gemini(prompt)


async def generate_report_summary(stats: dict, report_type: str) -> str:
    prompt = f"Generate a {report_type} performance report summary for a software engineering student based on these stats: {stats}. Be motivational and provide 3 actionable suggestions."
    return _call_gemini(prompt)


# ============================================
# QUIZ GENERATION
# ============================================
async def generate_quiz(subject: str, chapter: str, topic: str, num_mcq: int, num_short: int, difficulty: str) -> dict:
    context = f"Subject: {subject}"
    if chapter:
        context += f", Chapter: {chapter}"
    if topic:
        context += f", Topic: {topic}"

    prompt = f"""You are an expert teacher creating a quiz.

{context}
Difficulty: {difficulty}

Generate:
- {num_mcq} Multiple Choice Questions (MCQ) with 4 options each
- {num_short} Short Answer Questions (1-3 sentences expected)

Return ONLY valid JSON in this exact format:
{{
  "subject": "{subject}",
  "chapter": "{chapter}",
  "topic": "{topic}",
  "mcqs": [
    {{
      "id": 1,
      "question": "Question text here?",
      "options": ["option1", "option2", "option3", "option4"],
      "correctIndex": 0,
      "correctOption": "A",
      "explanation": "Brief explanation"
    }}
  ],
  "shorts": [
    {{
      "id": 1,
      "question": "Short question?",
      "expectedAnswer": "Expected answer"
    }}
  ]
}}"""

    text = _call_gemini(prompt, json_mode=True)
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse quiz JSON: {str(e)}")


# ============================================
# QUIZ GRADING
# ============================================
async def grade_quiz_answers(quiz: dict, answers: dict) -> dict:
    mcq_text = ""
    for mcq in quiz.get("mcqs", []):
        qid = str(mcq["id"])
        user_ans = answers.get(f"mcq_{qid}", "(no answer)")
        mcq_text += f"\nMCQ {qid}: {mcq['question']}\n  Correct: {mcq.get('correctOption', '?')}\n  User: {user_ans}"

    short_text = ""
    for s in quiz.get("shorts", []):
        qid = str(s["id"])
        user_ans = answers.get(f"short_{qid}", "(no answer)")
        short_text += f"\nShort Q{qid}: {s['question']}\n  User: {user_ans}"

    prompt = f"""Grade this quiz.

SUBJECT: {quiz.get('subject', 'General')}
MCQs:{mcq_text}
SHORTS:{short_text}

Return ONLY valid JSON:
{{
  "totalScore": 0,
  "maxScore": 0,
  "percentage": 0,
  "grade": "A/B/C/D/F",
  "mcqResults": [{{"id": 1, "userAnswer": "A", "correctAnswer": "A", "isCorrect": true, "explanation": "..."}}],
  "shortResults": [{{"id": 1, "userAnswer": "...", "expectedAnswer": "...", "score": 8, "maxScore": 10, "feedback": "...", "missingPoints": []}}],
  "overallFeedback": "...",
  "strengths": [],
  "weaknesses": [],
  "studySuggestions": []
}}"""

    text = _call_gemini(prompt, json_mode=True)
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse grading JSON: {str(e)}")


# ============================================
# VIVA PRACTICE
# ============================================
async def viva_start(subject: str, chapter: str, topic: str, difficulty: str) -> dict:
    context = f"Subject: {subject}"
    if chapter:
        context += f", Chapter: {chapter}"
    if topic:
        context += f", Topic: {topic}"

    prompt = f"""You are a viva examiner.

{context}
Difficulty: {difficulty}

Ask ONE opening question testing conceptual understanding.

Return ONLY valid JSON:
{{"question": "Your question?", "questionNumber": 1}}"""

    text = _call_gemini(prompt, json_mode=True)
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    try:
        return json.loads(text)
    except:
        return {"question": "Can you explain the fundamental concepts of this topic?", "questionNumber": 1}


async def viva_respond(subject: str, conversation: list, user_answer: str, question_number: int) -> dict:
    history = ""
    for turn in conversation:
        role = "EXAMINER" if turn.get("role") == "examiner" else "STUDENT"
        history += f"{role}: {turn['text']}\n"

    prompt = f"""You are a viva examiner for {subject}.

CONVERSATION:
{history}

STUDENT ANSWER: {user_answer}

1. Briefly acknowledge their answer (1 short sentence)
2. Ask the NEXT question (# {question_number + 1})

Return ONLY valid JSON:
{{"acknowledgement": "...", "question": "Next question?", "questionNumber": {question_number + 1}, "isLast": false}}"""

    text = _call_gemini(prompt, json_mode=True)
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    try:
        return json.loads(text)
    except:
        return {
            "acknowledgement": "Thank you for your answer.",
            "question": "Can you elaborate on the next concept?",
            "questionNumber": question_number + 1,
            "isLast": False
        }


async def viva_grade(subject: str, conversation: list) -> dict:
    history = ""
    for turn in conversation:
        role = "EXAMINER" if turn.get("role") == "examiner" else "STUDENT"
        history += f"{role}: {turn['text']}\n"

    prompt = f"""Grade this viva exam for {subject}.

CONVERSATION:
{history}

Return ONLY valid JSON:
{{
  "totalScore": 75,
  "maxScore": 100,
  "percentage": 75,
  "grade": "B",
  "overallFeedback": "...",
  "strengths": [],
  "weaknesses": [],
  "questionBreakdown": [],
  "studySuggestions": []
}}"""

    text = _call_gemini(prompt, json_mode=True)
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse viva grading: {str(e)}")
