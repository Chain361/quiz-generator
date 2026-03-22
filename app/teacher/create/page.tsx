import CreateQuiz from "@/components/CreateQuiz";
import Navbar from "@/components/ui/Navbar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CreateQuizPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("file_uploaded")
    .eq("id", user.id)
    .maybeSingle();

  if (userData && userData.file_uploaded >= 3) {
    redirect("/teacher/dashboard");
  }

  return(
    <main className="cosmic-night bg-background text-foreground min-h-screen">
      <Navbar/>
      <CreateQuiz/>
    </main>
  );
}