/**
 * Redis Streams implementation for real-time report progress tracking
 * Provides live updates during report generation and processing
 * 
 * Features:
 * - Real-time progress tracking
 * - Consumer groups for scalability
 * - Message persistence and replay
 * - Automatic cleanup of old streams
 * - Fallback for environments without Redis
 */

import Redis from 'ioredis';
import { EventEmitter } from 'events';

export interface ReportProgress {
  reportId: string;
  userId: string;
  percentage: number;
  message: string;
  stage: 'initializing' | 'processing' | 'finalizing' | 'completed' | 'error';
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface StreamMessage {
  id: string;
  data: ReportProgress;
}

export interface StreamSubscription {
  unsubscribe: () => void;
  isActive: boolean;
}

/**
 * Redis Streams for real-time report progress tracking
 */
export class RedisStreamingCache {
  private redis: Redis | null = null;
  private fallbackEmitter = new EventEmitter();
  private subscriptions = new Map<string, StreamSubscription>();
  private consumerGroup = 'report-progress-consumers';
  private consumerName: string;

  // Stream configuration
  private readonly STREAM_KEY = 'report:progress';
  private readonly MAX_STREAM_LENGTH = 1000; // Keep last 1000 messages
  private readonly MESSAGE_TTL = 3600; // 1 hour in seconds

  constructor() {
    this.consumerName = `consumer-${Math.random().toString(36).substring(7)}`;
    this.initializeRedis();
  }

  private initializeRedis(): void {
    try {
      const redisUrl = process.env.REDIS_URL || process.env.AZURE_REDIS_URL;
      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          // Optimized for Azure B1
          maxConnections: 2,
          keepAlive: 30000,
          family: 4,
        });

        this.redis.on('error', (error) => {
          console.error('[STREAMING_CACHE] Redis connection error:', error);
          this.redis = null;
        });

