import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/ui/Navbar"
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Github } from "@mynaui/icons-react";
import bgImage from "./bg.jpg";

export default function Home() {
  return (
    <main className="cosmic-night relative min-h-screen flex flex-col items-center text-foreground overflow-hidden">
      <div className="absolute inset-0 z-[-1]">
        <Image
          src={bgImage}
          alt="Classroom Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-background/80 dark:bg-background/90 transition-colors duration-300"></div>
      </div>

      <Navbar/>
      <div className="relative z-10 flex-1 w-full flex flex-col gap-20 items-center">
        <div className="flex-1 flex flex-col gap-4 max-w-5xl p-5 items-center justify-center text-center">
          <div className="flex justify-between w-full items-center">
            <div className="text-left align-middle">
              <h1 className="text-7xl font-bold text-foreground">Learn. Recall. Review.</h1>
              <p className="mt-5 text-blue-300 text-2xl opacity-75 text-center">🔰 by The Survey Corps 🔰</p>
            </div>
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
