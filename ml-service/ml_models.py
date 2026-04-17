"""
ml_models.py — Core ML prediction engine for HealthBuddy

Models:
  1. BloodSugarPredictor  — Linear regression on time-series sugar readings.
                            Predicts next expected value + 7-day trend.
  2. DiabetesRiskClassifier — Rule-based + weighted scoring using HbA1c,
                              average sugar, age, weight.  Returns a 0-100
                              risk percentage and a label.
"""

import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from typing import List, Optional


# ─────────────────────────────────────────────────────────────────────────────
# 1. Blood-Sugar Spike Predictor
# ─────────────────────────────────────────────────────────────────────────────

class BloodSugarPredictor:
    """
    Fits a polynomial regression on the user's timestamped sugar readings
    and predicts the *next* reading plus a short 7-day forecast.

    Requires at least 3 readings to make a meaningful prediction.
    """

    MIN_READINGS = 3

    def predict(self, readings: List[dict]) -> dict:
        """
        Parameters
        ----------
        readings : list of {"value": float, "date": str ISO-8601}
            Sorted oldest → newest.

        Returns
        -------
        dict with keys:
            predicted_next   float   – next expected reading (mg/dL)
            trend            str     – "RISING" | "FALLING" | "STABLE"
            trend_slope      float   – mg/dL change per day
            forecast_7d      list    – [{"day": int, "predicted": float}, …]
            confidence       str     – "HIGH" | "MEDIUM" | "LOW"
            spike_risk       str     – "HIGH" | "MODERATE" | "LOW"
            spike_risk_pct   float   – 0-100 probability-style score
            alert            str | None
        """
        if len(readings) < self.MIN_READINGS:
            return self._insufficient_data(readings)

        values = np.array([r["value"] for r in readings], dtype=float)
        # X = reading index (0, 1, 2, …)
        X = np.arange(len(values)).reshape(-1, 1)

        # Simple Linear Regression is much more stable than Polynomial for small/noisy health data
        model = LinearRegression()
        model.fit(X, values)

        # Predict the *next* index
        next_idx = np.array([[len(values)]])
        predicted_next = float(model.predict(next_idx)[0])
        
        # Physiological sanity checks
        recent_avg = float(np.mean(values[-3:]))
        
        # 1. Clamp to realistic range (70 mg/dL is a safe fasting floor)
        # 2. Prevent wild swings (don't deviate more than 40% from recent average)
        max_allowed_drop = recent_avg * 0.6 # Max 40% drop
        max_allowed_rise = recent_avg * 1.5 # Max 50% rise
        
        predicted_next = max(70.0, min(500.0, predicted_next))
        predicted_next = max(max_allowed_drop, min(max_allowed_rise, predicted_next))

        # Slope from simple linear regression (trend direction)
        lin = LinearRegression().fit(X, values)
        slope = float(lin.coef_[0])  # mg/dL per reading step

        # Trend classification
        if slope > 2:
            trend = "RISING"
        elif slope < -2:
            trend = "FALLING"
        else:
            trend = "STABLE"

        # 7-day forecast
        forecast_7d = []
        for day in range(1, 8):
            idx = np.array([[len(values) + day - 1]])
            val = float(model.predict(idx)[0])
            val = max(70.0, min(500.0, val))
            forecast_7d.append({"day": day, "predicted": round(val, 1)})

        # Spike-risk scoring
        recent_avg = float(np.mean(values[-5:])) if len(values) >= 5 else float(np.mean(values))
        spike_risk_pct = self._spike_risk_score(predicted_next, recent_avg, slope)

        if spike_risk_pct >= 65:
            spike_risk = "HIGH"
        elif spike_risk_pct >= 35:
            spike_risk = "MODERATE"
        else:
            spike_risk = "LOW"

        # Confidence based on number of readings
        confidence = "HIGH" if len(readings) >= 10 else ("MEDIUM" if len(readings) >= 5 else "LOW")

        # Smart alert
        alert = None
        if spike_risk == "HIGH":
            alert = f"⚠️ Your sugar trend suggests a spike is likely. Current trajectory: {trend.lower()}."
        elif trend == "RISING" and predicted_next > 130:
            alert = "📈 Your blood sugar is trending upward. Monitor closely and consider dietary adjustments."

        return {
            "predicted_next": round(predicted_next, 1),
            "trend": trend,
            "trend_slope": round(slope, 2),
            "forecast_7d": forecast_7d,
            "confidence": confidence,
            "spike_risk": spike_risk,
            "spike_risk_pct": round(spike_risk_pct, 1),
            "alert": alert,
            "readings_used": len(readings),
        }

    def _spike_risk_score(self, predicted: float, recent_avg: float, slope: float) -> float:
        score = 0.0
        # Predicted value contribution (0-50 pts)
        if predicted > 180:
            score += 50
        elif predicted > 140:
            score += 35
        elif predicted > 110:
            score += 15
        # Recent average (0-30 pts)
        if recent_avg > 160:
            score += 30
        elif recent_avg > 130:
            score += 18
        elif recent_avg > 100:
            score += 8
        # Rising slope (0-20 pts)
        if slope > 5:
            score += 20
        elif slope > 2:
            score += 10
        return min(score, 100.0)

    def _insufficient_data(self, readings: List[dict]) -> dict:
        if readings:
            avg = float(np.mean([r["value"] for r in readings]))
        else:
            avg = 0.0
        return {
            "predicted_next": None,
            "trend": "UNKNOWN",
            "trend_slope": 0.0,
            "forecast_7d": [],
            "confidence": "LOW",
            "spike_risk": "UNKNOWN",
            "spike_risk_pct": 0.0,
            "alert": "Log at least 3 blood sugar readings to unlock predictions.",
            "readings_used": len(readings),
        }


