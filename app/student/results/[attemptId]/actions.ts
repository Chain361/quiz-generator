"use server";

import OpenAI from "openai";

// Simple in-memory cache for recommendations (cleared on server restart)
const recommendationCache = new Map<string, string>();

export async function generateStudyRecommendation(quizTitle: string, failedTopics: string[]) {
  if (!failedTopics || failedTopics.length === 0) {
    return "Great job! You answered everything correctly. Keep up the excellent work!";
  }

  // Cache key based on sorted topics
  const cacheKey = [...failedTopics].sort().join("|");
  if (recommendationCache.has(cacheKey)) {
    return recommendationCache.get(cacheKey)!;
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
  const prompt = `Study recommendation for these topics in Thai: ${topicsList}. Give 2 sentences max, be encouraging and actionable.`;

  try {
    const completion = await qwen.chat.completions.create({
      model: "qwen3.6-plus",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 150,
    });
    const result = completion.choices[0].message.content || "Keep reviewing your study materials to improve your understanding of these topics.";
    recommendationCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error generating recommendation:", error);
    return "Keep reviewing your study materials to improve your understanding of these topics.";
  }
}
