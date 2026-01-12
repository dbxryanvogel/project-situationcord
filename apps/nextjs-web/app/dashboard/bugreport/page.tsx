import { Suspense } from "react";
import { getBugs } from "./actions";
import type { TimeFilter } from "./actions";
import { BugReportClient } from "./bug-report-client";
import { Skeleton } from "@/components/ui/skeleton";

interface BugReportPageProps {
  searchParams: Promise<{ q?: string; time?: TimeFilter }>;
}

export default async function BugReportPage({ searchParams }: BugReportPageProps) {
  const { q: searchQuery, time: timeFilter } = await searchParams;
  const validTimeFilter: TimeFilter = ['all', 'week', 'month', '3months'].includes(timeFilter || '') 
    ? (timeFilter as TimeFilter) 
    : 'all';
  const bugs = await getBugs(searchQuery, validTimeFilter);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-foreground">Bug Reports</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage bug reports from users
        </p>
      </div>

      <Suspense fallback={<BugReportSkeleton />}>
        <BugReportClient 
          bugs={bugs} 
          initialSearchQuery={searchQuery || ""} 
          initialTimeFilter={validTimeFilter}
        />
      </Suspense>
    </div>
  );
}

function BugReportSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
      </div>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}
