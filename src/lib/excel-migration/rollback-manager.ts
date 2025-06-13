import * as fs from 'fs/promises';
import * as path from 'path';

export interface MigrationCheckpoint {
  id: string;
  timestamp: Date;
  phase: 'mapping' | 'validation' | 'transformation' | 'loading' | 'complete';
  table: string;
  recordsProcessed: number;
  confidence: number;
  metadata: Record<string, any>;
}

export interface RollbackStrategy {
  type: 'full' | 'partial' | 'table' | 'checkpoint';
  checkpointId?: string;
  tables?: string[];
  reason: string;
  confidence: number;
}

export interface RollbackResult {
  success: boolean;
  recordsAffected: number;
  tablesAffected: string[];
  errors: string[];
  duration: number;
}

export interface MigrationState {
  id: string;
  startedAt: Date;
  status: 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  checkpoints: MigrationCheckpoint[];
  processedTables: {
    table: string;
    recordCount: number;
    confidence: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  }[];
  errors: {
    timestamp: Date;
    phase: string;
    table?: string;
    error: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
}

export class RollbackManager {
  private stateDir: string;
  private currentState: MigrationState | null = null;
  private checkpointThreshold = 1000; // Records per checkpoint
  
  constructor(stateDirectory: string = './migration-state') {
    this.stateDir = stateDirectory;
  }

  /**
   * Initialize migration state
   */
  async initializeMigration(migrationId: string): Promise<MigrationState> {
    await this.ensureStateDirectory();
    
    this.currentState = {
      id: migrationId,
      startedAt: new Date(),
      status: 'in_progress',
      checkpoints: [],
      processedTables: [],
      errors: []
    };
    
    await this.saveState();
    return this.currentState;
  }

