/**
 * Azure SQL Database Optimization Utilities
 * Optimized for Azure SQL Basic tier (5 DTU) constraints
 * 
 * Based on official Azure SQL performance recommendations:
 * - Batch related queries to reduce connection overhead
 * - Minimize DTU consumption through efficient query patterns
 * - Implement connection pooling best practices
 */

import { prismadb } from './prisma';

/**
 * Batch multiple organization queries for dashboard loading
 * Reduces DTU consumption by executing related queries concurrently
 */
export async function batchOrganizationQueries(filters: {
  status?: string;
  priority?: string;
  segment?: string;
  query?: string;
  limit?: number;
}) {
  const { status = "ACTIVE", priority, segment, query, limit = 50 } = filters;

  const whereClause: any = { status };
  
  // Add filters
  if (priority) whereClause.priority = priority;
  if (segment) whereClause.segment = segment;
  if (query) {
    whereClause.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } }
    ];
  }

  // Batch related queries for efficient DTU usage
  const [organizations, totalCount, priorityStats] = await Promise.all([
    // Main data query
    prismadb.organization.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        priority: true,
        segment: true,
        estimatedRevenue: true,
        lastContactDate: true,
        nextFollowUpDate: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { priority: 'asc' },
        { name: 'asc' }
      ],
      take: limit,
    }),

    // Count query for pagination
    prismadb.organization.count({
      where: whereClause,
    }),

    // Dashboard statistics
    prismadb.organization.groupBy({
      by: ['priority'],
      where: { status },
      _count: {
        priority: true,
      },
    }),
  ]);

  return {
    organizations,
    totalCount,
    priorityStats,
    performance: {
      queriesExecuted: 3,
      batchOptimized: true,
    }
  };
}

/**
 * Batch contact and interaction data for organization details
 * Optimizes the organization detail page loading
 */
