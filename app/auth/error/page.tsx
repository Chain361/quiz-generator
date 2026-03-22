import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <p className="text-sm text-destructive">
          Code error: {params.error}
        </p>
      ) : (
        <p className="text-sm text-secondary-foreground">
          An unspecified error occurred.
        </p>
      )}
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <div className="cosmic-night flex min-h-svh w-full items-center justify-center bg-background text-foreground p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="bg-card border-secondary shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">
                Sorry, something went wrong.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense>
                <ErrorContent searchParams={searchParams} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