  /**
   * Create a checkpoint during migration
   */
  async createCheckpoint(
    phase: MigrationCheckpoint['phase'],
    table: string,
    recordsProcessed: number,
    confidence: number,
    metadata: Record<string, any> = {}
  ): Promise<MigrationCheckpoint> {
    if (!this.currentState) {
      throw new Error('No active migration state');
    }

    const checkpoint: MigrationCheckpoint = {
      id: `cp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      phase,
      table,
      recordsProcessed,
      confidence,
      metadata
    };

    this.currentState.checkpoints.push(checkpoint);
    
    // Save checkpoint data
    await this.saveCheckpointData(checkpoint);
    await this.saveState();
    
    return checkpoint;
  }

  /**
   * Determine rollback strategy based on confidence and errors
   */
  determineRollbackStrategy(
    errors: any[],
    averageConfidence: number,
    affectedTables: string[]
  ): RollbackStrategy {
    // Critical errors require full rollback
    const criticalErrors = errors.filter(e => e.severity === 'critical');
    if (criticalErrors.length > 0) {
      return {
        type: 'full',
        reason: `Critical errors detected: ${criticalErrors[0].error}`,
        confidence: 0.9
      };
    }

    // Very low confidence suggests fundamental mapping issues
    if (averageConfidence < 3) {
      return {
        type: 'full',
        reason: 'Average confidence below acceptable threshold (3.0)',
        confidence: 0.8
      };
    }

    // High error rate in specific tables
    const tableErrorRates = this.calculateTableErrorRates(errors, affectedTables);
    const highErrorTables = tableErrorRates.filter(t => t.errorRate > 0.3);
    
    if (highErrorTables.length > 0) {
      return {
        type: 'table',
        tables: highErrorTables.map(t => t.table),
        reason: `High error rate in tables: ${highErrorTables.map(t => t.table).join(', ')}`,
        confidence: 0.7
      };
    }

    // Medium confidence with some errors - partial rollback
    if (averageConfidence < 6 && errors.length > 0) {
      const lastGoodCheckpoint = this.findLastGoodCheckpoint();
      if (lastGoodCheckpoint) {
        return {
          type: 'checkpoint',
          checkpointId: lastGoodCheckpoint.id,
          reason: 'Medium confidence with errors - rollback to last good checkpoint',
          confidence: 0.6
        };
      }
    }

    // Low confidence but no critical errors - partial rollback
    if (averageConfidence < 5) {
      return {
        type: 'partial',
        reason: 'Low confidence scores detected',
        confidence: 0.5
      };
    }

    // No rollback needed
    return {
      type: 'partial',
      reason: 'No significant issues detected',
      confidence: 0.1
    };
  }

  /**
   * Execute rollback based on strategy
   */
  async executeRollback(strategy: RollbackStrategy): Promise<RollbackResult> {
    const startTime = Date.now();
    const result: RollbackResult = {
      success: false,
      recordsAffected: 0,
      tablesAffected: [],
      errors: [],
      duration: 0
    };

    try {
      switch (strategy.type) {
        case 'full':
          result.recordsAffected = await this.rollbackFull();
          result.tablesAffected = this.currentState?.processedTables.map(t => t.table) || [];
          break;
          
        case 'table':
          if (strategy.tables) {
            for (const table of strategy.tables) {
              const affected = await this.rollbackTable(table);
              result.recordsAffected += affected;
              result.tablesAffected.push(table);
            }
          }
          break;
          
        case 'checkpoint':
          if (strategy.checkpointId) {
            const checkpoint = this.currentState?.checkpoints.find(cp => cp.id === strategy.checkpointId);
            if (checkpoint) {
              result.recordsAffected = await this.rollbackToCheckpoint(checkpoint);
              result.tablesAffected = this.getTablesAfterCheckpoint(checkpoint);
            }
          }
          break;
          
        case 'partial':
          // Rollback only low-confidence mappings
          result.recordsAffected = await this.rollbackLowConfidenceRecords();
          result.tablesAffected = ['Various'];
          break;
      }

      result.success = true;
      
      if (this.currentState) {
        this.currentState.status = 'rolled_back';
        await this.saveState();
      }
      
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Save rollback plan for review
   */
  async saveRollbackPlan(
    strategy: RollbackStrategy,
    affectedRecords: any[],
    confidence: number
  ): Promise<string> {
    const planId = `rollback_plan_${Date.now()}`;
    const planPath = path.join(this.stateDir, 'rollback-plans', `${planId}.json`);
    
    const plan = {
      id: planId,
      timestamp: new Date(),
      strategy,
      confidence,
      affectedRecordCount: affectedRecords.length,
      sampleRecords: affectedRecords.slice(0, 10),
      estimatedDuration: this.estimateRollbackDuration(strategy, affectedRecords.length)
    };

    await fs.mkdir(path.dirname(planPath), { recursive: true });
    await fs.writeFile(planPath, JSON.stringify(plan, null, 2));
    
    return planId;
  }

  /**
   * Generate rollback report
   */
  async generateRollbackReport(result: RollbackResult): Promise<string> {
    const report = [
      '# Migration Rollback Report',
      '',
      `## Summary`,
      `- Status: ${result.success ? 'SUCCESS' : 'FAILED'}`,
      `- Records Affected: ${result.recordsAffected.toLocaleString()}`,
      `- Tables Affected: ${result.tablesAffected.join(', ')}`,
      `- Duration: ${(result.duration / 1000).toFixed(2)} seconds`,
      '',
    ];

    if (result.errors.length > 0) {
      report.push('## Errors');
      result.errors.forEach(error => {
        report.push(`- ${error}`);
      });
      report.push('');
    }

    if (this.currentState) {
      report.push('## Migration State');
      report.push(`- Migration ID: ${this.currentState.id}`);
      report.push(`- Started At: ${this.currentState.startedAt.toISOString()}`);
      report.push(`- Final Status: ${this.currentState.status}`);
      report.push(`- Checkpoints Created: ${this.currentState.checkpoints.length}`);
      report.push('');

      if (this.currentState.errors.length > 0) {
        report.push('## Migration Errors');
        this.currentState.errors.slice(-10).forEach(error => {
          report.push(`- [${error.timestamp.toISOString()}] ${error.phase} - ${error.error}`);
        });
      }
    }

    return report.join('\n');
  }

  // Private helper methods

  private async ensureStateDirectory() {
    await fs.mkdir(this.stateDir, { recursive: true });
    await fs.mkdir(path.join(this.stateDir, 'checkpoints'), { recursive: true });
    await fs.mkdir(path.join(this.stateDir, 'rollback-plans'), { recursive: true });
  }

  private async saveState() {
    if (!this.currentState) return;
    
    const statePath = path.join(this.stateDir, `${this.currentState.id}.json`);
    await fs.writeFile(statePath, JSON.stringify(this.currentState, null, 2));
  }

