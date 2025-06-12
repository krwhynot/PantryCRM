/**
 * Data Retention Policies for PantryCRM
 * Implements automated data lifecycle management and compliance
 * 
 * COMPLIANCE: GDPR, CCPA, FSMA, Industry best practices
 */

import { prismadb } from '@/lib/prisma';
import { logSecurityEvent } from '@/lib/security-logger';

/**
 * Data retention configuration
 */
export interface RetentionPolicy {
  dataType: string;
  retentionPeriodDays: number;
  archivePeriodDays?: number; // Move to cold storage before deletion
  requiresUserConsent?: boolean; // For GDPR compliance
  legalHoldExempt?: boolean; // Can be deleted even under legal hold
  complianceStandard: 'GDPR' | 'CCPA' | 'FSMA' | 'SOX' | 'INTERNAL';
}

/**
 * Default retention policies for different data types
 */
const DEFAULT_RETENTION_POLICIES: RetentionPolicy[] = [
  // User and Authentication Data
  {
    dataType: 'user_sessions',
    retentionPeriodDays: 30,
    requiresUserConsent: false,
    legalHoldExempt: true,
    complianceStandard: 'INTERNAL'
  },
  {
    dataType: 'security_logs',
    retentionPeriodDays: 2555, // 7 years
    requiresUserConsent: false,
    legalHoldExempt: false,
    complianceStandard: 'SOX'
  },
  
  // Business Data
  {
    dataType: 'organizations',
    retentionPeriodDays: 2555, // 7 years after last activity
    archivePeriodDays: 1825, // 5 years
    requiresUserConsent: false,
    legalHoldExempt: false,
    complianceStandard: 'INTERNAL'
  },
  {
    dataType: 'contacts',
    retentionPeriodDays: 1095, // 3 years after last contact
    archivePeriodDays: 730, // 2 years
    requiresUserConsent: true, // GDPR - personal data
    legalHoldExempt: false,
    complianceStandard: 'GDPR'
  },
  {
    dataType: 'interactions',
    retentionPeriodDays: 1095, // 3 years
    archivePeriodDays: 365, // 1 year
    requiresUserConsent: false,
    legalHoldExempt: false,
    complianceStandard: 'INTERNAL'
  },
  
  // Food Service Specific
  {
    dataType: 'supplier_contracts',
    retentionPeriodDays: 2555, // 7 years (FSMA requirement)
    archivePeriodDays: 1825, // 5 years
    requiresUserConsent: false,
    legalHoldExempt: false,
    complianceStandard: 'FSMA'
  },
  {
    dataType: 'compliance_records',
    retentionPeriodDays: 2555, // 7 years
    requiresUserConsent: false,
    legalHoldExempt: false,
    complianceStandard: 'FSMA'
  },
  
  // Marketing and Analytics
  {
    dataType: 'marketing_interactions',
    retentionPeriodDays: 1095, // 3 years
    requiresUserConsent: true, // GDPR
    legalHoldExempt: true,
    complianceStandard: 'GDPR'
  }
];

/**
 * Legal hold tracking
 */
interface LegalHold {
  id: string;
  reason: string;
  startDate: Date;
  endDate?: Date;
  affectedDataTypes: string[];
  affectedRecords?: string[]; // Specific record IDs
  isActive: boolean;
}

/**
 * Data retention service
 */
export class DataRetentionService {
  private retentionPolicies: Map<string, RetentionPolicy>;
  private legalHolds: Map<string, LegalHold>;
  
  constructor(policies: RetentionPolicy[] = DEFAULT_RETENTION_POLICIES) {
    this.retentionPolicies = new Map();
    this.legalHolds = new Map();
    
    policies.forEach(policy => {
      this.retentionPolicies.set(policy.dataType, policy);
    });
    
    // Load active legal holds from database
    this.loadLegalHolds();
  }
  
  /**
   * Check if data should be archived
   */
  shouldArchive(dataType: string, createdDate: Date, lastActivityDate?: Date): boolean {
    const policy = this.retentionPolicies.get(dataType);
    if (!policy || !policy.archivePeriodDays) return false;
    
    const referenceDate = lastActivityDate || createdDate;
    const archiveThreshold = new Date(Date.now() - policy.archivePeriodDays * 24 * 60 * 60 * 1000);
    
    return referenceDate < archiveThreshold;
  }
  
