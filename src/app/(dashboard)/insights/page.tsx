import React from 'react';
import Card from '@/components/Card';
import styles from './insights.module.css';
import db from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';
import DiabetesRiskResults from '@/components/DiabetesRiskResults.client';
import { RiskRequest } from '@/lib/ml';

/**
 * Insights Page — Server Component
 * 
 * Provides AI-driven analysis of user health data.
 * Renamed variables to definitively avoid any naming collisions or staleness issues.
 */
export default async function Insights() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // 1. Fetch data
  const user = await db.user.findUnique({
    where: { id: session.user.id }
  });

  const allHealthLogs = await db.healthEntry.findMany({
    where: { userId: session.user.id }
  });

  // 2. Fragment and Analyze
  const clinicalHba1cLogs = allHealthLogs.filter(e => e.type === "HBA1C");
  const clinicalSugarLogs = allHealthLogs.filter(e => e.type === "SUGAR");
  const clinicalWeightLogs = allHealthLogs.filter(e => e.type === "WEIGHT");

  const latestHba1c = clinicalHba1cLogs.length > 0 
    ? [...clinicalHba1cLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  const averageSugar = clinicalSugarLogs.length > 0
    ? clinicalSugarLogs.reduce((acc, curr) => acc + parseFloat(curr.value), 0) / clinicalSugarLogs.length
    : null;

  const latestWeightValue = clinicalWeightLogs.length > 0 
    ? parseFloat([...clinicalWeightLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].value)
    : (user?.weight ? parseFloat(user.weight.toString()) : null);

  // 3. Prepare AI request parameters
  const riskAssessmentData: RiskRequest = {
    hba1c: latestHba1c ? parseFloat(latestHba1c.value) : null,
    avg_sugar: averageSugar,
    age: user?.age || null,
    weight: latestWeightValue,
    height_cm: 170, // Standard default or profile height
  };

  return (
    <div className={styles.insights}>
      <header className={styles.header}>
        <h1>Health Insights</h1>
        <p>Personalized recommendations based on your data</p>
      </header>

      <div className={styles.insightsList}>
        {/* ML AI Health Analysis Section */}
        <div style={{ marginBottom: '2rem' }}>
          <Card title="ML AI Health Analysis">
            <DiabetesRiskResults userData={riskAssessmentData} />
          </Card>
        </div>

        {/* Current Health Summary Card */}
        <Card title="Current Health Summary" className={styles.insightCard}>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Condition</span>
              <span className={styles.summaryValue}>{user?.condition || 'Analyzing...'}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Diabetes Status</span>
              <span className={`${styles.riskBadge} ${latestHba1c?.status === "DIABETIC" ? styles.high : (latestHba1c?.status === "PRE-DIABETIC" ? styles.warning : styles.low)}`}>
                {latestHba1c ? latestHba1c.status : 'Log HbA1c'}
              </span>
            </div>
          </div>
        </Card>

        {/* Traditional Data Analysis Section */}
        <Card title="Data Analysis" className={styles.recommendCard}>
          <div className={styles.recommendation}>
            <div className={styles.recIcon}>🩸</div>
            <div className={styles.recText}>
              {latestHba1c ? (
                `Your most recent HbA1c reading is ${latestHba1c.value}%. ` +
                (parseFloat(latestHba1c.value) > 6.4 
                  ? "This indicates your average blood sugar has been high. Prioritize a low-GI diet." 
                  : (parseFloat(latestHba1c.value) >= 5.7 ? "Managed well but slightly elevated." : "Excellent long-term control!"))
              ) : "Log your HbA1c percentage to unlock long-term average glucose analysis."}
            </div>
          </div>
          <div className={styles.recommendation} style={{ marginTop: '20px' }}>
            <div className={styles.recIcon}>🍬</div>
            <div className={styles.recText}>
              {averageSugar ? (
                `Your average daily blood sugar is ${averageSugar.toFixed(1)} mg/dL. ` +
                (averageSugar > 140 ? "Consider more regular monitoring." : "Maintaining a healthy daily average.")
              ) : "Log daily sugar for better accuracy."}
            </div>
          </div>
        </Card>

        {/* AI Narrative Section */}
        <Card title="AI Narrative Analysis" className={styles.aiCard}>
          <div className={styles.aiContent}>
            {latestHba1c ? (
              <p>With an HbA1c of {latestHba1c.value}%, our AI suggests focusing on consistent fiber intake. Your current weight is stable at {latestWeightValue ?? '--'}kg.</p>
            ) : (
              <p>Welcome! We suggest logging your first HbA1c value to provide a comprehensive analysis of your PCOS and Diabetes risk markers for your age ({user?.age}).</p>
            )}
            <div className={styles.aiBadge}>AI GENERATED INSIGHT</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
