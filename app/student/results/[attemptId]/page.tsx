import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateStudyRecommendation } from "./actions";
import Navbar from "@/components/ui/Navbar";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function ResultsContent({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const supabase = await createClient();

  // Fetch attempt details and answers in parallel
  const [attemptRes, answersRes] = await Promise.all([
    supabase
      .from("attempts")
      .select("*, quizzes(title, questions(id))")
      .eq("id", attemptId)
      .single(),
    supabase
      .from("attempt_answers")
      .select("is_correct, questions(topic_tag)")
      .eq("attempt_id", attemptId),
  ]);

  const { data: attempt, error: attemptError } = attemptRes;
  const { data: answers, error: answersError } = answersRes;

  if (attemptError || !attempt) {
    return <div className="p-10 text-center text-destructive">Could not load quiz results.</div>;
  }

  if (answersError) {
    return <div className="p-10 text-center text-destructive">Could not load answers.</div>;
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

  const aiInsight = await generateStudyRecommendation(quizTitle, failedTopics);

  return (
    <Card className="w-full max-w-2xl shadow-xl border-t-4 border-t-primary">
      <CardHeader className="bg-card/50 border-b border-secondary pb-6">
        <CardTitle className="text-3xl text-center font-bold text-primary">Quiz Results</CardTitle>
        <p className="text-center text-secondary-foreground mt-2 font-medium">
          {quizTitle}
        </p>
      </CardHeader>
      <CardContent className="space-y-8 pt-8">
        <div className="text-center bg-card py-6 rounded-2xl shadow-sm border border-secondary">
          <p className="text-sm font-semibold text-secondary-foreground uppercase tracking-wider mb-2">Final Score</p>
          <h2 className="text-6xl font-black text-primary flex items-baseline justify-center">
            {score} <span className="text-3xl text-secondary-foreground mx-2">/</span> <span className="text-4xl text-foreground">{totalQuestions}</span>
          </h2>
          <p className="text-lg mt-4 font-medium text-secondary-foreground">
            Student: <span className="text-foreground">{attempt.student_name}</span>
          </p>
        </div>

        <div className="bg-secondary p-6 rounded-2xl shadow-inner border border-accent relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <h3 className="text-xl font-bold mb-3 text-secondary-foreground flex items-center">
            <span className="text-2xl mr-2">💡</span> AI Study Insight
          </h3>
          <p className="text-secondary-foreground leading-relaxed">
            {aiInsight}
          </p>
        </div>
        <div className="w-full flex justify-center">
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/">Back To Homepage</Link>
          </Button>
        </div>

        {failedTopics.length > 0 && (
          <div className="px-2">
            <h3 className="text-lg font-bold mb-4 text-foreground border-b border-secondary pb-2">Topics to Review</h3>
            <div className="flex flex-wrap gap-2">
              {failedTopics.map((topic, index) => (
                <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-accent text-accent-foreground border border-accent">
                  <span className="w-2 h-2 rounded-full bg-destructive mr-2"></span>
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  return (
    <main className="cosmic-night bg-background text-foreground min-h-screen">
      <Navbar/>
      <div className="cosmic-night flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Suspense fallback={<div className="text-primary text-lg font-semibold">Loading results...</div>}>
          <ResultsContent params={params} />
        </Suspense>
      </div>
    </main>
  );
}