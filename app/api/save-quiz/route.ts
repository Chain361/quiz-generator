import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin'; // Assumes you have standard Next.js @ alias setup
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    
    // 1. Use the standard client to get the user from cookies
    const supabaseAuth = await createClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. You must be logged in to save a quiz.' }, { status: 401 });
    }

    const body = await req.json();
    const { quiz, storageBucket, storagePath } = body;

    // Generate a 6-character random alphanumeric code (e.g., "A8B2X9")
    const quizCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 2. Insert the Quiz using the admin client to bypass RLS
    const { data: insertedQuiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .insert({
        teacher_id: user.id,
        quiz_code: quizCode,
        title: quiz.title,
      })
      .select()
      .single();

    if (quizError) throw quizError;
      
    
    // 2. Format and Insert the Questions
    const questionsToInsert = quiz.questions.map((q: any) => ({
      quiz_id: insertedQuiz.id,
      text: q.text,
      topic_tag: q.topic_tag,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation
    }));

    const { error: questionsError } = await supabaseAdmin
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) {
      // Manual rollback: Delete the inserted quiz if questions fail to save
      console.warn("Questions insertion failed, rolling back quiz creation...");
      await supabaseAdmin.from('quizzes').delete().eq('id', insertedQuiz.id);
      throw questionsError;
    }

    // If a storage path was provided, attempt to remove the uploaded PDF now that quiz is saved
    if (storageBucket && storagePath) {
      try {
        const { error: removeError } = await supabaseAdmin.storage.from(storageBucket).remove([storagePath]);
        if (removeError) console.warn('Failed to delete uploaded PDF:', removeError);
      } catch (remErr) {
        console.warn('Error deleting uploaded PDF:', remErr);
      }
    }

    // Return success and the shareable code
    return NextResponse.json({ success: true, quizCode: quizCode });

  } catch (error: any) {
    console.error("Database save error:", error);
    return NextResponse.json({ error: error.message || "Failed to save quiz to database" }, { status: 500 });
  }
}