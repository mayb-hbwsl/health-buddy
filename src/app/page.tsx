import React from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import Card from '@/components/Card';
import styles from './page.module.css';

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <h2 style={{ color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem', fontSize: '1.125rem' }}>
            HealthBuddy
          </h2>
          <h1 className={styles.title}>
            Track <span className="text-gradient">PCOS & Diabetes</span> Easily
          </h1>
          <p className={styles.subtitle}>
            Your personal companion for managing health through intelligent tracking, insightful reports, and smart recommendations.
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/auth/signup">
              <Button variant="primary">Get Started</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="secondary">Log In</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <h2>Everything You Need</h2>
            <p style={{ marginTop: '1rem' }}>Designed specifically for the unique needs of managing PCOS and Diabetes.</p>
          </div>

          <div className={styles.featuresGrid}>
            <Card title="Graph Tracking">
              <div className={styles.featureIcon}>📈</div>
              <p>Visualize your sugar levels, weight, and cycle trends over time with beautiful, interactive graphs.</p>
            </Card>

            <Card title="Detailed Reports">
              <div className={styles.featureIcon}>📄</div>
              <p>Upload your lab reports and log your daily entries all in one secure, accessible place.</p>
            </Card>

            <Card title="Smart Insights">
              <div className={styles.featureIcon}>🧠</div>
              <p>Receive personalized recommendations and timely alerts to keep your health on track.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className={styles.ctaSection}>
        <div className={`container ${styles.ctaGlassBox}`}>
          <h2>Ready to take control of your health?</h2>
          <p>Join thousands of users tracking their way to a healthier lifestyle today.</p>
          <Link href="/auth/signup">
            <Button variant="primary">Get Started for Free</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
