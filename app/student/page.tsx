import Navbar from "@/components/ui/Navbar";
import StudentForm from "@/components/StudentForm";

export default function StudentPage() {
  return(
    <main className="cosmic-night bg-background text-foreground min-h-screen">
      <Navbar/>
      <StudentForm/>
    </main>
  );
}
