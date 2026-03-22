"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteQuiz(quizId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // First, verify the user owns the quiz
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("id, teacher_id")
    .eq("id", quizId)
    .single();

  if (quizError || !quiz) {
    console.error("Error fetching quiz for deletion:", quizError);
    return { error: "Quiz not found or you don't have permission to delete it." };
  }

  if (quiz.teacher_id !== user.id) {
    return { error: "You are not authorized to delete this quiz." };
  }

  // Find all attempts for this quiz to delete them and their answers
  const { data: attempts, error: fetchAttemptsError } = await supabase
    .from("attempts")
    .select("id")
    .eq("quiz_id", quizId);

  if (fetchAttemptsError) {
    console.error("Error fetching attempts for deletion:", fetchAttemptsError);
    return { error: "Failed to fetch attempts for the quiz." };
  }

  if (attempts && attempts.length > 0) {
    const attemptIds = attempts.map((a) => a.id);

    // Delete attempt answers
    const { error: attemptAnswersError } = await supabase
      .from("attempt_answers")
      .delete()
      .in("attempt_id", attemptIds);

    if (attemptAnswersError) {
      console.error("Error deleting attempt answers:", attemptAnswersError);
      return { error: "Failed to delete attempt answers for the quiz." };
    }

    // Delete attempts
    const { error: deleteAttemptsError } = await supabase
      .from("attempts")
      .delete()
      .eq("quiz_id", quizId);

    if (deleteAttemptsError) {
      console.error("Error deleting attempts:", deleteAttemptsError);
      return { error: "Failed to delete attempts for the quiz." };
    }
  }

  // Delete associated questions
  const { error: questionsError } = await supabase
    .from("questions")
    .delete()
    .eq("quiz_id", quizId);

  if (questionsError) {
    console.error("Error deleting questions:", questionsError);
    return { error: "Failed to delete questions for the quiz." };
  }

  // Delete the quiz itself
  const { error: deleteQuizError } = await supabase
    .from("quizzes")
    .delete()
    .eq("id", quizId);

  if (deleteQuizError) {
    console.error("Error deleting quiz:", deleteQuizError);
    return { error: "Failed to delete the quiz." };
  }

  // Decrement the user's file_uploaded count
  const { data: userData, error: userError } = await supabase
    .from("users")
    // @ts-ignore
    .select("file_uploaded")
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    console.error("Error fetching user for count update:", userError);
    // Continue even if this fails, as the core deletion is done.
  } else {
    const currentCount = userData.file_uploaded || 0;
    const { error: updateUserError } = await supabase
      .from("users")
      .update({ file_uploaded: Math.max(0, currentCount - 1) })
      .eq("id", user.id);

    if (updateUserError) {
      console.error("Error updating user file count:", updateUserError);
    }
  }

  revalidatePath("/teacher/dashboard");
  return { success: "Quiz deleted successfully." };
}
