"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function StudentForm() {
  const [name, setName] = useState("");
  const [quizCode, setQuizCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleQuizStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const supabase = createClient();

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
    <div className="cosmic-night flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md bg-card border-secondary">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-primary">
            Join a Quiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQuizStart} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-input border-secondary text-foreground placeholder:text-secondary-foreground/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiz-code" className="text-foreground">Quiz Code</Label>
              <Input
                id="quiz-code"
                placeholder="Enter quiz code"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value)}
                required
                className="bg-input border-secondary text-foreground placeholder:text-secondary-foreground/60"
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Start Quiz
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
