import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seeds the Setting table with Position entries for contact roles
 * These positions are specific to the food service industry
 */
async function seedPositions(): Promise<void> {
  const positions = [
    { key: 'exec-chef', label: 'Executive Chef', sortOrder: 1 },
    { key: 'sous-chef', label: 'Sous Chef', sortOrder: 2 },
    { key: 'kitchen-manager', label: 'Kitchen Manager', sortOrder: 3 },
    { key: 'buyer', label: 'Buyer', sortOrder: 4 },
    { key: 'purchasing-manager', label: 'Purchasing Manager', sortOrder: 5 },
    { key: 'general-manager', label: 'General Manager', sortOrder: 6 },
    { key: 'owner', label: 'Owner', sortOrder: 7 },
    { key: 'director-operations', label: 'Director of Operations', sortOrder: 8 },
    { key: 'food-service-director', label: 'Food Service Director', sortOrder: 9 },
    { key: 'other', label: 'Other', sortOrder: 10 },
  ];

  console.log('Seeding Position settings...');
  
  for (const position of positions) {
    await prisma.setting.upsert({
      where: { category_key: { category: 'Position', key: position.key } },
      update: { label: position.label, sortOrder: position.sortOrder },
      create: {
        category: 'Position',
        key: position.key,
        label: position.label,
        sortOrder: position.sortOrder,
        active: true,
      },
    });
  }

  console.log('Position settings seeded successfully');
}

// Run the seed function
seedPositions()
  .catch((e) => {
    console.error('Error seeding positions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
