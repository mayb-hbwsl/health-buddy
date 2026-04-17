"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Button from '@/components/Button';
import styles from '../auth.module.css';
import { signup } from '@/app/actions/auth';

const Signup: React.FC = () => {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const res = await signup(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      // Auto-login
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      router.push('/onboarding');
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>HealthBuddy</h1>
        <p className={styles.subtitle}>Create your medical profile to get started</p>
        
        {error && <p style={{ color: '#ff4757', textAlign: 'center', marginBottom: '16px' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input 
              name="name"
              type="text" 
              className={styles.input} 
              placeholder="Full Name" 
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Height (cm)</label>
              <input 
                name="height"
                type="number" 
                className={styles.input} 
                placeholder="165" 
                min="100"
                max="250"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Gender</label>
              <select name="gender" className={styles.input} required>
                <option value="">Select</option>
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input 
              name="email"
              type="email" 
              className={styles.input} 
              placeholder="anayni@gmail.com" 
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input 
              name="password"
              type="password" 
              className={styles.input} 
              placeholder="••••••••" 
              required
            />
          </div>

          <Button type="submit" variant="primary" fullWidth className={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className={styles.footer}>
          Already have an account? <Link href="/auth/login" className={styles.link}>Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
