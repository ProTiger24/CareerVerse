import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import firebase_admin
from firebase_admin import credentials, db, auth
from datetime import datetime
import schedule
import time
from dotenv import load_dotenv

# .env ফাইল থেকে ইমেইল এবং পাসওয়ার্ড লোড করা
load_dotenv()

# === Render এবং লোকাল—দুই জায়গায় কাজ করার জন্য স্মার্ট পাথ ডিটেকশন ===
key_path = "serviceAccountKey.json"
if os.path.exists("/etc/secrets/serviceAccountKey.json"):
    key_path = "/etc/secrets/serviceAccountKey.json"

# ফায়ারবেস অ্যাডমিন সেটআপ
cred = credentials.Certificate(key_path)
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://careerverse-f0a15-default-rtdb.firebaseio.com/' 
})

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

def send_email(to_email, subject, html_content):
    msg = MIMEMultipart()
    msg['From'] = f"CareerVerse <{EMAIL_USER}>"
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(html_content, 'html'))

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=20) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)
        print(f"✅ Reminder email sent to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send to {to_email}: {e}")

def check_and_send_reminders():
    print(f"\n⏰ Checking tasks at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    today_str = datetime.now().strftime('%Y-%m-%d')
    
    users_ref = db.reference('users')
    users = users_ref.get()

    if not users:
        print("❌ No users found in database.")
        return

    for user_id, user_data in users.items():
        email = None
        user_name = "Student"
        
        profile_data = user_data.get('profile', {})
        if profile_data:
            user_name = profile_data.get('displayName', user_name)
            email = profile_data.get('email')
            
        email = email or user_data.get('email')
        
        if not email:
            try:
                user_record = auth.get_user(user_id)
                email = user_record.email
                if user_record.display_name:
                    user_name = user_record.display_name
            except Exception as e:
                pass

        if not email:
            continue

        tasks = user_data.get('tasks', {})
        if not tasks:
            continue

        incomplete_tasks = []
        for task_id, task in tasks.items():
            task_date = task.get('taskDate', '')
            is_completed = task.get('completed', False)
            
            if task_date == today_str and not is_completed:
                incomplete_tasks.append(task.get('title', 'Unnamed Task'))

        if incomplete_tasks:
            print(f"🔍 User {email} has {len(incomplete_tasks)} incomplete tasks today.")
            
            task_list_html = "".join([f"<div style='padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 500;'><span style='color: #6366F1; margin-right: 8px;'>▹</span> {t}</div>" for t in incomplete_tasks])
            
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
            <style>
              body {{ font-family: 'Inter', Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }}
              .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }}
              .header {{ background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); padding: 30px 20px; text-align: center; color: white; }}
              .content {{ padding: 30px; color: #374151; line-height: 1.6; }}
              .task-box {{ background-color: #f9fafb; border-left: 4px solid #6366F1; padding: 10px 20px; margin: 20px 0; border-radius: 8px; }}
              .warning-box {{ background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px 20px; margin: 20px 0; border-radius: 8px; color: #991b1b; font-weight: 500; }}
              .btn {{ display: inline-block; background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px; }}
              .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #6b7280; background-color: #f9fafb; }}
            </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 24px;">CareerVerse 🚀</h1>
                  <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Your Daily Productivity Check-in</p>
                </div>
                <div class="content">
                  <h2 style="margin-top: 0; color: #111827;">Hello {user_name}! 👋</h2>
                  <p>Hope you're having a great day. This is a gentle reminder that you still have <strong>{len(incomplete_tasks)}</strong> incomplete task(s) scheduled for today:</p>
                  
                  <div class="task-box">
                    {task_list_html}
                  </div>

                  <div class="warning-box">
                    ⚠️ <strong>Coding Streak Alert:</strong> Have you solved your daily Codeforces or LeetCode problem yet? Keep that momentum going!
                  </div>

                  <div style="text-align: center;">
                    <a href="https://careerverse-three.vercel.app/dashboard" class="btn">Go to Dashboard</a>
                  </div>
                </div>
                <div class="footer">
                  Keep learning, keep growing. <br>
                  <strong>The CareerVerse Team</strong>
                </div>
              </div>
            </body>
            </html>
            """
            
            send_email(email, "Action Required: Incomplete Tasks for Today ⚠️", html_body)

# === এখানে আর কোনো while True লুপ নেই ===
# কারণ main.py থেকে থ্রেড হিসেবে এটি চলবে।
