/**
 * Proactive cache warming system for critical data
 * Preloads frequently accessed data to improve response times
 * 
 * Features:
 * - Intelligent cache warming based on usage patterns
 * - Scheduled warming for predictable access patterns
 * - User-specific cache preloading
 * - Background warming with queue management
 * - Performance monitoring and optimization
 */

import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { memoryCache, CacheStrategies } from './cache';
import { redisReportCache } from './redis-report-cache';

export interface WarmingJob {
  id: string;
  type: 'user' | 'dashboard' | 'search' | 'report' | 'metadata';
  priority: 'high' | 'medium' | 'low';
  userId?: string;
  parameters: Record<string, any>;
  scheduledFor: number;
  createdAt: number;
  retries: number;
}

export interface WarmingResult {
  jobId: string;
  success: boolean;
  duration: number;
  itemsWarmed: number;
  errors?: string[];
}

export interface WarmingStats {
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  averageDuration: number;
  itemsWarmed: number;
  queueSize: number;
}

/**
 * Cache warming system for proactive data preloading
 */
export class CacheWarming {
  private redis: Redis | null = null;
  private prisma: PrismaClient;
  private warmingQueue: WarmingJob[] = [];
  private isProcessing = false;
  private stats: WarmingStats = {
    totalJobs: 0,
    successfulJobs: 0,
    failedJobs: 0,
    averageDuration: 0,
    itemsWarmed: 0,
    queueSize: 0
  };

