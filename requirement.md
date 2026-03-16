🧠 AI-Powered Quiz Platform: Project Specification

1. Core Vision

A Single Page Application (SPA) designed to solve the teacher pain point of conducting quick, post-session knowledge checks. Educators can automatically generate quizzes from PDF class materials and share a unique "Quiz Code" with their class. Students use this code to take a gamified, multiple-choice quiz (inspired by KanaDojo and Duolingo) to instantly discover which topics they didn't understand.

2. Feature Breakdown

👤 Student / User Loop:

Enter Quiz Code: Student arrives at the app and enters a unique, short code provided by the teacher.

Take Quiz: Complete a quick, interactive multiple-choice quiz.

View Immediate Results: See their baseline score.

AI Insight: View a personalized post-quiz dashboard detailing weak topics with actionable study recommendations (e.g., 'You scored 40% on Photosynthesis, we recommend reviewing Chapter 3').

🎓 Creator / Teacher Loop:

Upload Material: Teacher uploads a PDF class material (syllabus, slides, or textbook chapter) immediately after a session.

AI Generation: The system parses the PDF and generates a structured quiz (Questions, Multiple Choices, Correct Answer, Topic Tag).

Generate Code: The system creates a unique, shareable Quiz Code (e.g., "XYZ-123") to display to the class.

Live Dashboard: View overall class insights to instantly see which topics the students are struggling with the most.

3. Finalized Architecture

All libraries and frameworks selected are free/open-source.

Frontend: Next.js (App Router), TypeScript, React, Tailwind CSS, Base UI.

Backend/Database: \* Database: PostgreSQL (Hosted via Supabase for free open-source BaaS).

Backend Logic: Next.js API Routes (Serverless functions) to keep it a single codebase, OR FastAPI (Python) if a dedicated microservice is preferred later.

AI Provider: Gemini API (Using the official SDK).

Database Schema (PostgreSQL)

users (Handled by Supabase Auth)
id (UUID, PK)

role (Enum: 'TEACHER', 'STUDENT')

email (String)

quizzes
id (UUID, PK)

teacher_id (UUID, FK to users)

quiz_code (String, Unique, e.g., "XYZ-123")

title (String)

source_material_url (String, Supabase Storage URL)

created_at (Timestamp)

questions
id (UUID, PK)

quiz_id (UUID, FK to quizzes)

text (String)

topic_tag (String) - Crucial for AI Insights later

options (JSONB) - Array of strings

correct_answer (String)

explanation (String) - Optional: AI generated explanation

attempts (Student Sessions)
id (UUID, PK)

quiz_id (UUID, FK to quizzes)

student_id (UUID, FK to users, Nullable for anonymous guests)

student_name (String)

score (Integer)

completed_at (Timestamp)

attempt_answers
id (UUID, PK)

attempt_id (UUID, FK to attempts)

question_id (UUID, FK to questions)

selected_answer (String)

is_correct (Boolean)

Next.js Application Structure
Using the App Router, we will organize the application into distinct route groups for the two core user loops:

src/
├── app/
│ ├── (student)/ # Student Loop
│ │ ├── page.tsx # Landing page & "Enter Quiz Code" input
│ │ ├── play/[code]/page.tsx # Gamified Quiz taking UI
│ │ └── results/[attemptId]/ # Post-quiz AI insights & weak topics
│ ├── (teacher)/ # Teacher Loop
│ │ ├── dashboard/page.tsx # List of created quizzes & live stats
│ │ └── create/page.tsx # PDF Upload & AI Generation loading screen
│ ├── api/  
│ │ ├── generate-quiz/route.ts # Serverless function calling Gemini
│ │ └── save-quiz/route.ts # Save quiz and questions to DB
├── components/
│ ├── ui/ # Base UI + Tailwind components
│ ├── quiz/ # Interactive quiz cards, progress bars
│ └── dashboard/ # Charts for class insights
└── lib/
├── supabase/ # Database client
└── gemini/ # AI prompt definitions and SDK setup

Current Status:
1.unknown RLS problem for authenticated role.Solution: Created new Supabase client with service_role api key with located at /app/lib/supabase/admin.ts and set policy of table quizzes and questions to allowed service_role.  
2.save-quiz/route.ts works with new RLS policies.
3.created file structure of student loop but not implemented yet
4.currently working on src/app/teacher/create/page.tsx
5.teacher/dashboard/page.tsx not implemented yet