  private async saveCheckpointData(checkpoint: MigrationCheckpoint) {
    const checkpointPath = path.join(this.stateDir, 'checkpoints', `${checkpoint.id}.json`);
    await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));
  }

  private calculateTableErrorRates(errors: any[], tables: string[]) {
    const tableErrors = new Map<string, number>();
    const tableRecords = new Map<string, number>();

    // Count errors per table
    errors.forEach(error => {
      if (error.table) {
        tableErrors.set(error.table, (tableErrors.get(error.table) || 0) + 1);
      }
    });

    // Get record counts from state
    this.currentState?.processedTables.forEach(t => {
      tableRecords.set(t.table, t.recordCount);
    });

    // Calculate error rates
    return tables.map(table => ({
      table,
      errorRate: (tableErrors.get(table) || 0) / (tableRecords.get(table) || 1)
    }));
  }

  private findLastGoodCheckpoint(): MigrationCheckpoint | null {
    if (!this.currentState) return null;
    
    // Find last checkpoint with high confidence
    const goodCheckpoints = this.currentState.checkpoints
      .filter(cp => cp.confidence >= 7)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return goodCheckpoints[0] || null;
  }

  private async rollbackFull(): Promise<number> {
    // Implementation would depend on database/storage system
    // This is a placeholder showing the concept
    console.log('Executing full rollback...');
    return this.currentState?.processedTables.reduce((sum, t) => sum + t.recordCount, 0) || 0;
  }

  private async rollbackTable(table: string): Promise<number> {
    console.log(`Executing rollback for table: ${table}`);
    const tableInfo = this.currentState?.processedTables.find(t => t.table === table);
    return tableInfo?.recordCount || 0;
  }

  private async rollbackToCheckpoint(checkpoint: MigrationCheckpoint): Promise<number> {
    console.log(`Executing rollback to checkpoint: ${checkpoint.id}`);
    // Calculate affected records after checkpoint
    const checkpointIndex = this.currentState?.checkpoints.findIndex(cp => cp.id === checkpoint.id) || 0;
    const affectedCheckpoints = this.currentState?.checkpoints.slice(checkpointIndex + 1) || [];
    
    return affectedCheckpoints.reduce((sum, cp) => sum + cp.recordsProcessed, 0);
  }

  private async rollbackLowConfidenceRecords(): Promise<number> {
    console.log('Executing partial rollback for low-confidence records...');
    // This would identify and rollback only records with confidence < 5
    return 0; // Placeholder
  }

  private getTablesAfterCheckpoint(checkpoint: MigrationCheckpoint): string[] {
    const checkpointIndex = this.currentState?.checkpoints.findIndex(cp => cp.id === checkpoint.id) || 0;
    const affectedCheckpoints = this.currentState?.checkpoints.slice(checkpointIndex + 1) || [];
    
    return [...new Set(affectedCheckpoints.map(cp => cp.table))];
  }

  private estimateRollbackDuration(strategy: RollbackStrategy, recordCount: number): number {
    // Rough estimates in milliseconds
    const baseTime = 1000; // 1 second base
    const perRecordTime = 10; // 10ms per record
    
    let multiplier = 1;
    switch (strategy.type) {
      case 'full': multiplier = 1.5; break;
      case 'table': multiplier = 1.2; break;
      case 'checkpoint': multiplier = 1.3; break;
      case 'partial': multiplier = 2; break; // More complex
    }
    
    return Math.round(baseTime + (recordCount * perRecordTime * multiplier));
  }

  /**
   * Log migration error
   */
  async logError(
    phase: string,
    error: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    table?: string
  ) {
    if (!this.currentState) return;
    
    this.currentState.errors.push({
      timestamp: new Date(),
      phase,
      table,
      error,
      severity
    });
    
    await this.saveState();
  }

  /**
   * Update table processing status
   */
  async updateTableStatus(
    table: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    recordCount?: number,
    confidence?: number
  ) {
    if (!this.currentState) return;
    
    const tableInfo = this.currentState.processedTables.find(t => t.table === table);
    if (tableInfo) {
      tableInfo.status = status;
      if (recordCount !== undefined) tableInfo.recordCount = recordCount;
      if (confidence !== undefined) tableInfo.confidence = confidence;
    } else {
      this.currentState.processedTables.push({
        table,
        recordCount: recordCount || 0,
        confidence: confidence || 0,
        status
      });
    }
    
    await this.saveState();
  }
}