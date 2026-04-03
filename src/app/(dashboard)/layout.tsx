"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import styles from './layout.module.css';
import ChatWidget from '@/components/ChatWidget.client';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Upload Reports', path: '/upload', icon: '📤' },
  { name: 'Health Insights', path: '/insights', icon: '🧠' },
  { name: 'All Reports', path: '/reports', icon: '📋' },
  { name: 'Profile', path: '/profile', icon: '👤' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard" className={styles.logo}>
            HealthBuddy
          </Link>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.name}>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={() => signOut({ callbackUrl: '/' })} className={styles.logoutBtn}>
            <span className={styles.icon}>🚪</span>
            <span className={styles.name}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.welcome}>
            Welcome back, <span className="text-gradient">{session?.user?.name || 'User'}</span>
          </div>
        </header>
        <div className={styles.content}>
          <div className="container">
            {children}
          </div>
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
