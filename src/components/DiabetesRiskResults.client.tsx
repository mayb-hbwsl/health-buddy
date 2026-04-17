'use client';

import React, { useEffect, useState } from 'react';
import { getDiabetesRisk, RiskResult, RiskRequest } from '@/lib/ml';
import styles from './PredictiveInsights.module.css'; // Reusing some base styles

interface DiabetesRiskResultsProps {
  userData: RiskRequest;
}

export default function DiabetesRiskResults({ userData }: DiabetesRiskResultsProps) {
  const [result, setResult] = useState<RiskResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRisk() {
      const res = await getDiabetesRisk(userData);
      setResult(res);
      setLoading(false);
    }
    fetchRisk();
  }, [userData]);

  if (loading) return <div className={styles.loading}>Calculating risk profile...</div>;
  if (!result) return null;

  return (
    <div className={styles.container}>
      <div className={styles.predictionBox} style={{ borderLeft: `6px solid ${result.risk_color}` }}>
        <div className={styles.label}>Clinical Risk Assessment</div>
        
        <div className={styles.valueArea}>
          <span className={styles.value} style={{ color: result.risk_color }}>{result.risk_score}%</span>
          <span className={styles.unit}>Probability</span>
        </div>

        <div style={{ 
          marginTop: '0.5rem', 
          fontSize: '1.1rem', 
          fontWeight: 800, 
          color: result.risk_color,
          textTransform: 'uppercase'
        }}>
          {result.risk_label}
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Contributing Factors:</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {result.factors.map((f, i) => (
              <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
                <span>•</span> {f}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ 
          marginTop: '1.5rem', 
          paddingTop: '1rem', 
          borderTop: '1px solid var(--border)' 
        }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>AI Recommendations:</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {result.recommendations.map((r, i) => (
              <div key={i} style={{ 
                fontSize: '0.9rem', 
                padding: '0.75rem', 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                {r}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