  /**
   * Check if data should be deleted
   */
  shouldDelete(dataType: string, createdDate: Date, lastActivityDate?: Date, recordId?: string): boolean {
    const policy = this.retentionPolicies.get(dataType);
    if (!policy) return false;
    
    // Check legal holds
    if (!policy.legalHoldExempt && this.isUnderLegalHold(dataType, recordId)) {
      return false;
    }
    
    const referenceDate = lastActivityDate || createdDate;
    const deleteThreshold = new Date(Date.now() - policy.retentionPeriodDays * 24 * 60 * 60 * 1000);
    
    return referenceDate < deleteThreshold;
  }
  
  /**
   * Check if data is under legal hold
   */
  private isUnderLegalHold(dataType: string, recordId?: string): boolean {
    for (const hold of this.legalHolds.values()) {
      if (!hold.isActive) continue;
      
      if (hold.affectedDataTypes.includes(dataType)) {
        // If specific records are specified, check if this record is included
        if (hold.affectedRecords && recordId) {
          return hold.affectedRecords.includes(recordId);
        }
        // Otherwise, all records of this type are under hold
        return true;
      }
    }
    return false;
  }
  
  /**
   * Archive old organizations and related data
   */
  async archiveOldOrganizations(): Promise<number> {
    let archivedCount = 0;
    
    try {
      const archiveThreshold = new Date(Date.now() - 1825 * 24 * 60 * 60 * 1000); // 5 years
      
      const organizationsToArchive = await prismadb.organization.findMany({
        where: {
          OR: [
            { lastContactDate: { lt: archiveThreshold } },
            { 
              lastContactDate: null,
              createdAt: { lt: archiveThreshold }
            }
          ],
          status: { not: 'ACTIVE' }
        },
        select: { id: true, name: true, lastContactDate: true, createdAt: true }
      });
      
      for (const org of organizationsToArchive) {
        if (!this.isUnderLegalHold('organizations', org.id)) {
          // Move to archive status instead of deleting
          await prismadb.organization.update({
            where: { id: org.id },
            data: { 
              status: 'ARCHIVED',
              notes: `${org.notes || ''}\n[ARCHIVED: ${new Date().toISOString()}]`
            }
          });
          archivedCount++;
          
          await this.logRetentionAction('archive', 'organizations', org.id, {
            organizationName: org.name,
            lastActivity: org.lastContactDate || org.createdAt
          });
        }
      }
      
    } catch (error) {
      console.error('[RETENTION] Error archiving organizations:', error);
    }
    
    return archivedCount;
  }
  
  /**
   * Delete old contacts per GDPR requirements
   */
  async deleteOldContacts(): Promise<number> {
    let deletedCount = 0;
    
    try {
      const deleteThreshold = new Date(Date.now() - 1095 * 24 * 60 * 60 * 1000); // 3 years
      
      const contactsToDelete = await prismadb.contact.findMany({
        where: {
          updatedAt: { lt: deleteThreshold },
          // Only delete contacts from inactive organizations
          organization: {
            status: { in: ['INACTIVE', 'ARCHIVED'] }
          }
        },
        select: { 
          id: true, 
          firstName: true, 
          lastName: true, 
          email: true,
          organizationId: true,
          updatedAt: true 
        }
      });
      
      for (const contact of contactsToDelete) {
        if (!this.isUnderLegalHold('contacts', contact.id)) {
          // Log before deletion for audit trail
          await this.logRetentionAction('delete', 'contacts', contact.id, {
            contactName: `${contact.firstName} ${contact.lastName}`,
            email: contact.email,
            organizationId: contact.organizationId,
            lastActivity: contact.updatedAt,
            complianceStandard: 'GDPR'
          });
          
          // Delete contact and related data
          await prismadb.interaction.deleteMany({
            where: { contactId: contact.id }
          });
          
          await prismadb.contact.delete({
            where: { id: contact.id }
          });
          
          deletedCount++;
        }
      }
      
    } catch (error) {
      console.error('[RETENTION] Error deleting contacts:', error);
    }
    
    return deletedCount;
  }
  
