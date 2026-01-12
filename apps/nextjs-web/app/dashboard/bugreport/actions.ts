'use server';

import { db } from '@/lib/db';
import { bugs, bugReports } from '@/db/schema';
import { and, desc, eq, gte, ilike, or, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { neonAuth } from '@neondatabase/auth/next/server';

export type TimeFilter = 'all' | 'week' | 'month' | '3months';

function getDateFromFilter(filter: TimeFilter): Date | null {
  if (filter === 'all') return null;
  
  const now = new Date();
  switch (filter) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '3months':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

export async function getBugs(searchQuery?: string, timeFilter: TimeFilter = 'all') {
  try {
    const filterDate = getDateFromFilter(timeFilter);
    
    const searchCondition = searchQuery
      ? or(
          ilike(bugs.title, `%${searchQuery}%`),
          ilike(bugs.description, `%${searchQuery}%`)
        )
      : undefined;
    
    const dateCondition = filterDate
      ? gte(bugs.firstReportedAt, filterDate)
      : undefined;
    
    const whereCondition = searchCondition && dateCondition
      ? and(searchCondition, dateCondition)
      : searchCondition || dateCondition;

    const bugsWithReportCount = await db
      .select({
        id: bugs.id,
        title: bugs.title,
        description: bugs.description,
        firstReportedAt: bugs.firstReportedAt,
        isLlmGenerated: bugs.isLlmGenerated,
        createdAt: bugs.createdAt,
        updatedAt: bugs.updatedAt,
        reportCount: sql<number>`COUNT(${bugReports.id})::int`.as('report_count'),
      })
      .from(bugs)
      .leftJoin(bugReports, eq(bugs.id, bugReports.bugId))
      .where(whereCondition)
      .groupBy(bugs.id)
      .orderBy(desc(bugs.firstReportedAt));

    return bugsWithReportCount;
  } catch (error) {
    console.error('Error getting bugs:', error);
    return [];
  }
}

export async function getBugWithReports(bugId: string) {
  try {
    const bug = await db
      .select()
      .from(bugs)
      .where(eq(bugs.id, bugId))
      .limit(1);

    if (bug.length === 0) {
      return null;
    }

    const reports = await db
      .select()
      .from(bugReports)
      .where(eq(bugReports.bugId, bugId))
      .orderBy(desc(bugReports.reportedAt));

    return {
      ...bug[0],
      reports,
    };
  } catch (error) {
    console.error('Error getting bug with reports:', error);
    return null;
  }
}

export async function getBugReports(bugId: string) {
  try {
    const reports = await db
      .select()
      .from(bugReports)
      .where(eq(bugReports.bugId, bugId))
      .orderBy(desc(bugReports.reportedAt));

    return reports;
  } catch (error) {
    console.error('Error getting bug reports:', error);
    return [];
  }
}

export async function createBug(
  title: string,
  description: string,
  discordLink: string,
  reportedAt: Date,
  isLlmGenerated: boolean = false
) {
  const { user } = await neonAuth();

  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    const bugId = nanoid();
    const reportId = nanoid();

    // Create the bug
    await db.insert(bugs).values({
      id: bugId,
      title,
      description,
      firstReportedAt: reportedAt,
      isLlmGenerated,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create the first report
    await db.insert(bugReports).values({
      id: reportId,
      bugId,
      discordLink,
      reportedAt,
      createdBy: user.email,
      isLlmGenerated,
      createdAt: new Date(),
    });

    return { success: true, bugId };
  } catch (error) {
    console.error('Error creating bug:', error);
    throw new Error('Failed to create bug');
  }
}

export async function addBugReport(
  bugId: string,
  discordLink: string,
  reportedAt: Date,
  isLlmGenerated: boolean = false
) {
  const { user } = await neonAuth();

  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    const reportId = nanoid();

    await db.insert(bugReports).values({
      id: reportId,
      bugId,
      discordLink,
      reportedAt,
      createdBy: user.email,
      isLlmGenerated,
      createdAt: new Date(),
    });

    return { success: true, reportId };
  } catch (error) {
    console.error('Error adding bug report:', error);
    throw new Error('Failed to add bug report');
  }
}

export async function deleteBug(bugId: string) {
  const { user } = await neonAuth();

  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    // Reports will be cascade deleted due to foreign key constraint
    await db.delete(bugs).where(eq(bugs.id, bugId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting bug:', error);
    throw new Error('Failed to delete bug');
  }
}

export async function deleteBugReport(reportId: string) {
  const { user } = await neonAuth();

  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    await db.delete(bugReports).where(eq(bugReports.id, reportId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting bug report:', error);
    throw new Error('Failed to delete bug report');
  }
}

export async function updateBug(bugId: string, title: string, description: string) {
  const { user } = await neonAuth();

  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    await db
      .update(bugs)
      .set({
        title,
        description,
        updatedAt: new Date(),
      })
      .where(eq(bugs.id, bugId));

    return { success: true };
  } catch (error) {
    console.error('Error updating bug:', error);
    throw new Error('Failed to update bug');
  }
}
