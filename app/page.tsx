import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/ui/Navbar"
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Github } from "@mynaui/icons-react";

export default function Home() {
  return (
    <main className="cosmic-night min-h-screen flex flex-col items-center bg-background text-foreground">
      <Navbar/>
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <div className="flex-1 flex flex-col gap-4 max-w-5xl p-5 items-center justify-center text-center">
          <div className="flex justify-between w-full items-center">
            <div className="text-left align-middle">
              <h1 className="text-4xl font-bold text-foreground">Welcome to Quiz Generator</h1>
              <p className="mt-1 text-blue-300 opacity-75">Made by @Chain361 🤯</p>
            </div>
            
            <a href="https://github.com/Chain361/quiz-generator" target="_blank" rel="noopener noreferrer">
              <Github className="hover:bg-secondary hover:cursor-pointer rounded-full w-10 h-10 transition duration-150 ease-in-out text-primary"></Github>
            </a>
          </div>
          
          
          <Card className="max-w-2xl p-5 shadow-lg bg-card border-secondary border static">
            <CardDescription>
              <CardTitle className="text-lg antialiased text-left font-normal text-card-foreground">Quiz Generator was created to solve the teacher pain point of conducting quick, post-session knowledge checks. Educators can automatically generate quizzes from PDF class materials and share a unique "Quiz Code" with their class. Students use this code to take a gamified, multiple-choice quiz to instantly discover which topics they didn't understand.</CardTitle>
            </CardDescription>
          </Card>
          <div className="text-left w-full">
            <p className="mt-1 text-blue-300 opacity-75">Example email: t@t.com</p>
            <p className="mt-1 text-blue-300 opacity-75">Example password: 123</p>
            <p className="mt-1 text-blue-300 opacity-75">Example Quiz Code: QDZZ1D</p>
          </div>
          <div className="flex gap-4 mt-5">
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 py-7 px-9 text-lg">
              <Link href="/student">Quiz Now!</Link>
            </Button>
            <Button asChild variant="outline" className="border-secondary text-secondary-foreground hover:bg-secondary  py-7 px-9 text-lg">
              <Link href="/teacher/dashboard">Create quiz</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
