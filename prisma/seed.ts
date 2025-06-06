// prisma/seed.ts - Fixed version without skipDuplicates
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Food Service CRM database seeding...');

  // Clear existing settings to avoid conflicts
  await prisma.setting.deleteMany({});

  // Seed Users (Account Managers)
  const users = await prisma.user.createMany({
    data: [
      {
        email: 'manager1@kitchenpantry.com',
        name: 'Sarah Johnson',
        role: 'manager',
      },
      {
        email: 'manager2@kitchenpantry.com', 
        name: 'Mike Davis',
        role: 'manager',
      },
      {
        email: 'admin@kitchenpantry.com',
        name: 'Admin User',
        role: 'admin',
      },
    ],
  });

  // Seed Settings - Priority Levels
  const priorities = await prisma.setting.createMany({
    data: [
      {
        category: 'PRIORITY',
        key: 'A',
        label: 'A - High Priority',
        color: '#22c55e', // Green
        sortOrder: 1,
        active: true,
      },
      {
        category: 'PRIORITY',
        key: 'B', 
        label: 'B - Medium Priority',
        color: '#eab308', // Yellow
        sortOrder: 2,
        active: true,
      },
      {
        category: 'PRIORITY',
        key: 'C',
        label: 'C - Low Priority', 
        color: '#f97316', // Orange
        sortOrder: 3,
        active: true,
      },
      {
        category: 'PRIORITY',
        key: 'D',
        label: 'D - Inactive',
        color: '#ef4444', // Red
        sortOrder: 4,
        active: true,
      },
    ],
  });

  // Seed Settings - Market Segments
  const segments = await prisma.setting.createMany({
    data: [
      {
        category: 'SEGMENT',
        key: 'FINE_DINING',
        label: 'Fine Dining',
        sortOrder: 1,
        active: true,
      },
      {
        category: 'SEGMENT',
        key: 'FAST_FOOD',
        label: 'Fast Food',
        sortOrder: 2,
        active: true,
      },
      {
        category: 'SEGMENT',
        key: 'HEALTHCARE',
        label: 'Healthcare',
        sortOrder: 3,
        active: true,
      },
      {
        category: 'SEGMENT',
        key: 'CATERING',
        label: 'Catering',
        sortOrder: 4,
        active: true,
      },
      {
        category: 'SEGMENT',
        key: 'INSTITUTIONAL',
        label: 'Institutional',
        sortOrder: 5,
        active: true,
      },
    ],
  });

  // Seed Settings - Distributors
  const distributors = await prisma.setting.createMany({
    data: [
      {
        category: 'DISTRIBUTOR',
        key: 'SYSCO',
        label: 'Sysco',
        sortOrder: 1,
        active: true,
      },
      {
        category: 'DISTRIBUTOR',
        key: 'USF',
        label: 'US Foods',
        sortOrder: 2,
        active: true,
      },
      {
        category: 'DISTRIBUTOR',
        key: 'PFG',
        label: 'Performance Food Group',
        sortOrder: 3,
        active: true,
      },
      {
        category: 'DISTRIBUTOR',
        key: 'DIRECT',
        label: 'Direct',
        sortOrder: 4,
        active: true,
      },
      {
        category: 'DISTRIBUTOR',
        key: 'OTHER',
        label: 'Other',
        sortOrder: 5,
        active: true,
      },
    ],
  });

  // Seed Settings - Contact Roles
  const contactRoles = await prisma.setting.createMany({
    data: [
      {
        category: 'CONTACT_ROLE',
        key: 'EXEC_CHEF',
        label: 'Executive Chef',
        sortOrder: 1,
        active: true,
      },
      {
        category: 'CONTACT_ROLE',
        key: 'BUYER',
        label: 'Buyer',
        sortOrder: 2,
        active: true,
      },
      {
        category: 'CONTACT_ROLE',
        key: 'MANAGER',
        label: 'Manager',
        sortOrder: 3,
        active: true,
      },
      {
        category: 'CONTACT_ROLE',
        key: 'OWNER',
        label: 'Owner',
        sortOrder: 4,
        active: true,
      },
      {
        category: 'CONTACT_ROLE',
        key: 'KITCHEN_MANAGER',
        label: 'Kitchen Manager',
        sortOrder: 5,
        active: true,
      },
    ],
  });

  // Seed Settings - Interaction Types
  const interactionTypes = await prisma.setting.createMany({
    data: [
      {
        category: 'INTERACTION_TYPE',
        key: 'EMAIL',
        label: 'Email',
        sortOrder: 1,
        active: true,
      },
      {
        category: 'INTERACTION_TYPE',
        key: 'CALL',
        label: 'Call',
        sortOrder: 2,
        active: true,
      },
      {
        category: 'INTERACTION_TYPE',
        key: 'IN_PERSON',
        label: 'In Person',
        sortOrder: 3,
        active: true,
      },
      {
        category: 'INTERACTION_TYPE',
        key: 'DEMO_SAMPLED',
        label: 'Demo/Sampled',
        sortOrder: 4,
        active: true,
      },
      {
        category: 'INTERACTION_TYPE',
        key: 'QUOTED_PRICE',
        label: 'Quoted Price',
        sortOrder: 5,
        active: true,
      },
      {
        category: 'INTERACTION_TYPE',
        key: 'FOLLOW_UP',
        label: 'Follow-up',
        sortOrder: 6,
        active: true,
      },
    ],
  });

  // Seed Settings - Opportunity Stages (5-Stage Pipeline)
  const opportunityStages = await prisma.setting.createMany({
    data: [
      {
        category: 'OPPORTUNITY_STAGE',
        key: 'LEAD_DISCOVERY',
        label: 'Lead Discovery',
        sortOrder: 1,
        active: true,
      },
      {
        category: 'OPPORTUNITY_STAGE',
        key: 'CONTACTED',
        label: 'Contacted',
        sortOrder: 2,
        active: true,
      },
      {
        category: 'OPPORTUNITY_STAGE',
        key: 'SAMPLED_VISITED',
        label: 'Sampled/Visited',
        sortOrder: 3,
        active: true,
      },
      {
        category: 'OPPORTUNITY_STAGE',
        key: 'FOLLOW_UP',
        label: 'Follow-up',
        sortOrder: 4,
        active: true,
      },
      {
        category: 'OPPORTUNITY_STAGE',
        key: 'CLOSE',
        label: 'Close',
        sortOrder: 5,
        active: true,
      },
    ],
  });

  // Seed Settings - Opportunity Status
  const opportunityStatuses = await prisma.setting.createMany({
    data: [
      {
        category: 'OPPORTUNITY_STATUS',
        key: 'OPEN',
        label: 'Open',
        color: '#3b82f6', // Blue
        sortOrder: 1,
        active: true,
      },
      {
        category: 'OPPORTUNITY_STATUS',
        key: 'CLOSED_WON',
        label: 'Closed - Won',
        color: '#22c55e', // Green
        sortOrder: 2,
        active: true,
      },
      {
        category: 'OPPORTUNITY_STATUS',
        key: 'CLOSED_LOST',
        label: 'Closed - Lost',
        color: '#ef4444', // Red
        sortOrder: 3,
        active: true,
      },
      {
        category: 'OPPORTUNITY_STATUS',
        key: 'ON_HOLD',
        label: 'On Hold',
        color: '#f59e0b', // Amber
        sortOrder: 4,
        active: true,
      },
    ],
  });

  // Seed Settings - Principals (11 Food Service Brands)
  const principals = await prisma.setting.createMany({
    data: [
      {
        category: 'PRINCIPAL',
        key: 'KAUFHOLDS',
        label: 'Kaufholds',
        sortOrder: 1,
        active: true,
      },
      {
        category: 'PRINCIPAL',
        key: 'FRITES_STREET',
        label: 'Frites Street',
        sortOrder: 2,
        active: true,
      },
      {
        category: 'PRINCIPAL',
        key: 'BETTER_BALANCE',
        label: 'Better Balance',
        sortOrder: 3,
        active: true,
      },
      {
        category: 'PRINCIPAL',
        key: 'VAF',
        label: 'VAF',
        sortOrder: 4,
        active: true,
      },
      {
        category: 'PRINCIPAL',
        key: 'OFK',
        label: 'Ofk',
        sortOrder: 5,
        active: true,
      },
      {
        category: 'PRINCIPAL',
        key: 'ANNASEA',
        label: 'Annasea',
        sortOrder: 6,
        active: true,
      },
      {
        category: 'PRINCIPAL',
        key: 'WICKS',
        label: 'Wicks',
        sortOrder: 7,
        active: true,
      },
      {
        category: 'PRINCIPAL',
        key: 'RJC',
        label: 'RJC',
        sortOrder: 8,
        active: true,
      },
      {
        category: 'PRINCIPAL',
        key: 'KAYCO',
        label: 'Kayco',
        sortOrder: 9,
        active: true,
      },
      {
        category: 'PRINCIPAL',
        key: 'ABDALE',
        label: 'Abdale',
        sortOrder: 10,
        active: true,
      },
      {
        category: 'PRINCIPAL',
        key: 'LAND_LOVERS',
        label: 'Land Lovers',
        sortOrder: 11,
        active: true,
      },
    ],
  });

  // Create sample organizations for testing
  const sampleOrgs = await prisma.organization.createMany({
    data: [
      {
        name: 'The Golden Spoon Restaurant',
        description: 'Upscale fine dining establishment',
        phone: '(555) 123-4567',
        email: 'contact@goldenspoon.com',
        website: 'https://goldenspoon.com',
        addressLine1: '123 Main Street',
        city: 'Dallas',
        state: 'TX',
        postalCode: '75201',
        country: 'USA',
      },
      {
        name: 'QuickBite Fast Food',
        description: 'Popular fast food chain location',
        phone: '(555) 987-6543',
        email: 'manager@quickbite.com',
        addressLine1: '456 Commerce Blvd',
        city: 'Houston',
        state: 'TX',
        postalCode: '77001',
        country: 'USA',
      },
      {
        name: 'Central Hospital Cafeteria',
        description: 'Healthcare facility food service',
        phone: '(555) 555-0123',
        email: 'foodservice@centralhospital.com',
        addressLine1: '789 Health Drive',
        city: 'Austin',
        state: 'TX',
        postalCode: '73301',
        country: 'USA',
      },
    ],
  });

  console.log('✅ Successfully seeded Food Service CRM database!');
  console.log(`📊 Created:`);
  console.log(`   - ${users.count} users (account managers)`);
  console.log(`   - ${priorities.count} priority levels`);
  console.log(`   - ${segments.count} market segments`);
  console.log(`   - ${distributors.count} distributors`);
  console.log(`   - ${contactRoles.count} contact roles`);
  console.log(`   - ${interactionTypes.count} interaction types`);
  console.log(`   - ${opportunityStages.count} opportunity stages`);
  console.log(`   - ${opportunityStatuses.count} opportunity statuses`);
  console.log(`   - ${principals.count} principals/brands`);
  console.log(`   - ${sampleOrgs.count} sample organizations`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });