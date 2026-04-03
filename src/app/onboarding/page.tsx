"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Card from '@/components/Card';
import styles from './onboarding.module.css';
import { saveOnboarding } from '@/app/actions/user';

const Onboarding: React.FC = () => {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const res = await saveOnboarding(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className={styles.onboarding}>
      <div className="container">
        <div className={styles.header}>
          <h1>Complete Your Profile</h1>
          <p>We'll use this information to personalize your health tracking experience.</p>
        </div>

        <Card className={styles.card}>
          {error && <p className={styles.error}>{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>How old are you?</label>
              <input name="age" type="number" className={styles.input} placeholder="e.g. 25" required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Current Weight (kg)</label>
              <input name="weight" type="number" step="0.1" className={styles.input} placeholder="e.g. 65.5" required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Main health condition (optional)</label>
              <select name="condition" className={styles.select}>
                <option value="none">None / Just Tracking</option>
                <option value="pcos">PCOS</option>
                <option value="diabetes">Diabetes (Type 2)</option>
                <option value="prediabetes">Pre-diabetes</option>
                <option value="both">Both PCOS & Diabetes</option>
              </select>
            </div>

            <div className={styles.footer}>
              <Button type="submit" variant="primary" fullWidth disabled={loading}>
                {loading ? 'Saving Profile...' : 'Get Started'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
