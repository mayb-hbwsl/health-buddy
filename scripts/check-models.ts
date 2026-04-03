import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  try {
    // There is no direct "listModels" in the simple GenAI SDK, but we can try common ones
    const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro-vision"];
    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        console.log(`Checking ${m}...`);
        await model.generateContent("test");
        console.log(`✅ ${m} is available`);
      } catch (e: any) {
        console.log(`❌ ${m} failed: ${e.message}`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

listModels();
