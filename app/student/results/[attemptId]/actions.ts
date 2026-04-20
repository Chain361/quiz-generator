"use server";

import OpenAI from "openai";

export async function generateStudyRecommendation(quizTitle: string, failedTopics: string[]) {
  if (!failedTopics || failedTopics.length === 0) {
    return "Great job! You answered everything correctly. Keep up the excellent work!";
  }

  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    console.error("DASHSCOPE_API_KEY is not set.");
    return "Keep reviewing your study materials to improve your understanding of these topics.";
  }

  // Initialize Qwen client
  const qwen = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://coding-intl.dashscope.aliyuncs.com/v1",
  });

  const topicsList = failedTopics.join(", ");
  const prompt = `You are a helpful and encouraging educational assistant. A student struggled with the following topics on a quiz titled "${quizTitle}": ${topicsList}.
    
    Provide a short, encouraging, and actionable 2-sentence study recommendation for these specific topics in Thai. Be positive and motivating while giving concrete advice on how to improve.
    
    Keep your response to exactly 2 sentences only.`;

  try {
    const completion = await qwen.chat.completions.create({
      model: "qwen3.6-plus",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
    return completion.choices[0].message.content || "Keep reviewing your study materials to improve your understanding of these topics.";
  } catch (error) {
    console.error("Error generating recommendation:", error);
    return "Keep reviewing your study materials to improve your understanding of these topics.";
  }
}
