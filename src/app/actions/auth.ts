"use server";

import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function signup(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { error: "Email and password are required" };
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "User already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return { success: true, userId: newUser.id };
  } catch (error: any) {
    console.error("Signup error:", error);
    return { error: error.message || "An unexpected error occurred." };
  }
}
