from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv

# Import our custom models
from ml_models import BloodSugarPredictor, DiabetesRiskClassifier

# Load environment variables
load_dotenv()

app = FastAPI(title="HealthBuddy ML Service", version="1.0.0")

# Enable CORS for Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
sugar_predictor = BloodSugarPredictor()
risk_classifier = DiabetesRiskClassifier()

# ── Pydantic Schemas ─────────────────────────────────────────────────────────

class SugarReading(BaseModel):
    value: float
    date: str

class DiabetesRiskRequest(BaseModel):
    hba1c: Optional[float] = None
    avg_sugar: Optional[float] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    height_cm: Optional[float] = None
    gender: Optional[str] = None

# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "online", "service": "HealthBuddy ML"}

@app.post("/predict/blood-sugar")
async def predict_sugar(readings: List[SugarReading] = Body(...)):
    """
    Predict next blood sugar value and trend based on historic readings.
    """
    data = [{"value": r.value, "date": r.date} for r in readings]
    prediction = sugar_predictor.predict(data)
    return prediction

@app.post("/predict/diabetes-risk")
async def classify_risk(data: DiabetesRiskRequest):
    """
    Calculate diabetes risk score and recommendations.
    """
    result = risk_classifier.classify(
        hba1c=data.hba1c,
        avg_sugar=data.avg_sugar,
        age=data.age,
        weight=data.weight,
        height_cm=data.height_cm,
        gender=data.gender
    )
    return result

if __name__ == "__main__":
    # Get port from env or default to 8000
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
