import os
from dotenv import load_dotenv
load_dotenv(override=True)

import google.generativeai as genai

key = os.getenv("GEMINI_API_KEY")
print("=" * 50)
print("API KEY CHECK")
print("=" * 50)
if not key:
    print("❌ KEY MISSING!")
elif key.startswith("AIzaSy"):
    print("✅ Key format OK:", key[:15] + "...")
elif key.startswith("AQ."):
    print("❌ WRONG KEY TYPE! This is OAuth token, not Gemini API Key")
else:
    print("⚠️ Unknown format:", key[:20])

print()
print("=" * 50)
print("AVAILABLE MODELS")
print("=" * 50)
try:
    genai.configure(api_key=key)
    for m in genai.list_models():
        if "generateContent" in m.supported_generation_methods:
            print(" -", m.name)
except Exception as e:
    print("❌ Cannot list models:", type(e).__name__, ":", str(e)[:300])

print()
print("=" * 50)
print("TEST CALL")
print("=" * 50)
try:
    genai.configure(api_key=key)
    model = genai.GenerativeModel("gemini-2.5-flash")
    r = model.generate_content("Say hi in one word")
    print("✅ SUCCESS:", r.text)
except Exception as e:
    print("❌ ERROR TYPE:", type(e).__name__)
    print("❌ MESSAGE:", str(e)[:500])
