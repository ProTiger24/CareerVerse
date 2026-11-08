import os
import json
import traceback
from google import genai
from google.genai import types

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

client = genai.Client(
    api_key=API_KEY,
    http_options=types.HttpOptions(api_version='v1beta')
) if API_KEY else None

async def ask_gemini(query: str, context: str = "general") -> str:
    if not client:
        return "AI Client is not initialized. Please check GEMINI_API_KEY."
    try:
        prompt = f"Context: {context}\n\nUser Query: {query}"
        response = await client.aio.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )
        return response.text
    except Exception as e:
        traceback.print_exc()
        raise Exception(f"Gemini API Error: {str(e)}")

# ============ QUIZ GENERATION ============
async def generate_quiz(subject: str, chapter: str, topic: str, num_mcq: int, num_short: int, difficulty: str) -> dict:
    prompt = f"""
    You are an expert educator creating a quiz for a student. 
    Subject: {subject}, Chapter: {chapter}, Topic: {topic}.
    Difficulty Level: {difficulty}.
    
    IMPORTANT: Do NOT assume the student is from a Computer Science background unless the subject explicitly says so. Adapt the questions to the specific subject provided.
    
    Generate exactly {num_mcq} Multiple Choice Questions (MCQs) and {num_short} Short Questions.
    Return the response strictly as a JSON object with the following structure:
    {{
        "subject": "{subject}",
        "chapter": "{chapter}",
        "mcqs": [
            {{"id": 1, "question": "Question text?", "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"], "answer": "A"}}
        ],
        "shorts": [
            {{"id": 1, "question": "Question text?"}}
        ]
    }}
    """
    try:
        response = await client.aio.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error in generate_quiz: {e}")
        return {"mcqs": [], "shorts": [], "error": str(e)}

# ============ QUIZ GRADING ============
async def grade_quiz_answers(quiz: dict, answers: dict) -> dict:
    prompt = f"""
    Grade the following quiz based on the user's answers.
    Quiz: {json.dumps(quiz)}
    User Answers: {json.dumps(answers)}
    
    CRITICAL RULES:
    1. If a user's answer is missing from the 'User Answers' dictionary, OR if the answer is an empty string or whitespace, you MUST treat it as UNANSWERED.
    2. For any UNANSWERED question: Set "userAnswer" to "No answer provided", "score" to 0, and add a feedback saying "You did not attempt this question."
    3. DO NOT hallucinate or make up an answer for the user if they left it blank.
    
    Return the response strictly as a JSON object matching this structure exactly:
    {{
        "totalScore": 85,
        "maxScore": 100,
        "percentage": 85,
        "grade": "A",
        "overallFeedback": "Overall feedback here...",
        "strengths": ["Strength 1", "Strength 2"],
        "weaknesses": ["Weakness 1", "Weakness 2"],
        "studySuggestions": ["Suggestion 1", "Suggestion 2"],
        "mcqResults": [
            {{"id": 1, "userAnswer": "A", "correctAnswer": "A", "isCorrect": true, "explanation": "Why it is correct."}}
        ],
        "shortResults": [
            {{"id": 1, "userAnswer": "User text OR No answer provided", "expectedAnswer": "Expected text...", "score": 3, "maxScore": 5, "feedback": "Feedback...", "missingPoints": ["Point 1"]}}
        ]
    }}
    """
    try:
        response = await client.aio.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error in grade_quiz_answers: {e}")
        return {"error": str(e)}

# ============ VIVA START ============
async def viva_start(subject: str, chapter: str, topic: str, difficulty: str) -> dict:
    prompt = f"""
    You are an expert university professor conducting a viva/oral exam.
    Subject: {subject}, Chapter: {chapter}, Topic: {topic}.
    Difficulty Level: {difficulty}.
    
    IMPORTANT: This student could be from ANY academic discipline. Do NOT assume they are a Computer Science student.
    
    Ask the first question. Give a brief greeting.
    Return strictly as JSON matching this structure:
    {{
        "message": "Greeting message",
        "question": "First viva question?",
        "questionNumber": 1
    }}
    """
    try:
        response = await client.aio.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error in viva_start: {e}")
        return {"error": str(e)}

# ============ VIVA RESPOND ============
async def viva_respond(subject: str, conversation: list, user_answer: str, question_number: int, difficulty: str = "medium") -> dict:
    prompt = f"""
    You are conducting a viva exam.
    Subject: {subject}. 
    Difficulty Level: {difficulty}. 
    This is question number {question_number}.
    Current conversation history: {json.dumps(conversation)}
    User's answer to the last question: "{user_answer}"
    
    Briefly evaluate the answer and ask the next question keeping the difficulty level ({difficulty}) in mind.
    
    Return strictly as JSON matching this structure exactly:
    {{
        "acknowledgement": "Brief feedback on the answer",
        "question": "Next viva question?",
        "questionNumber": {question_number + 1}
    }}
    """
    try:
        response = await client.aio.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error in viva_respond: {e}")
        return {"error": str(e)}

# ============ VIVA GRADE ============
async def viva_grade(subject: str, conversation: list) -> dict:
    prompt = f"""
    Grade the following viva conversation for the subject: {subject}.
    Conversation: {json.dumps(conversation)}
    
    Return strictly as JSON matching this structure exactly:
    {{
        "totalScore": 35,
        "maxScore": 50,
        "percentage": 70,
        "grade": "B",
        "overallFeedback": "Detailed feedback...",
        "strengths": ["list", "of", "strengths"],
        "weaknesses": ["list", "of", "weaknesses"],
        "studySuggestions": ["list", "of", "suggestions"],
        "questionBreakdown": [
            {{"question": "Question text", "score": 7, "maxScore": 10, "feedback": "Feedback"}}
        ]
    }}
    """
    try:
        response = await client.aio.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error in viva_grade: {e}")
        return {"error": str(e)}

# ============ REPORT SUMMARY ============
async def generate_report_summary(report_data: str) -> str:
    prompt = f"Please provide a concise, professional, and encouraging summary based on the following student report data:\n{report_data}\nReturn only the summary text."
    try:
        response = await client.aio.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )
        return response.text
    except Exception as e:
        print(f"Error in generate_report_summary: {e}")
        return "Could not generate report summary at this time."
