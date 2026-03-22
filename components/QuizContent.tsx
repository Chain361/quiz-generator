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
    return <div className="cosmic-night bg-background text-foreground text-center p-10 min-h-screen flex items-center justify-center">Loading Quiz...</div>;
  }

  if (error) {
    return <div className="cosmic-night bg-background text-destructive text-center p-10 min-h-screen flex items-center justify-center">{error}</div>;
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="cosmic-night bg-background text-foreground text-center p-10 min-h-screen flex items-center justify-center">
        This quiz has no questions.
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / quiz.questions.length) * 100;

  return (
    <div className="cosmic-night flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm tracking-wide text-secondary-foreground uppercase">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
            <div key={score} className="flex items-center gap-1.5 bg-success/20 px-3 py-1 rounded-full border border-success/50 shadow-sm animate-in zoom-in duration-300">
              <span className="text-sm leading-none">⭐</span>
              <span className="font-bold text-success">
                Score: {score}
              </span>
            </div>
          </div>
          <Progress value={progress} />
        </div>
        <Card className="bg-card/40 backdrop-blur-xl border-secondary/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-primary">{quiz.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-xl font-semibold mb-4 text-foreground">{currentQuestion.text}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => {
                let variant: "default" | "outline" | "destructive" | "secondary" = "outline";
                let className = "p-4 h-auto whitespace-normal disabled:opacity-90 text-white";

                if (isChecked) {
                  if (option === currentQuestion.correct_answer) {
                    variant = "default"; // To remove default outline
                    className += " bg-success text-success-foreground hover:bg-success/90 border-success text-white opacity-100";
                  } else if (option === selectedOption) {
                    variant = "destructive";
                    className += " opacity-100";
                  } else {
                    variant = "outline";
                    className += " opacity-50 text-foreground border-secondary";
                  }
                } else {
                  if (selectedOption === option) {
                    variant = "default";
                    className += " bg-primary text-primary-foreground";
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
              <div className="mt-6 p-4 rounded-md bg-secondary border border-accent">
                <h3 className="font-semibold text-secondary-foreground mb-1">Explanation</h3>
                <p className="text-sm text-secondary-foreground">
                  {currentQuestion.explanation || "No explanation provided."}
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              {!isChecked ? (
                <Button onClick={handleCheck} disabled={!selectedOption} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Check
                </Button>
              ) : (
                <Button onClick={handleNextQuestion} disabled={isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
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
