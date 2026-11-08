import os
import json
import traceback
from google import genai
from google.genai import types

# Environment Variable থেকে API Key লোড করা
API_KEY = os.getenv("GEMINI_API_KEY")

# Best Practice: Environment Variable থেকে মডেলের নাম লোড করা, না থাকলে ডিফল্ট 2.5-flash
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# নতুন google-genai ক্লায়েন্ট তৈরি
client = genai.Client(api_key=API_KEY) if API_KEY else None

async def ask_gemini(query: str, context: str = "general") -> str:
    """সাধারণ AI চ্যাটের জন্য"""
    if not client:
        return "AI Client is not initialized. Please check GEMINI_API_KEY environment variable."
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
        # আসল এরর ফ্রন্টএন্ডে পাঠানোর জন্য exception raise করা
        raise Exception(f"Gemini API Error: {str(e)}")
        
# ... (নিচে আপনার generate_quiz, grade_quiz_answers, viva_start, viva_respond, viva_grade, generate_report_summary ফাংশনগুলো আগের মতোই থাকবে) ...
