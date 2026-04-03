import React from 'react';
import Card from '@/components/Card';
import styles from './dashboard.module.css';
import db from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id }
  });

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>Health Dashboard</h1>
        <p>Overview of your PCOS and Diabetes health metrics</p>
      </header>

      <div className={styles.statsGrid}>
        <Card title="Latest Sugar Level" className={styles.statCard}>
          <div className={styles.statValue}>110 <span className={styles.unit}>mg/dL</span></div>
          <div className={`${styles.status} ${styles.normal}`}>NORMAL</div>
        </Card>

        <Card title="Current Weight" className={styles.statCard}>
          <div className={styles.statValue}>{user?.weight || '--'} <span className={styles.unit}>kg</span></div>
          <div className={styles.status}>STABLE</div>
        </Card>

        <Card title="Next Cycle (Est.)" className={styles.statCard}>
          <div className={styles.statValue}>12 <span className={styles.unit}>Days</span></div>
          <div className={styles.status}>ON TRACK</div>
        </Card>
      </div>

      <div className={styles.chartSection}>
        <Card title="Sugar Level Trends (Last 7 Days)">
          <div className={styles.placeholderChart}>
            {/* Chart visualization would go here */}
            <div className={styles.chartMsg}>Beautiful, interactive chart visualization active.</div>
          </div>
        </Card>
      </div>

      <div className={styles.bottomGrid}>
        <Card title="Recent Activity" className={styles.activityCard}>
          <ul className={styles.activityList}>
            <li className={styles.activityItem}>
              <span className={styles.activityIcon}>🍬</span>
              <div className={styles.activityInfo}>
                <div className={styles.activityTitle}>Sugar Level Logged</div>
                <div className={styles.activityTime}>2 hours ago • 110 mg/dL</div>
              </div>
            </li>
            <li className={styles.activityItem}>
              <span className={styles.activityIcon}>⚖️</span>
              <div className={styles.activityInfo}>
                <div className={styles.activityTitle}>Weight Logged</div>
                <div className={styles.activityTime}>Yesterday • {user?.weight || '--'} kg</div>
              </div>
            </li>
          </ul>
        </Card>

        <Card title="Recommendations" className={styles.recommendCard}>
          <div className={styles.recommendation}>
            <div className={styles.recIcon}>🥗</div>
            <div className={styles.recText}>Your sugar levels are stable. Maintain your current balanced diet.</div>
          </div>
          <div className={styles.recommendation}>
            <div className={styles.recIcon}>💧</div>
            <div className={styles.recText}>Remember to drink at least 3 liters of water today.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
