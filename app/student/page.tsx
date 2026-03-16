"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function StudentPage() {
  const [name, setName] = useState("");
  const [quizCode, setQuizCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleQuizStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !quizCode) {
      setError("Please enter your name and a quiz code.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("id")
        .eq("quiz_code", quizCode)
        .single();

      if (error || !data) {
        setError("Invalid quiz code. Please check and try again.");
        return;
      }

      sessionStorage.setItem("studentName", name);
      router.push(`/student/play/${quizCode}`);
    } catch (err) {
      console.error("Error verifying quiz code:", err);
      setError("An unexpected error occurred. Please try again later.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Join a Quiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQuizStart} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiz-code">Quiz Code</Label>
              <Input
                id="quiz-code"
                placeholder="Enter quiz code"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full">
              Start Quiz
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