# ─────────────────────────────────────────────────────────────────────────────
# 2. Diabetes Risk Classifier
# ─────────────────────────────────────────────────────────────────────────────

class DiabetesRiskClassifier:
    """
    Evidence-based weighted scoring system.

    Inputs: HbA1c, average blood sugar, age, weight (kg), height (cm) → BMI.
    Returns a risk score 0–100, a label, and personalised recommendations.

    Thresholds are aligned with ADA / WHO guidelines:
      HbA1c ≥ 6.5          → diabetic range
      HbA1c 5.7–6.4        → pre-diabetic range
      Fasting glucose ≥ 126 → diabetic range
      Fasting glucose 100–125 → pre-diabetic range
      BMI ≥ 30              → obese (elevated risk factor)
    """

    def classify(
        self,
        hba1c: Optional[float],
        avg_sugar: Optional[float],
        age: Optional[int],
        weight: Optional[float],
        height_cm: Optional[float] = None,
        gender: Optional[str] = None,
    ) -> dict:
        score = 0.0
        factors = []

        # ── Gender-specific Metabolic Adjustment (0–5 pts) ─────────────────
        if gender == "FEMALE":
            # Females have slightly different metabolic risk profiles and specific 
            # conditions like PCOD/PCOS that elevate diabetes risk.
            score += 5
            factors.append("Gender-specific factor: Elevated risk profile for PCOS/metabolic syndrome observed in females")
        elif gender == "MALE":
            # Males often carry more visceral fat (belly fat) which is a higher risk
            score += 3
            factors.append("Gender-specific factor: Increased propensity for visceral adipose tissue in males")

        # ── HbA1c (0–40 pts, highest weight) ──────────────────────────────
        if hba1c is not None:
            if hba1c >= 6.5:
                score += 40
                factors.append(f"HbA1c {hba1c}% is in the diabetic range (≥6.5%)")
            elif hba1c >= 5.7:
                pts = 20 + (hba1c - 5.7) / (6.5 - 5.7) * 20
                score += pts
                factors.append(f"HbA1c {hba1c}% is in the pre-diabetic range (5.7–6.4%)")
            else:
                factors.append(f"HbA1c {hba1c}% is in the normal range (<5.7%) ✓")

        # ── Average Blood Sugar (0–30 pts) ─────────────────────────────────
        if avg_sugar is not None:
            if avg_sugar >= 126:
                score += 30
                factors.append(f"Average sugar {avg_sugar:.0f} mg/dL is above diabetic threshold (≥126)")
            elif avg_sugar >= 100:
                pts = (avg_sugar - 100) / (126 - 100) * 30
                score += pts
                factors.append(f"Average sugar {avg_sugar:.0f} mg/dL is in the elevated range (100–125)")
            else:
                factors.append(f"Average sugar {avg_sugar:.0f} mg/dL is in normal range ✓")

        # ── BMI (0–20 pts) ──────────────────────────────────────────────────
        bmi = None
        if weight and height_cm:
            bmi = weight / ((height_cm / 100) ** 2)
            if bmi >= 30:
                score += 20
                factors.append(f"BMI {bmi:.1f} indicates obesity — a significant risk factor")
            elif bmi >= 25:
                pts = (bmi - 25) / 5 * 20
                score += pts
                factors.append(f"BMI {bmi:.1f} is in the overweight range")
            else:
                factors.append(f"BMI {bmi:.1f} is in healthy range ✓")
        elif weight:
            # rough heuristic without height: weight alone adds up to 10 pts
            if weight > 95:
                score += 10
                factors.append(f"Weight {weight} kg may contribute to risk (no height provided)")

        # ── Age (0–10 pts) ──────────────────────────────────────────────────
        if age is not None:
            if age >= 45:
                pts = min((age - 45) / 20 * 10, 10)
                score += pts
                factors.append(f"Age {age} — risk increases with age after 45")
            else:
                factors.append(f"Age {age} — within lower-risk age group ✓")

        score = min(score, 100.0)

        # Label
        if score >= 65:
            label = "HIGH RISK"
            color = "red"
        elif score >= 35:
            label = "MODERATE RISK"
            color = "orange"
        else:
            label = "LOW RISK"
            color = "green"

        # Personalised recommendations
        recommendations = self._recommendations(score, hba1c, avg_sugar, bmi, age)

        return {
            "risk_score": round(score, 1),
            "risk_label": label,
            "risk_color": color,
            "factors": factors,
            "recommendations": recommendations,
            "bmi": round(bmi, 1) if bmi else None,
        }

    def _recommendations(self, score, hba1c, avg_sugar, bmi, age) -> List[str]:
        recs = []
        if hba1c and hba1c >= 6.5:
            recs.append("🩺 Consult your doctor about medication management for your HbA1c levels.")
        elif hba1c and hba1c >= 5.7:
            recs.append("🥗 Adopt a low-GI diet to bring HbA1c below 5.7%.")

        if avg_sugar and avg_sugar > 140:
            recs.append("📊 Monitor blood sugar more frequently — aim for readings ≤140 mg/dL post-meal.")
        elif avg_sugar and avg_sugar > 100:
            recs.append("🏃 Add 30 min of moderate cardio 5 days/week to improve insulin sensitivity.")

        if bmi and bmi >= 30:
            recs.append("⚖️ A 5–10% reduction in body weight can significantly lower diabetes risk.")
        elif bmi and bmi >= 25:
            recs.append("🥦 Focus on portion control and reducing refined carbohydrate intake.")

        if age and age >= 45:
            recs.append("🔬 Schedule an annual HbA1c and fasting glucose check with your doctor.")

        if not recs:
            recs.append("✅ Keep up your healthy habits! Continue regular monitoring.")

        return recs
