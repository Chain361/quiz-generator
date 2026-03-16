SYSTEM CONTEXT & PROJECT SPECIFICATION

You are an expert full-stack developer building an AI-Powered Quiz Platform.

1. Tech Stack

Frontend: Next.js (App Router), TypeScript, React, Tailwind CSS, Base UI.

Backend: Next.js API Routes (Server Actions/Serverless functions).

Database & Auth: Supabase (PostgreSQL).

AI Provider: Gemini API (Official SDK).

2. Database Schema (PostgreSQL)

users: id (UUID PK), role ('TEACHER' | 'STUDENT'), email

quizzes: id (UUID PK), teacher_id (UUID FK), quiz_code (String, Unique), title, source_material_url, created_at

questions: id (UUID PK), quiz_id (UUID FK), text, topic_tag (String), options (JSONB array), correct_answer, explanation

attempts: id (UUID PK), quiz_id (UUID FK), student_id (UUID FK, Nullable), student_name (String), score (Integer), completed_at

attempt_answers: id (UUID PK), attempt_id (UUID FK), question_id (UUID FK), selected_answer, is_correct (Boolean)

3. Directory Structure

src/
├── app/
│ ├── (student)/  
│ │ ├── page.tsx # Landing page & "Enter Quiz Code" input
│ │ ├── play/[code]/page.tsx # Gamified Quiz taking UI
│ │ └── results/[attemptId]/ # Post-quiz AI insights
│ ├── (teacher)/  
│ │ ├── dashboard/page.tsx # List of created quizzes & live stats
│ │ └── create/page.tsx # (COMPLETED) PDF Upload & AI Generation
│ ├── api/  
│ │ ├── generate-quiz/route.ts # (COMPLETED) Serverless function calling Gemini
│ │ └── save-quiz/route.ts # (COMPLETED) Save quiz/questions to DB

4. Current Status

The Teacher's quiz generation loop (PDF upload, Gemini parsing, saving quiz/questions to Supabase) is COMPLETED. Do not modify or rebuild create/page.tsx, generate-quiz, or save-quiz.

Your goal is to build the remaining features: The Student Loop and the Teacher Dashboard.

INSTRUCTIONS FOR EXECUTION

Please implement the following tasks sequentially. Wait for my approval and testing after completing each task before moving on to the next one. Write clean, modular TypeScript code using Tailwind CSS for styling.

Task 1: Student Landing Page (src/app/(student)/page.tsx)

Build the entry point for students.

UI: Create a clean, responsive hero section.

Form: Include two input fields: "Enter your Name" (required) and "Enter Quiz Code" (required).

Logic: On submit, verify if the quiz_code exists in the quizzes table via Supabase.

Routing: If valid, store the student's name in local state/session storage and redirect to /play/[code]. If invalid, display a user-friendly error message.

Task 2: Gamified Quiz UI (src/app/(student)/play/[code]/page.tsx)

Build the interactive quiz experience (KanaDojo/Duolingo style).

Data Fetching: Fetch the quiz details and its associated questions based on the URL [code].

UI: \* Display a top progress bar showing completion percentage.

Show one question at a time using interactive cards.

Provide visual feedback when an option is selected.

State Management: Track the student's selected answers in React state.

Submission Logic: On the final question, calculate the score. Create a new Server Action to insert a record into the attempts table (using the student_name from Task 1), and bulk insert the answers into the attempt_answers table.

Routing: Redirect to /results/[attemptId] upon successful save.

Task 3: Post-Quiz AI Insights (src/app/(student)/results/[attemptId]/page.tsx)

Build the personalized student dashboard.

Data Fetching: Fetch the attempt details, score, and the breakdown of correct/incorrect answers from attempt_answers, joining with questions to get the topic_tag.

UI: Display the baseline score prominently (e.g., "8/10"). List the specific topics they struggled with.

AI Integration: Create an API route or server action that calls the Gemini API. Pass it the failed topic_tags. Prompt Gemini to return a short, encouraging 2-sentence actionable study recommendation for those specific topics. Display this AI insight on the page.

Task 4: Teacher Dashboard (src/app/(teacher)/dashboard/page.tsx)

Build the analytics view for teachers.

Data Fetching: Fetch all quizzes belonging to the currently authenticated teacher_id. Fetch aggregate data from attempts and attempt_answers for these quizzes.

UI:

Display a grid/list of their created quizzes with the shareable quiz_code.

For each quiz, show the total number of attempts and the average class score.

Weakest Links Feature: Group the attempt_answers data by topic_tag to visually highlight (e.g., via a simple bar chart or list) which concepts the class as a whole missed the most.
