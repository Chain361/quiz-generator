"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { submitQuiz } from "./actions";

type Question = {
  id: string;
  text: string;
  options: string[];
};

type Quiz = {
  id: string;
  title: string;
  questions: Question[];
};

function QuizContent() {
  const params = useParams();
  const code = params.code as string;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!code) return;
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("quizzes")
        .select("id, title, questions(id, text, options)")
        .eq("quiz_code", code)
        .single();

      if (error || !data) {
        setError("Failed to fetch quiz. The quiz code might be invalid.");
        setLoading(false);
        return;
      }

      // Supabase returns questions as a nested array, let's fix that
      const formattedQuiz = {
        ...data,
        questions: data.questions || [],
      };

      setQuiz(formattedQuiz as Quiz);
      setLoading(false);
    };

    fetchQuiz();
  }, [code, supabase]);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  const handleNextQuestion = async () => {
    if (selectedOption) {
      const currentQuestionId = quiz!.questions[currentQuestionIndex].id;
      const newSelectedAnswers = {
        ...selectedAnswers,
        [currentQuestionId]: selectedOption,
      };
      setSelectedAnswers(newSelectedAnswers);
      setSelectedOption(null);

      if (currentQuestionIndex < quiz!.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        await handleSubmit(newSelectedAnswers);
      }
    }
  };

  const handleSubmit = async (finalAnswers: Record<string, string>) => {
    const studentName = sessionStorage.getItem("studentName");
    if (!quiz || !studentName) {
      setError("Could not submit quiz. Student name or quiz data is missing.");
      return;
    }

    startTransition(async () => {
      const result = await submitQuiz(quiz.id, finalAnswers, studentName);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  if (loading) {
    return <div className="text-center p-10">Loading Quiz...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="text-center p-10">
        This quiz has no questions.
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / quiz.questions.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-4">
          <p className="text-center mb-2">{`Question ${currentQuestionIndex + 1} of ${quiz.questions.length}`}</p>
          <Progress value={progress} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{quiz.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-xl font-semibold mb-4">{currentQuestion.text}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedOption === option ? "default" : "outline"}
                  onClick={() => handleOptionSelect(option)}
                  className="p-4 h-auto whitespace-normal"
                >
                  {option}
                </Button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleNextQuestion} disabled={!selectedOption || isPending}>
                {isPending
                  ? "Submitting..."
                  : currentQuestionIndex < quiz.questions.length - 1
                  ? "Next"
                  : "Submit"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PlayQuizPage() {
  return (
    <Suspense fallback={<div className="text-center p-10">Loading Quiz...</div>}>
      <QuizContent />
    </Suspense>
  );
}
