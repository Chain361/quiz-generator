import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateStudyRecommendation } from "./actions";
import Navbar from "@/components/ui/Navbar";

async function ResultsContent({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const supabase = await createClient();

  // Fetch attempt details
  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .select("*, quizzes(title, questions(id))")
    .eq("id", attemptId)
    .single();

  if (attemptError || !attempt) {
    return <div className="p-10 text-center text-red-500">Could not load quiz results.</div>;
  }

  // Fetch answers with question details
  const { data: answers, error: answersError } = await supabase
    .from("attempt_answers")
    .select("is_correct, questions(topic_tag)")
    .eq("attempt_id", attemptId);

  if (answersError) {
    return <div className="p-10 text-center text-red-500">Could not load answers.</div>;
  }

  // Type assertion for Supabase's generated generic response types 
  // since `quizzes` is a single object here, not an array.
  const totalQuestions = (attempt.quizzes as unknown as { questions: any[] })?.questions?.length || 0;
  const quizTitle = (attempt.quizzes as unknown as { title: string })?.title || "Quiz";
  const score = attempt.score;

  // Extract failed topics
  const failedTopicsSet = new Set<string>();
  answers?.forEach((answer: any) => {
    // Handle potential type mismatches (e.g. if is_correct is a string "false")
    const isCorrect = answer.is_correct === true || String(answer.is_correct).toLowerCase() === "true";
    
    if (!isCorrect) {
      const topicTag = Array.isArray(answer.questions) ? answer.questions[0]?.topic_tag : answer.questions?.topic_tag;
      if (topicTag) {
        failedTopicsSet.add(topicTag);
      }
    }
  });

  let failedTopics = Array.from(failedTopicsSet);

  // Fallback: if they didn't get a perfect score but we couldn't extract specific topics
  if (failedTopics.length === 0 && score < totalQuestions) {
    failedTopics.push("General Review");
  }

  const aiInsight = await generateStudyRecommendation(failedTopics);

  return (
    <main>
      <Navbar/>
      <Card className="w-full max-w-2xl shadow-xl border-t-4 border-t-blue-500">
        <CardHeader className="bg-blue-50/50 dark:bg-blue-900/20 border-b border-gray-100 dark:border-gray-800 pb-6">
          <CardTitle className="text-3xl text-center font-bold text-gray-800 dark:text-white">Quiz Results</CardTitle>
          <p className="text-center text-gray-500 dark:text-gray-400 mt-2 font-medium">
            {quizTitle}
          </p>
        </CardHeader>
        <CardContent className="space-y-8 pt-8">
          <div className="text-center bg-white dark:bg-gray-800 py-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Final Score</p>
            <h2 className="text-6xl font-black text-blue-600 dark:text-blue-400 flex items-baseline justify-center">
              {score} <span className="text-3xl text-gray-300 dark:text-gray-600 mx-2">/</span> <span className="text-4xl text-gray-800 dark:text-gray-200">{totalQuestions}</span>
            </h2>
            <p className="text-lg mt-4 font-medium text-gray-600 dark:text-gray-300">
              Student: <span className="text-gray-900 dark:text-white">{attempt.student_name}</span>
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-2xl shadow-inner border border-blue-100 dark:border-blue-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <h3 className="text-xl font-bold mb-3 text-blue-800 dark:text-blue-300 flex items-center">
              <span className="text-2xl mr-2">💡</span> AI Study Insight
            </h3>
            <p className="text-blue-900 dark:text-blue-100 leading-relaxed">
              {aiInsight}
            </p>
          </div>

          {failedTopics.length > 0 && (
            <div className="px-2">
              <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200 border-b pb-2">Topics to Review</h3>
              <div className="flex flex-wrap gap-2">
                {failedTopics.map((topic, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800/50">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function ResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Suspense fallback={<div className="text-blue-500 text-lg font-semibold">Loading results...</div>}>
        <ResultsContent params={params} />
      </Suspense>
    </div>
  );
}