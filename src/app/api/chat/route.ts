import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = await req.json();

    // Fetch user's health context
    const user = await db.user.findUnique({ where: { id: session.user.id } });
    const allEntries = await db.healthEntry.findMany({ where: { userId: session.user.id } });

    const sortedEntries = [...allEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const latestSugar = sortedEntries.find((e) => e.type === "SUGAR");
    const latestHba1c = sortedEntries.find((e) => e.type === "HBA1C");
    const latestWeight = sortedEntries.find((e) => e.type === "WEIGHT");

    const sugarHistory = sortedEntries
      .filter((e) => e.type === "SUGAR")
      .slice(0, 5)
      .map((e) => `${new Date(e.date).toLocaleDateString()}: ${e.value} mg/dL (${e.status})`)
      .join(", ");

    // Build a rich system context with the user's real data
    const systemPrompt = `
You are HealthBuddy AI — a compassionate, expert personal health assistant for ${user?.name || "the user"}.

## Patient Profile:
- Name: ${user?.name || "Unknown"}
- Age: ${user?.age ?? "Not specified"} years
- Weight: ${user?.weight ?? "Not specified"} kg
- Known Condition: ${user?.condition || "None specified"}

## Latest Health Readings:
- Blood Sugar (Latest): ${latestSugar ? `${latestSugar.value} mg/dL — Status: ${latestSugar.status}` : "No data recorded yet"}
- HbA1c (Latest): ${latestHba1c ? `${latestHba1c.value}% — Status: ${latestHba1c.status}` : "No data recorded yet"}
- Weight (Latest): ${latestWeight ? `${latestWeight.value} kg` : "No data recorded yet"}

## Blood Sugar History (Last 5 readings):
${sugarHistory || "No history available."}

## Your Behavior Rules:
1. Use the patient's REAL data above when answering questions about their health.
2. Be warm, empathetic, and encouraging — never alarmist.
3. Provide actionable, practical advice (diet, lifestyle, exercise tips).
4. For values out of range, clearly but gently explain the concern and next steps.
5. Always end responses involving serious health concerns with: "Please consult your doctor for a professional evaluation."
6. Keep responses concise — use bullet points for lists. Avoid walls of text.
7. NEVER diagnose or prescribe medication. You are an assistant, not a doctor.
8. If the user asks something unrelated to health, politely redirect them.

## Clinical Thresholds for Reference:
- Fasting Blood Sugar: Normal < 100, Pre-Diabetic 100-125, Diabetic ≥ 126 mg/dL
- HbA1c: Normal < 5.7%, Pre-Diabetic 5.7-6.4%, Diabetic ≥ 6.5%
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    // Build history for multi-turn conversation
    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1].content;

    const result = await chat.sendMessage(lastMessage);
    const text = result.response.text();

    return NextResponse.json({ reply: text });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to get a response. Please try again." },
      { status: 500 }
    );
  }
}
