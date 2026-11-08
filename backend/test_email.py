import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

def send_test_email():
    print("Sending test email with debug output...")
    msg = MIMEText("Hello Abdul! This is a test email from CareerVerse.")
    msg['Subject'] = '✅ Test Email from CareerVerse'
    msg['From'] = EMAIL_USER
    msg['To'] = EMAIL_USER

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=20) as server:
            server.set_debuglevel(1) # ডিবাগ লেভেল চালু
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)
        print("✅ Test email sent successfully! Check your inbox.")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

if __name__ == "__main__":
    send_test_email()
