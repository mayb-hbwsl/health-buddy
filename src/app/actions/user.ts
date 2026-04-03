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
    const value = formData.get("value") as string;
    const dateInput = formData.get("date") as string;
    const date = dateInput ? new Date(dateInput) : new Date();

    let type = "WEIGHT";
    if (typeField?.toUpperCase()?.includes("SUGAR")) type = "SUGAR";
    else if (typeField?.toUpperCase()?.includes("HBA1C")) type = "HBA1C";

    // Basic logic for health status
    let status = "NORMAL";
    const numericValue = parseFloat(value);

    if (type === "SUGAR" && numericValue > 140) {
      status = "HIGH";
    } else if (type === "HBA1C") {
      if (numericValue > 6.4) status = "DIABETIC";
      else if (numericValue >= 5.7) status = "PRE-DIABETIC";
      else status = "NORMAL";
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

    // Sync base user weight if type is WEIGHT
    if (type === "WEIGHT") {
      await db.user.update({
        where: { id: session.user.id },
        data: { weight: parseFloat(value) },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/reports");
    revalidatePath("/upload");
    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("Health entry error:", error);
    return { error: "Failed to save entry." };
  }
}
