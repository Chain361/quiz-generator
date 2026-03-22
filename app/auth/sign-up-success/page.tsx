import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="cosmic-night flex min-h-svh w-full items-center justify-center bg-background text-foreground p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="bg-card border-secondary shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">
                Thank you for signing up!
              </CardTitle>
              <CardDescription className="text-secondary-foreground">Check your email to confirm</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">
                You&apos;ve successfully signed up. Please check your email to
                confirm your account before signing in.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
