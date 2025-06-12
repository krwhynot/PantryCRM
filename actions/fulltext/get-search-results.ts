import { prismadb } from "@/lib/prisma";
import { cachedQuery, CacheKeys, CacheStrategies } from "@/lib/cache";
import { optimizedSearch } from "@/lib/db-optimization";
import { logger, performanceMonitor } from "@/lib/monitoring";

/**
 * Optimized full-text search across multiple entities in the CRM
 * Uses parallel queries, caching, and proper indexing for <1 second response time
 * Optimized for Azure B1 performance requirements
 * 
 * @param search The search term to look for
 * @param limit Maximum results per entity type (default: 10, reduced for B1)
 * @param userId Optional user ID for personalized caching
 * @returns Search results across multiple entities
 */
export const getSearch = async (search: string, limit: number = 10, userId?: string) => {
  // Performance tracking for B1 monitoring
  const endTracking = performanceMonitor.trackRequest();
  const searchStartTime = Date.now();

  try {
    // Input validation and sanitization
    if (!search || search.trim().length === 0) {
      return {
        message: "Search term is required",
        results: {
          opportunities: [],
          accounts: [],
          contacts: [],
          users: [],
          tasks: [],
          projects: [],
        },
      };
    }

    const sanitizedSearch = search.trim().substring(0, 100);
    
    // Use cached search for improved performance
    const cacheKey = CacheKeys.search(sanitizedSearch, userId);
    
    return await cachedQuery(
      cacheKey,
      async () => {
        // Execute all searches in parallel for better performance
        const [
          resultsCrmOpportunities,
          resultsCrmAccounts,
          resultsCrmContacts,
          resultsUser,
          resultsTasks,
        ] = await Promise.all([
          // Search in Organizations (opportunities) - highly optimized query
          optimizedSearch(
            prismadb.organization,
            sanitizedSearch,
            ['name', 'notes'],
            {
              pagination: { limit },
              where: { status: "ACTIVE" },
              select: {
                id: true,
                name: true,
                notes: true,
                estimatedRevenue: true,
                createdAt: true,
              },
              orderBy: { priority: 'asc' },
              userId,
            }
          ).then(result => result.data),

          // Search in Organizations (accounts) - highly optimized query
          optimizedSearch(
            prismadb.organization,
            sanitizedSearch,
            ['name', 'email', 'phone'],
            {
              pagination: { limit },
              where: { status: "ACTIVE" },
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                priority: true,
                segment: true,
                estimatedRevenue: true,
                createdAt: true,
              },
              orderBy: { priority: 'asc' },
              userId,
            }
          ).then(result => result.data),

          // Search in Contacts - highly optimized query
          optimizedSearch(
            prismadb.contact,
            sanitizedSearch,
            ['firstName', 'lastName', 'email'],
            {
              pagination: { limit },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                position: true,
                organizationId: true,
                organization: {
                  select: {
                    name: true,
                  },
                },
              },
              orderBy: { lastName: 'asc' },
              userId,
            }
          ).then(result => result.data),

          // Search in Users - highly optimized query with security filter
          optimizedSearch(
            prismadb.user,
            sanitizedSearch,
            ['name', 'email'],
            {
              pagination: { limit },
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                lastLoginAt: true,
                // Exclude sensitive fields like password
              },
              orderBy: { name: 'asc' },
              userId,
            }
          ).then(result => result.data),

          // Search in Tasks (using Interactions) - highly optimized query
          optimizedSearch(
            prismadb.interaction,
            sanitizedSearch,
            ['subject', 'description'],
            {
              pagination: { limit },
              where: { nextAction: { not: null } },
              select: {
                id: true,
                subject: true,
                description: true,
                type: true,
                date: true,
                nextAction: true,
                organizationId: true,
                organization: {
                  select: {
                    name: true,
                  },
                },
              },
              orderBy: { date: 'desc' },
              userId,
            }
          ).then(result => result.data),
        ]);

        // For projects, we'll use the same data as opportunities for now
        // In a real scenario, you'd have a separate Projects model
        const reslutsProjects = resultsCrmOpportunities;

        const searchDuration = Date.now() - searchStartTime;
        
        // Log performance metrics for B1 monitoring
        logger.info(
          `Search completed in ${searchDuration}ms for term: "${sanitizedSearch}"`,
          'SEARCH_PERFORMANCE',
          {
            searchTerm: sanitizedSearch,
            duration: searchDuration,
            totalResults: 
              resultsCrmOpportunities.length + 
              resultsCrmAccounts.length + 
              resultsCrmContacts.length + 
              resultsUser.length + 
              resultsTasks.length,
            userId,
            cacheHit: false, // First execution, not cached
          }
        );

        // Alert if search is too slow for B1 requirements
        if (searchDuration > 1000) {
          logger.warn(
            `Search operation exceeded 1s requirement: ${searchDuration}ms`,
            'B1_PERFORMANCE',
            { searchTerm: sanitizedSearch, duration: searchDuration }
          );
        }

        return {
          message: "Fulltext search response",
          searchTerm: sanitizedSearch,
          searchDuration,
          totalResults: 
            resultsCrmOpportunities.length + 
            resultsCrmAccounts.length + 
            resultsCrmContacts.length + 
            resultsUser.length + 
            resultsTasks.length,
          results: {
            opportunities: resultsCrmOpportunities,
            accounts: resultsCrmAccounts,
            contacts: resultsCrmContacts,
            users: resultsUser,
            tasks: resultsTasks,
            projects: reslutsProjects,
          },
          performance: {
            searchDuration,
            cached: false,
            meetsSLA: searchDuration <= 1000,
          },
        };
      },
      CacheStrategies.SEARCH
    );

  } catch (error) {
    const searchDuration = Date.now() - searchStartTime;
    
    logger.error(
      "Search operation failed",
      'SEARCH_ERROR',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        searchTerm: search,
        duration: searchDuration,
        userId,
      }
    );
    
    throw new Error("Search operation failed");
  } finally {
    endTracking();
  }
};
