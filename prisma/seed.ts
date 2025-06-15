import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define a type for raw setting data to ensure consistency
interface RawSettingDefinition {
  category: string;
  key: string;
  label: string;
  color?: string; // Optional for settings like priority
  sortOrder: number;
  active: boolean;
  icon?: string; // Optional for interaction types, etc.
}

async function main() {
  console.log('🌱 Starting Food Service CRM database seeding...');

  // 1. Clear existing data in the correct order to avoid foreign key violations
  console.log('🗑️ Clearing existing data...');
  await prisma.interaction.deleteMany({});
  await prisma.opportunity.deleteMany({});
  await prisma.contract.deleteMany({}); // Assuming Contract might depend on Contact/Org
  await prisma.contact.deleteMany({});
  await prisma.lead.deleteMany({}); // Assuming Lead might depend on Org or User
  await prisma.organization.deleteMany({});
  await prisma.systemSetting.deleteMany({});
  await prisma.user.deleteMany({});
  // Note: Account and Session tables are managed by NextAuth and usually don't need manual clearing.
  console.log('✅ Existing data cleared.');

  // 2. Seed Users (Account Managers)
  // Using static string IDs as User.id is not @default(cuid()) or @default(auto())
  const userSeedData = [
    {
      id: 'user_admin_01', // Static ID
      email: 'admin@kitchenpantry.com',
      name: 'Admin User',
      role: 'admin',
      // Add password hash if your app handles auth directly; otherwise NextAuth manages it
      // password: 'hashed_password_for_admin' 
    },
    {
      id: 'user_manager_sj', // Static ID
      email: 'sarah.j@kitchenpantry.com',
      name: 'Sarah Johnson',
      role: 'manager',
      // password: 'hashed_password_for_sarah'
    },
    {
      id: 'user_manager_md', // Static ID
      email: 'mike.d@kitchenpantry.com',
      name: 'Mike Davis',
      role: 'manager',
      // password: 'hashed_password_for_mike'
    },
  ];
  const users = await prisma.user.createMany({
    data: userSeedData,
  });
  console.log(`👤 Created ${users.count} users.`);

  // 3. Define all raw setting data
  const prioritiesRaw: RawSettingDefinition[] = [
    { category: 'PRIORITY', key: 'A', label: 'A - High Priority', color: '#22c55e', sortOrder: 1, active: true },
    { category: 'PRIORITY', key: 'B', label: 'B - Medium Priority', color: '#eab308', sortOrder: 2, active: true },
    { category: 'PRIORITY', key: 'C', label: 'C - Low Priority', color: '#f97316', sortOrder: 3, active: true },
    { category: 'PRIORITY', key: 'D', label: 'D - Inactive', color: '#ef4444', sortOrder: 4, active: true },
  ];

  const segmentsRaw: RawSettingDefinition[] = [
    { category: 'SEGMENT', key: 'FINE_DINING', label: 'Fine Dining', sortOrder: 1, active: true },
    { category: 'SEGMENT', key: 'CASUAL_DINING', label: 'Casual Dining', sortOrder: 2, active: true },
    { category: 'SEGMENT', key: 'QSR', label: 'QSR (Quick Service)', sortOrder: 3, active: true },
    { category: 'SEGMENT', key: 'HEALTHCARE', label: 'Healthcare', sortOrder: 4, active: true },
    { category: 'SEGMENT', key: 'EDUCATION', label: 'Education', sortOrder: 5, active: true },
    { category: 'SEGMENT', key: 'CATERING', label: 'Catering', sortOrder: 6, active: true },
    { category: 'SEGMENT', key: 'INSTITUTIONAL', label: 'Institutional', sortOrder: 7, active: true },
  ];

  const distributorsRaw: RawSettingDefinition[] = [
    { category: 'DISTRIBUTOR', key: 'SYSCO', label: 'Sysco', sortOrder: 1, active: true },
    { category: 'DISTRIBUTOR', key: 'US_FOODS', label: 'US Foods', sortOrder: 2, active: true },
    { category: 'DISTRIBUTOR', key: 'PFG', label: 'Performance Food Group', sortOrder: 3, active: true },
    { category: 'DISTRIBUTOR', key: 'GORDON_FOOD_SERVICE', label: 'Gordon Food Service', sortOrder: 4, active: true },
    { category: 'DISTRIBUTOR', key: 'DIRECT', label: 'Direct', sortOrder: 5, active: true },
    { category: 'DISTRIBUTOR', key: 'OTHER', label: 'Other', sortOrder: 6, active: true },
  ];

  const contactRolesRaw: RawSettingDefinition[] = [
    { category: 'CONTACT_ROLE', key: 'EXECUTIVE_CHEF', label: 'Executive Chef', sortOrder: 1, active: true },
    { category: 'CONTACT_ROLE', key: 'SOUS_CHEF', label: 'Sous Chef', sortOrder: 2, active: true },
    { category: 'CONTACT_ROLE', key: 'PURCHASING_MANAGER', label: 'Purchasing Manager', sortOrder: 3, active: true },
    { category: 'CONTACT_ROLE', key: 'FNB_DIRECTOR', label: 'F&B Director', sortOrder: 4, active: true },
    { category: 'CONTACT_ROLE', key: 'OWNER_OPERATOR', label: 'Owner/Operator', sortOrder: 5, active: true },
    { category: 'CONTACT_ROLE', key: 'GENERAL_MANAGER', label: 'General Manager', sortOrder: 6, active: true },
  ];

  const interactionTypesRaw: RawSettingDefinition[] = [
    { category: 'INTERACTION_TYPE', key: 'EMAIL', label: 'Email', sortOrder: 1, active: true, icon: 'Mail' },
    { category: 'INTERACTION_TYPE', key: 'PHONE_CALL', label: 'Phone Call', sortOrder: 2, active: true, icon: 'Phone' },
    { category: 'INTERACTION_TYPE', key: 'SITE_VISIT', label: 'Site Visit', sortOrder: 3, active: true, icon: 'MapPin' },
    { category: 'INTERACTION_TYPE', key: 'SAMPLE_DROP', label: 'Sample Drop-off', sortOrder: 4, active: true, icon: 'Package' },
    { category: 'INTERACTION_TYPE', key: 'QUOTED_PRICE', label: 'Quoted Price', sortOrder: 5, active: true, icon: 'DollarSign' },
    { category: 'INTERACTION_TYPE', key: 'FOLLOW_UP', label: 'Follow-up', sortOrder: 6, active: true, icon: 'MessageSquare' },
  ];

  const opportunityStagesRaw: RawSettingDefinition[] = [
    { category: 'OPPORTUNITY_STAGE', key: 'LEAD_DISCOVERY', label: 'Lead Discovery', sortOrder: 1, active: true },
    { category: 'OPPORTUNITY_STAGE', key: 'CONTACTED', label: 'Contacted', sortOrder: 2, active: true },
    { category: 'OPPORTUNITY_STAGE', key: 'SAMPLED_VISITED', label: 'Sampled/Visited', sortOrder: 3, active: true },
    { category: 'OPPORTUNITY_STAGE', key: 'FOLLOW_UP', label: 'Follow-up', sortOrder: 4, active: true },
    { category: 'OPPORTUNITY_STAGE', key: 'CLOSE_WON', label: 'Close Won', sortOrder: 5, active: true },
    { category: 'OPPORTUNITY_STAGE', key: 'CLOSE_LOST', label: 'Close Lost', sortOrder: 6, active: true },
  ];

  const opportunityStatusesRaw: RawSettingDefinition[] = [
    { category: 'OPPORTUNITY_STATUS', key: 'OPEN', label: 'Open', sortOrder: 1, active: true },
    { category: 'OPPORTUNITY_STATUS', key: 'WON', label: 'Won', sortOrder: 2, active: true },
    { category: 'OPPORTUNITY_STATUS', key: 'LOST', label: 'Lost', sortOrder: 3, active: true },
    { category: 'OPPORTUNITY_STATUS', key: 'ON_HOLD', label: 'On Hold', sortOrder: 4, active: true },
  ];

  const principalsRaw: RawSettingDefinition[] = [
    { category: 'PRINCIPAL', key: 'KAUFHOLDS', label: 'Kaufholds', sortOrder: 1, active: true },
    { category: 'PRINCIPAL', key: 'FRITES_STREET', label: 'Frites Street', sortOrder: 2, active: true },
    { category: 'PRINCIPAL', key: 'BETTER_BALANCE', label: 'Better Balance', sortOrder: 3, active: true },
    { category: 'PRINCIPAL', key: 'VAF', label: 'VAF', sortOrder: 4, active: true },
    { category: 'PRINCIPAL', key: 'OFK', label: 'Ofk', sortOrder: 5, active: true },
    { category: 'PRINCIPAL', key: 'ANNASEA', label: 'Annasea', sortOrder: 6, active: true },
    { category: 'PRINCIPAL', key: 'WICKS', label: 'Wicks', sortOrder: 7, active: true },
    { category: 'PRINCIPAL', key: 'RJC', label: 'RJC', sortOrder: 8, active: true },
    { category: 'PRINCIPAL', key: 'KAYCO', label: 'Kayco', sortOrder: 9, active: true },
    { category: 'PRINCIPAL', key: 'ABDALE', label: 'Abdale', sortOrder: 10, active: true },
    { category: 'PRINCIPAL', key: 'LAND_LOVERS', label: 'Land Lovers', sortOrder: 11, active: true },
  ];

  const allSettingsRaw = [
    ...prioritiesRaw,
    ...segmentsRaw,
    ...distributorsRaw,
    ...contactRolesRaw,
    ...interactionTypesRaw,
    ...opportunityStagesRaw,
    ...opportunityStatusesRaw,
    ...principalsRaw,
  ];

  const systemSettingsSeedData = allSettingsRaw.map(s => {
    const { category, key, label, color, sortOrder, active, icon } = s;
    // Construct the value object carefully, only including defined properties
    const valueObject: any = { label, category, sortOrder, active };
    if (color !== undefined) valueObject.color = color;
    if (icon !== undefined) valueObject.icon = icon;

    return {
      // Create a more robust unique key for SystemSetting, e.g., CATEGORY_KEY
      key: `${s.category}_${s.key}`.toUpperCase(), 
      value: JSON.stringify(valueObject),
      type: 'json', // As per SystemSetting model
    };
  });

  const settings = await prisma.systemSetting.createMany({
    data: systemSettingsSeedData,
  });
  console.log(`⚙️ Created ${settings.count} system settings.`);


  // 4. Seed Organizations (Example Data)
  // Ensure user IDs and setting keys match what's created above
  const organizationSeedData = [
    {
      name: 'The Grand Restaurant',
      address: '123 Culinary Ave', // Corrected field
      city: 'New York',
      state: 'NY',
      zipCode: '10001', // Corrected field
      phone: '212-555-0100',
      notes: 'High-end fine dining establishment, requires top-tier ingredients.', // Corrected field
      priority: 'PRIORITY_A', // Corrected: was priorityKey. Matches SystemSetting key.
      segment: 'SEGMENT_FINE_DINING', // Corrected: was segmentKey. Matches SystemSetting key.
      // accountManagerId: 'user_manager_sj', // Removed: Not a direct scalar field on Organization model for createMany
      // distributorKey: 'DISTRIBUTOR_SYSCO', // Removed: Not a direct scalar field on Organization model for createMany
    },
    {
      name: 'Quick Bites Cafe',
      address: '456 Speedy St', // Corrected field
      city: 'Brooklyn',
      state: 'NY',
      zipCode: '11201', // Corrected field
      phone: '718-555-0200',
      notes: 'Fast-paced QSR, needs reliable and cost-effective options.', // Corrected field
      priority: 'PRIORITY_B', // Corrected: was priorityKey
      segment: 'SEGMENT_QSR', // Corrected: was segmentKey
      // accountManagerId: 'user_manager_md', // Removed: Not a direct scalar field
      // distributorKey: 'DISTRIBUTOR_US_FOODS', // Removed: Not a direct scalar field
    },
  ];

  const organizations = await prisma.organization.createMany({
    data: organizationSeedData,
  });
  console.log(`🏢 Created ${organizations.count} organizations.`);

  // Add more seed data for Contacts, Interactions, Opportunities, etc. as needed.
  // Example:
  // const contactSeedData = [
  //   {
  //     id: 'contact_chef_grand', // Static ID
  //     firstName: 'Alice',
  //     lastName: 'Waters',
  //     email: 'alice.waters@grandrestaurant.com',
  //     phone: '212-555-0101',
  //     organizationName: 'The Grand Restaurant', // Link by name; consider linking by ID if organizations are created first and IDs are known
  //     roleKey: 'CONTACT_ROLE_EXECUTIVE_CHEF',
  //     // accountManagerId: 'user_manager_sj' // Or inherit from Organization
  //   }
  // ];
  // await prisma.contact.createMany({ data: contactSeedData });
  // console.log(`🤝 Created contacts.`);


  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch(async (e) => {
    console.error('❌ Error during database seeding:');
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
