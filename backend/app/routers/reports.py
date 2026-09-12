from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.utils.gemini_helper import generate_report_summary

router = APIRouter()

class ReportData(BaseModel):
    userId: str
    type: str
    stats: dict

@router.post("/generate")
async def generate_report(data: ReportData):
    summary = await generate_report_summary(data.stats, data.type)
    return {"summary": summary, "status": "generated"}
