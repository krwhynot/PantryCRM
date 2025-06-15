import { PrismaClient, Prisma } from '@prisma/client';

// Priority settings with color coding (A=Green, B=Yellow, C=Orange, D=Red)
const prioritySettings: Prisma.SystemSettingCreateInput[] = [
  {
    key: 'A',
    label: 'A - High Priority',
    category: 'PRIORITY',
    sortOrder: 10,
    color: '#4ade80', // Green
    active: true,
  },
  {
    key: 'B',
    label: 'B - Medium Priority',
    category: 'PRIORITY',
    sortOrder: 20,
    color: '#facc15', // Yellow
    active: true,
  },
  {
    key: 'C',
    label: 'C - Low Priority',
    category: 'PRIORITY',
    sortOrder: 30,
    color: '#fb923c', // Orange
    active: true,
  },
  {
    key: 'D',
    label: 'D - Minimal Priority',
    category: 'PRIORITY',
    sortOrder: 40,
    color: '#f87171', // Red
    active: true,
  },
];

// Market segment settings for food service industry
const segmentSettings: Prisma.SystemSettingCreateInput[] = [
  {
    key: 'FINE_DINING',
    label: 'Fine Dining',
    category: 'SEGMENT',
    sortOrder: 10,
    active: true,
  },
  {
    key: 'FAST_FOOD',
    label: 'Fast Food',
    category: 'SEGMENT',
    sortOrder: 20,
    active: true,
  },
  {
    key: 'HEALTHCARE',
    label: 'Healthcare',
    category: 'SEGMENT',
    sortOrder: 30,
    active: true,
  },
  {
    key: 'CATERING',
    label: 'Catering',
    category: 'SEGMENT',
    sortOrder: 40,
    active: true,
  },
  {
    key: 'INSTITUTIONAL',
    label: 'Institutional',
    category: 'SEGMENT',
    sortOrder: 50,
    active: true,
  },
];

// Distributor settings for food service industry
const distributorSettings: Prisma.SystemSettingCreateInput[] = [
  {
    key: 'SYSCO',
    label: 'Sysco',
    category: 'DISTRIBUTOR',
    sortOrder: 10,
    active: true,
  },
  {
    key: 'USF',
    label: 'US Foods',
    category: 'DISTRIBUTOR',
    sortOrder: 20,
    active: true,
  },
  {
    key: 'PFG',
    label: 'Performance Food Group',
    category: 'DISTRIBUTOR',
    sortOrder: 30,
    active: true,
  },
  {
    key: 'DIRECT',
    label: 'Direct',
    category: 'DISTRIBUTOR',
    sortOrder: 40,
    active: true,
  },
  {
    key: 'OTHER',
    label: 'Other',
    category: 'DISTRIBUTOR',
    sortOrder: 50,
    active: true,
  },
];

// Contact role settings for food service industry
const contactRoleSettings: Prisma.SystemSettingCreateInput[] = [
  {
    key: 'EXEC_CHEF',
    label: 'Executive Chef',
    category: 'CONTACT_ROLE',
    sortOrder: 10,
    active: true,
  },
  {
    key: 'BUYER',
    label: 'Buyer',
    category: 'CONTACT_ROLE',
    sortOrder: 20,
    active: true,
  },
  {
    key: 'MANAGER',
    label: 'Manager',
    category: 'CONTACT_ROLE',
    sortOrder: 30,
    active: true,
  },
  {
    key: 'OWNER',
    label: 'Owner',
    category: 'CONTACT_ROLE',
    sortOrder: 40,
    active: true,
  },
  {
    key: 'KITCHEN_MANAGER',
    label: 'Kitchen Manager',
    category: 'CONTACT_ROLE',
    sortOrder: 50,
    active: true,
  },
];

