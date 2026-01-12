import Link from "next/link";
import { redirect } from "next/navigation";
import { neonAuth } from "@neondatabase/auth/next/server";
import { Button } from "@/components/ui/button";

export default async function Home() {
  // Check if user is authenticated
  const { user } = await neonAuth();

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-card">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-semibold leading-10 tracking-tight text-foreground">
            Restricted
          </h1>
          <p className="max-w-md text-lg leading-8 text-muted-foreground">
            This application requires authentication to access protected routes.
          </p>
          <Button asChild className="w-full md:w-[158px]">
            <Link href="/auth/sign-in">Sign In</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
