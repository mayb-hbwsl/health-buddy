"use server";

import db from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function savePeriodDate(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "You must be logged in" };

    const lastPeriodDate = formData.get("lastPeriodDate") as string;
    const cycleLength = parseInt((formData.get("cycleLength") as string) || "28");

    if (!lastPeriodDate) return { error: "Period date is required" };

    await db.user.update({
      where: { id: session.user.id },
      data: { lastPeriodDate, cycleLength },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Period save error:", error);
    return { error: "Failed to save period data." };
  }
}