// Interaction type settings for food service industry
const interactionSettings: Prisma.SystemSettingCreateInput[] = [
  {
    key: 'EMAIL',
    label: 'Email',
    category: 'INTERACTION',
    sortOrder: 10,
    active: true,
  },
  {
    key: 'CALL',
    label: 'Call',
    category: 'INTERACTION',
    sortOrder: 20,
    active: true,
  },
  {
    key: 'IN_PERSON',
    label: 'In Person',
    category: 'INTERACTION',
    sortOrder: 30,
    active: true,
  },
  {
    key: 'DEMO',
    label: 'Demo/Sample',
    category: 'INTERACTION',
    sortOrder: 40,
    active: true,
  },
  {
    key: 'QUOTE',
    label: 'Quoted Price',
    category: 'INTERACTION',
    sortOrder: 50,
    active: true,
  },
  {
    key: 'FOLLOW_UP',
    label: 'Follow-up',
    category: 'INTERACTION',
    sortOrder: 60,
    active: true,
  },
];

// Principal settings for food service industry
const principalSettings: Prisma.SystemSettingCreateInput[] = [
  {
    key: 'KAUFHOLDS',
    label: 'Kaufholds',
    category: 'PRINCIPAL',
    sortOrder: 10,
    active: true,
  },
  {
    key: 'FRITES_STREET',
    label: 'Frites Street',
    category: 'PRINCIPAL',
    sortOrder: 20,
    active: true,
  },
  {
    key: 'BETTER_BALANCE',
    label: 'Better Balance',
    category: 'PRINCIPAL',
    sortOrder: 30,
    active: true,
  },
  {
    key: 'VAF',
    label: 'VAF',
    category: 'PRINCIPAL',
    sortOrder: 40,
    active: true,
  },
  {
    key: 'OFK',
    label: 'Ofk',
    category: 'PRINCIPAL',
    sortOrder: 50,
    active: true,
  },
  {
    key: 'ANNASEA',
    label: 'Annasea',
    category: 'PRINCIPAL',
    sortOrder: 60,
    active: true,
  },
  {
    key: 'WICKS',
    label: 'Wicks',
    category: 'PRINCIPAL',
    sortOrder: 70,
    active: true,
  },
  {
    key: 'RJC',
    label: 'RJC',
    category: 'PRINCIPAL',
    sortOrder: 80,
    active: true,
  },
  {
    key: 'KAYCO',
    label: 'Kayco',
    category: 'PRINCIPAL',
    sortOrder: 90,
    active: true,
  },
  {
    key: 'ABDALE',
    label: 'Abdale',
    category: 'PRINCIPAL',
    sortOrder: 100,
    active: true,
  },
  {
    key: 'LAND_LOVERS',
    label: 'Land Lovers',
    category: 'PRINCIPAL',
    sortOrder: 110,
    active: true,
  },
];

// Combine all settings
const allSettings: Prisma.SystemSettingCreateInput[] = [
  ...prioritySettings,
  ...segmentSettings,
  ...distributorSettings,
  ...contactRoleSettings,
  ...interactionSettings,
  ...principalSettings,
];

/**
 * Seeds food service industry-specific settings into the database
 * 
 * @param prisma - PrismaClient instance
 * @returns Promise resolving when seeding is complete
 */
export async function seedFoodServiceSettings(prisma: PrismaClient): Promise<void> {
  console.log('Seeding food service settings...');
  
  // Create each setting, handling duplicates gracefully
  for (const setting of allSettings) {
    await prisma.systemSetting.upsert({
      where: {
        key: setting.key, // Use the actual unique key of SystemSetting
      },
      update: {
        // Only update fields that exist in SystemSetting
        value: JSON.stringify({ label: setting.label, sortOrder: setting.sortOrder, color: setting.color, active: setting.active, category: setting.category }), // Store extra info as JSON in 'value'
        type: 'json', // Indicate that 'value' is JSON
      },
      create: {
        key: setting.key,
        // Store extra info as JSON in 'value'
        value: JSON.stringify({ label: setting.label, sortOrder: setting.sortOrder, color: setting.color, active: setting.active, category: setting.category }),
        type: 'json', // Indicate that 'value' is JSON
      },
    });
  }
  
  console.log(`Seeded ${allSettings.length} food service settings successfully!`);
}
