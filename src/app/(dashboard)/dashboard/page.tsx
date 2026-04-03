import React from 'react';
import Card from '@/components/Card';
import styles from './dashboard.module.css';
import db from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';
import HealthChart from '@/components/HealthChart';

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
  const latestHba1c = sortedEntries.find(e => e.type === "HBA1C");
  const recentActivity = sortedEntries.slice(0, 3);

  const isSugarHigh = latestSugar && parseFloat(latestSugar.value) > 140;

  // Prepare chart data for sugar entries (last 10)
  const sugarChartData = entries
    .filter(e => e.type === "SUGAR")
    .map(e => ({
      date: e.date.toISOString(),
      value: parseFloat(e.value)
    }))
    .slice(-10);

  // Prepare chart data for weight entries (last 10)
  const weightChartData = entries
    .filter(e => e.type === "WEIGHT")
    .map(e => ({
      date: e.date.toISOString(),
      value: parseFloat(e.value)
    }))
    .slice(-10);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>Health Dashboard</h1>
        <p>Overview of your PCOS and Diabetes health metrics</p>
      </header>

      <div className={styles.statsGrid}>
        <Card title="Latest Sugar Level" className={styles.statCard}>
          <div className={`${styles.statValue} ${isSugarHigh ? styles.highText : (latestSugar ? styles.normalText : '')}`}>
            {latestSugar ? latestSugar.value : '--'} <span className={styles.unit}>mg/dL</span>
          </div>
          <div className={`${styles.status} ${isSugarHigh ? styles.high : (latestSugar ? styles.normal : '')}`}>
            {latestSugar ? (isSugarHigh ? 'HIGH' : 'NORMAL') : 'NO DATA'}
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

        <Card title="Latest HbA1c" className={styles.statCard}>
          <div className={styles.statValue}>
            {latestHba1c ? latestHba1c.value : '--'} <span className={styles.unit}>%</span>
          </div>
          <div className={`${styles.status} ${latestHba1c?.status === "DIABETIC" ? styles.high : (latestHba1c?.status === "PRE-DIABETIC" ? styles.warning : styles.normal)}`}>
            {latestHba1c ? latestHba1c.status : 'NO DATA'}
          </div>
        </Card>

        <Card title="Next Cycle (Est.)" className={styles.statCard}>
          <div className={styles.statValue}>10 <span className={styles.unit}>Days</span></div>
          <div className={styles.status}>ON TRACK</div>
        </Card>
      </div>

      <div className={styles.chartSection}>
        <Card title="Sugar Level Trends (mg/dL)">
          {sugarChartData.length > 0 ? (
            <HealthChart data={sugarChartData} color="#ec4899" />
          ) : (
            <div className={styles.placeholderChart}>
              <div className={styles.chartMsg}>No sugar level data available yet.</div>
            </div>
          )}
        </Card>

        <Card title="Weight Trends (kg)">
          {weightChartData.length > 0 ? (
            <HealthChart data={weightChartData} color="#6366f1" unit="kg" />
          ) : (
            <div className={styles.placeholderChart}>
              <div className={styles.chartMsg}>No weight data available yet.</div>
            </div>
          )}
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
                    {activity.type === "SUGAR" ? "🍬" : (activity.type === "HBA1C" ? "🩸" : "⚖️")}
                  </span>
                  <div className={styles.activityInfo}>
                    <div className={styles.activityTitle}>
                      {activity.type === "SUGAR" ? "Sugar Level Logged" : (activity.type === "HBA1C" ? "HbA1c Logged" : "Weight Logged")}
                    </div>
                    <div className={styles.activityTime}>
                      {new Date(activity.date).toLocaleDateString()} • {activity.value} {activity.type === "SUGAR" ? "mg/dL" : (activity.type === "HBA1C" ? "%" : "kg")}
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
              {isSugarHigh 
                ? "Your sugar levels are high. Consider a low-carb meal and monitor closely." 
                : (latestHba1c?.status === "DIABETIC" ? "Your long-term glucose is elevated. Follow your medical dietary plan strictly." : "Your levels are stable. Maintain your balanced diet.")}
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
