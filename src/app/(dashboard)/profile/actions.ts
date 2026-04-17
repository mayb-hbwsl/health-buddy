'use server';

import db from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const name = formData.get('name') as string;
  const age = formData.get('age') ? parseInt(formData.get('age') as string) : null;
  const gender = formData.get('gender') as string;
  const weight = formData.get('weight') ? parseFloat(formData.get('weight') as string) : null;
  const height = formData.get('height') ? parseInt(formData.get('height') as string) : null;
  const condition = formData.get('condition') as string;
  const lastPeriodDate = formData.get('lastPeriodDate') as string | null;
  const cycleLength = formData.get('cycleLength')
    ? parseInt(formData.get('cycleLength') as string)
    : null;

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name: name || undefined,
      age,
      gender,
      weight,
      height,
      condition,
      lastPeriodDate: lastPeriodDate || null,
      cycleLength,
    },
  });

  revalidatePath('/profile');
  redirect('/profile');
}
