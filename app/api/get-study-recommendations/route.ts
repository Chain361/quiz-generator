import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  try {
    const { topics } = await request.json();

    if (!Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json(
        { error: "Topics array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: "API key not configured",
          recommendation:
            "Keep practicing these topics! Review the material and try again.",
        },
        { status: 200 }
      );
    }

    const topicsList = topics.join(", ");

    const prompt = `You are a helpful and encouraging educational assistant. A student struggled with the following topics on a quiz: ${topicsList}. 
    
    Provide a short, encouraging, and actionable 2-sentence study recommendation for these specific topics. Be positive and motivating while giving concrete advice on how to improve.
    
    Keep your response to exactly 2 sentences only.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const text = response.text || "";

    return NextResponse.json({
      recommendation: text,
    });
  } catch (error) {
    console.error("Error generating study recommendation:", error);

    // Return a fallback recommendation
    return NextResponse.json({
      recommendation:
        "Keep practicing these topics! Review the material and try again. You got this!",
    });
  }
}
