import CreateQuiz from "@/components/CreateQuiz";
import Navbar from "@/components/ui/Navbar";

export const dynamic = "force-dynamic";


export default function CreateQuizPage() {

  return(
    <main className="cosmic-night bg-background text-foreground min-h-screen">
      <Navbar/>
      <CreateQuiz/>
    </main>
  );
}