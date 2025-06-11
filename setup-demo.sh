#!/bin/bash

echo "🚀 Setting up Kitchen Pantry CRM Local Demo..."

# Copy demo environment
cp .env.local.demo .env.local
echo "✅ Demo environment configured"

# Copy demo Prisma schema
cp prisma/schema.demo.prisma prisma/schema.prisma
echo "✅ Demo database schema configured (SQLite)"

# Remove existing database if it exists
rm -f dev.db
echo "✅ Cleaned up existing demo database"

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️ Setting up demo database..."
npx prisma db push --force-reset

# Create demo data
echo "🌱 Seeding demo data..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDemo() {
  console.log('Creating demo organizations...');
  
  const org1 = await prisma.organization.create({
    data: {
      name: 'Bella Vista Restaurant',
      priority: 'A',
      segment: 'FINE_DINING',
      address: '123 Main St',
      city: 'Downtown',
      state: 'CA',
      zipCode: '90210',
      phone: '(555) 123-4567',
      email: 'manager@bellavista.com',
      estimatedRevenue: 250000,
      employeeCount: 25,
      status: 'ACTIVE'
    }
  });
  
  const org2 = await prisma.organization.create({
    data: {
      name: 'Quick Burger Chain',
      priority: 'B',
      segment: 'FAST_FOOD',
      address: '456 Speed Ave',
      city: 'Fasttown',
      state: 'TX',
      zipCode: '75201',
      phone: '(555) 987-6543',
      email: 'orders@quickburger.com',
      estimatedRevenue: 150000,
      employeeCount: 15,
      status: 'ACTIVE'
    }
  });
  
  console.log('Creating demo contacts...');
  
  await prisma.contact.create({
    data: {
      firstName: 'Maria',
      lastName: 'Rodriguez',
      email: 'maria@bellavista.com',
      phone: '(555) 123-4567',
      position: 'General Manager',
      isPrimary: true,
      organizationId: org1.id
    }
  });
  
  await prisma.contact.create({
    data: {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john@quickburger.com',
      phone: '(555) 987-6543',
      position: 'Operations Director',
      isPrimary: true,
      organizationId: org2.id
    }
  });
  
  console.log('Creating demo interactions...');
  
  await prisma.interaction.create({
    data: {
      type: 'CALL',
      subject: 'Initial contact call',
      description: 'Discussed catering needs for upcoming events',
      date: new Date('2024-06-01'),
      duration: 30,
      outcome: 'POSITIVE',
      nextAction: 'Schedule tasting appointment',
      organizationId: org1.id
    }
  });
  
  await prisma.interaction.create({
    data: {
      type: 'VISIT',
      subject: 'Site visit and product demo',
      description: 'Presented new frozen food line, very interested',
      date: new Date('2024-06-05'),
      duration: 60,
      outcome: 'FOLLOW_UP_NEEDED',
      nextAction: 'Send pricing proposal',
      organizationId: org2.id
    }
  });
  
  console.log('✅ Demo data created successfully!');
  
  await prisma.\$disconnect();
}

seedDemo().catch(console.error);
"

echo ""
echo "🎉 Demo setup complete!"
echo ""
echo "📋 What's included:"
echo "   • SQLite database with demo data"
echo "   • 2 demo organizations (Fine Dining & Fast Food)"
echo "   • Sample contacts and interactions"
echo "   • Local authentication setup"
echo ""
echo "🚀 To start the demo:"
echo "   npm run dev"
echo ""
echo "🌐 Then visit: http://localhost:3000"