import { withAuth } from '@workos-inc/authkit-nextjs';
import { notFound } from 'next/navigation';
import { getUserInfo, getUserMessages, getUserMessageStats } from '@/app/dashboard/actions';
import { DashboardHeader } from '@/components/dashboard-header';
import { UserMessageList } from '@/components/user-message-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface UserPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserPage({ params }: UserPageProps) {
  const { user: currentUser } = await withAuth({ ensureSignedIn: true });
  const { id } = await params;
  
  const [userInfo, messages, stats] = await Promise.all([
    getUserInfo(id),
    getUserMessages(id),
    getUserMessageStats(id),
  ]);

  if (!userInfo) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <DashboardHeader user={currentUser} />

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* User Profile Card */}
        <Card className="mb-8">
          <CardHeader>
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
                </CardTitle>
                <CardDescription>@{userInfo.username}</CardDescription>
              </div>
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
                  {stats?.firstMessage ? formatDate(stats.firstMessage) : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages List */}
        <UserMessageList initialMessages={messages} userId={id} />
      </main>
    </div>
  );
}

