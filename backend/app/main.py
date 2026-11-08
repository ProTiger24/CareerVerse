from fastapi import FastAPI
import threading
import time
import schedule
import sys
import os

# reminder.py ফাইলটি app ফোল্ডারের বাইরে (backend ফোল্ডারে) আছে, তাই পাথ সেট করা হচ্ছে
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from reminder import check_and_send_reminders
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ai, reports

app = FastAPI(title="CareerVerse AI Backend")

# CORS: Allow all origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

@app.get("/")
def root():
    return {"message": "CareerVerse AI Backend is running 🚀"}
# === Background Scheduler Setup ===
def run_scheduler():
    schedule.every().day.at("20:00").do(check_and_send_reminders)
    print("🚀 Background Reminder Scheduler Started! It will run daily at 20:00.")
    while True:
        schedule.run_pending()
        time.sleep(60)

@app.on_event("startup")
def start_scheduler():
    thread = threading.Thread(target=run_scheduler, daemon=True)
    thread.start()
