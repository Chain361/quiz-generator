"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type SelectedAnswers = Record<string, string>;

export async function submitQuiz(
  quizId: string,
  selectedAnswers: SelectedAnswers,
  studentName: string
) {
  const supabase = await createClient();

  // 1. Fetch questions to get correct answers
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("id, correct_answer")
    .eq("quiz_id", quizId);

  if (questionsError) {
    console.error("Error fetching questions for score calculation:", questionsError);
    return { error: "Could not fetch quiz questions." };
  }

  // 2. Calculate score
  let score = 0;
  const answerIsCorrect: Record<string, boolean> = {};
  for (const question of questions) {
    const selected = selectedAnswers[question.id];
    const correct = question.correct_answer;
    const isCorrect = selected === correct;
    if (isCorrect) {
      score++;
    }
    answerIsCorrect[question.id] = isCorrect;
  }

  // 3. Insert attempt
  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .insert({
      quiz_id: quizId,
      student_name: studentName,
      score: score,
    })
    .select("id")
    .single();

  if (attemptError) {
    console.error("Error inserting attempt:", attemptError);
    return { error: "Could not save your attempt." };
  }

  const attemptId = attempt.id;

  // 4. Insert attempt answers
  const attemptAnswers = Object.entries(selectedAnswers).map(
    ([question_id, selected_answer]) => ({
      attempt_id: attemptId,
      question_id: question_id,
      selected_answer: selected_answer,
      is_correct: answerIsCorrect[question_id] || false,
    })
  );

  const { error: attemptAnswersError } = await supabase
    .from("attempt_answers")
    .insert(attemptAnswers);

  if (attemptAnswersError) {
    console.error("Error inserting attempt answers:", attemptAnswersError);
    // Maybe delete the attempt here? For now, just log it.
    return { error: "Could not save your answers." };
  }

  revalidatePath(`/student/results/${attemptId}`);
  redirect(`/student/results/${attemptId}`);
}
