import React from 'react';
import Card from '@/components/Card';
import styles from './reports.module.css';
import db from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';

export default async function Reports() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const entries = await db.healthEntry.findMany({
    where: { userId: session.user.id }
  });

  return (
    <div className={styles.reports}>
      <header className={styles.header}>
        <h1>All Health Reports</h1>
        <p>A history of your logged health metrics and uploaded documents</p>
      </header>

      <div className={styles.reportsList}>
        <Card title="Recent Logs" className={styles.reportCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.empty}>No logs found. Try uploading some data!</td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.type}</td>
                      <td>{entry.value}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[entry.status?.toLowerCase() || 'normal']}`}>
                          {entry.status || 'NORMAL'}
                        </span>
                      </td>
                      <td>{new Date(entry.date).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Daily Observations" className={styles.observationCard}>
          <div className={styles.observation}>
            <div className={styles.obsHeader}>
              <span className={styles.obsIcon}>🥗</span>
              <span className={styles.obsTitle}>Low Carb Day</span>
              <span className={styles.obsDate}>April 03, 2026</span>
            </div>
            <p className={styles.obsText}>Feeling much better today with more energy. Sugar levels are stable.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
