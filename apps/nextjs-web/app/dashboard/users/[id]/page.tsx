import { notFound } from "next/navigation";
import { getUserInfo, getUserMessages, getUserMessageStats, checkIfUserIsIgnored } from "@/app/dashboard/actions";
import { UserMessageList } from "@/components/user-message-list";
import { IgnoreUserButton } from "@/components/ignore-user-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface UserPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params;
  
  const [userInfo, messages, stats, isIgnored] = await Promise.all([
    getUserInfo(id),
    getUserMessages(id),
    getUserMessageStats(id),
    checkIfUserIsIgnored(id),
  ]);

  if (!userInfo) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href="/dashboard/messagelog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Message Log
        </Link>
        <h1 className="text-3xl font-semibold text-foreground">User Profile</h1>
        <p className="text-muted-foreground mt-1">View user details and message history</p>
      </div>

      {/* User Profile Card */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {userInfo.avatarUrl && (
                <img
                  src={userInfo.avatarUrl}
                  alt={userInfo.displayName || userInfo.username}
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <CardTitle className="flex items-center gap-2">
                  {userInfo.displayName || userInfo.username}
                  {userInfo.bot && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                      BOT
                    </span>
                  )}
                  {isIgnored && (
                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                      IGNORED
                    </span>
                  )}
                </CardTitle>
                <CardDescription>@{userInfo.username}</CardDescription>
              </div>
            </div>
            <IgnoreUserButton 
              userId={id} 
              username={userInfo.username} 
              isIgnored={isIgnored} 
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
              <div className="text-sm text-muted-foreground">Total Messages</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.channelMessages || 0}</div>
              <div className="text-sm text-muted-foreground">In Channels</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.threadMessages || 0}</div>
              <div className="text-sm text-muted-foreground">In Threads</div>
            </div>
            <div>
              <div className="text-sm font-medium">First Message</div>
              <div className="text-xs text-muted-foreground">
                {stats?.firstMessage ? formatDate(stats.firstMessage) : "N/A"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <UserMessageList initialMessages={messages} userId={id} />
    </div>
  );
}
