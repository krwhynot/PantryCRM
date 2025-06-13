import { MigrationDashboard } from '@/components/excel-migration/MigrationDashboard';

export default function MigrationPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Excel Data Migration</h1>
      <MigrationDashboard />
    </div>
  );
}