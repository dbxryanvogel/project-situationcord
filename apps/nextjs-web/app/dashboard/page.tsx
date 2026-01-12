import { redirect } from "next/navigation";

// Redirect root dashboard to message log
export default function DashboardPage() {
  redirect("/dashboard/messagelog");
}
