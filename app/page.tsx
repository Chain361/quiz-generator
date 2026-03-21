import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/ui/Navbar"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <Navbar/>
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <div className="flex-1 flex flex-col gap-8 max-w-5xl p-5 items-center justify-center text-center">
          <h1 className="text-4xl font-bold">Welcome to Quiz Generator</h1>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/student">Quiz Now!</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/teacher/dashboard">Create quiz</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
