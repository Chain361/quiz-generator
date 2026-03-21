"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function submitQuiz(
  quizId: string,
  studentName: string,
  score: number,
  answerDetails: { question_id: string; selected_answer: string; is_correct: boolean }[]
) {
  const supabase = await createClient();

  // 1. Insert attempt
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

  // 2. Insert attempt answers
  const attemptAnswers = answerDetails.map((detail) => ({
    attempt_id: attemptId,
    question_id: detail.question_id,
    selected_answer: detail.selected_answer,
    is_correct: detail.is_correct,
  }));

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
