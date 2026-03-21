import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/CopyButton";
import { SupabaseClient } from "@supabase/supabase-js";
import { Suspense } from "react";
import Navbar from "@/components/ui/Navbar"

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
      {quizzesWithStats.length === 0 && (
        <div className="text-center text-gray-500 mt-12">
            <h2 className="text-2xl font-semibold">No quizzes yet!</h2>
            <p className="mt-2">Create your first quiz to see analytics here.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzesWithStats.map((quiz) => (
            <Card key={quiz.id}>
              <CardHeader>
                <CardTitle className="truncate">{quiz.title}</CardTitle>
                <div className="text-sm text-gray-500">
                  Created: {new Date(quiz.created_at).toLocaleDateString()}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4 bg-gray-50 p-2 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-mono font-bold tracking-widest">
                      {quiz.quiz_code}
                    </div>
                    <div className="text-xs text-gray-500">Share Code</div>
                  </div>
                  <CopyButton textToCopy={quiz.quiz_code} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-center mb-6">
                  <div>
                    <div className="text-2xl font-bold">{quiz.totalAttempts}</div>
                    <div className="text-sm text-gray-500">Total Attempts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {quiz.averageScore.toFixed(1)} <span className="text-lg text-gray-400">/ {quiz.totalQuestions}</span>
                    </div>
                    <div className="text-sm text-gray-500">Avg. Score</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2 text-gray-800">Weakest Links</h4>
                  {quiz.weakestLinks.length > 0 ? (
                    <ul className="space-y-2">
                        {quiz.weakestLinks.map(link => (
                        <li key={link.topic} className="flex justify-between items-center text-sm bg-red-50 p-2 rounded-md">
                            <span className="font-medium text-red-800 truncate">{link.topic}</span>
                            <span className="font-bold text-red-600 flex items-center gap-1">{link.missed} <span className="text-xs font-normal">missed</span></span>
                        </li>
                        ))}
                    </ul>
                  ) : (
                    <div className="text-center text-sm text-gray-400 p-4 bg-gray-50 rounded-md">
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
    <div className="container mx-auto ">
        <Navbar/>
      <h1 className="text-3xl font-bold mb-6">Teacher Dashboard</h1>
      <Suspense fallback={<div className="text-gray-500">Loading dashboard...</div>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}