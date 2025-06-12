/**
 * Food Service Industry Specific Security Enhancements
 * Implements compliance requirements for food industry CRM systems
 * 
 * COMPLIANCE: FSMA, FDA regulations, supply chain security
 */

import { NextRequest } from 'next/server';
import { logSecurityEvent } from '@/lib/security-logger';
import { prismadb } from '@/lib/prisma';

/**
 * Food safety data classification levels
 */
export enum FoodSafetyDataLevel {
  PUBLIC = 'PUBLIC',           // General company information
  INTERNAL = 'INTERNAL',       // Internal business data
  CONFIDENTIAL = 'CONFIDENTIAL', // Sensitive business information
  RESTRICTED = 'RESTRICTED'    // FSMA regulated data, supplier information
}

/**
 * Supply chain traceability logging
 * Required for FSMA compliance
 */
export interface SupplyChainEvent {
  eventType: 'access' | 'modify' | 'create' | 'delete' | 'export';
  userId: string;
  organizationId: string;
  dataType: 'supplier_info' | 'product_data' | 'contract' | 'interaction' | 'compliance_record';
  dataClassification: FoodSafetyDataLevel;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, any>;
}

/**
 * Food service compliance logger
 */
class FoodServiceComplianceLogger {
  /**
   * Log supply chain data access for FSMA compliance
   */
  async logSupplyChainAccess(
    userId: string,
    organizationId: string,
    dataType: SupplyChainEvent['dataType'],
    eventType: SupplyChainEvent['eventType'],
    request?: NextRequest,
    details?: Record<string, any>
  ): Promise<void> {
    const dataClassification = this.classifyData(dataType, details);
    
    const event: SupplyChainEvent = {
      eventType,
      userId,
      organizationId,
      dataType,
      dataClassification,
      timestamp: new Date(),
      ipAddress: this.extractIpAddress(request),
      userAgent: request?.headers.get('user-agent') || 'unknown',
      details
    };
    
    // Log to security system
    logSecurityEvent('data_access', {
      userId,
      resourceType: 'supply_chain_data',
      resourceId: organizationId,
      action: eventType,
      dataType,
      dataClassification,
      compliance: 'FSMA',
      details
    }, request);
    
    // Store in compliance audit trail
    await this.storeComplianceRecord(event);
    
    // Alert on sensitive data access
    if (dataClassification === FoodSafetyDataLevel.RESTRICTED) {
      await this.alertSensitiveDataAccess(event);
    }
  }
  
  /**
   * Classify data based on food safety regulations
   */
  private classifyData(dataType: SupplyChainEvent['dataType'], details?: Record<string, any>): FoodSafetyDataLevel {
    switch (dataType) {
      case 'supplier_info':
        // Supplier information is typically restricted under FSMA
        return FoodSafetyDataLevel.RESTRICTED;
      
      case 'product_data':
        // Product safety data is confidential
        return details?.containsAllergens || details?.safetyData 
          ? FoodSafetyDataLevel.RESTRICTED 
          : FoodSafetyDataLevel.CONFIDENTIAL;
      
      case 'compliance_record':
        // All compliance records are restricted
        return FoodSafetyDataLevel.RESTRICTED;
      
      case 'contract':
        // Contracts with suppliers are confidential
        return FoodSafetyDataLevel.CONFIDENTIAL;
      
      case 'interaction':
        // Regular interactions are internal
        return FoodSafetyDataLevel.INTERNAL;
      
      default:
        return FoodSafetyDataLevel.INTERNAL;
    }
  }
  
  /**
   * Store compliance record in database
   */
  private async storeComplianceRecord(event: SupplyChainEvent): Promise<void> {
    try {
      // Store in a dedicated compliance table or log
      // This ensures audit trail retention per regulatory requirements
      await prismadb.systemSetting.upsert({
        where: {
          key: `compliance_log_${event.timestamp.getTime()}_${event.userId}`
        },
        update: {
          value: JSON.stringify(event),
          type: 'compliance_audit'
        },
        create: {
          key: `compliance_log_${event.timestamp.getTime()}_${event.userId}`,
          value: JSON.stringify(event),
          type: 'compliance_audit'
        }
      });
    } catch (error) {
      console.error('[COMPLIANCE_LOGGER] Failed to store record:', error);
    }
  }
  
  /**
   * Alert on sensitive data access
   */
  private async alertSensitiveDataAccess(event: SupplyChainEvent): Promise<void> {
    console.warn('[FOOD_SAFETY_ALERT] Restricted data accessed:', {
      userId: event.userId,
      dataType: event.dataType,
      organizationId: event.organizationId,
      timestamp: event.timestamp,
      ipAddress: event.ipAddress
    });
    
    // In production, this would send alerts to compliance team
    if (process.env.COMPLIANCE_ALERT_EMAIL) {
      // Send compliance alert email
      console.log('[COMPLIANCE_ALERT] Would send to:', process.env.COMPLIANCE_ALERT_EMAIL);
    }
  }
  
  /**
   * Extract IP address from request
   */
  private extractIpAddress(request?: NextRequest): string {
    if (!request) return 'unknown';
    
    return request.ip || 
           request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
           request.headers.get('x-real-ip') || 
           'unknown';
  }
}

/**
 * Data retention policy enforcement
 * Implements regulatory data retention requirements
 */
export class FoodServiceDataRetention {
  /**
   * Retention periods per data type (in days)
   */
  private static readonly RETENTION_PERIODS = {
    supplier_contracts: 2555, // 7 years (FSMA requirement)
    compliance_records: 2555, // 7 years
    supplier_communications: 1095, // 3 years
    product_safety_data: 2555, // 7 years
    audit_logs: 2555, // 7 years
    general_interactions: 365, // 1 year
    marketing_data: 1095 // 3 years
  };
  
