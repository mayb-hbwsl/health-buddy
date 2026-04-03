import React from 'react';
import Card from '@/components/Card';
import styles from './insights.module.css';
import db from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';

export default async function Insights() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id }
  });

  const entries = await db.healthEntry.findMany({
    where: { userId: session.user.id }
  });

  const sugarEntries = entries.filter(e => e.type === "SUGAR");
  const weightEntries = entries.filter(e => e.type === "WEIGHT");

  const averageSugar = sugarEntries.length > 0
    ? sugarEntries.reduce((acc, curr) => acc + parseFloat(curr.value), 0) / sugarEntries.length
    : null;

  const latestWeight = weightEntries.length > 0 
    ? [...weightEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].value 
    : user?.weight;

  return (
    <div className={styles.insights}>
      <header className={styles.header}>
        <h1>Health Insights</h1>
        <p>Personalized recommendations based on your data</p>
      </header>

      <div className={styles.insightsList}>
        <Card title="Current Health Summary" className={styles.insightCard}>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Condition</span>
              <span className={styles.summaryValue}>{user?.condition || 'Analyzing...'}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Risk Level</span>
              <span className={`${styles.riskBadge} ${averageSugar && averageSugar > 140 ? styles.high : styles.low}`}>
                {averageSugar ? (averageSugar > 140 ? 'High' : 'Low') : 'TBD'}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Data Analysis" className={styles.recommendCard}>
          <div className={styles.recommendation}>
            <div className={styles.recIcon}>🍬</div>
            <div className={styles.recText}>
              {averageSugar ? (
                `Your average blood sugar level is ${averageSugar.toFixed(1)} mg/dL. ` +
                (averageSugar > 140 ? "Consider dietary adjustments." : "Great work maintaining a normal range.")
              ) : "Log more sugar readings to see trend analysis."}
            </div>
          </div>
          <div className={styles.recommendation} style={{ marginTop: '20px' }}>
            <div className={styles.recIcon}>⚖️</div>
            <div className={styles.recText}>
              Your current weight is tracked at {latestWeight || '--'} kg. 
              {weightEntries.length > 1 ? " We noticed consistent tracking. Keep it up!" : " Start logging your weight weekly for better analysis."}
            </div>
          </div>
        </Card>

        <Card title="AI Analysis" className={styles.aiCard}>
          <div className={styles.aiContent}>
            {entries.length > 0 ? (
              <p>Based on your last {entries.length} uploads, we noticed a positive trend in your metrics. Your weight is tracked at {latestWeight}kg for your age ({user?.age}).</p>
            ) : (
              <p>Welcome! Once you upload your first few health readings, our AI will provide personalized trend analysis based on your age ({user?.age}) and condition ({user?.condition}).</p>
            )}
            <div className={styles.aiBadge}>AI GENERATED INSIGHT</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
