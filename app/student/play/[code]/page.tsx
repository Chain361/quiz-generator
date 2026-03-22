import Navbar from "@/components/ui/Navbar";
import PlayQuizPage from "@/components/QuizContent"

export default function QuizPage() {
  return (
    <main className="cosmic-night bg-background text-foreground min-h-screen">
      <Navbar/>
      <PlayQuizPage/>
    </main>
  );
}