  /**
   * Archive old interactions
   */
  async archiveOldInteractions(): Promise<number> {
    let archivedCount = 0;
    
    try {
      const archiveThreshold = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year
      
      const interactionsToArchive = await prismadb.interaction.findMany({
        where: {
          date: { lt: archiveThreshold },
          // Don't archive interactions related to active contracts
          organization: {
            contracts: {
              none: {
                status: 'ACTIVE'
              }
            }
          }
        },
        select: { id: true, date: true, organizationId: true, type: true }
      });
      
      // Mark as archived instead of deleting (for compliance)
      for (const interaction of interactionsToArchive) {
        if (!this.isUnderLegalHold('interactions', interaction.id)) {
          await prismadb.interaction.update({
            where: { id: interaction.id },
            data: {
              description: `${interaction.description || ''}\n[ARCHIVED: ${new Date().toISOString()}]`
            }
          });
          archivedCount++;
        }
      }
      
    } catch (error) {
      console.error('[RETENTION] Error archiving interactions:', error);
    }
    
    return archivedCount;
  }
  
  /**
   * Clean up old security logs
   */
  async cleanupSecurityLogs(): Promise<number> {
    let cleanedCount = 0;
    
    try {
      // Keep security logs for 7 years as per SOX requirements
      const deleteThreshold = new Date(Date.now() - 2555 * 24 * 60 * 60 * 1000);
      
      const result = await prismadb.systemSetting.deleteMany({
        where: {
          type: 'security_log',
          createdAt: { lt: deleteThreshold }
        }
      });
      
      cleanedCount = result.count;
      
      if (cleanedCount > 0) {
        await this.logRetentionAction('delete', 'security_logs', 'batch', {
          deletedCount: cleanedCount,
          threshold: deleteThreshold,
          complianceStandard: 'SOX'
        });
      }
      
    } catch (error) {
      console.error('[RETENTION] Error cleaning security logs:', error);
    }
    
    return cleanedCount;
  }
  
  /**
   * Run full data retention cleanup
   */
  async runRetentionCleanup(): Promise<{
    archived: number;
    deleted: number;
    errors: string[];
  }> {
    console.log('[RETENTION] Starting automated data retention cleanup...');
    
    let totalArchived = 0;
    let totalDeleted = 0;
    const errors: string[] = [];
    
    try {
      // Archive old organizations
      totalArchived += await this.archiveOldOrganizations();
      
      // Archive old interactions
      totalArchived += await this.archiveOldInteractions();
      
      // Delete old contacts (GDPR compliance)
      totalDeleted += await this.deleteOldContacts();
      
      // Clean up old security logs
      totalDeleted += await this.cleanupSecurityLogs();
      
      console.log(`[RETENTION] Cleanup completed: ${totalArchived} archived, ${totalDeleted} deleted`);
      
    } catch (error) {
      const errorMsg = `Retention cleanup failed: ${error}`;
      errors.push(errorMsg);
      console.error('[RETENTION]', errorMsg);
    }
    
    return {
      archived: totalArchived,
      deleted: totalDeleted,
      errors
    };
  }
  
