import os
import json
from google import genai
from google.genai import types

# Environment Variable থেকে API Key লোড করা
API_KEY = os.getenv("GEMINI_API_KEY")

# নতুন google-genai ক্লায়েন্ট তৈরি
client = genai.Client(api_key=API_KEY)

# ডিফল্ট মডেল
MODEL_NAME = "gemini-1.5-flash" # চাইলে gemini-2.5-flash দিতে পারেন

async def ask_gemini(query: str, context: str = "general") -> str:
    """সাধারণ AI চ্যাটের জন্য"""
    try:
        prompt = f"Context: {context}\n\nUser Query: {query}"
        response = await client.aio.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )
        return response.text
    except Exception as e:
        print(f"Error in ask_gemini: {e}")
        return "Sorry, I couldn't process your request at the moment."

async def generate_quiz(subject: str, chapter: str, topic: str, num_mcq: int, num_short: int, difficulty: str) -> dict:
    """কুইজ তৈরি করার জন্য (JSON ফরম্যাটে রিটার্ন করবে)"""
    prompt = f"""
    Create a quiz for the subject: {subject}, Chapter: {chapter}, Topic: {topic}.
    Difficulty: {difficulty}.
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
    """কুইজের উত্তর মূল্যায়ন করার জন্য"""
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
    """ভাইভা পরীক্ষা শুরু করার জন্য প্রথম প্রশ্ন"""
    prompt = f"""
    Start a viva (oral exam) for the subject: {subject}, Chapter: {chapter}, Topic: {topic}.
    Difficulty: {difficulty}.
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

async def viva_respond(subject: str, conversation: list, user_answer: str, question_number: int) -> dict:
    """ভাইভায় ইউজারের উত্তর শুনে পরের প্রশ্ন করা"""
    prompt = f"""
    Subject: {subject}. 
    This is question number {question_number}.
    Current conversation history: {json.dumps(conversation)}
    User's answer to the last question: "{user_answer}"
    
    Briefly evaluate the answer and ask the next question.
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
    """ভাইভার চূড়ান্ত রেজাল্ট"""
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
    """রিপোর্টের ডাটা থেকে AI সামারি তৈরি করার জন্য"""
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