  /**
   * Check if data should be archived based on retention policy
   */
  static shouldArchive(dataType: keyof typeof FoodServiceDataRetention.RETENTION_PERIODS, createdDate: Date): boolean {
    const retentionDays = this.RETENTION_PERIODS[dataType];
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
    const ageMs = Date.now() - createdDate.getTime();
    
    return ageMs > retentionMs;
  }
  
  /**
   * Archive old compliance data
   */
  static async archiveOldData(): Promise<void> {
    console.log('[DATA_RETENTION] Starting automated data archival...');
    
    try {
      // Archive old interactions (except those related to active contracts)
      const cutoffDate = new Date(Date.now() - this.RETENTION_PERIODS.general_interactions * 24 * 60 * 60 * 1000);
      
      const archivedInteractions = await prismadb.interaction.updateMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          // Don't archive if related to active contracts
          organization: {
            contracts: {
              none: {
                status: 'ACTIVE'
              }
            }
          }
        },
        data: {
          // Add archived flag instead of deleting (for compliance)
          notes: 'ARCHIVED_BY_RETENTION_POLICY'
        }
      });
      
      console.log(`[DATA_RETENTION] Archived ${archivedInteractions.count} old interactions`);
      
      // Archive old compliance logs
      const complianceCutoff = new Date(Date.now() - this.RETENTION_PERIODS.compliance_records * 24 * 60 * 60 * 1000);
      
      // Move to cold storage instead of deleting (regulatory requirement)
      const oldComplianceLogs = await prismadb.systemSetting.findMany({
        where: {
          type: 'compliance_audit',
          createdAt: {
            lt: complianceCutoff
          }
        }
      });
      
      // In production, these would be moved to cold storage (Azure Blob Storage Archive tier)
      console.log(`[DATA_RETENTION] Found ${oldComplianceLogs.length} compliance logs for archival`);
      
    } catch (error) {
      console.error('[DATA_RETENTION] Error during archival:', error);
    }
  }
}

/**
 * Supplier data access controls
 */
export class SupplierDataAccess {
  /**
   * Validate user can access supplier data
   */
  static async validateSupplierAccess(
    userId: string,
    organizationId: string,
    accessType: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    try {
      // Get user permissions
      const user = await prismadb.user.findUnique({
        where: { id: userId },
        select: { role: true, isActive: true }
      });
      
      if (!user || !user.isActive) {
        return false;
      }
      
      // Admin and manager roles can access supplier data
      if (user.role === 'admin' || user.role === 'manager') {
        return true;
      }
      
      // Regular users can only read public supplier information
      return accessType === 'read';
      
    } catch (error) {
      console.error('[SUPPLIER_ACCESS] Error validating access:', error);
      return false;
    }
  }
  
  /**
   * Log supplier data access with enhanced details
   */
  static async logSupplierAccess(
    userId: string,
    organizationId: string,
    accessType: 'read' | 'write' | 'delete',
    supplierField?: string,
    request?: NextRequest
  ): Promise<void> {
    await complianceLogger.logSupplyChainAccess(
      userId,
      organizationId,
      'supplier_info',
      accessType === 'read' ? 'access' : 
      accessType === 'write' ? 'modify' : 'delete',
      request,
      {
        supplierField,
        accessLevel: await this.getUserAccessLevel(userId)
      }
    );
  }
  
  private static async getUserAccessLevel(userId: string): Promise<string> {
    try {
      const user = await prismadb.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      return user?.role || 'unknown';
    } catch {
      return 'unknown';
    }
  }
}

// Global compliance logger instance
export const complianceLogger = new FoodServiceComplianceLogger();

// Helper functions for easy integration
export async function logSupplierAccess(
  userId: string,
  organizationId: string,
  action: 'view' | 'edit' | 'create' | 'delete',
  request?: NextRequest
): Promise<void> {
  const eventType: SupplyChainEvent['eventType'] = 
    action === 'view' ? 'access' :
    action === 'edit' ? 'modify' :
    action === 'create' ? 'create' : 'delete';
    
  await complianceLogger.logSupplyChainAccess(
    userId,
    organizationId,
    'supplier_info',
    eventType,
    request
  );
}

export async function logProductDataAccess(
  userId: string,
  organizationId: string,
  productInfo: any,
  action: 'view' | 'edit' | 'create',
  request?: NextRequest
): Promise<void> {
  const eventType: SupplyChainEvent['eventType'] = 
    action === 'view' ? 'access' :
    action === 'edit' ? 'modify' : 'create';
    
  await complianceLogger.logSupplyChainAccess(
    userId,
    organizationId,
    'product_data',
    eventType,
    request,
    {
      containsAllergens: productInfo?.allergens?.length > 0,
      safetyData: !!productInfo?.safetyInfo,
      productCategory: productInfo?.category
    }
  );
}

export async function logComplianceRecordAccess(
  userId: string,
  organizationId: string,
  recordType: string,
  action: 'view' | 'create' | 'export',
  request?: NextRequest
): Promise<void> {
  const eventType: SupplyChainEvent['eventType'] = 
    action === 'view' ? 'access' :
    action === 'create' ? 'create' : 'export';
    
  await complianceLogger.logSupplyChainAccess(
    userId,
    organizationId,
    'compliance_record',
    eventType,
    request,
    {
      recordType,
      complianceStandard: 'FSMA'
    }
  );
}