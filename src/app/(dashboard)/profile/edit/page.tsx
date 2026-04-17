import React from 'react';
import Link from 'next/link';
import Card from '@/components/Card';
import Button from '@/components/Button';
import styles from './edit.module.css';
import db from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { updateProfile } from '../actions';

export default async function EditProfile() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className={styles.editProfile}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <Link href="/profile" className={styles.backLink}>
          ← Back to Profile
        </Link>
        <h1>Edit Profile</h1>
        <p>Update your personal details and health information</p>
      </header>

      <Card>
        {/* ── Avatar preview ── */}
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>👤</div>
          <div className={styles.avatarMeta}>
            <strong>{user.name || 'Your Name'}</strong>
            <span>{user.email}</span>
          </div>
        </div>

        {/* ── Form ── */}
        <form action={updateProfile}>
          <div className={styles.formGrid}>
            {/* Full name */}
            <div className={`${styles.formGroup} ${styles.fullSpan}`}>
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={user.name ?? ''}
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Age */}
            <div className={styles.formGroup}>
              <label htmlFor="age">Age</label>
              <input
                id="age"
                name="age"
                type="number"
                min={1}
                max={120}
                defaultValue={user.age ?? ''}
                placeholder="e.g. 25"
              />
            </div>

            {/* Gender */}
            <div className={styles.formGroup}>
              <label htmlFor="gender">Gender</label>
              <select id="gender" name="gender" defaultValue={user.gender ?? ''} required>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Weight */}
            <div className={styles.formGroup}>
              <label htmlFor="weight">Weight (kg)</label>
              <input
                id="weight"
                name="weight"
                type="number"
                min={1}
                step="0.1"
                defaultValue={user.weight ?? ''}
                placeholder="e.g. 70.5"
              />
            </div>

            {/* Height */}
            <div className={styles.formGroup}>
              <label htmlFor="height">Height (cm)</label>
              <input
                id="height"
                name="height"
                type="number"
                min={100}
                max={250}
                defaultValue={user.height ?? ''}
                placeholder="e.g. 165"
                required
              />
            </div>

            {/* Primary condition */}
            <div className={`${styles.formGroup} ${styles.fullSpan}`}>
              <label htmlFor="condition">Primary Health Condition</label>
              <select id="condition" name="condition" defaultValue={user.condition ?? 'none'}>
                <option value="none">None / General Health</option>
                <option value="diabetes">Diabetes</option>
                <option value="hypertension">Hypertension</option>
                <option value="heart_disease">Heart Disease</option>
                <option value="obesity">Obesity</option>
                <option value="pcod">PCOD / PCOS</option>
                <option value="thyroid">Thyroid Disorder</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* ── Menstrual health section (always shown, optional) ── */}
          <div className={styles.periodSection}>
            <h3>🩸 Menstrual Health <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>(optional)</span></h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="lastPeriodDate">Last Period Start Date</label>
                <input
                  id="lastPeriodDate"
                  name="lastPeriodDate"
                  type="date"
                  defaultValue={user.lastPeriodDate ?? ''}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="cycleLength">Average Cycle Length (days)</label>
                <input
                  id="cycleLength"
                  name="cycleLength"
                  type="number"
                  min={20}
                  max={45}
                  defaultValue={user.cycleLength ?? 28}
                  placeholder="e.g. 28"
                />
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className={styles.actions}>
            <Link href="/profile">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
