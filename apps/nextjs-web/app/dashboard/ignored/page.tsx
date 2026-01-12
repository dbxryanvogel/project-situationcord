import { neonAuth } from "@neondatabase/auth/next/server";
import { redirect } from "next/navigation";
import { getIgnoredUsers } from "@/app/dashboard/actions";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UserX } from "lucide-react";
import Link from "next/link";
import { IgnoreUserButton } from "@/components/ignore-user-button";

export default async function IgnoredUsersPage() {
  const { user: currentUser } = await neonAuth();
  
  if (!currentUser) {
    redirect("/auth/sign-in");
  }

  const ignoredUsers = await getIgnoredUsers();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <DashboardHeader user={currentUser} />

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Ignored Users
            </CardTitle>
            <CardDescription>
              Users on this list are hidden from the message log and won't trigger Customer.io alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ignoredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UserX className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No ignored users</p>
                <p className="text-sm mt-1">Users you ignore will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ignoredUsers.map((ignored) => (
                  <div
                    key={ignored.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {ignored.user.avatarUrl && (
                        <Link href={`/dashboard/users/${ignored.userId}`}>
                          <img
                            src={ignored.user.avatarUrl}
                            alt={ignored.user.displayName || ignored.user.username}
                            className="w-12 h-12 rounded-full flex-shrink-0"
                          />
                        </Link>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/dashboard/users/${ignored.userId}`}
                          className="hover:underline"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold truncate">
                              {ignored.user.displayName || ignored.user.username}
                            </span>
                            {ignored.user.bot && (
                              <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                                BOT
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            @{ignored.user.username}
                          </p>
                        </Link>
                        <div className="text-xs text-muted-foreground mt-1">
                          {ignored.reason && (
                            <p className="italic mb-1">"{ignored.reason}"</p>
                          )}
                          <p>
                            Ignored by {ignored.ignoredBy || "Unknown"} on{" "}
                            {formatDate(ignored.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <IgnoreUserButton
                        userId={ignored.userId}
                        username={ignored.user.username}
                        isIgnored={true}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {ignoredUsers.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              <strong>Note:</strong> Ignored users' messages are still processed and stored in the
              database. They are only hidden from the dashboard and won't trigger high-severity
              alerts.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