        this.redis.on('ready', () => {
          this.initializeConsumerGroup();
        });
      }
    } catch (error) {
      console.error('[STREAMING_CACHE] Failed to initialize Redis:', error);
    }
  }

  /**
   * Initialize consumer group for scalable message processing
   */
  private async initializeConsumerGroup(): Promise<void> {
    if (!this.redis) return;

    try {
      // Create consumer group if it doesn't exist
      await this.redis.xgroup('CREATE', this.STREAM_KEY, this.consumerGroup, '0', 'MKSTREAM');
    } catch (error) {
      // Group might already exist, that's fine
      if (!error.message.includes('BUSYGROUP')) {
        console.error('[STREAMING_CACHE] Error creating consumer group:', error);
      }
    }
  }

  /**
   * Stream report progress update
   */
  async streamReportProgress(progress: ReportProgress): Promise<string | null> {
    try {
      if (this.redis) {
        return await this.streamToRedis(progress);
      } else {
        return await this.streamToFallback(progress);
      }
    } catch (error) {
      console.error('[STREAMING_CACHE] Error streaming progress:', error);
      // Fallback to in-memory event emitter
      return await this.streamToFallback(progress);
    }
  }

  /**
   * Stream to Redis Streams
   */
  private async streamToRedis(progress: ReportProgress): Promise<string> {
    const messageId = await this.redis!.xadd(
      this.STREAM_KEY,
      'MAXLEN',
      '~', // Approximate trimming
      this.MAX_STREAM_LENGTH,
      '*', // Auto-generate ID
      'reportId', progress.reportId,
      'userId', progress.userId,
      'percentage', progress.percentage.toString(),
      'message', progress.message,
      'stage', progress.stage,
      'timestamp', progress.timestamp.toString(),
      'metadata', JSON.stringify(progress.metadata || {})
    );

    return messageId;
  }

  /**
   * Fallback to in-memory event emitter
   */
  private async streamToFallback(progress: ReportProgress): Promise<string> {
    const messageId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Emit to specific report listeners
    this.fallbackEmitter.emit(`progress:${progress.reportId}`, {
      id: messageId,
      data: progress
    });

    // Emit to user listeners
    this.fallbackEmitter.emit(`progress:user:${progress.userId}`, {
      id: messageId,
      data: progress
    });

    return messageId;
  }

  /**
   * Subscribe to report progress updates
   */
  async subscribeToReportProgress(
    reportId: string,
    callback: (message: StreamMessage) => void,
    startFromBeginning = false
  ): Promise<StreamSubscription> {
    if (this.redis) {
      return await this.subscribeToRedisStream(reportId, callback, startFromBeginning);
    } else {
      return this.subscribeToFallback(reportId, callback);
    }
  }

  /**
   * Subscribe to Redis Stream
   */
  private async subscribeToRedisStream(
    reportId: string,
    callback: (message: StreamMessage) => void,
    startFromBeginning: boolean
  ): Promise<StreamSubscription> {
    let isActive = true;
    const subscriptionId = `${reportId}-${Date.now()}`;

    // Read existing messages if requested
    if (startFromBeginning) {
      await this.readHistoricalMessages(reportId, callback);
    }

    // Start consuming new messages
    const consumeMessages = async () => {
      while (isActive && this.redis) {
        try {
          const messages = await this.redis.xreadgroup(
            'GROUP',
            this.consumerGroup,
            this.consumerName,
            'COUNT',
            10,
            'BLOCK',
            1000, // 1 second timeout
            'STREAMS',
            this.STREAM_KEY,
            '>'
          );

          if (messages && messages.length > 0) {
            for (const [stream, streamMessages] of messages) {
              for (const [messageId, fields] of streamMessages) {
                const progress = this.parseStreamMessage(fields);
                
                // Only notify if this message is for our report
                if (progress.reportId === reportId) {
                  callback({
                    id: messageId,
                    data: progress
                  });

                  // Acknowledge message
                  await this.redis!.xack(this.STREAM_KEY, this.consumerGroup, messageId);
                }
              }
            }
          }
        } catch (error) {
          if (isActive) {
            console.error('[STREAMING_CACHE] Error consuming messages:', error);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    };

    // Start consuming in background
    consumeMessages();

    const subscription: StreamSubscription = {
      unsubscribe: () => {
        isActive = false;
        this.subscriptions.delete(subscriptionId);
      },
      isActive: true
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  /**
   * Subscribe to fallback event emitter
   */
  private subscribeToFallback(
    reportId: string,
    callback: (message: StreamMessage) => void
  ): StreamSubscription {
    const eventName = `progress:${reportId}`;
    
    this.fallbackEmitter.on(eventName, callback);

    const subscription: StreamSubscription = {
      unsubscribe: () => {
        this.fallbackEmitter.removeListener(eventName, callback);
      },
      isActive: true
    };

    return subscription;
  }

  /**
   * Subscribe to all progress updates for a user
   */
  async subscribeToUserProgress(
    userId: string,
    callback: (message: StreamMessage) => void
  ): Promise<StreamSubscription> {
    if (this.redis) {
      return await this.subscribeToUserRedisStream(userId, callback);
    } else {
      return this.subscribeToUserFallback(userId, callback);
    }
  }

  /**
   * Subscribe to all user updates via Redis
   */
  private async subscribeToUserRedisStream(
    userId: string,
    callback: (message: StreamMessage) => void
  ): Promise<StreamSubscription> {
    let isActive = true;
    const subscriptionId = `user-${userId}-${Date.now()}`;

    const consumeMessages = async () => {
      while (isActive && this.redis) {
        try {
          const messages = await this.redis.xreadgroup(
            'GROUP',
            this.consumerGroup,
            this.consumerName,
            'COUNT',
            10,
            'BLOCK',
            1000,
            'STREAMS',
            this.STREAM_KEY,
            '>'
          );

          if (messages && messages.length > 0) {
            for (const [stream, streamMessages] of messages) {
              for (const [messageId, fields] of streamMessages) {
                const progress = this.parseStreamMessage(fields);
                
                if (progress.userId === userId) {
                  callback({
                    id: messageId,
                    data: progress
                  });

                  await this.redis!.xack(this.STREAM_KEY, this.consumerGroup, messageId);
                }
              }
            }
          }
        } catch (error) {
          if (isActive) {
            console.error('[STREAMING_CACHE] Error consuming user messages:', error);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    };

    consumeMessages();

    const subscription: StreamSubscription = {
      unsubscribe: () => {
        isActive = false;
        this.subscriptions.delete(subscriptionId);
      },
      isActive: true
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  /**
   * Subscribe to user fallback events
   */
  private subscribeToUserFallback(
    userId: string,
    callback: (message: StreamMessage) => void
  ): StreamSubscription {
    const eventName = `progress:user:${userId}`;
    
    this.fallbackEmitter.on(eventName, callback);

    return {
      unsubscribe: () => {
        this.fallbackEmitter.removeListener(eventName, callback);
      },
      isActive: true
    };
  }

  /**
   * Read historical messages for a report
   */
  private async readHistoricalMessages(
    reportId: string,
    callback: (message: StreamMessage) => void
  ): Promise<void> {
    if (!this.redis) return;

    try {
      const messages = await this.redis.xrevrange(
        this.STREAM_KEY,
        '+',
        '-',
        'COUNT',
        100 // Last 100 messages
      );

      for (const [messageId, fields] of messages.reverse()) {
        const progress = this.parseStreamMessage(fields);
        
        if (progress.reportId === reportId) {
          callback({
            id: messageId,
            data: progress
          });
        }
      }
    } catch (error) {
      console.error('[STREAMING_CACHE] Error reading historical messages:', error);
    }
  }

  /**
   * Parse Redis stream message fields into ReportProgress
   */
  private parseStreamMessage(fields: string[]): ReportProgress {
    const fieldMap: Record<string, string> = {};
    
    for (let i = 0; i < fields.length; i += 2) {
      fieldMap[fields[i]] = fields[i + 1];
    }

    return {
      reportId: fieldMap.reportId,
      userId: fieldMap.userId,
      percentage: parseFloat(fieldMap.percentage),
      message: fieldMap.message,
      stage: fieldMap.stage as ReportProgress['stage'],
      timestamp: parseInt(fieldMap.timestamp),
      metadata: fieldMap.metadata ? JSON.parse(fieldMap.metadata) : {}
    };
  }

  /**
   * Get report progress history
   */
  async getReportHistory(reportId: string, limit = 50): Promise<StreamMessage[]> {
    if (!this.redis) {
      return [];
    }

    try {
      const messages = await this.redis.xrevrange(
        this.STREAM_KEY,
        '+',
        '-',
        'COUNT',
        limit
      );

      const reportMessages: StreamMessage[] = [];
      
      for (const [messageId, fields] of messages) {
        const progress = this.parseStreamMessage(fields);
        
        if (progress.reportId === reportId) {
          reportMessages.push({
            id: messageId,
            data: progress
          });
        }
      }

      return reportMessages.reverse(); // Chronological order
    } catch (error) {
      console.error('[STREAMING_CACHE] Error getting report history:', error);
      return [];
    }
  }

  /**
   * Cleanup old stream messages
   */
  async cleanup(): Promise<void> {
    if (!this.redis) return;

    try {
      // Trim stream to max length
      await this.redis.xtrim(this.STREAM_KEY, 'MAXLEN', '~', this.MAX_STREAM_LENGTH);
      
      // Clean up processed messages older than TTL
      const cutoffTime = Date.now() - (this.MESSAGE_TTL * 1000);
      const oldMessages = await this.redis.xrange(
        this.STREAM_KEY,
        '-',
        cutoffTime.toString(),
        'COUNT',
        100
      );

      if (oldMessages.length > 0) {
        const messageIds = oldMessages.map(([id]) => id);
        await this.redis.xdel(this.STREAM_KEY, ...messageIds);
      }
    } catch (error) {
      console.error('[STREAMING_CACHE] Error during cleanup:', error);
    }
  }

  /**
   * Get stream statistics
   */
  async getStreamStats(): Promise<{
    streamLength: number;
    consumerGroupInfo: any;
    totalConsumers: number;
  }> {
    if (!this.redis) {
      return {
        streamLength: 0,
        consumerGroupInfo: null,
        totalConsumers: 0
      };
    }

    try {
      const [streamInfo, groupInfo] = await Promise.all([
        this.redis.xinfo('STREAM', this.STREAM_KEY),
        this.redis.xinfo('GROUPS', this.STREAM_KEY)
      ]);

      return {
        streamLength: streamInfo[1] as number, // length is at index 1
        consumerGroupInfo: groupInfo[0] || null,
        totalConsumers: this.subscriptions.size
      };
    } catch (error) {
      console.error('[STREAMING_CACHE] Error getting stream stats:', error);
      return {
        streamLength: 0,
        consumerGroupInfo: null,
        totalConsumers: this.subscriptions.size
      };
    }
  }

  /**
   * Shutdown and cleanup all subscriptions
   */
  async shutdown(): Promise<void> {
    // Close all active subscriptions
    for (const subscription of this.subscriptions.values()) {
      subscription.unsubscribe();
    }
    this.subscriptions.clear();

    // Remove all fallback listeners
    this.fallbackEmitter.removeAllListeners();

    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }
}

// Global instance
export const redisStreamingCache = new RedisStreamingCache();

/**
 * Convenience functions for common streaming operations
 */
export const streamProgress = {
  /**
   * Stream report progress update
   */
  update: (progress: ReportProgress) => redisStreamingCache.streamReportProgress(progress),

  /**
   * Subscribe to specific report progress
   */
  subscribe: (reportId: string, callback: (message: StreamMessage) => void) =>
    redisStreamingCache.subscribeToReportProgress(reportId, callback),

  /**
   * Subscribe to all user reports
   */
  subscribeUser: (userId: string, callback: (message: StreamMessage) => void) =>
    redisStreamingCache.subscribeToUserProgress(userId, callback),

  /**
   * Get report history
   */
  getHistory: (reportId: string, limit?: number) =>
    redisStreamingCache.getReportHistory(reportId, limit)
};

// Cleanup on process exit
process.on('SIGTERM', () => redisStreamingCache.shutdown());
process.on('SIGINT', () => redisStreamingCache.shutdown());