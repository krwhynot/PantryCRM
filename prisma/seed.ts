import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Priority Settings (A=Green, B=Yellow, C=Orange, D=Red)
  await prisma.setting.createMany({
    data: [
      { category: 'Priority', key: 'A', label: 'High Priority', color: '#22c55e', sortOrder: 1 },
      { category: 'Priority', key: 'B', label: 'Medium Priority', color: '#eab308', sortOrder: 2 },
      { category: 'Priority', key: 'C', label: 'Low Priority', color: '#f97316', sortOrder: 3 },
      { category: 'Priority', key: 'D', label: 'Inactive', color: '#ef4444', sortOrder: 4 },
    ],
    skipDuplicates: true,
  });

  // Segment Settings
  await prisma.setting.createMany({
    data: [
      { category: 'Segment', key: 'fine-dining', label: 'Fine Dining', sortOrder: 1 },
      { category: 'Segment', key: 'fast-food', label: 'Fast Food', sortOrder: 2 },
      { category: 'Segment', key: 'healthcare', label: 'Healthcare', sortOrder: 3 },
      { category: 'Segment', key: 'catering', label: 'Catering', sortOrder: 4 },
      { category: 'Segment', key: 'institutional', label: 'Institutional', sortOrder: 5 },
    ],
    skipDuplicates: true,
  });

  // Distributor Settings
  await prisma.setting.createMany({
    data: [
      { category: 'Distributor', key: 'sysco', label: 'Sysco', sortOrder: 1 },
      { category: 'Distributor', key: 'usf', label: 'US Foods', sortOrder: 2 },
      { category: 'Distributor', key: 'pfg', label: 'Performance Food Group', sortOrder: 3 },
      { category: 'Distributor', key: 'direct', label: 'Direct', sortOrder: 4 },
      { category: 'Distributor', key: 'other', label: 'Other', sortOrder: 5 },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Settings seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });