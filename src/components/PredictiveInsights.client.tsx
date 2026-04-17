'use client';

import React, { useEffect, useState } from 'react';
import { getSugarPrediction, PredictionResult, SugarReading } from '@/lib/ml';
import styles from './PredictiveInsights.module.css';

interface PredictiveInsightsProps {
  sugarReadings: SugarReading[];
}

export default function PredictiveInsights({ sugarReadings }: PredictiveInsightsProps) {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrediction() {
      if (sugarReadings.length < 3) {
        setLoading(false);
        return;
      }
      
      const res = await getSugarPrediction(sugarReadings);
      setPrediction(res);
      setLoading(false);
    }

    fetchPrediction();
  }, [sugarReadings]);

  if (loading) {
    return <div className={styles.loading}>Analyzing your patterns...</div>;
  }

  if (!prediction || sugarReadings.length < 3) {
    return (
      <div className={styles.predictionBox}>
        <div className={styles.label}>ML Insights</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Log at least 3 blood sugar readings to unlock AI-powered predictions and trend analysis.
        </p>
      </div>
    );
  }

  const trendClass = 
    prediction.trend === 'RISING' ? styles.rising : 
    prediction.trend === 'FALLING' ? styles.falling : 
    styles.stable;

  const trendIcon = 
    prediction.trend === 'RISING' ? '📈' : 
    prediction.trend === 'FALLING' ? '📉' : 
    '➡️';

  return (
    <div className={styles.container}>
      <div className={styles.predictionBox}>
        <div className={styles.label}>Next Predicted Sugar Level</div>
        <div className={styles.valueArea}>
          <span className={styles.value}>{prediction.predicted_next}</span>
          <span className={styles.unit}>mg/dL</span>
        </div>
        
        <div className={`${styles.trendBadge} ${trendClass}`}>
          {trendIcon} {prediction.trend} TRAJECTORY
        </div>

        {prediction.alert && (
          <div className={styles.alert}>
            {prediction.alert}
          </div>
        )}

        <div className={styles.forecast}>
          <div className={styles.forecastTitle}>7-Day AI Forecast</div>
          <div className={styles.forecastGrid}>
            {prediction.forecast_7d.map((f) => (
              <div key={f.day} className={styles.forecastDay}>
                <span className={styles.dayLabel}>Day {f.day}</span>
                <span className={styles.dayVal}>{Math.round(f.predicted)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
