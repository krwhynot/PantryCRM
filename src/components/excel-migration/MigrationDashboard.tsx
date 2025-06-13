'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  Upload, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileSpreadsheet,
  Database,
  ArrowRight
} from 'lucide-react';

interface EntityProgress {
  name: string;
  total: number;
  processed: number;
  errors: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

interface MigrationState {
  status: 'idle' | 'analyzing' | 'migrating' | 'completed' | 'error';
  currentEntity: string | null;
  entities: EntityProgress[];
  startTime: Date | null;
  endTime: Date | null;
  errors: Array<{
    entity: string;
    row: number;
    field: string;
    message: string;
  }>;
}

export function MigrationDashboard() {
  const [migrationState, setMigrationState] = useState<MigrationState>({
    status: 'idle',
    currentEntity: null,
    entities: [
      { name: 'Organizations', total: 2284, processed: 0, errors: 0, status: 'pending' },
      { name: 'Contacts', total: 1954, processed: 0, errors: 0, status: 'pending' },
      { name: 'Opportunities', total: 1068, processed: 0, errors: 0, status: 'pending' },
      { name: 'Interactions', total: 3470, processed: 0, errors: 0, status: 'pending' }
    ],
    startTime: null,
    endTime: null,
    errors: []
  });

  const [isPaused, setIsPaused] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { toast } = useToast();

  // Connect to SSE for real-time updates
  useEffect(() => {
    if (migrationState.status === 'analyzing' || migrationState.status === 'migrating') {
      const eventSource = new EventSource('/api/migration/progress');
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('connected', (event) => {
        console.log('Connected to migration progress stream');
      });

      eventSource.addEventListener('entity:progress', (event) => {
        const data = JSON.parse(event.data);
        setMigrationState(prev => ({
          ...prev,
          entities: prev.entities.map(entity =>
            entity.name === data.entity
              ? { ...entity, processed: data.processed, errors: data.errors }
              : entity
          )
        }));
      });

      eventSource.addEventListener('entity:start', (event) => {
        const data = JSON.parse(event.data);
        setMigrationState(prev => ({
          ...prev,
          currentEntity: data.entity,
          entities: prev.entities.map(entity =>
            entity.name === data.entity
              ? { ...entity, status: 'processing' }
              : entity
          )
        }));
      });

      eventSource.addEventListener('entity:complete', (event) => {
        const data = JSON.parse(event.data);
        setMigrationState(prev => ({
          ...prev,
          entities: prev.entities.map(entity =>
            entity.name === data.entity
              ? { ...entity, status: data.errors > 0 ? 'error' : 'completed' }
              : entity
          )
        }));
      });

      eventSource.addEventListener('migration:complete', (event) => {
        const data = JSON.parse(event.data);
        setMigrationState(prev => ({
          ...prev,
          status: 'completed',
          endTime: new Date(),
          errors: data.errors || []
        }));
        toast({
          title: 'Migration Completed',
          description: `Successfully processed ${data.entities.reduce((sum: number, e: any) => sum + e.processed, 0)} records`,
        });
      });

      eventSource.addEventListener('migration:error', (event) => {
        const data = JSON.parse(event.data);
        setMigrationState(prev => ({
          ...prev,
          status: 'error',
          endTime: new Date()
        }));
        toast({
          title: 'Migration Failed',
          description: data.message || 'An error occurred during migration',
          variant: 'destructive'
        });
      });

      eventSource.addEventListener('error', (event) => {
        console.error('SSE error:', event);
        eventSource.close();
      });

      return () => {
        eventSource.close();
      };
    }
  }, [migrationState.status, toast]);

  const totalRecords = migrationState.entities.reduce((sum, e) => sum + e.total, 0);
  const processedRecords = migrationState.entities.reduce((sum, e) => sum + e.processed, 0);
  const totalErrors = migrationState.entities.reduce((sum, e) => sum + e.errors, 0);
  const overallProgress = totalRecords > 0 ? (processedRecords / totalRecords) * 100 : 0;

  const getElapsedTime = () => {
    if (!migrationState.startTime) return '00:00';
    const endTime = migrationState.endTime || new Date();
    const elapsed = Math.floor((endTime.getTime() - migrationState.startTime.getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getEstimatedTimeRemaining = () => {
    if (!migrationState.startTime || processedRecords === 0) return '--:--';
    const elapsed = new Date().getTime() - migrationState.startTime.getTime();
    const rate = processedRecords / elapsed;
    const remaining = (totalRecords - processedRecords) / rate;
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const startMigration = async () => {
    try {
      const response = await fetch('/api/migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start migration');
      }

      setMigrationState(prev => ({
        ...prev,
        status: 'analyzing',
        startTime: new Date(),
        endTime: null,
        errors: []
      }));

      // The actual status updates will come through SSE
    } catch (error) {
      toast({
        title: 'Failed to start migration',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const pauseMigration = async () => {
    try {
      const response = await fetch('/api/migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause' })
      });

      if (response.ok) {
        setIsPaused(!isPaused);
      }
    } catch (error) {
      console.error('Failed to pause migration:', error);
    }
  };

  const abortMigration = async () => {
    try {
      const response = await fetch('/api/migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'abort' })
      });

      if (response.ok) {
        setMigrationState(prev => ({
          ...prev,
          status: 'error',
          endTime: new Date()
        }));
        toast({
          title: 'Migration aborted',
          description: 'The migration process has been stopped',
        });
      }
    } catch (error) {
      console.error('Failed to abort migration:', error);
    }
  };

  const resetMigration = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setMigrationState({
      status: 'idle',
      currentEntity: null,
      entities: [
        { name: 'Organizations', total: 2284, processed: 0, errors: 0, status: 'pending' },
        { name: 'Contacts', total: 1954, processed: 0, errors: 0, status: 'pending' },
        { name: 'Opportunities', total: 1068, processed: 0, errors: 0, status: 'pending' },
        { name: 'Interactions', total: 3470, processed: 0, errors: 0, status: 'pending' }
      ],
      startTime: null,
      endTime: null,
      errors: []
    });
    setIsPaused(false);
  };

  // Fetch current database counts on mount
  useEffect(() => {
    fetch('/api/migration')
      .then(res => res.json())
      .then(data => {
        if (data.counts) {
          console.log('Current database counts:', data.counts);
        }
      })
      .catch(console.error);
  }, []);

  const getStatusIcon = (status: EntityProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: MigrationState['status']) => {
    const variants: Record<MigrationState['status'], { variant: any; label: string }> = {
      idle: { variant: 'secondary', label: 'Ready' },
      analyzing: { variant: 'default', label: 'Analyzing' },
      migrating: { variant: 'default', label: 'Migrating' },
      completed: { variant: 'success', label: 'Completed' },
      error: { variant: 'destructive', label: 'Error' }
    };

    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="h-6 w-6" />
              <CardTitle>Excel Migration Dashboard</CardTitle>
            </div>
            {getStatusBadge(migrationState.status)}
          </div>
          <CardDescription>
            Import data from CRM-WORKBOOK.xlsx into PantryCRM database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Progress Overview */}
            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Overall Progress</span>
                <span>{processedRecords.toLocaleString()} / {totalRecords.toLocaleString()} records</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>Elapsed: {getElapsedTime()}</span>
                <span>Remaining: {getEstimatedTimeRemaining()}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2">
              {migrationState.status === 'idle' && (
                <Button onClick={startMigration} className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Start Migration
                </Button>
              )}
              {(migrationState.status === 'migrating' || migrationState.status === 'analyzing') && (
                <Button 
                  onClick={pauseMigration} 
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
              )}
              {migrationState.status !== 'idle' && (
                <Button 
                  onClick={resetMigration} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              )}
            </div>

            {/* Entity Progress */}
            <div className="space-y-3">
              {migrationState.entities.map((entity, index) => (
                <div key={entity.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(entity.status)}
                      <span className="font-medium">{entity.name}</span>
                      {entity.errors > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {entity.errors} errors
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {entity.processed.toLocaleString()} / {entity.total.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={(entity.processed / entity.total) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>

            {/* Status Messages */}
            {migrationState.status === 'analyzing' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Analyzing Excel File</AlertTitle>
                <AlertDescription>
                  Reading worksheet structure and validating data format...
                </AlertDescription>
              </Alert>
            )}

            {totalErrors > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Migration Errors</AlertTitle>
                <AlertDescription>
                  {totalErrors} errors encountered during migration. Check the errors tab for details.
                </AlertDescription>
              </Alert>
            )}

            {migrationState.status === 'completed' && (
              <Alert variant="default" className="border-green-500">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Migration Completed</AlertTitle>
                <AlertDescription>
                  Successfully migrated {processedRecords.toLocaleString()} records in {getElapsedTime()}.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="mappings">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mappings">Field Mappings</TabsTrigger>
              <TabsTrigger value="errors">
                Errors {totalErrors > 0 && `(${totalErrors})`}
              </TabsTrigger>
              <TabsTrigger value="logs">Activity Log</TabsTrigger>
            </TabsList>
            
            <TabsContent value="mappings" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Configured field mappings for each entity type
              </div>
              {migrationState.entities.map(entity => (
                <Card key={entity.name}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">{entity.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <FileSpreadsheet className="h-3 w-3" />
                        <span className="text-muted-foreground">Excel</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                      <div className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        <span className="text-muted-foreground">Database</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="errors" className="space-y-2">
              {migrationState.errors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No errors recorded
                </div>
              ) : (
                <div className="space-y-2">
                  {migrationState.errors.slice(0, 10).map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertDescription>
                        <strong>{error.entity} Row {error.row}:</strong> {error.field} - {error.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                  {migrationState.errors.length > 10 && (
                    <div className="text-sm text-muted-foreground text-center">
                      ... and {migrationState.errors.length - 10} more errors
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="logs" className="space-y-2">
              <div className="text-sm space-y-1 font-mono">
                {migrationState.startTime && (
                  <div className="text-muted-foreground">
                    [{migrationState.startTime.toLocaleTimeString()}] Migration started
                  </div>
                )}
                {migrationState.status === 'analyzing' && (
                  <div className="text-blue-600">
                    [--:--:--] Analyzing Excel workbook structure...
                  </div>
                )}
                {migrationState.currentEntity && (
                  <div className="text-blue-600">
                    [--:--:--] Processing {migrationState.currentEntity}...
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}