  // Warming configuration
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly CONCURRENT_JOBS = 3;
  private readonly JOB_TIMEOUT = 30000; // 30 seconds
  private readonly RETRY_LIMIT = 3;
  private readonly WARMING_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.initializeRedis();
    this.startWarmingProcessor();
    this.schedulePeriodicWarming();
  }

  private initializeRedis(): void {
    try {
      const redisUrl = process.env.REDIS_URL || process.env.AZURE_REDIS_URL;
      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          maxConnections: 2,
          keepAlive: 30000,
          family: 4,
        });

        this.redis.on('error', (error) => {
          console.error('[CACHE_WARMING] Redis connection error:', error);
          this.redis = null;
        });
      }
    } catch (error) {
      console.error('[CACHE_WARMING] Failed to initialize Redis:', error);
    }
  }

  /**
   * Warm critical caches for improved performance
   */
  async warmCriticalCaches(): Promise<WarmingResult[]> {
    const jobs: WarmingJob[] = [
      {
        id: `critical-${Date.now()}-1`,
        type: 'dashboard',
        priority: 'high',
        parameters: { scope: 'global' },
        scheduledFor: Date.now(),
        createdAt: Date.now(),
        retries: 0
      },
      {
        id: `critical-${Date.now()}-2`,
        type: 'metadata',
        priority: 'high',
        parameters: { type: 'all' },
        scheduledFor: Date.now(),
        createdAt: Date.now(),
        retries: 0
      },
      {
        id: `critical-${Date.now()}-3`,
        type: 'search',
        priority: 'medium',
        parameters: { commonQueries: true },
        scheduledFor: Date.now(),
        createdAt: Date.now(),
        retries: 0
      }
    ];

    const results: WarmingResult[] = [];
    
    for (const job of jobs) {
      const result = await this.executeWarmingJob(job);
      results.push(result);
    }

    return results;
  }

  /**
   * Warm user-specific data
   */
  async warmUserData(userId: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<string> {
    const jobId = `user-${userId}-${Date.now()}`;
    
    const job: WarmingJob = {
      id: jobId,
      type: 'user',
      priority,
      userId,
      parameters: { userId },
      scheduledFor: Date.now(),
      createdAt: Date.now(),
      retries: 0
    };

    this.enqueueJob(job);
    return jobId;
  }

  /**
   * Warm dashboard data for all active users
   */
  async warmDashboardData(): Promise<string[]> {
    try {
      // Get recently active users (last 7 days)
      const activeUsers = await this.prisma.user.findMany({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          },
          isActive: true
        },
        select: { id: true },
        take: 50 // Limit for Azure B1 constraints
      });

      const jobIds: string[] = [];

      for (const user of activeUsers) {
        const jobId = `dashboard-${user.id}-${Date.now()}`;
        
        const job: WarmingJob = {
          id: jobId,
          type: 'dashboard',
          priority: 'medium',
          userId: user.id,
          parameters: { userId: user.id },
          scheduledFor: Date.now() + Math.random() * 60000, // Stagger jobs
          createdAt: Date.now(),
          retries: 0
        };

        this.enqueueJob(job);
        jobIds.push(jobId);
      }

      return jobIds;
    } catch (error) {
      console.error('[CACHE_WARMING] Error warming dashboard data:', error);
      return [];
    }
  }

  /**
   * Warm search cache with common queries
   */
  async warmSearchData(commonQueries?: string[]): Promise<string> {
    if (!commonQueries) {
      // Get most common search terms from analytics or predefined list
      commonQueries = await this.getCommonSearchQueries();
    }

    const jobId = `search-${Date.now()}`;
    
    const job: WarmingJob = {
      id: jobId,
      type: 'search',
      priority: 'low',
      parameters: { queries: commonQueries },
      scheduledFor: Date.now(),
      createdAt: Date.now(),
      retries: 0
    };

    this.enqueueJob(job);
    return jobId;
  }

  /**
   * Warm metadata caches (dropdowns, system settings, etc.)
   */
  async warmMetadataCache(): Promise<string> {
    const jobId = `metadata-${Date.now()}`;
    
    const job: WarmingJob = {
      id: jobId,
      type: 'metadata',
      priority: 'high',
      parameters: { type: 'all' },
      scheduledFor: Date.now(),
      createdAt: Date.now(),
      retries: 0
    };

    this.enqueueJob(job);
    return jobId;
  }

  /**
   * Warm report cache for frequently requested reports
   */
  async warmReportCache(userId?: string): Promise<string> {
    const jobId = `report-${userId || 'global'}-${Date.now()}`;
    
    const job: WarmingJob = {
      id: jobId,
      type: 'report',
      priority: 'medium',
      userId,
      parameters: { userId, reportTypes: ['sales', 'contacts', 'activity'] },
      scheduledFor: Date.now(),
      createdAt: Date.now(),
      retries: 0
    };

    this.enqueueJob(job);
    return jobId;
  }

  /**
   * Execute a specific warming job
   */
  private async executeWarmingJob(job: WarmingJob): Promise<WarmingResult> {
    const startTime = Date.now();
    let itemsWarmed = 0;
    const errors: string[] = [];

    try {
      switch (job.type) {
        case 'user':
          itemsWarmed = await this.warmUserSpecificData(job.userId!, job.parameters);
          break;
        case 'dashboard':
          itemsWarmed = await this.warmDashboardCache(job.userId, job.parameters);
          break;
        case 'search':
          itemsWarmed = await this.warmSearchCache(job.parameters);
          break;
        case 'metadata':
          itemsWarmed = await this.warmMetadata(job.parameters);
          break;
        case 'report':
          itemsWarmed = await this.warmReports(job.userId, job.parameters);
          break;
        default:
          throw new Error(`Unknown warming job type: ${job.type}`);
      }

      this.stats.successfulJobs++;
      this.stats.itemsWarmed += itemsWarmed;

      return {
        jobId: job.id,
        success: true,
        duration: Date.now() - startTime,
        itemsWarmed
      };

    } catch (error) {
      console.error(`[CACHE_WARMING] Job ${job.id} failed:`, error);
      errors.push(error.message);
      this.stats.failedJobs++;

      return {
        jobId: job.id,
        success: false,
        duration: Date.now() - startTime,
        itemsWarmed,
        errors
      };
    }
  }

  /**
   * Warm user-specific data
   */
  private async warmUserSpecificData(userId: string, parameters: Record<string, any>): Promise<number> {
    let itemsWarmed = 0;

    try {
      // Warm user profile data
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true
        }
      });

      if (user) {
        memoryCache.set(`cache:user:${userId}`, user, CacheStrategies.STATIC);
        itemsWarmed++;
      }

      // Warm user's recent organizations
      const recentOrganizations = await this.prisma.organization.findMany({
        where: {
          updatedBy: userId,
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        take: 20,
        orderBy: { updatedAt: 'desc' }
      });

      recentOrganizations.forEach(org => {
        memoryCache.set(`cache:organization:${org.id}`, org, CacheStrategies.SEARCH);
        itemsWarmed++;
      });

      // Warm user's dashboard data
      const dashboardData = await this.getDashboardData(userId);
      memoryCache.set(`cache:dashboard:${userId}:week`, dashboardData, CacheStrategies.SEARCH);
      itemsWarmed++;

    } catch (error) {
      console.error(`[CACHE_WARMING] Error warming user data for ${userId}:`, error);
      throw error;
    }

    return itemsWarmed;
  }

  /**
   * Warm dashboard cache
   */
  private async warmDashboardCache(userId?: string, parameters?: Record<string, any>): Promise<number> {
    let itemsWarmed = 0;

    try {
      if (userId) {
        // User-specific dashboard
        const dashboardData = await this.getDashboardData(userId);
        memoryCache.set(`cache:dashboard:${userId}:week`, dashboardData, CacheStrategies.SEARCH);
        itemsWarmed++;
      } else {
        // Global dashboard summary
        const globalSummary = await this.getGlobalSummary();
        memoryCache.set('cache:dashboard:global:summary', globalSummary, CacheStrategies.SEARCH);
        itemsWarmed++;
      }
    } catch (error) {
      console.error('[CACHE_WARMING] Error warming dashboard cache:', error);
      throw error;
    }

    return itemsWarmed;
  }

  /**
   * Warm search cache
   */
  private async warmSearchCache(parameters: Record<string, any>): Promise<number> {
    let itemsWarmed = 0;

    try {
      const queries = parameters.queries || await this.getCommonSearchQueries();

      for (const query of queries) {
        try {
          // Search organizations
          const orgResults = await this.prisma.organization.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } }
              ]
            },
            take: 10,
            select: {
              id: true,
              name: true,
              description: true,
              priority: true,
              segment: true
            }
          });

          const cacheKey = `cache:search:${query.toLowerCase()}:organizations`;
          memoryCache.set(cacheKey, orgResults, CacheStrategies.SEARCH);
          itemsWarmed++;

          // Search contacts
          const contactResults = await this.prisma.contact.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { position: { contains: query, mode: 'insensitive' } }
              ]
            },
            take: 10,
            select: {
              id: true,
              name: true,
              email: true,
              position: true,
              organizationId: true
            }
          });

          const contactCacheKey = `cache:search:${query.toLowerCase()}:contacts`;
          memoryCache.set(contactCacheKey, contactResults, CacheStrategies.SEARCH);
          itemsWarmed++;

        } catch (error) {
          console.error(`[CACHE_WARMING] Error warming search for query "${query}":`, error);
        }
      }
    } catch (error) {
      console.error('[CACHE_WARMING] Error warming search cache:', error);
      throw error;
    }

    return itemsWarmed;
  }

  /**
   * Warm metadata cache
   */
  private async warmMetadata(parameters: Record<string, any>): Promise<number> {
    let itemsWarmed = 0;

    try {
      // System settings
      const settings = await this.prisma.systemSetting.findMany({
        orderBy: { key: 'asc' }
      });
      memoryCache.set('cache:settings:all', settings, CacheStrategies.LONG);
      itemsWarmed++;

      // Organization metadata
      const [priorities, segments, types] = await Promise.all([
        this.prisma.organization.findMany({
          select: { priority: true },
          distinct: ['priority'],
          where: { priority: { not: null } }
        }),
        this.prisma.organization.findMany({
          select: { segment: true },
          distinct: ['segment'],
          where: { segment: { not: null } }
        }),
        this.prisma.organization.findMany({
          select: { type: true },
          distinct: ['type'],
          where: { type: { not: null } }
        })
      ]);

      const orgMetadata = {
        priorities: priorities.map(p => p.priority).filter(Boolean),
        segments: segments.map(s => s.segment).filter(Boolean),
        types: types.map(t => t.type).filter(Boolean)
      };

      memoryCache.set('metadata:organizations', orgMetadata, CacheStrategies.REPORT);
      itemsWarmed++;

      // Contact positions
      const positions = await this.prisma.contact.findMany({
        select: { position: true },
        distinct: ['position'],
        where: { 
          position: { 
            not: null,
            not: ''
          }
        }
      });

      const contactPositions = positions.map(p => p.position).filter(Boolean).sort();
      memoryCache.set('metadata:contact_positions', contactPositions, CacheStrategies.REPORT);
      itemsWarmed++;

      // Static data
      const interactionTypes = ["email", "call", "in-person", "demo", "quote", "follow-up"];
      const pipelineStages = ["lead-discovery", "contacted", "sampled-visited", "follow-up", "close"];

      memoryCache.set('static:interaction_types', interactionTypes, CacheStrategies.LONG);
      memoryCache.set('static:pipeline_stages', pipelineStages, CacheStrategies.LONG);
      itemsWarmed += 2;

    } catch (error) {
      console.error('[CACHE_WARMING] Error warming metadata:', error);
      throw error;
    }

    return itemsWarmed;
  }

  /**
   * Warm report cache
   */
  private async warmReports(userId?: string, parameters?: Record<string, any>): Promise<number> {
    let itemsWarmed = 0;

    try {
      const reportTypes = parameters?.reportTypes || ['sales', 'contacts', 'activity'];

      for (const reportType of reportTypes) {
        try {
          const reportParams = {
            timeframe: 'week',
            limit: 100
          };

          // Generate report data based on type
          let reportData;
          switch (reportType) {
            case 'sales':
              reportData = await this.generateSalesReport(reportParams, userId);
              break;
            case 'contacts':
              reportData = await this.generateContactsReport(reportParams, userId);
              break;
            case 'activity':
              reportData = await this.generateActivityReport(reportParams, userId);
              break;
            default:
              continue;
          }

          // Cache in Redis report cache
          if (userId) {
            await redisReportCache.cacheReport(reportType, reportParams, reportData, userId);
          }
          itemsWarmed++;

        } catch (error) {
          console.error(`[CACHE_WARMING] Error warming ${reportType} report:`, error);
        }
      }
    } catch (error) {
      console.error('[CACHE_WARMING] Error warming reports:', error);
      throw error;
    }

    return itemsWarmed;
  }

  /**
   * Get common search queries from usage patterns
   */
  private async getCommonSearchQueries(): Promise<string[]> {
    // In a real implementation, this would analyze search logs
    // For now, return common business terms
    return [
      'restaurant',
      'food',
      'manager',
      'director',
      'chef',
      'procurement',
      'hotel',
      'catering',
      'kitchen',
      'beverage'
    ];
  }

  /**
   * Get dashboard data for a user
   */
  private async getDashboardData(userId: string): Promise<any> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalOrganizations, recentContacts, recentOpportunities] = await Promise.all([
      this.prisma.organization.count({
        where: { createdBy: userId }
      }),
      this.prisma.contact.count({
        where: {
          createdBy: userId,
          createdAt: { gte: weekAgo }
        }
      }),
      this.prisma.opportunity.count({
        where: {
          createdBy: userId,
          createdAt: { gte: weekAgo }
        }
      })
    ]);

    return {
      totalOrganizations,
      recentContacts,
      recentOpportunities,
      generatedAt: Date.now()
    };
  }

  /**
   * Get global summary data
   */
  private async getGlobalSummary(): Promise<any> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalOrganizations, totalContacts, recentActivity] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.contact.count(),
      this.prisma.interaction.count({
        where: { createdAt: { gte: weekAgo } }
      })
    ]);

    return {
      totalOrganizations,
      totalContacts,
      recentActivity,
      generatedAt: Date.now()
    };
  }

  /**
   * Generate sales report data
   */
  private async generateSalesReport(params: any, userId?: string): Promise<any> {
    const whereClause = userId ? { createdBy: userId } : {};
    
    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        ...whereClause,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      take: params.limit || 100,
      select: {
        id: true,
        name: true,
        value: true,
        stage: true,
        createdAt: true
      }
    });

    return {
      opportunities,
      totalValue: opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0),
      count: opportunities.length,
      generatedAt: Date.now()
    };
  }

  /**
   * Generate contacts report data
   */
  private async generateContactsReport(params: any, userId?: string): Promise<any> {
    const whereClause = userId ? { createdBy: userId } : {};
    
    const contacts = await this.prisma.contact.findMany({
      where: whereClause,
      take: params.limit || 100,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        organizationId: true,
        createdAt: true
      }
    });

    return {
      contacts,
      count: contacts.length,
      generatedAt: Date.now()
    };
  }

  /**
   * Generate activity report data
   */
  private async generateActivityReport(params: any, userId?: string): Promise<any> {
    const whereClause = userId ? { createdBy: userId } : {};
    
    const interactions = await this.prisma.interaction.findMany({
      where: {
        ...whereClause,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      take: params.limit || 100,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        notes: true,
        createdAt: true,
        organizationId: true,
        contactId: true
      }
    });

    return {
      interactions,
      count: interactions.length,
      generatedAt: Date.now()
    };
  }

  /**
   * Enqueue a warming job
   */
  private enqueueJob(job: WarmingJob): void {
    if (this.warmingQueue.length >= this.MAX_QUEUE_SIZE) {
      // Remove oldest low-priority job
      const index = this.warmingQueue.findIndex(j => j.priority === 'low');
      if (index !== -1) {
        this.warmingQueue.splice(index, 1);
      } else {
        console.warn('[CACHE_WARMING] Queue full, dropping job:', job.id);
        return;
      }
    }

    this.warmingQueue.push(job);
    this.stats.queueSize = this.warmingQueue.length;

    // Sort by priority and scheduled time
    this.warmingQueue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      return priorityDiff || a.scheduledFor - b.scheduledFor;
    });
  }

  /**
   * Start the warming job processor
   */
  private startWarmingProcessor(): void {
    setInterval(async () => {
      if (this.isProcessing || this.warmingQueue.length === 0) {
        return;
      }

      this.isProcessing = true;

      try {
        const now = Date.now();
        const readyJobs = this.warmingQueue
          .filter(job => job.scheduledFor <= now)
          .slice(0, this.CONCURRENT_JOBS);

        if (readyJobs.length > 0) {
          // Remove jobs from queue
          readyJobs.forEach(job => {
            const index = this.warmingQueue.indexOf(job);
            if (index !== -1) {
              this.warmingQueue.splice(index, 1);
            }
          });

          // Process jobs concurrently
          const results = await Promise.allSettled(
            readyJobs.map(job => this.executeWarmingJob(job))
          );

          // Handle failed jobs
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              const job = readyJobs[index];
              if (job.retries < this.RETRY_LIMIT) {
                job.retries++;
                job.scheduledFor = now + (job.retries * 60000); // Exponential backoff
                this.enqueueJob(job);
              }
            }
          });

          this.stats.totalJobs += readyJobs.length;
          this.stats.queueSize = this.warmingQueue.length;
        }
      } catch (error) {
        console.error('[CACHE_WARMING] Error processing warming queue:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 1000); // Check every second
  }

  /**
   * Schedule periodic warming for predictable patterns
   */
  private schedulePeriodicWarming(): void {
    setInterval(async () => {
      try {
        // Warm critical caches every 5 minutes
        await this.warmCriticalCaches();
        
        // Warm metadata every 15 minutes
        if (Date.now() % (15 * 60 * 1000) < this.WARMING_INTERVAL) {
          await this.warmMetadataCache();
        }
      } catch (error) {
        console.error('[CACHE_WARMING] Error in periodic warming:', error);
      }
    }, this.WARMING_INTERVAL);
  }

  /**
   * Get warming statistics
   */
  getStats(): WarmingStats {
    const avgDuration = this.stats.totalJobs > 0 
      ? this.stats.averageDuration / this.stats.totalJobs 
      : 0;

    return {
      ...this.stats,
      averageDuration: Math.round(avgDuration)
    };
  }

  /**
   * Clear the warming queue
   */
  clearQueue(): void {
    this.warmingQueue = [];
    this.stats.queueSize = 0;
  }
}

// Global instance (to be initialized with Prisma in the app)
let cacheWarming: CacheWarming | null = null;

export function initializeCacheWarming(prisma: PrismaClient): CacheWarming {
  if (!cacheWarming) {
    cacheWarming = new CacheWarming(prisma);
  }
  return cacheWarming;
}

export { cacheWarming };