  /**
   * Add legal hold
   */
  async addLegalHold(
    reason: string,
    dataTypes: string[],
    specificRecords?: string[]
  ): Promise<string> {
    const holdId = `hold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const legalHold: LegalHold = {
      id: holdId,
      reason,
      startDate: new Date(),
      affectedDataTypes: dataTypes,
      affectedRecords: specificRecords,
      isActive: true
    };
    
    this.legalHolds.set(holdId, legalHold);
    
    // Store in database
    await prismadb.systemSetting.create({
      data: {
        key: `legal_hold_${holdId}`,
        value: JSON.stringify(legalHold),
        type: 'legal_hold'
      }
    });
    
    await this.logRetentionAction('legal_hold_created', 'system', holdId, {
      reason,
      dataTypes,
      recordCount: specificRecords?.length || 'all'
    });
    
    return holdId;
  }
  
  /**
   * Release legal hold
   */
  async releaseLegalHold(holdId: string): Promise<void> {
    const hold = this.legalHolds.get(holdId);
    if (hold) {
      hold.isActive = false;
      hold.endDate = new Date();
      
      // Update in database
      await prismadb.systemSetting.update({
        where: { key: `legal_hold_${holdId}` },
        data: { value: JSON.stringify(hold) }
      });
      
      await this.logRetentionAction('legal_hold_released', 'system', holdId, {
        reason: hold.reason,
        duration: hold.endDate.getTime() - hold.startDate.getTime()
      });
    }
  }
  
  /**
   * Load legal holds from database
   */
  private async loadLegalHolds(): Promise<void> {
    try {
      const legalHoldSettings = await prismadb.systemSetting.findMany({
        where: { type: 'legal_hold' }
      });
      
      for (const setting of legalHoldSettings) {
        try {
          const hold: LegalHold = JSON.parse(setting.value);
          this.legalHolds.set(hold.id, hold);
        } catch (error) {
          console.error('[RETENTION] Error parsing legal hold:', setting.key, error);
        }
      }
    } catch (error) {
      console.error('[RETENTION] Error loading legal holds:', error);
    }
  }
  
  /**
   * Log retention actions for audit trail
   */
  private async logRetentionAction(
    action: string,
    dataType: string,
    recordId: string,
    details: Record<string, any>
  ): Promise<void> {
    logSecurityEvent('data_access', {
      userId: 'system',
      resourceType: 'data_retention',
      resourceId: recordId,
      action,
      dataType,
      ...details,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Get retention statistics for dashboard
   */
  async getRetentionStats(): Promise<any> {
    try {
      const stats = {
        organizationsEligibleForArchival: 0,
        contactsEligibleForDeletion: 0,
        interactionsEligibleForArchival: 0,
        activeLegalHolds: 0,
        oldestRecord: null as Date | null,
        retentionPoliciesCount: this.retentionPolicies.size
      };
      
      // Count organizations eligible for archival
      const archiveThreshold = new Date(Date.now() - 1825 * 24 * 60 * 60 * 1000);
      stats.organizationsEligibleForArchival = await prismadb.organization.count({
        where: {
          OR: [
            { lastContactDate: { lt: archiveThreshold } },
            { 
              lastContactDate: null,
              createdAt: { lt: archiveThreshold }
            }
          ],
          status: { not: 'ACTIVE' }
        }
      });
      
      // Count contacts eligible for deletion
      const deleteThreshold = new Date(Date.now() - 1095 * 24 * 60 * 60 * 1000);
      stats.contactsEligibleForDeletion = await prismadb.contact.count({
        where: {
          updatedAt: { lt: deleteThreshold },
          organization: {
            status: { in: ['INACTIVE', 'ARCHIVED'] }
          }
        }
      });
      
      // Count active legal holds
      stats.activeLegalHolds = Array.from(this.legalHolds.values())
        .filter(hold => hold.isActive).length;
      
      return stats;
    } catch (error) {
      console.error('[RETENTION] Error getting stats:', error);
      return null;
    }
  }
}

// Global retention service instance
export const dataRetentionService = new DataRetentionService();

// Convenience functions
export async function runDailyRetentionCleanup(): Promise<void> {
  const result = await dataRetentionService.runRetentionCleanup();
  
  if (result.errors.length > 0) {
    console.error('[RETENTION] Cleanup completed with errors:', result.errors);
  } else {
    console.log(`[RETENTION] Daily cleanup successful: ${result.archived} archived, ${result.deleted} deleted`);
  }
}

export async function addDataLegalHold(
  reason: string,
  dataTypes: string[],
  specificRecords?: string[]
): Promise<string> {
  return await dataRetentionService.addLegalHold(reason, dataTypes, specificRecords);
}

export async function releaseDataLegalHold(holdId: string): Promise<void> {
  await dataRetentionService.releaseLegalHold(holdId);
}

export async function getDataRetentionDashboard(): Promise<any> {
  return await dataRetentionService.getRetentionStats();
}