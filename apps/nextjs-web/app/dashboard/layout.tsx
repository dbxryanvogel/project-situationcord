import { neonAuth } from "@neondatabase/auth/next/server";
import { redirect } from "next/navigation";
import { SideNav } from "@/components/side-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await neonAuth();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="flex h-screen bg-background">
      <SideNav user={user} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
