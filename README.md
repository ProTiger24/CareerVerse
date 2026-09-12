 Step 1: README.md file খুলুন
bash
cd /home/abdul-alim/Documents/careerverse
nano README.md
⚠️ যদি file-এ পুরোনো content থাকে:

Ctrl + K চেপে সব line delete করুন

অথবা Ctrl + A → Ctrl + K সব একসাথে delete

যদি file খালি থাকে — সরাসরি paste করুন।

📄 Step 2: নিচের Complete Content Copy করুন
পুরোটা select করে copy করুন (নিচের সবটুকু):

markdown
<div align="center">

# 🚀 CareerVerse

### AI-Powered Career Growth Platform for Software Engineers

[![Live Demo](https://img.shields.io/badge/Live-Demo-4F46E5?style=for-the-badge&logo=vercel&logoColor=white)](https://career-verse-three.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ProTiger24/CareerVerse)

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Your personal Career Operating System** — combining study planning, competitive programming, AI guidance, and interview prep in one unified platform.

[Live Demo](https://career-verse-three.vercel.app) · [Report Bug](https://github.com/ProTiger24/CareerVerse/issues) · [Request Feature](https://github.com/ProTiger24/CareerVerse/issues)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

---

## 🎯 Overview

**CareerVerse** is a full-stack, AI-powered career growth platform designed specifically for Computer Science students and software engineers. It eliminates the chaos of juggling multiple tools by providing a single, unified system to manage:

- 📚 Daily study routines and progress
- 💻 Competitive programming activity
- 🤖 AI-powered learning assistance
- 📝 Interview preparation (Quiz & Viva)
- 📊 Personal analytics and insights

Unlike generic task managers, CareerVerse acts as your **Personal Career Operating System**, offering intelligent, data-driven guidance to accelerate your growth.

### 🎯 Why CareerVerse?

| The Problem | The Solution |
|-------------|--------------|
| Scattered tools for study tracking | One unified dashboard |
| No visibility into coding consistency | Codeforces auto-sync + heatmap |
| Generic advice, no personalization | AI coach trained for your goals |
| Forgotten chapters, no revision plan | Spaced repetition scheduler |
| No way to practice interviews | Voice-based AI Viva practice |

---

## ✨ Features

### 🔐 Authentication
Email/Password + Google OAuth with Firebase Auth

### 📊 Smart Dashboard
Real-time KPIs (Tasks, Study Hours, Streak, XP), application progress, upcoming tasks, activity timeline

### 📋 Task Manager
Daily tasks with priorities, built-in timer, 30-day history, real-time Firebase sync

### 📚 Study Planner
Custom subjects with icons & colors, chapter-wise progress, exam countdown, spaced repetition

### 💻 Coding Hub
- **Codeforces auto-sync** via public API
- GitHub-style activity heatmap (365 days)
- Multi-platform support (LeetCode, CodeChef, HackerRank, AtCoder)
- Project tracking with progress bars
- Custom user-defined sections

### 🤖 AI Features (Powered by Google Gemini)
- **AI Career Coach** — Chat-based personalized guidance
- **AI Quiz Test** — Auto-generate MCQ + short questions
- **AI Grading** — Instant marking with detailed feedback
- **Voice Viva Practice** — Realistic mock interview with Web Speech API

### 📖 Digital Library
Upload PDF books (up to 5MB), external link support, category-based organization, built-in PDF reader

### 📅 Calendar & Events
Study sessions, exams, contests scheduler with Google Calendar sync

### 📊 Analytics Dashboard
Weekly & monthly reports, subject-wise breakdown, consistency tracking, PDF export

### 🎓 Test History
All past Quiz & Viva results with detailed question-by-question review

### 🕌 Islamic Motivation
Daily Quran verses & hadiths with beautiful background images

---

## 🛠️ Tech Stack

### Frontend
- **React 18** — UI framework
- **Tailwind CSS 3** — Styling system
- **Framer Motion** — Animations
- **React Router v6** — Routing
- **Recharts** — Data visualization
- **Lucide React** — Icons

### Backend
- **FastAPI** — REST API framework
- **Python 3.11** — Runtime
- **Uvicorn** — ASGI server
- **Google Generative AI** — Gemini SDK

### Database & Services
- **Firebase Authentication**
- **Firebase Realtime Database**
- **Google Gemini API**
- **YouTube Data API v3**

### Deployment
- **Vercel** — Frontend hosting
- **Render** — Backend hosting
- **GitHub** — CI/CD

---

## 🏗️ Architecture
┌──────────────────────────────────────────────┐
│ USER BROWSER │
└────────────────────┬─────────────────────────┘
│
▼
┌──────────────────────────────────────────────┐
│ FRONTEND (React + Tailwind) │
│ Deployed on Vercel │
└─────┬────────────────────────────┬───────────┘
│ Firebase SDK │ REST API
▼ ▼
┌──────────────────┐ ┌──────────────────────┐
│ FIREBASE │ │ BACKEND (FastAPI) │
│ • Auth │ │ Deployed on Render │
│ • Realtime DB │ │ • Gemini API │
│ • Storage │ │ • AI endpoints │
└──────────────────┘ └──────────────────────┘

text

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16.x
- Python >= 3.11
- Firebase account
- Google Gemini API key

### Frontend Setup

```bash
git clone https://github.com/ProTiger24/CareerVerse.git
cd CareerVerse
npm install
cp .env.example .env
npm start
Frontend runs on http://localhost:3000

Backend Setup
bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
Backend runs on http://localhost:8000
API Docs: http://localhost:8000/docs

🔐 Environment Variables
Frontend (.env)
env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key
REACT_APP_AI_BACKEND_URL=https://your-backend.onrender.com
Backend (.env)
env
GEMINI_API_KEY=your_gemini_api_key
⚠️ Never commit .env files. Use .env.example as template.

🌐 Deployment
Frontend — Vercel
Push code to GitHub

Import repo on Vercel

Add environment variables

Deploy (auto on every push)

Backend — Render
Create new Web Service on Render

Connect GitHub repository

Configure:

Root Directory: backend

Build Command: pip install -r requirements.txt

Start Command: python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT

Python Version: 3.11.9

Add env vars: GEMINI_API_KEY, PYTHON_VERSION=3.11.9

Deploy

📁 Project Structure
text
CareerVerse/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── common/
│   │   ├── Analytics.jsx
│   │   ├── CalendarIntegration.jsx
│   │   ├── CodingHub.jsx
│   │   ├── DigitalLibrary.jsx
│   │   ├── Motivation.jsx
│   │   ├── QuizTest.jsx
│   │   ├── ReportSection.jsx
│   │   ├── StudyPlanner.jsx
│   │   ├── TaskSection.jsx
│   │   ├── TestHistory.jsx
│   │   ├── VivaPractice.jsx
│   │   └── YouTubeSection.jsx
│   ├── context/AuthContext.js
│   ├── firebase/config.js
│   ├── pages/
│   ├── services/
│   ├── styles/
│   ├── App.jsx
│   └── index.jsx
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── utils/gemini_helper.py
│   │   └── main.py
│   ├── requirements.txt
│   └── runtime.txt
└── README.md
🤝 Contributing
Fork the repository

Create feature branch: git checkout -b feature/amazing

Commit: git commit -m "Add: amazing feature"

Push: git push origin feature/amazing

Open Pull Request

📄 License
MIT License — see LICENSE for details.

👨‍💻 Author
Abdul Alim (ProTiger24)

🎓 CSE Student, BUBT

🔗 GitHub: @ProTiger24

📧 Email: abdulalim528260@gmail.com

<div align="center">
⭐ If you find this helpful, please give it a star!
Built with ❤️ by Abdul Alim

</div> ```
🚀 Step 3: nano-তে Paste করুন
nano-তে paste:
Terminal-এ nano-এর ভিতরে:

text
Ctrl + Shift + V
(অথবা mouse দিয়ে Right-click → Paste)

কিছু terminal-এ এটাও কাজ করে:

text
Shift + Insert
🚀 Step 4: Save করুন
nano-তে save করার key sequence:
text
Ctrl + O
(এটা "Write Out" = save)

তারপর:

text
Enter
(confirm filename)

তারপর nano থেকে বের হতে:

text
Ctrl + X
🚀 Step 5: Verify করুন
bash
cd /home/abdul-alim/Documents/careerverse
wc -l README.md
head -20 README.md
Expected:

Lines: ~350+ lines

Content: <div align="center"> দিয়ে শুরু

🚀 Step 6: Git-এ Push করুন
bash
cd /home/abdul-alim/Documents/careerverse

git add README.md
git commit -m "docs: update professional README"
git push origin main
📋 Complete Flow (Summary):
text
1. nano README.md                    ← File open
2. (Purge old content if any)        ← Ctrl+K
3. Paste content                     ← Ctrl+Shift+V
4. Ctrl + O                          ← Save
5. Enter                             ← Confirm
6. Ctrl + X                          ← Exit nano
7. git add README.md
8. git commit -m "..."
9. git push origin main
⚡ Alternative — VS Code দিয়ে (আরো সহজ)
যদি nano-তে paste করতে সমস্যা হয়, VS Code ব্যবহার করুন:

bash
cd /home/abdul-alim/Documents/careerverse
code README.md
VS Code-এ:

পুরোনো content select করে delete করুন (Ctrl + A → Delete)

উপরের content paste করুন (Ctrl + V)

Save করুন (Ctrl + S)

Terminal-এ git commit + push করুন

🎯 এখন এই কাজগুলো করুন:
১. nano README.md খুলুন
bash
cd /home/abdul-alim/Documents/careerverse
nano README.md
২. পুরোনো সব delete করুন (যদি থাকে)
Ctrl + K বারবার চাপুন যতক্ষণ না সব খালি হয়।

৩. উপরের README content copy করুন
৪. nano-তে paste করুন
Ctrl + Shift + V

৫. Save + Exit
Ctrl + O → Enter → Ctrl + X

৬. Git push
bash
git add README.md
git commit -m "docs: update professional README"
git push origin main
