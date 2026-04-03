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

  const entries = await db.healthEntry.findMany({
    where: { userId: session.user.id }
  });

  // Sort entries by date descending
  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const latestSugar = sortedEntries.find(e => e.type === "SUGAR");
  const latestWeight = sortedEntries.find(e => e.type === "WEIGHT");
  const recentActivity = sortedEntries.slice(0, 3);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>Health Dashboard</h1>
        <p>Overview of your PCOS and Diabetes health metrics</p>
      </header>

      <div className={styles.statsGrid}>
        <Card title="Latest Sugar Level" className={styles.statCard}>
          <div className={styles.statValue}>
            {latestSugar ? latestSugar.value : '--'} <span className={styles.unit}>mg/dL</span>
          </div>
          <div className={`${styles.status} ${latestSugar?.status === "HIGH" ? styles.high : styles.normal}`}>
            {latestSugar ? latestSugar.status : 'NO DATA'}
          </div>
        </Card>

        <Card title="Current Weight" className={styles.statCard}>
          <div className={styles.statValue}>
            {latestWeight ? latestWeight.value : (user?.weight || '--')} <span className={styles.unit}>kg</span>
          </div>
          <div className={styles.status}>
            {latestWeight ? 'UPDATED' : 'STABLE'}
          </div>
        </Card>

        <Card title="Next Cycle (Est.)" className={styles.statCard}>
          <div className={styles.statValue}>12 <span className={styles.unit}>Days</span></div>
          <div className={styles.status}>ON TRACK</div>
        </Card>
      </div>

      <div className={styles.chartSection}>
        <Card title="Sugar Level Trends (Last 7 Days)">
          <div className={styles.placeholderChart}>
            {sortedEntries.filter(e => e.type === "SUGAR").length > 0 ? (
              <div className={styles.chartMsg}>Analyzing your latest {sortedEntries.filter(e => e.type === "SUGAR").length} sugar readings...</div>
            ) : (
              <div className={styles.chartMsg}>No sugar level data available yet for trend analysis.</div>
            )}
          </div>
        </Card>
      </div>

      <div className={styles.bottomGrid}>
        <Card title="Recent Activity" className={styles.activityCard}>
          {recentActivity.length === 0 ? (
            <p className={styles.emptyMsg}>No recent activity found. Try uploading some data!</p>
          ) : (
            <ul className={styles.activityList}>
              {recentActivity.map((activity) => (
                <li key={activity.id} className={styles.activityItem}>
                  <span className={styles.activityIcon}>
                    {activity.type === "SUGAR" ? "🍬" : "⚖️"}
                  </span>
                  <div className={styles.activityInfo}>
                    <div className={styles.activityTitle}>
                      {activity.type === "SUGAR" ? "Sugar Level Logged" : "Weight Logged"}
                    </div>
                    <div className={styles.activityTime}>
                      {new Date(activity.date).toLocaleDateString()} • {activity.value} {activity.type === "SUGAR" ? "mg/dL" : "kg"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recommendations" className={styles.recommendCard}>
          <div className={styles.recommendation}>
            <div className={styles.recIcon}>🥗</div>
            <div className={styles.recText}>
              {latestSugar?.status === "HIGH" 
                ? "Your sugar levels are high. Consider a low-carb meal and monitor closely." 
                : "Your sugar levels are stable. Maintain your current balanced diet."}
            </div>
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
