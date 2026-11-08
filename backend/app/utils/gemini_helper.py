import os
import json
import traceback
from google import genai
from google.genai import types

# Environment Variable থেকে API Key লোড করা
API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# নতুন google-genai ক্লায়েন্ট তৈরি
client = genai.Client(api_key=API_KEY) if API_KEY else None

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
        print(f"Error in ask_gemini: {type(e).__name__}: {e}")
        raise Exception(f"Gemini API Error: {str(e)}")

async def generate_quiz(subject: str, chapter: str, topic: str, num_mcq: int, num_short: int, difficulty: str) -> dict:
    prompt = f"""
    You are an expert educator creating a quiz for a student. 
    Subject: {subject}, Chapter: {chapter}, Topic: {topic}.
    Difficulty Level: {difficulty}.
    
    IMPORTANT: Do NOT assume the student is from a Computer Science background unless the subject explicitly says so. Adapt the questions to the specific subject provided.
    
    Generate exactly {num_mcq} Multiple Choice Questions (MCQs) and {num_short} Short Questions.
    Return the response strictly as a JSON object with the following structure:
    {{
        "mcqs": [
            {{"question": "Question text?", "options": ["A", "B", "C", "D"], "answer": "A"}}
        ],
        "short_questions": [
            {{"question": "Question text?"}}
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
        return {"mcqs": [], "short_questions": [], "error": str(e)}

async def grade_quiz_answers(quiz: dict, answers: dict) -> dict:
    prompt = f"""
    Grade the following quiz based on the user's answers.
    Quiz: {json.dumps(quiz)}
    User Answers: {json.dumps(answers)}
    
    Return the response strictly as a JSON object:
    {{
        "total_score": 85,
        "feedback": "Overall feedback here...",
        "detailed_results": [
            {{"question": "...", "user_answer": "...", "correct_answer": "...", "is_correct": true, "explanation": "..."}}
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

async def viva_start(subject: str, chapter: str, topic: str, difficulty: str) -> dict:
    prompt = f"""
    You are an expert university professor conducting a viva/oral exam.
    Subject: {subject}, Chapter: {chapter}, Topic: {topic}.
    Difficulty Level: {difficulty}.
    
    IMPORTANT: This student could be from ANY academic discipline (Arts, Science, Commerce, Medical, Engineering, etc.). Do NOT assume they are a Computer Science student. Ask questions strictly relevant to the provided subject.
    
    Ask the first question. Give a brief greeting.
    Return strictly as JSON:
    {{
        "message": "Greeting message",
        "question": "First viva question?",
        "conversation": [{{"role": "interviewer", "text": "Greeting + First question"}}]
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

async def viva_respond(subject: str, conversation: list, user_answer: str, question_number: int, difficulty: str = "medium") -> dict:
    prompt = f"""
    You are conducting a viva exam.
    Subject: {subject}. 
    Difficulty Level: {difficulty}. 
    This is question number {question_number}.
    Current conversation history: {json.dumps(conversation)}
    User's answer to the last question: "{user_answer}"
    
    Briefly evaluate the answer and ask the next question keeping the difficulty level ({difficulty}) in mind. Stay strictly within the domain of {subject}.
    
    Return strictly as JSON:
    {{
        "feedback": "Feedback on the answer",
        "next_question": "Next viva question?",
        "conversation": [{{"role": "interviewer", "text": "next question"}}, {{"role": "candidate", "text": "user answer"}}]
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

async def viva_grade(subject: str, conversation: list) -> dict:
    prompt = f"""
    Grade the following viva conversation for the subject: {subject}.
    Conversation: {json.dumps(conversation)}
    
    Return strictly as JSON:
    {{
        "score": 75,
        "grade": "A",
        "strengths": ["list", "of", "strengths"],
        "weaknesses": ["list", "of", "weaknesses"],
        "overall_feedback": "Detailed feedback..."
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

async def generate_report_summary(report_data: str) -> str:
    prompt = f"""
    Please provide a concise, professional, and encouraging summary based on the following student report data:
    {report_data}
    Return only the summary text.
    """
    try:
        response = await client.aio.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )
        return response.text
    except Exception as e:
        print(f"Error in generate_report_summary: {e}")
        return "Could not generate report summary at this time."