export async function batchOrganizationDetails(organizationId: string) {
  const [organization, contacts, recentInteractions, upcomingFollowUps] = await Promise.all([
    // Organization details
    prismadb.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        priority: true,
        segment: true,
        type: true,
        estimatedRevenue: true,
        employeeCount: true,
        primaryContact: true,
        lastContactDate: true,
        nextFollowUpDate: true,
        notes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

    // Associated contacts
    prismadb.contact.findMany({
      where: { organizationId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        position: true,
        isPrimary: true,
        updatedAt: true,
      },
      orderBy: [
        { isPrimary: 'desc' },
        { updatedAt: 'desc' }
      ],
      take: 10, // Limit for Azure Basic performance
    }),

    // Recent interactions
    prismadb.interaction.findMany({
      where: { organizationId },
      select: {
        id: true,
        type: true,
        subject: true,
        date: true,
        outcome: true,
        nextAction: true,
        contact: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 5,
    }),

    // Upcoming follow-ups
    prismadb.interaction.findMany({
      where: {
        organizationId,
        nextAction: { not: null },
        // Add date filter for upcoming items
      },
      select: {
        id: true,
        nextAction: true,
        date: true,
        type: true,
      },
      orderBy: { date: 'asc' },
      take: 3,
    }),
  ]);

  return {
    organization,
    contacts,
    recentInteractions,
    upcomingFollowUps,
    performance: {
      queriesExecuted: 4,
      batchOptimized: true,
    }
  };
}

/**
 * Batch dashboard analytics queries
 * Optimizes the main CRM dashboard loading
 */
export async function batchDashboardAnalytics() {
  const [
    totalOrganizations,
    priorityBreakdown,
    segmentBreakdown,
    recentInteractions,
    upcomingFollowUps,
    conversionStats
  ] = await Promise.all([
    // Total active organizations
    prismadb.organization.count({
      where: { status: 'ACTIVE' }
    }),

    // Priority breakdown
    prismadb.organization.groupBy({
      by: ['priority'],
      where: { status: 'ACTIVE' },
      _count: { priority: true },
      _sum: { estimatedRevenue: true },
    }),

    // Segment breakdown
    prismadb.organization.groupBy({
      by: ['segment'],
      where: { status: 'ACTIVE' },
      _count: { segment: true },
    }),

    // Recent interactions summary
    prismadb.interaction.findMany({
      select: {
        id: true,
        type: true,
        date: true,
        outcome: true,
        organization: {
          select: {
            name: true,
            priority: true,
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 10,
    }),

    // Upcoming follow-ups
    prismadb.organization.findMany({
      where: {
        nextFollowUpDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        priority: true,
        nextFollowUpDate: true,
      },
      orderBy: { nextFollowUpDate: 'asc' },
      take: 10,
    }),

    // Pipeline conversion stats
    prismadb.opportunity.groupBy({
      by: ['stage'],
      _count: { stage: true },
      _sum: { value: true },
    }),
  ]);

  return {
    totalOrganizations,
    priorityBreakdown,
    segmentBreakdown,
    recentInteractions,
    upcomingFollowUps,
    conversionStats,
    performance: {
      queriesExecuted: 6,
      batchOptimized: true,
      dtueOptimized: true,
    }
  };
}

/**
 * Optimized search with batch result processing
 * Handles search across organizations, contacts, and interactions
 */
export async function batchSearchQueries(searchTerm: string, limit: number = 20) {
  const sanitizedQuery = searchTerm.trim().substring(0, 100);
  
  if (sanitizedQuery.length < 2) {
    return {
      organizations: [],
      contacts: [],
      interactions: [],
      performance: { queriesExecuted: 0, skipped: 'Query too short' }
    };
  }

  const [organizations, contacts, interactions] = await Promise.all([
    // Organization search
    prismadb.organization.findMany({
      where: {
        OR: [
          { name: { contains: sanitizedQuery, mode: 'insensitive' } },
          { email: { contains: sanitizedQuery, mode: 'insensitive' } },
        ],
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        priority: true,
        segment: true,
      },
      take: Math.floor(limit * 0.6), // 60% of results
    }),

    // Contact search
    prismadb.contact.findMany({
      where: {
        OR: [
          { firstName: { contains: sanitizedQuery, mode: 'insensitive' } },
          { lastName: { contains: sanitizedQuery, mode: 'insensitive' } },
          { email: { contains: sanitizedQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        position: true,
        organization: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      take: Math.floor(limit * 0.3), // 30% of results
    }),

    // Interaction search (by subject/notes)
    prismadb.interaction.findMany({
      where: {
        OR: [
          { subject: { contains: sanitizedQuery, mode: 'insensitive' } },
          { description: { contains: sanitizedQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        subject: true,
        type: true,
        date: true,
        organization: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { date: 'desc' },
      take: Math.floor(limit * 0.1), // 10% of results
    }),
  ]);

  return {
    organizations,
    contacts,
    interactions,
    performance: {
      queriesExecuted: 3,
      batchOptimized: true,
      searchTerm: sanitizedQuery,
    }
  };
}

/**
 * Connection pool health monitoring for Azure SQL Basic
 * Helps track DTU usage and connection efficiency
 */
export async function getConnectionPoolStats() {
  try {
    // Note: This requires Prisma metrics feature (preview)
    // Enable with: previewFeatures = ["metrics"]
    const metrics = await prismadb.$metrics.json();
    
    const poolConnections = metrics.gauges?.find(g => 
      g.key === 'prisma_pool_connections_open'
    )?.value || 0;
    
    const busyConnections = metrics.gauges?.find(g => 
      g.key === 'prisma_pool_connections_busy'
    )?.value || 0;
    
    const idleConnections = metrics.gauges?.find(g => 
      g.key === 'prisma_pool_connections_idle'
    )?.value || 0;

    return {
      totalConnections: poolConnections,
      busyConnections,
      idleConnections,
      utilization: poolConnections > 0 ? (busyConnections / poolConnections * 100) : 0,
      azureBasicOptimal: poolConnections <= 3, // Optimal for 5 DTU limit
    };
  } catch (error) {
    console.warn('Connection pool metrics not available:', error);
    return {
      totalConnections: 'unknown',
      busyConnections: 'unknown',
      idleConnections: 'unknown',
      utilization: 'unknown',
      azureBasicOptimal: 'unknown',
    };
  }
}

/**
 * Enhanced monitoring with buffer cache hit ratio and DTU metrics
 * Based on Microsoft SQL Server performance monitoring best practices
 */
export async function getEnhancedPerformanceMetrics() {
  try {
    // Buffer cache hit ratio - critical Azure SQL performance metric
    const bufferCacheResult = await prismadb.$queryRaw<Array<{ cntr_value: number }>>`
      SELECT cntr_value 
      FROM sys.dm_os_performance_counters 
      WHERE counter_name = 'Buffer cache hit ratio'
      AND instance_name = ''
    `;

    // Buffer cache hit ratio base
    const bufferCacheBaseResult = await prismadb.$queryRaw<Array<{ cntr_value: number }>>`
      SELECT cntr_value 
      FROM sys.dm_os_performance_counters 
      WHERE counter_name = 'Buffer cache hit ratio base'
      AND instance_name = ''
    `;

    // Page life expectancy - memory pressure indicator
    const pageLifeResult = await prismadb.$queryRaw<Array<{ cntr_value: number }>>`
      SELECT cntr_value 
      FROM sys.dm_os_performance_counters 
      WHERE counter_name = 'Page life expectancy'
    `;

    // Batch requests per second
    const batchRequestsResult = await prismadb.$queryRaw<Array<{ cntr_value: number }>>`
      SELECT cntr_value 
      FROM sys.dm_os_performance_counters 
      WHERE counter_name = 'Batch Requests/sec'
    `;

    // Calculate buffer cache hit ratio percentage
    const bufferCache = bufferCacheResult[0]?.cntr_value || 0;
    const bufferCacheBase = bufferCacheBaseResult[0]?.cntr_value || 1;
    const hitRatio = bufferCacheBase > 0 ? (bufferCache / bufferCacheBase) * 100 : 0;

    // Connection pool stats
    const poolStats = await getConnectionPoolStats();

    return {
      bufferCacheHitRatio: hitRatio,
      pageLifeExpectancy: pageLifeResult[0]?.cntr_value || 0,
      batchRequestsPerSec: batchRequestsResult[0]?.cntr_value || 0,
      connectionPool: poolStats,
      timestamp: new Date().toISOString(),
      azureBasicRecommendations: {
        bufferCacheOptimal: hitRatio >= 95,
        pageLifeOptimal: (pageLifeResult[0]?.cntr_value || 0) >= 300,
        connectionOptimal: poolStats.azureBasicOptimal,
      }
    };
  } catch (error) {
    console.warn('Enhanced performance metrics not available:', error);
    return {
      bufferCacheHitRatio: 'unknown',
      pageLifeExpectancy: 'unknown',
      batchRequestsPerSec: 'unknown',
      connectionPool: await getConnectionPoolStats(),
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}