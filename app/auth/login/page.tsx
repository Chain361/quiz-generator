import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <div className="cosmic-night flex min-h-svh w-full items-center justify-center bg-background text-foreground p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
