import CreateQuiz from "@/components/CreateQuiz";
import Navbar from "@/components/ui/Navbar";

export default async function CreateQuizPage() {

  return(
    <main className="cosmic-night bg-background text-foreground min-h-screen">
      <Navbar/>
      <CreateQuiz/>
    </main>
  );
}