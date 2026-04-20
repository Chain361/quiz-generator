import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/CopyButton";
import { SupabaseClient } from "@supabase/supabase-js";
import { Suspense } from "react";
import Navbar from "@/components/ui/Navbar"
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { deleteQuiz } from "./actions";
import { DeleteQuizButton } from "@/components/DeleteQuizButton";

async function getWeakestLinksForQuiz(quizId: string, supabase: SupabaseClient) {
    const { data: attemptIds, error: attemptsError } = await supabase
        .from('attempts')
        .select('id')
        .eq('quiz_id', quizId);

    if (attemptsError || !attemptIds) {
        console.error('Error fetching attempts for weakest links:', attemptsError);
        return [];
    }

    if (attemptIds.length === 0) {
        return [];
    }

    const ids = attemptIds.map(a => a.id);

    const { data: incorrectAnswers, error: answersError } = await supabase
        .from('attempt_answers')
        .select(`
            questions (topic_tag)
        `)
        .in('attempt_id', ids)
        .eq('is_correct', false);

    if (answersError || !incorrectAnswers) {
        console.error('Error fetching incorrect answers for weakest links:', answersError);
        return [];
    }

    const topicCounts = incorrectAnswers.reduce((acc, answer) => {
        // @ts-ignore
        const topic = answer.questions?.topic_tag;
        if (topic) {
            acc[topic] = (acc[topic] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(topicCounts)
        .map(([topic, missed]) => ({ topic, missed }))
        .sort((a, b) => b.missed - a.missed)
        .slice(0, 3); // Get top 3
}


async function DashboardContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: quizzes, error: quizzesError } = await supabase
    .from("quizzes")
    .select(
      `
      id,
      title,
      quiz_code,
      created_at,
      attempts (
        id,
        score
      ),
      questions (
        id
      )
    `
    )
    .eq("teacher_id", user.id);

  if (quizzesError) {
    console.error("Error fetching quizzes:", quizzesError);
    return <div>Error loading quizzes.</div>;
  }

  const quizzesWithStats = await Promise.all(
    quizzes.map(async (quiz) => {
      const weakestLinks = await getWeakestLinksForQuiz(quiz.id, supabase);
      const totalAttempts = quiz.attempts.length;
      const averageScore =
        totalAttempts > 0
          ? quiz.attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts
          : 0;
      const totalQuestions = quiz.questions ? quiz.questions.length : 0;

      return {
        ...quiz,
        totalAttempts,
        averageScore,
        totalQuestions,
        weakestLinks,
      };
    })
  );

  return (
    <>
      <div className="bg-secondary border border-accent py-12 px-6 rounded-2xl mb-8 mt-4 text-center">
        <h1 className="text-4xl font-bold mb-4 text-primary">Teacher Dashboard</h1>
        <p className="text-lg text-secondary-foreground mb-6 max-w-2xl mx-auto">
          Manage your quizzes, track student performance, and create new learning experiences.
        </p>
        <div className="flex flex-col items-center gap-4">
          <p className="text-md font-medium text-foreground px-4 py-2 rounded-full border border-secondary shadow-sm">
            Quizzes Created: <span className={quizzesWithStats.length >= 3 ? "text-destructive font-bold" : "text-primary font-bold"}>{quizzesWithStats.length}</span> / 3
          </p>
          {quizzesWithStats.length >= 3 ? (
            <button disabled className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-auto px-5 py-3 opacity-50 cursor-not-allowed">
              Create New Quiz (Limit Reached)
            </button>
          ) : (
            <Link
              href="/teacher/create"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-auto px-5 py-3 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Create New Quiz
            </Link>
          )}
        </div>
      </div>

      {quizzesWithStats.length === 0 && (
        <div className="text-center text-secondary-foreground mt-12">
            <h2 className="text-2xl font-semibold">No quizzes yet!</h2>
            <p className="mt-2">Upload a document to create your first quiz and see analytics here.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzesWithStats.map((quiz) => (
            <Card key={quiz.id} className="bg-card border-secondary">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-primary">{quiz.title}</CardTitle>
                    <div className="text-sm text-secondary-foreground mt-1">
                      Created: {new Date(quiz.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <DeleteQuizButton deleteAction={deleteQuiz.bind(null, quiz.id) as (formData: FormData) => void} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4 bg-secondary p-2 rounded-lg border border-accent">
                  <div className="text-center">
                    <div className="text-lg font-mono font-bold tracking-widest text-foreground">
                      {quiz.quiz_code}
                    </div>
                    <div className="text-xs text-secondary-foreground">Share Code</div>
                  </div>
                  <CopyButton textToCopy={quiz.quiz_code} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-center mb-6">
                  <div>
                    <div className="text-2xl font-bold text-foreground">{quiz.totalAttempts}</div>
                    <div className="text-sm text-secondary-foreground">Total Attempts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {quiz.averageScore.toFixed(1)} <span className="text-lg text-secondary-foreground">/ {quiz.totalQuestions}</span>
                    </div>
                    <div className="text-sm text-secondary-foreground">Avg. Score</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Weakest Links</h4>
                  {quiz.weakestLinks.length > 0 ? (
                    <ul className="space-y-2">
                        {quiz.weakestLinks.map(link => (
                        <li key={link.topic} className="flex justify-between items-center text-sm bg-accent p-2 rounded-md border border-accent">
                            <span className="font-medium text-accent-foreground truncate">{link.topic}</span>
                            <span className="font-bold text-destructive flex items-center gap-1">{link.missed} <span className="text-xs font-normal text-accent-foreground">missed</span></span>
                        </li>
                        ))}
                    </ul>
                  ) : (
                    <div className="text-center text-sm text-secondary-foreground p-4 bg-secondary rounded-md border border-accent">
                        No incorrect answers yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <main className="cosmic-night bg-background text-foreground min-h-screen">
      <Navbar/>
      <div className="container mx-auto pb-10">

        <Suspense fallback={<Spinner className="size-10 mx-auto mt-20"></Spinner>}>
          <DashboardContent />
        </Suspense>
      </div>
    </main>
  );
}