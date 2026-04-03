"use server";

import db from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveOnboarding(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "You must be logged in" };

    const ageInput = formData.get("age");
    const weightInput = formData.get("weight");
    const condition = (formData.get("condition") as string) || "none";

    const age = ageInput ? parseInt(ageInput as string) : null;
    const weight = weightInput ? parseFloat(weightInput as string) : null;

    await db.user.update({
      where: { id: session.user.id },
      data: { age, weight, condition },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return { error: "Failed to save profile." };
  }
}

export async function saveHealthEntry(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "You must be logged in" };

    const typeField = formData.get("type") as string;
    const type = typeField?.toUpperCase()?.includes("SUGAR") ? "SUGAR" : "WEIGHT";
    const value = formData.get("value") as string;
    const dateInput = formData.get("date") as string;
    const date = dateInput ? new Date(dateInput) : new Date();

    // Basic logic for "HIGH" sugar
    let status = "NORMAL";
    if (type === "SUGAR" && parseFloat(value) > 140) {
      status = "HIGH";
    }

    await db.healthEntry.create({
      data: {
        userId: session.user.id,
        type,
        value,
        status,
        date,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/reports");
    revalidatePath("/upload");
    return { success: true };
  } catch (error: any) {
    console.error("Health entry error:", error);
    return { error: "Failed to save entry." };
  }
}
