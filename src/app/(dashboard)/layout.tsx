// Server Component — fetches the latest user name from the DB on every request
// so "Welcome back" always reflects the most recent name, even after editing.
import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import DashboardLayoutClient from './DashboardLayoutClient';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // Always read the freshest name from the DB, not from the stale JWT
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  const userName = user?.name || session.user.name || 'User';

  return (
    <DashboardLayoutClient userName={userName}>
      {children}
    </DashboardLayoutClient>
  );
}
