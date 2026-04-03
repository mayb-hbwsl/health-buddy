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
              <span className={`${styles.riskBadge} ${styles.low}`}>Low</span>
            </div>
          </div>
        </Card>

        <Card title="Weekly Recommendation" className={styles.recommendCard}>
          <div className={styles.recommendation}>
            <div className={styles.recIcon}>🥦</div>
            <div className={styles.recText}>
              Increase your fiber intake. Adding 10g of fiber to your daily meals can improve your insulin sensitivity.
            </div>
          </div>
          <div className={styles.recommendation} style={{ marginTop: '20px' }}>
            <div className={styles.recIcon}>👟</div>
            <div className={styles.recText}>
              A quick 15-minute walk after lunch can help lower post-prandial sugar spikes by up to 12%.
            </div>
          </div>
        </Card>

        <Card title="AI Analysis" className={styles.aiCard}>
          <div className={styles.aiContent}>
            <p>Based on your last 3 uploads, we noticed a positive trend in your fasting glucose levels. Your weight is stable within the healthy range for your age ({user?.age}).</p>
            <div className={styles.aiBadge}>AI GENERATED INSIGHT</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
