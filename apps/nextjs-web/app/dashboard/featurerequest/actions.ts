'use server';

import { db } from '@/lib/db';
import { featureRequests, featureRequestReports } from '@/db/schema';
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

export async function getFeatureRequests(searchQuery?: string, timeFilter: TimeFilter = 'all') {
  try {
    const filterDate = getDateFromFilter(timeFilter);
    
    const searchCondition = searchQuery
      ? or(
          ilike(featureRequests.title, `%${searchQuery}%`),
          ilike(featureRequests.description, `%${searchQuery}%`)
        )
      : undefined;
    
    const dateCondition = filterDate
      ? gte(featureRequests.firstRequestedAt, filterDate)
      : undefined;
    
    const whereCondition = searchCondition && dateCondition
      ? and(searchCondition, dateCondition)
      : searchCondition || dateCondition;

    const featuresWithReportCount = await db
      .select({
        id: featureRequests.id,
        title: featureRequests.title,
        description: featureRequests.description,
        firstRequestedAt: featureRequests.firstRequestedAt,
        isLlmGenerated: featureRequests.isLlmGenerated,
        createdAt: featureRequests.createdAt,
        updatedAt: featureRequests.updatedAt,
        reportCount: sql<number>`COUNT(${featureRequestReports.id})::int`.as('report_count'),
      })
      .from(featureRequests)
      .leftJoin(featureRequestReports, eq(featureRequests.id, featureRequestReports.featureId))
      .where(whereCondition)
      .groupBy(featureRequests.id)
      .orderBy(desc(featureRequests.firstRequestedAt));

    return featuresWithReportCount;
  } catch (error) {
    console.error('Error getting feature requests:', error);
    return [];
  }
}

export async function getFeatureRequestWithReports(featureId: string) {
  try {
    const feature = await db
      .select()
      .from(featureRequests)
      .where(eq(featureRequests.id, featureId))
      .limit(1);

    if (feature.length === 0) {
      return null;
    }

    const reports = await db
      .select()
      .from(featureRequestReports)
      .where(eq(featureRequestReports.featureId, featureId))
      .orderBy(desc(featureRequestReports.requestedAt));

    return {
      ...feature[0],
      reports,
    };
  } catch (error) {
    console.error('Error getting feature request with reports:', error);
    return null;
  }
}

export async function getFeatureRequestReports(featureId: string) {
  try {
    const reports = await db
      .select()
      .from(featureRequestReports)
      .where(eq(featureRequestReports.featureId, featureId))
      .orderBy(desc(featureRequestReports.requestedAt));

    return reports;
  } catch (error) {
    console.error('Error getting feature request reports:', error);
    return [];
  }
}

export async function createFeatureRequest(
  title: string,
  description: string,
  discordLink: string,
  requestedAt: Date,
  isLlmGenerated: boolean = false
) {
  const { user } = await neonAuth();

  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    const featureId = nanoid();
    const reportId = nanoid();

    // Create the feature request
    await db.insert(featureRequests).values({
      id: featureId,
      title,
      description,
      firstRequestedAt: requestedAt,
      isLlmGenerated,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create the first report
    await db.insert(featureRequestReports).values({
      id: reportId,
      featureId,
      discordLink,
      requestedAt,
      createdBy: user.email,
      isLlmGenerated,
      createdAt: new Date(),
    });

    return { success: true, featureId };
  } catch (error) {
    console.error('Error creating feature request:', error);
    throw new Error('Failed to create feature request');
  }
}

export async function addFeatureRequestReport(
  featureId: string,
  discordLink: string,
  requestedAt: Date,
  isLlmGenerated: boolean = false
) {
  const { user } = await neonAuth();

  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    const reportId = nanoid();

    await db.insert(featureRequestReports).values({
      id: reportId,
      featureId,
      discordLink,
      requestedAt,
      createdBy: user.email,
      isLlmGenerated,
      createdAt: new Date(),
    });

    return { success: true, reportId };
  } catch (error) {
    console.error('Error adding feature request report:', error);
    throw new Error('Failed to add feature request report');
  }
}

export async function deleteFeatureRequest(featureId: string) {
  const { user } = await neonAuth();

  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    // Reports will be cascade deleted due to foreign key constraint
    await db.delete(featureRequests).where(eq(featureRequests.id, featureId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting feature request:', error);
    throw new Error('Failed to delete feature request');
  }
}

export async function deleteFeatureRequestReport(reportId: string) {
  const { user } = await neonAuth();

  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    await db.delete(featureRequestReports).where(eq(featureRequestReports.id, reportId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting feature request report:', error);
    throw new Error('Failed to delete feature request report');
  }
}

export async function updateFeatureRequest(featureId: string, title: string, description: string) {
  const { user } = await neonAuth();

  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    await db
      .update(featureRequests)
      .set({
        title,
        description,
        updatedAt: new Date(),
      })
      .where(eq(featureRequests.id, featureId));

    return { success: true };
  } catch (error) {
    console.error('Error updating feature request:', error);
    throw new Error('Failed to update feature request');
  }
}
