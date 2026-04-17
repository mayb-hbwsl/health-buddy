/**
 * ml.ts — Client for the Python ML microservice.
 */

const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000';

export interface SugarReading {
  value: number;
  date: string;
}

export interface PredictionResult {
  predicted_next: number | null;
  trend: "RISING" | "FALLING" | "STABLE" | "UNKNOWN";
  trend_slope: number;
  forecast_7d: Array<{ day: number; predicted: number }>;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  spike_risk: "HIGH" | "MODERATE" | "LOW" | "UNKNOWN";
  spike_risk_pct: number;
  alert: string | null;
  readings_used: number;
}

export interface RiskRequest {
  hba1c?: number | null;
  avg_sugar?: number | null;
  age?: number | null;
  weight?: number | null;
  height_cm?: number | null;
}

export interface RiskResult {
  risk_score: number;
  risk_label: string;
  risk_color: string;
  factors: string[];
  recommendations: string[];
  bmi: number | null;
}

/**
 * Fetch blood sugar predictions from the ML service
 */
export async function getSugarPrediction(readings: SugarReading[]): Promise<PredictionResult> {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict/blood-sugar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(readings),
    });

    if (!response.ok) throw new Error('ML Service Error');
    return await response.ok ? response.json() : null;
  } catch (error) {
    console.error('Error fetching sugar prediction:', error);
    return {
      predicted_next: null,
      trend: "UNKNOWN",
      trend_slope: 0,
      forecast_7d: [],
      confidence: "LOW",
      spike_risk: "UNKNOWN",
      spike_risk_pct: 0,
      alert: "ML Service unreachable.",
      readings_used: readings.length
    };
  }
}

/**
 * Fetch diabetes risk classification from the ML service
 */
export async function getDiabetesRisk(data: RiskRequest): Promise<RiskResult> {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict/diabetes-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('ML Service Error');
    return await response.json();
  } catch (error) {
    console.error('Error fetching risk classification:', error);
    return {
      risk_score: 0,
      risk_label: "UNKNOWN",
      risk_color: "gray",
      factors: ["Could not reach ML service"],
      recommendations: ["Ensure the ML service is running."],
      bmi: null
    };
  }
}
