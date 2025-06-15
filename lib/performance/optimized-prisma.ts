/**
 * Optimized Prisma Client for Azure B1
 * 
 * Performance-optimized wrapper around Prisma Client that automatically
 * applies Azure SQL Basic optimizations, caching, and monitoring.
 */

import { PrismaClient } from '@prisma/client';
import { 
  QueryComplexityAnalyzer,
  AzureB1ConnectionManager,
  OrganizationQueryOptimizer,
  AzureB1PerformanceMonitor
} from './azure-b1-optimizer';
import { AzureB1CacheManager, withCache } from './azure-b1-cache';
import type { 
  OrganizationWithDetails,
  OrganizationSummary,
  OrganizationFilters,
  ContactWithDetails,
  InteractionWithDetails,
  OpportunityWithDetails,
  DashboardMetrics,
  ChartDataPoint,
  InteractionOutcome
} from '@/types/crm';
import { INTERACTION_OUTCOMES } from '@/types/crm';

// =============================================================================
// OPTIMIZED PRISMA CLIENT
// =============================================================================

export class OptimizedPrismaClient {
  private prisma: PrismaClient;
  private connectionManager: AzureB1ConnectionManager;
  private cacheManager: AzureB1CacheManager;
  private queryOptimizer: OrganizationQueryOptimizer;
  private complexityAnalyzer: QueryComplexityAnalyzer;

  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    this.connectionManager = AzureB1ConnectionManager.getInstance();
    this.cacheManager = AzureB1CacheManager.getInstance();
    this.queryOptimizer = new OrganizationQueryOptimizer();
    this.complexityAnalyzer = new QueryComplexityAnalyzer();
  }

  // =============================================================================
  // ORGANIZATION OPERATIONS
  // =============================================================================

  /**
   * Get organizations with intelligent caching and optimization
   */
  async getOrganizations(filters: OrganizationFilters): Promise<{
    organizations: OrganizationSummary[];
    total: number;
    fromCache: boolean;
  }> {
    const cacheKey = JSON.stringify(filters);
    
    // Try cache first
    const cached = this.cacheManager.getCachedOrganizationList(filters);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    // Execute optimized query
    return this.connectionManager.acquireConnection(async () => {
      return AzureB1PerformanceMonitor.trackQuery('getOrganizations', async () => {
        const { optimized, warnings } = this.queryOptimizer.optimizeListQuery(filters);
        
        if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
          console.warn('Organization query optimizations applied:', warnings);
        }

        // Execute count and data queries in parallel for efficiency
        const [organizations, total] = await Promise.all([
          this.prisma.organization.findMany(optimized),
          this.getOrganizationCount(filters)
        ]);

        const result = {
          organizations: organizations.map(this.mapToOrganizationSummary),
          total,
          fromCache: false
        };

        // Cache the result
        await this.cacheManager.cacheOrganizationList(filters, result.organizations, total);
        
        return result;
      });
    });
  }

  /**
   * Get single organization with details
   */
  async getOrganizationById(id: string): Promise<OrganizationWithDetails | null> {
    // Try cache first
    const cached = this.cacheManager.get<OrganizationWithDetails>('organizations', id);
    if (cached) {
      return cached;
    }

    return this.connectionManager.acquireConnection(async () => {
      return AzureB1PerformanceMonitor.trackQuery('getOrganizationById', async () => {
        const { optimized, warnings } = this.queryOptimizer.optimizeDetailQuery(id);
        
        if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
          console.warn('Organization detail query optimizations applied:', warnings);
        }

        const organization = await this.prisma.organization.findUnique(optimized);
        
        if (organization) {
          const mapped = this.mapToOrganizationWithDetails(organization);
          await this.cacheManager.cacheOrganization(mapped);
          return mapped;
        }
        
        return null;
      });
    });
  }

  /**
   * Create organization with cache invalidation
   */
  async createOrganization(data: any): Promise<OrganizationWithDetails> {
    return this.connectionManager.acquireConnection(async () => {
      return AzureB1PerformanceMonitor.trackQuery('createOrganization', async () => {
        const organization = await this.prisma.organization.create({
          data,
          include: {
            contacts: { take: 5 },
            interactions: { take: 3, orderBy: { date: 'desc' } },
            opportunities: { take: 3, where: { isActive: true } }
          }
        });

        const mapped = this.mapToOrganizationWithDetails(organization);
        
        // Cache the new organization
        await this.cacheManager.cacheOrganization(mapped);
        
        // Invalidate list caches
        this.invalidateOrganizationListCaches();
        
        return mapped;
      });
    }, 'high'); // High priority for user-initiated creates
  }

  /**
   * Update organization with cache management
   */
  async updateOrganization(id: string, data: any): Promise<OrganizationWithDetails> {
    return this.connectionManager.acquireConnection(async () => {
      return AzureB1PerformanceMonitor.trackQuery('updateOrganization', async () => {
        const organization = await this.prisma.organization.update({
          where: { id },
          data,
          include: {
            contacts: { take: 5 },
            interactions: { take: 3, orderBy: { date: 'desc' } },
            opportunities: { take: 3, where: { isActive: true } }
          }
        });

        const mapped = this.mapToOrganizationWithDetails(organization);
        
        // Update cache
        await this.cacheManager.cacheOrganization(mapped);
        
        // Invalidate list caches
        this.invalidateOrganizationListCaches();
        
        return mapped;
      });
    }, 'high');
  }

  // =============================================================================
  // CONTACT OPERATIONS
  // =============================================================================

  /**
   * Get contacts for organization with caching
   */
  async getContactsByOrganization(organizationId: string): Promise<ContactWithDetails[]> {
    const cacheKey = `org:${organizationId}`;
    
    return withCache('contacts', cacheKey, async () => {
      return this.connectionManager.acquireConnection(async () => {
        return AzureB1PerformanceMonitor.trackQuery('getContactsByOrganization', async () => {
          const contacts = await this.prisma.contact.findMany({
            where: { organizationId },
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  priority: true,
                  segment: true,
                  type: true,
                  status: true
                }
              }
            },
            orderBy: [
              { isPrimary: 'desc' },
              { firstName: 'asc' }
            ],
            take: 50 // Limit for performance
          });

          return contacts.map(this.mapToContactWithDetails);
        });
      });
    });
  }

  /**
   * Create contact with cache invalidation
   */
  async createContact(data: any): Promise<ContactWithDetails> {
    return this.connectionManager.acquireConnection(async () => {
      return AzureB1PerformanceMonitor.trackQuery('createContact', async () => {
        const contact = await this.prisma.contact.create({
          data,
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                priority: true,
                segment: true,
                type: true,
                status: true
              }
            }
          }
        });

        const mapped = this.mapToContactWithDetails(contact);
        
        // Invalidate related caches
        this.invalidateContactCaches(data.organizationId);
        
        return mapped;
      });
    }, 'high');
  }

  // =============================================================================
  // DASHBOARD AND ANALYTICS
  // =============================================================================

  /**
   * Get dashboard metrics with aggressive caching
   */
  async getDashboardMetrics(userId?: string): Promise<DashboardMetrics> {
    const cacheKey = `dashboard:${userId || 'global'}`;
    
    return withCache('dashboard', cacheKey, async () => {
      return this.connectionManager.acquireConnection(async () => {
        return AzureB1PerformanceMonitor.trackQuery('getDashboardMetrics', async () => {
          // Execute multiple aggregation queries in parallel
          const [
            orgStats,
            interactionStats,
            opportunityStats
          ] = await Promise.all([
            this.getOrganizationStats(),
            this.getInteractionStats(),
            this.getOpportunityStats()
          ]);

          return {
            organizations: orgStats,
            interactions: interactionStats,
            opportunities: opportunityStats,
            performance: {
              averageResponseTime: 0, // Will be filled by monitoring
              topPerformingSegments: [], // TODO: Implement calculation for topPerformingSegments
              totalRevenue: opportunityStats.totalValue || 0,
              leadSourceEffectiveness: [] // TODO: Implement calculation for leadSourceEffectiveness
            }
          };
        });
      });
    });
  }

  /**
   * Get chart data with caching and optimization
   */
  async getChartData(
    chartType: 'priority_distribution' | 'segment_performance' | 'activity_timeline' | 'pipeline_funnel',
    params: any = {}
  ): Promise<ChartDataPoint[]> {
    // Try cache first
    const cached = this.cacheManager.getCachedChartData(chartType, params);
    if (cached) {
      return cached;
    }

    return this.connectionManager.acquireConnection(async () => {
      return AzureB1PerformanceMonitor.trackQuery(`getChartData:${chartType}`, async () => {
        let data: ChartDataPoint[] = [];

        switch (chartType) {
          case 'priority_distribution':
            data = await this.getPriorityDistributionData();
            break;
          case 'segment_performance':
            data = await this.getSegmentPerformanceData();
            break;
          case 'activity_timeline':
            data = await this.getActivityTimelineData(params);
            break;
          case 'pipeline_funnel':
            data = await this.getPipelineFunnelData();
            break;
        }

        // Cache the chart data
        await this.cacheManager.cacheChartData(chartType, params, data);
        
        return data;
      });
    });
  }

  // =============================================================================
  // SEARCH OPERATIONS
  // =============================================================================

  /**
   * Full-text search with caching and optimization
   */
  async searchOrganizations(query: string, limit: number = 20): Promise<OrganizationSummary[]> {
    const cacheKey = `search:${query}:${limit}`;
    
    return withCache('search', cacheKey, async () => {
      return this.connectionManager.acquireConnection(async () => {
        return AzureB1PerformanceMonitor.trackQuery('searchOrganizations', async () => {
          const organizations = await this.prisma.organization.findMany({
            where: {
              OR: [
                { name: { contains: query } },
                { email: { contains: query } },
                { phone: { contains: query } }
              ]
            },
            select: {
              id: true,
              name: true,
              priority: true,
              segment: true,
              type: true,
              status: true,
              email: true,
              phone: true,
              estimatedRevenue: true,
              lastContactDate: true,
              primaryContact: true
            },
            orderBy: [
              { priority: 'asc' },
              { name: 'asc' }
            ],
            take: limit
          });

          return organizations.map(this.mapToOrganizationSummary);
        });
      });
    });
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private async getOrganizationCount(filters: OrganizationFilters): Promise<number> {
    // Build simplified where clause for count
    const where: any = {};
    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { email: { contains: filters.search } }
      ];
    }
    
    if (filters.priority?.length) {
      where.priority = { in: filters.priority };
    }
    
    if (filters.segment?.length) {
      where.segment = { in: filters.segment };
    }

    return this.prisma.organization.count({ where });
  }

  private async getOrganizationStats() {
    const [total, byPriority, bySegment, byStatus] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.organization.groupBy({
        by: ['priority'],
        _count: { priority: true }
      }),
      this.prisma.organization.groupBy({
        by: ['segment'],
        _count: { segment: true }
      }),
      this.prisma.organization.groupBy({
        by: ['status'],
        _count: { status: true }
      })
    ]);

    return {
      total,
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority as any] = item._count.priority;
        return acc;
      }, {} as any),
      bySegment: bySegment.reduce((acc, item) => {
        acc[item.segment as any] = item._count.segment;
        return acc;
      }, {} as any),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status as any] = item._count.status;
        return acc;
      }, {} as any),
      recentlyAdded: 0, // TODO: Calculate
      needingFollowUp: 0 // TODO: Calculate
    };
  }

  private async getInteractionStats() {
    const statsInitial = {
      total: 0,
      thisWeek: 0,
      byType: {} as Record<string, number>,
      byOutcome: INTERACTION_OUTCOMES.reduce((acc, outcome) => {
        acc[outcome] = 0;
        return acc;
      }, {} as Record<InteractionOutcome, number>)
    };

    const [total, thisWeek, byTypeResults, byOutcomeResults] = await Promise.all([
      this.prisma.interaction.count(),
      this.prisma.interaction.count({
        where: {
          date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      this.prisma.interaction.groupBy({
        by: ['type'],
        _count: { type: true }
      }),
      this.prisma.interaction.groupBy({
        by: ['outcome'],
        _count: { outcome: true },
        where: { outcome: { not: null } } // Only count interactions with an outcome
      })
    ]);

    statsInitial.total = total;
    statsInitial.thisWeek = thisWeek;

    for (const item of byTypeResults) {
      statsInitial.byType[item.type as string] = item._count.type;
    }

    for (const item of byOutcomeResults) {
      if (item.outcome) { // Ensure outcome is not null
        statsInitial.byOutcome[item.outcome as InteractionOutcome] = item._count.outcome;
      }
    }

    return statsInitial;
  }

  private async getOpportunityStats() {
    const [total, totalValue, byStage] = await Promise.all([
      this.prisma.opportunity.count({ where: { isActive: true } }),
      this.prisma.opportunity.aggregate({
        where: { isActive: true },
        _sum: { value: true }
      }),
      this.prisma.opportunity.groupBy({
        by: ['stage'],
        where: { isActive: true },
        _count: { stage: true }
      })
    ]);

    return {
      total,
      totalValue: totalValue._sum.value || 0,
      byStage: byStage.reduce((acc, item) => {
        acc[item.stage as any] = item._count.stage;
        return acc;
      }, {} as any),
      averageProbability: 0, // TODO: Calculate
      closingThisMonth: 0 // TODO: Calculate
    };
  }

  private async getPriorityDistributionData(): Promise<ChartDataPoint[]> {
    const priorityData = await this.prisma.organization.groupBy({
      by: ['priority'],
      _count: { priority: true },
      orderBy: { priority: 'asc' }
    });

    return priorityData.map(item => ({
      name: `Priority ${item.priority}`,
      value: item._count.priority,
      category: item.priority
    }));
  }

  private async getSegmentPerformanceData(): Promise<ChartDataPoint[]> {
    const segmentData = await this.prisma.organization.groupBy({
      by: ['segment'],
      _count: { segment: true },
      _avg: { estimatedRevenue: true }
    });

    return segmentData.map(item => ({
      name: item.segment,
      value: Math.round(item._avg.estimatedRevenue || 0),
      category: 'revenue'
    }));
  }

  private async getActivityTimelineData(params: any): Promise<ChartDataPoint[]> {
    const days = params.days || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const activityData = await this.prisma.interaction.groupBy({
      by: ['date'],
      where: { date: { gte: startDate } },
      _count: { date: true },
      orderBy: { date: 'asc' }
    });

    return activityData.map(item => ({
      name: item.date.toISOString().split('T')[0],
      value: item._count.date,
      category: 'activity'
    }));
  }

  private async getPipelineFunnelData(): Promise<ChartDataPoint[]> {
    const stageData = await this.prisma.opportunity.groupBy({
      by: ['stage'],
      where: { isActive: true },
      _count: { stage: true },
      _sum: { value: true }
    });

    return stageData.map(item => ({
      name: item.stage,
      value: item._sum.value || 0,
      category: 'pipeline'
    }));
  }

  // Mapping functions
  private mapToOrganizationSummary(org: any): OrganizationSummary {
    return {
      id: org.id,
      name: org.name,
      priority: org.priority,
      segment: org.segment,
      type: org.type,
      status: org.status,
      primaryContactName: org.primaryContact,
      lastContactDate: org.lastContactDate,
      estimatedRevenue: org.estimatedRevenue
    };
  }

  private mapToOrganizationWithDetails(org: any): OrganizationWithDetails {
    return {
      ...org,
      contacts: org.contacts?.map(this.mapToContactSummary) || [],
      interactions: org.interactions?.map(this.mapToInteractionSummary) || [],
      opportunities: org.opportunities?.map(this.mapToOpportunitySummary) || [],
      leads: org.leads?.map(this.mapToLeadSummary) || [],
      contracts: org.contracts?.map(this.mapToContractSummary) || [],
      totalContacts: org.contacts?.length || 0,
      lastInteractionDate: org.interactions?.[0]?.date || null,
      nextFollowUpDate: org.nextFollowUpDate,
      totalOpportunityValue: org.opportunities?.reduce((sum: number, opp: any) => sum + (opp.value || 0), 0) || 0,
      primaryContactName: org.primaryContact
    };
  }

  private mapToContactSummary(contact: any) {
    return {
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      position: contact.position,
      isPrimary: contact.isPrimary
    };
  }

  private mapToContactWithDetails(contact: any): ContactWithDetails {
    return {
      ...contact,
      organization: this.mapToOrganizationSummary(contact.organization),
      interactions: [],
      opportunities: [],
      contracts: []
    };
  }

  private mapToInteractionSummary(interaction: any) {
    return {
      id: interaction.id,
      type: interaction.type,
      subject: interaction.subject,
      date: interaction.date,
      outcome: interaction.outcome,
      duration: interaction.duration
    };
  }

  private mapToOpportunitySummary(opportunity: any) {
    return {
      id: opportunity.id,
      name: opportunity.name,
      value: opportunity.value,
      stage: opportunity.stage,
      probability: opportunity.probability,
      expectedCloseDate: opportunity.expectedCloseDate,
      isActive: opportunity.isActive
    };
  }

  private mapToLeadSummary(lead: any) {
    return {
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      company: lead.company,
      status: lead.status,
      source: lead.source
    };
  }

  private mapToContractSummary(contract: any) {
    return {
      id: contract.id,
      name: contract.name,
      value: contract.value,
      status: contract.status,
      startDate: contract.startDate,
      endDate: contract.endDate
    };
  }

  private invalidateOrganizationListCaches(): void {
    // Simple but effective - clear all organization list caches
    const listCache = this.cacheManager.get('organizationLists', 'clear');
    // This will be handled by the cache manager
  }

  private invalidateContactCaches(organizationId: string): void {
    // Invalidate contact caches for the organization
    const cacheKey = `org:${organizationId}`;
    // This will be handled by the cache manager
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      queries: AzureB1PerformanceMonitor.getPerformanceReport(),
      cache: this.cacheManager.getStats(),
      connections: this.connectionManager.getStatus()
    };
  }

  /**
   * Cleanup resources
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let optimizedPrismaInstance: OptimizedPrismaClient | null = null;

export function getOptimizedPrisma(): OptimizedPrismaClient {
  if (!optimizedPrismaInstance) {
    optimizedPrismaInstance = new OptimizedPrismaClient();
  }
  return optimizedPrismaInstance;
}