import React from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import styles from './profile.module.css';
import db from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";
import { redirect } from 'next/navigation';

export default async function Profile() {
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

  const latestWeightEntry = [...entries]
    .filter(e => e.type === "WEIGHT")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const currentWeight = latestWeightEntry ? latestWeightEntry.value : (user?.weight || '--');

  return (
    <div className={styles.profile}>
      <header className={styles.header}>
        <h1>Your Profile</h1>
        <p>Manage your account settings and health details</p>
      </header>

      <div className={styles.profileGrid}>
        <div className={styles.leftCol}>
          <Card className={styles.profileInfo}>
            <div className={styles.avatar}>
              <span className={styles.avatarIcon}>👤</span>
            </div>
            <h2 className={styles.userName}>{user?.name || 'User'}</h2>
            <p className={styles.userEmail}>{user?.email}</p>
            <div className={styles.badges}>
              {user?.condition !== 'none' && (
                <span className={styles.badge}>{user?.condition?.toUpperCase()}</span>
              )}
              <span className={styles.badge}>ACTIVE MEMBER</span>
            </div>
          </Card>
        </div>

        <div className={styles.rightCol}>
          <Card title="Personal Details">
            <div className={styles.detailsList}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Age</span>
                <span className={styles.detailValue}>{user?.age || '--'} years</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Weight</span>
                <span className={styles.detailValue}>{currentWeight} kg</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Primary Condition</span>
                <span className={styles.detailValue}>{user?.condition || 'Not specified'}</span>
              </div>
            </div>
            <Button variant="secondary" fullWidth style={{ marginTop: '20px' }}>
              Edit Profile
            </Button>
          </Card>

          <Card title="Account Settings" style={{ marginTop: '30px' }}>
            <div className={styles.settingsItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingTitle}>Email Notifications</div>
                <div className={styles.settingDesc}>Receive weekly health summaries</div>
              </div>
              <div className={styles.toggle}>
                <input type="checkbox" defaultChecked />
              </div>
            </div>
            <div className={styles.settingsItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingTitle}>Data Privacy</div>
                <div className={styles.settingDesc}>Keep health metrics encrypted</div>
              </div>
              <div className={styles.toggle}>
                <input type="checkbox" defaultChecked />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
