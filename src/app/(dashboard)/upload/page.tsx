import React from 'react';
import UploadForms from './UploadForms.client';
import styles from './upload.module.css';
import db from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';

export default async function UploadPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const entries = await db.healthEntry.findMany({
    where: { userId: session.user.id }
  });

  // Sort entries by date descending (newest first)
  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className={styles.upload}>
      <header className={styles.header}>
        <h1>Upload & Track</h1>
        <p>Log your metrics manually or upload a report for AI analysis</p>
      </header>

      <UploadForms />

      <div className={styles.historySection} style={{ marginTop: '40px' }}>
        <h2 style={{ marginBottom: '20px' }}>Recent Activity</h2>
        <div className={styles.historyList}>
          {sortedEntries.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No recent activity to show. Try uploading or logging a metric!</p>
          ) : (
            sortedEntries.slice(0, 10).map((entry) => (
              <div key={entry.id} className={styles.historyItem}>
                <span>{entry.type === "SUGAR" ? "Blood Sugar" : entry.type}</span>
                <strong>
                  {entry.value} 
                  <span style={{ fontSize: '0.8rem', marginLeft: '4px', opacity: 0.7 }}>
                    {entry.type === "SUGAR" ? "mg/dL" : (entry.type === "HBA1C" ? "%" : "kg")}
                  </span>
                </strong>
                <span className={styles.historyDate}>{new Date(entry.date).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
