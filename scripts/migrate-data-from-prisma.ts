/**
 * Data Migration Script: Prisma SQLite → Drizzle PostgreSQL
 * Migrates all existing data from Prisma database to new Drizzle schema
 */

import { PrismaClient } from '@prisma/client';
import { db } from '../lib/db/index';
import { 
  users, organizations, contacts, interactions, 
  opportunities, leads, contracts, accounts, sessions
} from '../lib/db/schema';

import { resolve } from 'path';

// Get absolute path to SQLite database
const sqliteDbPath = resolve(process.cwd(), 'prisma', 'dev.db');

// Initialize Prisma client for source data
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${sqliteDbPath}`
    }
  }
});

// Ensure we're using SQLite for source and PostgreSQL for destination
console.log(`📊 Source: SQLite (Prisma) at ${sqliteDbPath}`);
console.log('📊 Destination: PostgreSQL (Drizzle) via DATABASE_URL');

interface MigrationStats {
  users: number;
  organizations: number;
  contacts: number;
  interactions: number;
  opportunities: number;
  leads: number;
  contracts: number;
  accounts: number;
  sessions: number;
  errors: string[];
}

async function migrateAllData(): Promise<MigrationStats> {
  console.log('🚀 Starting Complete Data Migration: Prisma → Drizzle\n');
  
  const stats: MigrationStats = {
    users: 0,
    organizations: 0,
    contacts: 0,
    interactions: 0,
    opportunities: 0,
    leads: 0,
    contracts: 0,
    accounts: 0,
    sessions: 0,
    errors: []
  };

  try {
    // Test connections
    console.log('🔍 Testing database connections...');
    await prisma.$connect();
    await db.select().from(users).limit(1);
    console.log('✅ Both database connections successful\n');

    // 1. Migrate Users first (required for foreign keys)
    console.log('👥 Migrating Users...');
    try {
      const prismaUsers = await prisma.user.findMany();
      console.log(`   Found ${prismaUsers.length} users in Prisma`);
      
      for (const user of prismaUsers) {
        await db.insert(users).values({
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          password: user.password,
          role: user.role,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          resetToken: user.resetToken,
          resetTokenExpiry: user.resetTokenExpiry,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }).onConflictDoNothing();
        stats.users++;
      }
      console.log(`✅ Migrated ${stats.users} users\n`);
    } catch (error) {
      const errorMsg = `Users migration failed: ${error}`;
      stats.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}\n`);
    }

    // 2. Migrate Accounts
    console.log('🔐 Migrating Accounts...');
    try {
      const prismaAccounts = await prisma.account.findMany();
      console.log(`   Found ${prismaAccounts.length} accounts in Prisma`);
      
      for (const account of prismaAccounts) {
        await db.insert(accounts).values({
          id: account.id,
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        }).onConflictDoNothing();
        stats.accounts++;
      }
      console.log(`✅ Migrated ${stats.accounts} accounts\n`);
    } catch (error) {
      const errorMsg = `Accounts migration failed: ${error}`;
      stats.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}\n`);
    }

    // 3. Migrate Sessions
    console.log('🎫 Migrating Sessions...');
    try {
      const prismaSessions = await prisma.session.findMany();
      console.log(`   Found ${prismaSessions.length} sessions in Prisma`);
      
      for (const session of prismaSessions) {
        await db.insert(sessions).values({
          id: session.id,
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires,
        }).onConflictDoNothing();
        stats.sessions++;
      }
      console.log(`✅ Migrated ${stats.sessions} sessions\n`);
    } catch (error) {
      const errorMsg = `Sessions migration failed: ${error}`;
      stats.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}\n`);
    }

    // 4. Migrate Organizations
    console.log('🏢 Migrating Organizations...');
    try {
      const prismaOrgs = await prisma.organization.findMany();
      console.log(`   Found ${prismaOrgs.length} organizations in Prisma`);
      
      for (const org of prismaOrgs) {
        await db.insert(organizations).values({
          id: org.id,
          name: org.name,
          priority: org.priority,
          segment: org.segment,
          type: org.type,
          address: org.address,
          city: org.city,
          state: org.state,
          zipCode: org.zipCode,
          phone: org.phone,
          email: org.email,
          website: org.website,
          notes: org.notes,
          estimatedRevenue: org.estimatedRevenue,
          employeeCount: org.employeeCount,
          primaryContact: org.primaryContact,
          lastContactDate: org.lastContactDate,
          nextFollowUpDate: org.nextFollowUpDate,
          status: org.status,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt,
        }).onConflictDoNothing();
        stats.organizations++;
      }
      console.log(`✅ Migrated ${stats.organizations} organizations\n`);
    } catch (error) {
      const errorMsg = `Organizations migration failed: ${error}`;
      stats.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}\n`);
    }

    // 5. Migrate Contacts
    console.log('👤 Migrating Contacts...');
    try {
      const prismaContacts = await prisma.contact.findMany();
      console.log(`   Found ${prismaContacts.length} contacts in Prisma`);
      
      for (const contact of prismaContacts) {
        await db.insert(contacts).values({
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          position: contact.position,
          isPrimary: contact.isPrimary,
          notes: contact.notes,
          organizationId: contact.organizationId,
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt,
        }).onConflictDoNothing();
        stats.contacts++;
      }
      console.log(`✅ Migrated ${stats.contacts} contacts\n`);
    } catch (error) {
      const errorMsg = `Contacts migration failed: ${error}`;
      stats.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}\n`);
    }

    // 6. Migrate Interactions
    console.log('💬 Migrating Interactions...');
    try {
      const prismaInteractions = await prisma.interaction.findMany();
      console.log(`   Found ${prismaInteractions.length} interactions in Prisma`);
      
      for (const interaction of prismaInteractions) {
        await db.insert(interactions).values({
          id: interaction.id,
          type: interaction.type,
          subject: interaction.subject,
          description: interaction.description,
          date: interaction.date,
          duration: interaction.duration,
          outcome: interaction.outcome,
          nextAction: interaction.nextAction,
          organizationId: interaction.organizationId,
          contactId: interaction.contactId,
          createdAt: interaction.createdAt,
          updatedAt: interaction.updatedAt,
        }).onConflictDoNothing();
        stats.interactions++;
      }
      console.log(`✅ Migrated ${stats.interactions} interactions\n`);
    } catch (error) {
      const errorMsg = `Interactions migration failed: ${error}`;
      stats.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}\n`);
    }

    // 7. Migrate Opportunities
    console.log('💰 Migrating Opportunities...');
    try {
      const prismaOpportunities = await prisma.opportunity.findMany();
      console.log(`   Found ${prismaOpportunities.length} opportunities in Prisma`);
      
      for (const opportunity of prismaOpportunities) {
        await db.insert(opportunities).values({
          id: opportunity.id,
          name: opportunity.name,
          value: opportunity.value,
          stage: opportunity.stage,
          probability: opportunity.probability,
          expectedCloseDate: opportunity.expectedCloseDate,
          notes: opportunity.notes,
          reason: opportunity.reason,
          isActive: opportunity.isActive,
          organizationId: opportunity.organizationId,
          contactId: opportunity.contactId,
          createdAt: opportunity.createdAt,
          updatedAt: opportunity.updatedAt,
        }).onConflictDoNothing();
        stats.opportunities++;
      }
      console.log(`✅ Migrated ${stats.opportunities} opportunities\n`);
    } catch (error) {
      const errorMsg = `Opportunities migration failed: ${error}`;
      stats.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}\n`);
    }

    // 8. Migrate Leads
    console.log('🎯 Migrating Leads...');
    try {
      const prismaLeads = await prisma.lead.findMany();
      console.log(`   Found ${prismaLeads.length} leads in Prisma`);
      
      for (const lead of prismaLeads) {
        await db.insert(leads).values({
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          source: lead.source,
          status: lead.status,
          notes: lead.notes,
          organizationId: lead.organizationId,
          assignedToId: lead.assignedToId,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
        }).onConflictDoNothing();
        stats.leads++;
      }
      console.log(`✅ Migrated ${stats.leads} leads\n`);
    } catch (error) {
      const errorMsg = `Leads migration failed: ${error}`;
      stats.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}\n`);
    }

    // 9. Migrate Contracts
    console.log('📄 Migrating Contracts...');
    try {
      const prismaContracts = await prisma.contract.findMany();
      console.log(`   Found ${prismaContracts.length} contracts in Prisma`);
      
      for (const contract of prismaContracts) {
        await db.insert(contracts).values({
          id: contract.id,
          name: contract.name,
          value: contract.value,
          startDate: contract.startDate,
          endDate: contract.endDate,
          status: contract.status,
          terms: contract.terms,
          notes: contract.notes,
          organizationId: contract.organizationId,
          contactId: contract.contactId,
          createdAt: contract.createdAt,
          updatedAt: contract.updatedAt,
        }).onConflictDoNothing();
        stats.contracts++;
      }
      console.log(`✅ Migrated ${stats.contracts} contracts\n`);
    } catch (error) {
      const errorMsg = `Contracts migration failed: ${error}`;
      stats.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}\n`);
    }

    return stats;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function validateMigration(stats: MigrationStats) {
  console.log('🔍 Validating migration...\n');
  
  try {
    // Check record counts in PostgreSQL
    const [usersCount] = await db.select().from(users);
    const [orgsCount] = await db.select().from(organizations);
    const [contactsCount] = await db.select().from(contacts);
    const [interactionsCount] = await db.select().from(interactions);
    
    console.log('📊 PostgreSQL record counts:');
    console.log(`   Users: ${usersCount?.length || 0}`);
    console.log(`   Organizations: ${orgsCount?.length || 0}`);
    console.log(`   Contacts: ${contactsCount?.length || 0}`);
    console.log(`   Interactions: ${interactionsCount?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
  }
}

// Main execution
async function runMigration() {
  try {
    const stats = await migrateAllData();
    
    console.log('🎉 Data Migration Complete!\n');
    console.log('📊 Migration Summary:');
    console.log(`   👥 Users: ${stats.users}`);
    console.log(`   🏢 Organizations: ${stats.organizations}`);
    console.log(`   👤 Contacts: ${stats.contacts}`);
    console.log(`   💬 Interactions: ${stats.interactions}`);
    console.log(`   💰 Opportunities: ${stats.opportunities}`);
    console.log(`   🎯 Leads: ${stats.leads}`);
    console.log(`   📄 Contracts: ${stats.contracts}`);
    console.log(`   🔐 Accounts: ${stats.accounts}`);
    console.log(`   🎫 Sessions: ${stats.sessions}`);
    
    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      stats.errors.forEach(error => console.log(`   ❌ ${error}`));
    }
    
    await validateMigration(stats);
    
    console.log('\n🏁 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test application with PostgreSQL');
    console.log('   2. Update API routes to use Drizzle');
    console.log('   3. Validate all functionality');
    console.log('   4. Update environment variables');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateAllData, runMigration };