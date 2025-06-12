/**
 * Azure SQL Automatic Tuning and Performance Monitoring
 * 
 * Based on official Azure SQL documentation recommendations:
 * - Enable automatic index creation/removal
 * - Monitor missing indexes via DMVs
 * - Track query performance issues
 */

import { prismadb } from './prisma';
import { logger } from './monitoring';

/**
 * Azure SQL Automatic Tuning Configuration
 * Enables CREATE_INDEX and DROP_INDEX automatic tuning
 */
export async function enableAzureSQLAutoTuning(): Promise<boolean> {
  try {
    // Enable automatic tuning for CREATE_INDEX and DROP_INDEX
    // Based on Azure SQL documentation: https://learn.microsoft.com/en-us/azure/azure-sql/database/automatic-tuning-overview
    await prismadb.$executeRaw`
      ALTER DATABASE CURRENT 
      SET AUTOMATIC_TUNING 
      (CREATE_INDEX = ON, DROP_INDEX = ON);
    `;

    logger.info('Azure SQL Automatic Tuning enabled successfully', 'AZURE_SQL');
    return true;
  } catch (error) {
    logger.error('Failed to enable Azure SQL Automatic Tuning', 'AZURE_SQL', error);
    return false;
  }
}

/**
 * Missing Index Analysis using Azure SQL DMVs
 * Based on Microsoft documentation for missing index detection
 */
export async function getMissingIndexRecommendations() {
  try {
    const missingIndexes = await prismadb.$queryRaw<Array<{
      runtime: string;
      index_group_handle: number;
      index_handle: number;
      improvement_measure: number;
      create_index_statement: string;
      database_id: number;
      object_id: number;
    }>>`
      SELECT
        CONVERT (varchar, getdate(), 126) AS runtime,
        mig.index_group_handle,
        mid.index_handle,
        CONVERT (decimal (28,1), migs.avg_total_user_cost * migs.avg_user_impact *
             (migs.user_seeks + migs.user_scans)) AS improvement_measure,
        'CREATE INDEX missing_index_' + CONVERT (varchar, mig.index_group_handle) + '_' +
             CONVERT (varchar, mid.index_handle) + ' ON ' + mid.statement + '
             (' + ISNULL (mid.equality_columns,'')
             + CASE WHEN mid.equality_columns IS NOT NULL
             AND mid.inequality_columns IS NOT NULL
             THEN ',' ELSE '' END + ISNULL (mid.inequality_columns, '') + ')'
             + ISNULL (' INCLUDE (' + mid.included_columns + ')', '') AS create_index_statement,
        mid.database_id,
        mid.[object_id]
      FROM sys.dm_db_missing_index_groups AS mig
        INNER JOIN sys.dm_db_missing_index_group_stats AS migs
           ON migs.group_handle = mig.index_group_handle
        INNER JOIN sys.dm_db_missing_index_details AS mid
           ON mig.index_handle = mid.index_handle
      WHERE migs.avg_total_user_cost * migs.avg_user_impact * (migs.user_seeks + migs.user_scans) > 10
      ORDER BY migs.avg_total_user_cost * migs.avg_user_impact * (migs.user_seeks + migs.user_scans) DESC
    `;

    // Log recommendations for high-impact missing indexes
    if (missingIndexes.length > 0) {
      logger.info(`Found ${missingIndexes.length} missing index recommendations`, 'AZURE_SQL', {
        topRecommendation: missingIndexes[0],
        totalRecommendations: missingIndexes.length
      });
    } else {
      logger.info('No missing index recommendations found', 'AZURE_SQL');
    }

    return missingIndexes;
  } catch (error) {
    logger.error('Failed to analyze missing indexes', 'AZURE_SQL', error);
    return [];
  }
}

/**
 * Query Store Performance Analysis
 * Identifies poorly parameterized queries causing excessive compilations
 */
export async function analyzeQueryStorePerformance() {
  try {
    const poorlyParameterizedQueries = await prismadb.$queryRaw<Array<{
      query_hash: string;
      number_of_distinct_query_ids: number;
      sampled_query_text: string;
    }>>`
      SELECT TOP 10
        q.query_hash,
        count (distinct p.query_id ) AS number_of_distinct_query_ids,
        min(qt.query_sql_text) AS sampled_query_text
      FROM sys.query_store_query_text AS qt
        JOIN sys.query_store_query AS q
           ON qt.query_text_id = q.query_text_id
        JOIN sys.query_store_plan AS p
           ON q.query_id = p.query_id
        JOIN sys.query_store_runtime_stats AS rs
           ON rs.plan_id = p.plan_id
        JOIN sys.query_store_runtime_stats_interval AS rsi
           ON rsi.runtime_stats_interval_id = rs.runtime_stats_interval_id
      WHERE
        rsi.start_time >= DATEADD(hour, -2, GETUTCDATE())
        AND query_parameterization_type_desc IN ('User', 'None')
      GROUP BY q.query_hash
      ORDER BY count (distinct p.query_id) DESC;
    `;

    if (poorlyParameterizedQueries.length > 0) {
      logger.warn(`Found ${poorlyParameterizedQueries.length} poorly parameterized queries`, 'QUERY_STORE', {
        topQuery: poorlyParameterizedQueries[0]
      });
    }

    return poorlyParameterizedQueries;
  } catch (error) {
    logger.error('Failed to analyze Query Store performance', 'QUERY_STORE', error);
    return [];
  }
}

