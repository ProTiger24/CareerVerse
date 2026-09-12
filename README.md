<div align="center">

# 🚀 CareerVerse

### AI-Powered Career Growth Platform for Software Engineers

[![Live Demo](https://img.shields.io/badge/Live-Demo-4F46E5?style=for-the-badge&logo=vercel&logoColor=white)](https://career-verse-three.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ProTiger24/CareerVerse)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/Gemini_AI-Google-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

**Your personal Career Operating System — combining study planning, competitive programming, AI guidance, and interview preparation in one unified platform.**

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
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

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
- Email/Password authentication
- Google OAuth sign-in
- Secure session management with Firebase Auth

### 📊 Smart Dashboard
- Real-time KPI tracking (Tasks, Study Hours, Streak, XP)
- Application progress tracking
- Upcoming tasks with deadline badges
- Recent activity timeline
- Quick links to coding platforms

### 📋 Task Manager
- Daily task creation with priorities
- Built-in Pomodoro-style timer
- Task history (30-day view)
- Duration tracking per session
- Real-time Firebase sync

### 📚 Study Planner
- Custom subject creation with icons & colors
- Chapter-wise progress tracking
- Exam countdown with deadline alerts
- Spaced repetition revision scheduler
- Study session timer with history

### 💻 Coding Hub
- **Codeforces auto-sync** via public API
- GitHub-style activity heatmap (365 days)
- Multi-platform support (LeetCode, CodeChef, HackerRank, AtCoder)
- Project tracking with progress bars
- New technology learning tracker
- Custom user-defined sections

### 🤖 AI Features (Powered by Google Gemini)
- **AI Career Coach** — Chat-based personalized guidance
- **AI Quiz Test** — Auto-generate MCQ + short questions on any topic
- **AI Grading** — Instant marking with detailed feedback
- **Voice Viva Practice** — Realistic mock interview with Web Speech API
- **Multi-model fallback** — Automatic retry across Gemini models

### 📖 Digital Library
- Upload PDF books (up to 5MB) with base64 storage
- External link support (Google Drive, Dropbox)
- Category-based organization
- Built-in PDF reader
- Search & filter functionality

### 📅 Calendar & Events
- Study sessions, exams, contests scheduler
- Google Calendar one-click sync
- Color-coded event types
- Grouped timeline view

### 📊 Analytics Dashboard
- Weekly & monthly reports
- Subject-wise time breakdown
- Consistency rate tracking
- Best day analysis
- Strengths & weaknesses detection
- PDF report export

### 🎓 Test History
- All past Quiz & Viva results stored
- Subject-wise performance trends
- Detailed question-by-question review
- Average score & best score tracking

### 🕌 Islamic Motivation
- Daily Quran verses & hadiths
- Beautiful background images
- Auto-rotation every 30 seconds
- Save favorite quotes

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Tailwind CSS 3** | Styling system |
| **Framer Motion** | Animations |
| **React Router v6** | Client-side routing |
| **Recharts** | Charts & data visualization |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | REST API framework |
| **Python 3.11** | Runtime |
| **Uvicorn** | ASGI server |
| **Google Generative AI** | Gemini SDK |

### Database & Services
| Technology | Purpose |
|------------|---------|
| **Firebase Authentication** | User authentication |
| **Firebase Realtime Database** | Real-time data sync |
| **Google Gemini API** | AI capabilities |
| **YouTube Data API v3** | Video search |

### DevOps
| Technology | Purpose |
|------------|---------|
| **Vercel** | Frontend hosting |
| **Render** | Backend hosting |
| **GitHub Actions** | CI/CD pipeline |

---

## 🏗️ Architecture

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** >= 16.x ([Download](https://nodejs.org/))
- **Python** >= 3.11 ([Download](https://www.python.org/downloads/))
- **npm** or **yarn**
- **Git**
- A **Firebase** account ([Sign up](https://firebase.google.com/))
- A **Google Cloud** account for Gemini API ([Sign up](https://aistudio.google.com/))

### Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/ProTiger24/CareerVerse.git
cd CareerVerse# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your Firebase & YouTube credentials

# Start development server
npm start
The frontend will be available at http://localhost:3000
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env with your Gemini API key

# Start server
uvicorn app.main:app --reload --port 8000Environment Variables
Frontend (.env)
env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# YouTube Data API
REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key

# Backend URL (for production)
REACT_APP_AI_BACKEND_URL=https://your-backend.onrender.com
Backend (.env)
env
GEMINI_API_KEY=your_gemini_api_key
⚠️ Security Note: Never commit .env files. Use .env.example as a template.

🌐 Deployment
Frontend Deployment (Vercel)
Push code to GitHub

Import repository on Vercel

Add environment variables in Vercel dashboard

Deploy — automatic on every push

Backend Deployment (Render)
Create a new Web Service on Render

Connect your GitHub repository

Configure:

Root Directory: backend

Build Command: pip install -r requirements.txt

Start Command: python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT

Python Version: 3.11.9 (set via runtime.txt or PYTHON_VERSION env var)

Add environment variables:

GEMINI_API_KEY

PYTHON_VERSION=3.11.9

Deploy

📁 Project Structure
text
CareerVerse/
├── public/                       # Static assets
│   └── index.html
├── src/                          # Frontend source
│   ├── components/
│   │   ├── auth/                 # Login, Register
│   │   ├── common/               # Navbar, shared UI
│   │   ├── Analytics.jsx         # Charts & reports
│   │   ├── CalendarIntegration.jsx
│   │   ├── CodingHub.jsx         # CP + projects tracker
│   │   ├── DigitalLibrary.jsx
│   │   ├── Motivation.jsx
│   │   ├── QuizTest.jsx
│   │   ├── ReportSection.jsx
│   │   ├── StudyPlanner.jsx
│   │   ├── TaskSection.jsx
│   │   ├── TestHistory.jsx
│   │   ├── VivaPractice.jsx
│   │   └── YouTubeSection.jsx
│   ├── context/
│   │   └── AuthContext.js
│   ├── firebase/
│   │   └── config.js
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   └── LandingPage.jsx
│   ├── services/
│   │   ├── aiService.js
│   │   └── dashboardService.js
│   ├── styles/
│   │   └── index.css
│   ├── App.jsx
│   └── index.jsx
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── routers/
│   │   │   ├── ai.py             # AI endpoints
│   │   │   └── reports.py        # Report endpoints
│   │   ├── utils/
│   │   │   └── gemini_helper.py  # Gemini integration
│   │   └── main.py               # FastAPI entry
│   ├── requirements.txt
│   ├── runtime.txt               # Python version
│   └── .env.example
├── .env.example
├── .gitignore
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
└── README.md
📸 Screenshots
🏠 Landing Page
https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Landing+Page

📊 Dashboard
https://via.placeholder.com/800x400/0A0E1A/FFFFFF?text=Dashboard

💻 Coding Hub with Heatmap
https://via.placeholder.com/800x400/10B981/FFFFFF?text=Coding+Hub

🤖 AI Coach
https://via.placeholder.com/800x400/8B5CF6/FFFFFF?text=AI+Coach

💡 Replace placeholders with actual screenshots hosted on GitHub or an image CDN.

🤝 Contributing
Contributions are welcome! If you'd like to improve CareerVerse, please follow these steps:

Fork the repository

Create a feature branch:

bash
git checkout -b feature/amazing-feature
Commit your changes:

bash
git commit -m "Add: amazing feature"
Push to the branch:

bash
git push origin feature/amazing-feature
Open a Pull Request

Contribution Guidelines
Follow the existing code style

Add comments for complex logic

Update documentation when needed

Test thoroughly before submitting

📄 License
This project is licensed under the MIT License — see the LICENSE file for details.

👨‍💻 Author
Abdul Alim (ProTiger24)

🎓 CSE Student, BUBT

💼 Full-Stack Developer | AI Enthusiast

🔗 GitHub: @ProTiger24

📧 Email: abdulalim528260@gmail.com

🙏 Acknowledgments
Firebase for authentication & database

Google Gemini for AI capabilities

Vercel for hosting the frontend

Render for hosting the backend

The open-source community for amazing tools and libraries

<div align="center">
⭐ If you find this project helpful, please give it a star!
Built with ❤️ by Abdul Alim

</div> ```
🚀 Step 2: Save এবং Push করুন
Save করুন: Ctrl+O → Enter → Ctrl+X

তারপর Terminal-এ:

bash
cd /home/abdul-alim/Documents/careerverse

git add README.md
git commit -m "docs: add professional README with badges, architecture & screenshots"
git push origin main

