"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function analyzeDocument(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) return { error: "No file provided" };

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    try {
      // Use 1.5-flash for speed, or 1.5-pro for maximum accuracy with messy handwriting/tables
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        // Force the model to output valid JSON
        generationConfig: { responseMimeType: "application/json" }
      });
      
      const prompt = `
        Analyze this medical laboratory report and extract exactly ONE health metric.
        
        Focus strictly on the 'Result' or 'Value' column. 
        IGNORE the 'Reference Range', 'Biological Interval', or 'Flag' columns.

        Identify one of these types: 
        - "Blood Sugar (Fasting)"
        - "Blood Sugar (Post-Prandial)"
        - "HbA1c"
        - "Weight"

        Return this JSON structure:
        {
          "type": "The exact type name from the list above",
          "value": number,
          "unit": "string",
          "date": "YYYY-MM-DD"
        }

        If you cannot find a date, use today's date: ${new Date().toISOString().split('T')[0]}.
      `;

      const result = await model.generateContent([
        { inlineData: { data: base64, mimeType: file.type } },
        { text: prompt },
      ]);

      const text = result.response.text();
      // Because we used responseMimeType: "application/json", 
      // 'text' is now a pure JSON string. No regex needed!
      const data = JSON.parse(text);

      return { 
        success: true, 
        data: {
          type: data.type,
          value: data.value,
          date: data.date
        }
      };

    } catch (apiError: any) {
      console.warn("Gemini API failed:", apiError.message);
      // Fallback logic remains same...
    }

    // Your existing fallback logic...
    const fileName = file.name.toLowerCase();
    const isSugar = fileName.includes("sugar") || fileName.includes("glucose") || fileName.includes("blood") || fileName.includes("fasting");
    const isHba1c = fileName.includes("hba1c") || fileName.includes("hba");
    
    return { 
      success: true, 
      data: {
        type: isHba1c ? "HbA1c" : (isSugar ? "Blood Sugar (Fasting)" : "Weight"),
        value: isHba1c ? (5.5 + Math.random() * 2).toFixed(1) : (isSugar ? (90 + Math.floor(Math.random() * 60)).toString() : (60 + Math.floor(Math.random() * 20)).toString()),
        date: new Date().toISOString().split('T')[0]
      }
    };

  } catch (error: any) {
    console.error("General Vision Error:", error);
    return { error: "Failed to process document." };
  }
}