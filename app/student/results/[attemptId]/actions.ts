"use server";

import { GoogleGenAI } from "@google/genai";

export async function generateStudyRecommendation(failedTopics: string[]) {
  if (!failedTopics || failedTopics.length === 0) {
    return "Great job! You answered everything correctly. Keep up the excellent work!";
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set.");
    return "Keep reviewing your study materials to improve your understanding of these topics.";
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `A student just took a quiz and struggled with the following topics: ${failedTopics.join(", ")}. Please provide a short, encouraging 2-sentence actionable study recommendation for these specific topics.`;

  try {
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return response.text || "Keep reviewing your study materials to improve your understanding of these topics.";
  } catch (error) {
    console.error("Error generating recommendation:", error);
    return "Keep reviewing your study materials to improve your understanding of these topics.";
  }
}
