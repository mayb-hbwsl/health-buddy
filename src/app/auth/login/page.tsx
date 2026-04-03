"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Button from '@/components/Button';
import styles from '../auth.module.css';

const Login: React.FC = () => {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>HealthBuddy</h1>
        <p className={styles.subtitle}>Welcome back! Log in to your account</p>
        
        {error && <p style={{ color: '#ff4757', textAlign: 'center', marginBottom: '16px' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input 
              name="email"
              type="email" 
              className={styles.input} 
              placeholder="mayur@example.com" 
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
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className={styles.footer}>
          Don't have an account? <Link href="/auth/signup" className={styles.link}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
