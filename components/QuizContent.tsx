"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { submitQuiz } from "@/app/student/play/[code]/actions";

type Question = {
  id: string;
  text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
};

type Quiz = {
  id: string;
  title: string;
  questions: Question[];
};

type AnswerDetail = {
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
};

function QuizContent() {
  const params = useParams();
  const code = params.code as string;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [answerDetails, setAnswerDetails] = useState<AnswerDetail[]>([]);
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
        .select("id, title, questions(id, text, options, correct_answer, explanation)")
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
    if (!isChecked) {
      setSelectedOption(option);
    }
  };

  const handleCheck = () => {
    if (!selectedOption || !quiz) return;
    
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correct_answer;
    
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setAnswerDetails((prev) => [
      ...prev,
      {
        question_id: currentQuestion.id,
        selected_answer: selectedOption,
        is_correct: isCorrect,
      },
    ]);

    setIsChecked(true);
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < quiz!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsChecked(false);
    } else {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const studentName = sessionStorage.getItem("studentName");
    if (!quiz || !studentName) {
      setError("Could not submit quiz. Student name or quiz data is missing.");
      return;
    }

    startTransition(async () => {
      const result = await submitQuiz(quiz.id, studentName, score, answerDetails);
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
              {currentQuestion.options.map((option, index) => {
                let variant: "default" | "outline" | "destructive" | "secondary" = "outline";
                let className = "p-4 h-auto whitespace-normal";

                if (isChecked) {
                  if (option === currentQuestion.correct_answer) {
                    className += " bg-green-500 hover:bg-green-600 text-white border-green-500";
                  } else if (option === selectedOption) {
                    variant = "destructive";
                  } else {
                    variant = "outline";
                    className += " opacity-50";
                  }
                } else {
                  if (selectedOption === option) {
                    variant = "default";
                  }
                }

                return (
                  <Button
                    key={index}
                    variant={variant}
                    onClick={() => handleOptionSelect(option)}
                    className={className}
                    disabled={isChecked}
                  >
                    {option}
                  </Button>
                );
              })}
            </div>

            {isChecked && (
              <div className="mt-6 p-4 rounded-md bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Explanation</h3>
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  {currentQuestion.explanation || "No explanation provided."}
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              {!isChecked ? (
                <Button onClick={handleCheck} disabled={!selectedOption}>
                  Check
                </Button>
              ) : (
                <Button onClick={handleNextQuestion} disabled={isPending}>
                  {isPending
                    ? "Submitting..."
                    : currentQuestionIndex < quiz.questions.length - 1
                    ? "Next"
                    : "Submit"}
                </Button>
              )}
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
