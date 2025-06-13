import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MigrationExecutor } from '@/lib/excel-migration/migration-executor';
import path from 'path';

// Store active migrations
const activeMigrations = new Map<string, MigrationExecutor>();

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    switch (action) {
      case 'start':
        return startMigration();
      case 'pause':
        return pauseMigration();
      case 'abort':
        return abortMigration();
      case 'status':
        return getMigrationStatus();
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function startMigration() {
  // Check if migration is already running
  if (activeMigrations.has('current')) {
    return NextResponse.json(
      { error: 'Migration already in progress' },
      { status: 409 }
    );
  }

  // Create new migration executor
  const executor = new MigrationExecutor(prisma);
  activeMigrations.set('current', executor);

  // Start migration in background
  const excelPath = path.join(process.cwd(), 'excel', 'CRM-WORKBOOK.xlsx');
  
  executor.executeMigration(excelPath)
    .then(result => {
      console.log('Migration completed:', result);
      activeMigrations.delete('current');
    })
    .catch(error => {
      console.error('Migration failed:', error);
      activeMigrations.delete('current');
    });

  return NextResponse.json({
    message: 'Migration started',
    id: 'current'
  });
}

function pauseMigration() {
  // Note: Pause functionality would need to be implemented in the executor
  return NextResponse.json({
    message: 'Pause functionality not yet implemented'
  });
}

function abortMigration() {
  const executor = activeMigrations.get('current');
  if (!executor) {
    return NextResponse.json(
      { error: 'No active migration' },
      { status: 404 }
    );
  }

  executor.abort();
  activeMigrations.delete('current');

  return NextResponse.json({
    message: 'Migration aborted'
  });
}

function getMigrationStatus() {
  const executor = activeMigrations.get('current');
  
  return NextResponse.json({
    active: !!executor,
    message: executor ? 'Migration in progress' : 'No active migration'
  });
}

export async function GET() {
  // Get migration statistics
  try {
    const [organizations, contacts, opportunities, interactions] = await Promise.all([
      prisma.organization.count(),
      prisma.contact.count(),
      prisma.opportunity.count(),
      prisma.interaction.count()
    ]);

    return NextResponse.json({
      counts: {
        organizations,
        contacts,
        opportunities,
        interactions
      },
      migrationActive: activeMigrations.has('current')
    });
  } catch (error) {
    console.error('Error fetching migration stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}