/**
 * Azure SQL Resource Monitoring
 * Tracks real-time resource consumption
 */
export async function getAzureSQLResourceStats() {
  try {
    // Real-time resource stats for current database
    const realtimeStats = await prismadb.$queryRaw<Array<{
      end_time: Date;
      avg_cpu_percent: number;
      max_worker_percent: number;
      max_session_percent: number;
    }>>`
      SELECT end_time, avg_cpu_percent, max_worker_percent, max_session_percent
      FROM sys.dm_db_resource_stats
      ORDER BY end_time DESC
    `;

    // Historical resource stats (requires master database connection)
    // This would need to be run separately with master database connection
    
    return {
      realtime: realtimeStats.slice(0, 10), // Last 10 samples
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to get Azure SQL resource stats', 'AZURE_SQL', error);
    return null;
  }
}

/**
 * Comprehensive Azure SQL Health Check
 * Combines all monitoring capabilities
 */
export async function performAzureSQLHealthCheck() {
  const startTime = Date.now();
  
  try {
    const [
      missingIndexes,
      queryStoreAnalysis,
      resourceStats,
    ] = await Promise.all([
      getMissingIndexRecommendations(),
      analyzeQueryStorePerformance(),
      getAzureSQLResourceStats(),
    ]);

    const healthCheckDuration = Date.now() - startTime;

    const healthReport = {
      timestamp: new Date().toISOString(),
      duration: healthCheckDuration,
      
      indexOptimization: {
        missingIndexCount: missingIndexes.length,
        topRecommendations: missingIndexes.slice(0, 5),
        hasHighImpactMissing: missingIndexes.some(idx => idx.improvement_measure > 100),
      },
      
      queryPerformance: {
        poorlyParameterizedCount: queryStoreAnalysis.length,
        topIssues: queryStoreAnalysis.slice(0, 3),
        needsParameterization: queryStoreAnalysis.length > 0,
      },
      
      resourceUtilization: {
        currentStats: resourceStats?.realtime[0] || null,
        trend: resourceStats?.realtime.slice(0, 5) || [],
        healthy: resourceStats?.realtime[0]?.avg_cpu_percent < 80,
      },
      
      recommendations: [
        ...(missingIndexes.length > 0 ? ['Review and implement missing indexes'] : []),
        ...(queryStoreAnalysis.length > 0 ? ['Improve query parameterization'] : []),
        ...(resourceStats?.realtime[0]?.avg_cpu_percent > 80 ? ['Investigate high CPU usage'] : []),
      ],
    };

    logger.info('Azure SQL health check completed', 'AZURE_SQL', {
      duration: healthCheckDuration,
      missingIndexes: missingIndexes.length,
      performanceIssues: queryStoreAnalysis.length,
    });

    return healthReport;
  } catch (error) {
    logger.error('Azure SQL health check failed', 'AZURE_SQL', error);
    return null;
  }
}

/**
 * Initialize Azure SQL optimizations
 * Call this during application startup
 */
export async function initializeAzureSQLOptimizations() {
  logger.info('Initializing Azure SQL optimizations...', 'AZURE_SQL');
  
  try {
    // Enable automatic tuning
    const tuningEnabled = await enableAzureSQLAutoTuning();
    
    // Perform initial health check
    const healthReport = await performAzureSQLHealthCheck();
    
    // Schedule periodic health checks (every 30 minutes)
    setInterval(async () => {
      try {
        await performAzureSQLHealthCheck();
      } catch (error) {
        logger.error('Scheduled Azure SQL health check failed', 'AZURE_SQL', error);
      }
    }, 30 * 60 * 1000); // 30 minutes
    
    logger.info('Azure SQL optimizations initialized successfully', 'AZURE_SQL', {
      autoTuningEnabled: tuningEnabled,
      initialHealthCheck: !!healthReport,
    });
    
    return {
      autoTuningEnabled: tuningEnabled,
      initialHealthReport: healthReport,
    };
  } catch (error) {
    logger.error('Failed to initialize Azure SQL optimizations', 'AZURE_SQL', error);
    return null;
  }
}