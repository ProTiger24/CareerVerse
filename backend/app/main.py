from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ai, reports

app = FastAPI(title="CareerVerse AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

@app.get("/")
def root():
    return {"message": "CareerVerse AI Backend is running 🚀"}
