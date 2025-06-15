# Excel Import Pipeline Architecture

## Overview

Design for secure, performant bulk data import system optimized for Azure B1 hosting constraints and food service CRM workflows.

---

## Core Requirements

### Business Requirements
- **Bulk Organization Import**: Restaurant chains, distributors, supplier networks
- **Contact Import**: Chef contacts, decision makers, procurement teams
- **Data Validation**: Ensure data quality and schema compliance
- **Error Handling**: Clear feedback on import issues and corrections
- **Performance**: Handle 1000+ records efficiently on Azure B1 (5 DTU limit)

### Technical Constraints
- **Memory**: 1.75GB max (85% = 1.5GB usable)
- **DTU**: 5 DTU Azure SQL Basic (optimize for minimal DB load)
- **Processing**: Stream processing, no large file loading
- **Security**: File validation, sanitization, user authentication

---

## Architecture Components

### 1. File Upload System

```typescript
// lib/excel-import/file-handler.ts
interface ExcelImportConfig {
  maxFileSize: number;     // 10MB limit for Azure B1
  allowedExtensions: string[]; // .xlsx, .csv
  maxRows: number;         // 1000 rows per import
  chunkSize: number;       // 50 records per batch
}

interface ImportFileMetadata {
  originalName: string;
  size: number;
  mimeType: string;
  userId: string;
  uploadedAt: Date;
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
}
```

### 2. Data Parser & Validator

```typescript
// lib/excel-import/parsers.ts
interface OrganizationImportRow {
  name: string;              // Required
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  segment: OrganizationSegment; // Required: FINE_DINING, CASUAL_DINING, etc.
  priority?: OrganizationPriority; // Default: C
  estimatedRevenue?: number;
  notes?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  primaryContactPosition?: string;
}

interface ContactImportRow {
  firstName: string;         // Required
  lastName: string;          // Required
  email?: string;
  phone?: string;
  position?: string;
  organizationName?: string; // For linking to organization
  organizationEmail?: string; // Alternative linking method
  isPrimary?: boolean;
  notes?: string;
}
```

### 3. Processing Pipeline

```typescript
// lib/excel-import/pipeline.ts
class ExcelImportPipeline {
  async processFile(
    file: File, 
    importType: 'organizations' | 'contacts',
    userId: string
  ): Promise<ImportResult> {
    
    // Step 1: File validation
    const validation = await this.validateFile(file);
    if (!validation.valid) throw new ImportError(validation.errors);
    
    // Step 2: Stream parsing (memory efficient)
    const dataStream = await this.createDataStream(file);
    
    // Step 3: Batch processing (50 records per batch for DTU optimization)
    const batches = await this.createBatches(dataStream, 50);
    
    // Step 4: Validation & transformation
    const processedBatches = await this.validateAndTransform(batches, importType);
    
    // Step 5: Database insertion with error handling
    const results = await this.insertBatches(processedBatches, userId);
    
    return results;
  }
}
```

### 4. Database Optimization

```typescript
// lib/excel-import/db-operations.ts
class ImportDbOperations {
  async insertOrganizationBatch(
    records: OrganizationImportRow[],
    userId: string
  ): Promise<BatchInsertResult> {
    
    // Use Prisma transaction for batch consistency
    return await prismadb.$transaction(async (tx) => {
      const results: BatchInsertResult = {
        successful: [],
        failed: [],
        duplicates: []
      };
      
      // Check for duplicates before insertion (by email/name)
      const existingOrgs = await tx.organization.findMany({
        where: {
          OR: records.map(r => ({ 
            OR: [
              { email: r.email },
              { name: r.name }
            ]
          }))
        },
        select: { id: true, name: true, email: true }
      });
      
      // Process each record with duplicate checking
      for (const record of records) {
        try {
          const duplicate = existingOrgs.find(org => 
            org.email === record.email || org.name === record.name
          );
          
          if (duplicate) {
            results.duplicates.push({
              record,
              existing: duplicate,
              reason: 'Duplicate name or email'
            });
            continue;
          }
          
          // Create organization with contact if provided
          const org = await tx.organization.create({
            data: {
              name: record.name,
              email: record.email,
              phone: record.phone,
              address: record.address,
              city: record.city,
              state: record.state,
              zipCode: record.zipCode,
              segment: record.segment,
              priority: record.priority || 'C',
              type: 'PROSPECT',
              status: 'ACTIVE',
              estimatedRevenue: record.estimatedRevenue,
              notes: record.notes,
              primaryContact: record.primaryContactName,
              createdBy: userId
            }
          });
          
          // Create primary contact if provided
          if (record.primaryContactEmail || record.primaryContactName) {
            await tx.contact.create({
              data: {
                firstName: record.primaryContactName?.split(' ')[0] || 'Unknown',
                lastName: record.primaryContactName?.split(' ').slice(1).join(' ') || '',
                email: record.primaryContactEmail,
                phone: record.primaryContactPhone,
                position: record.primaryContactPosition,
                isPrimary: true,
                organizationId: org.id,
                createdBy: userId
              }
            });
          }
          
          results.successful.push({ record, created: org });
          
        } catch (error) {
          results.failed.push({
            record,
            error: error.message,
            code: 'DB_INSERT_ERROR'
          });
        }
      }
      
      return results;
    });
  }
}
```

---

## UI Components

### 1. Import Wizard Component

```typescript
// components/excel-import/ImportWizard.tsx
interface ImportWizardProps {
  importType: 'organizations' | 'contacts';
  onComplete: (result: ImportResult) => void;
  onCancel: () => void;
}

const ImportWizard = ({ importType, onComplete, onCancel }: ImportWizardProps) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'results'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [results, setResults] = useState<ImportResult | null>(null);
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <ImportProgress currentStep={step} />
      
      {step === 'upload' && (
        <FileUploadStep 
          importType={importType}
          onFileSelected={handleFileUpload}
          onCancel={onCancel}
        />
      )}
      
      {step === 'preview' && preview && (
        <PreviewStep
          preview={preview}
          onConfirm={handleProcessing}
          onBack={() => setStep('upload')}
        />
      )}
      
      {step === 'processing' && (
        <ProcessingStep />
      )}
      
      {step === 'results' && results && (
        <ResultsStep
          results={results}
          onComplete={() => onComplete(results)}
        />
      )}
    </div>
  );
};
```

### 2. Template Generator

```typescript
// components/excel-import/TemplateGenerator.tsx
const TemplateGenerator = () => {
  const generateOrganizationTemplate = () => {
    const template = [
      ['name*', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'segment*', 'priority', 'estimatedRevenue', 'notes', 'primaryContactName', 'primaryContactEmail', 'primaryContactPhone', 'primaryContactPosition'],
      ['Acme Restaurant Group', 'info@acmerestaurants.com', '(555) 123-4567', '123 Main St', 'New York', 'NY', '10001', 'CASUAL_DINING', 'B', '500000', 'Large restaurant chain', 'John Smith', 'john@acmerestaurants.com', '(555) 123-4568', 'Purchasing Manager'],
      ['Fine Dining Co', 'contact@finedining.com', '(555) 987-6543', '456 Oak Ave', 'Los Angeles', 'CA', '90210', 'FINE_DINING', 'A', '1000000', 'Upscale restaurant', 'Jane Doe', 'jane@finedining.com', '(555) 987-6544', 'Head Chef']
    ];
    
    return createExcelFile(template, 'organization-import-template.xlsx');
  };
  
  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Download Import Templates</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button onClick={generateOrganizationTemplate} className="flex items-center">
          <Download className="w-4 h-4 mr-2" />
          Organization Template
        </Button>
        
        <Button onClick={generateContactTemplate} className="flex items-center">
          <Download className="w-4 h-4 mr-2" />
          Contact Template
        </Button>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>* Required fields</p>
        <p>Templates include sample data and validation rules</p>
      </div>
    </div>
  );
};
```

---

## API Routes

### 1. File Upload Endpoint

```typescript
// app/api/import/upload/route.ts
export async function POST(req: NextRequest): Promise<NextResponse<APIResponse<ImportSession>>> {
  const { user, error } = await requireAuth(req);
  if (error) return error;
  
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const importType = formData.get('type') as 'organizations' | 'contacts';
    
    // Validate file
    const validation = await validateImportFile(file);
    if (!validation.valid) {
      return createErrorResponse('Invalid file format', 400, validation.errors);
    }
    
    // Create import session
    const session = await createImportSession({
      userId: user.id,
      fileName: file.name,
      fileSize: file.size,
      importType,
      status: 'uploaded'
    });
    
    // Store file temporarily (use Azure Blob Storage for production)
    const fileUrl = await storeTemporaryFile(file, session.id);
    
    return createSuccessResponse({
      sessionId: session.id,
      fileUrl,
      previewUrl: `/api/import/${session.id}/preview`
    });
    
  } catch (err) {
    return handlePrismaError(err);
  }
}
```

### 2. Preview Endpoint

```typescript
// app/api/import/[sessionId]/preview/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
): Promise<NextResponse<APIResponse<ImportPreview>>> {
  
  const { user, error } = await requireAuth(req);
  if (error) return error;
  
  try {
    const { sessionId } = await params;
    
    // Get import session
    const session = await getImportSession(sessionId, user.id);
    if (!session) {
      return createErrorResponse('Import session not found', 404);
    }
    
    // Parse first 10 rows for preview
    const preview = await generateImportPreview(session.fileUrl, session.importType, 10);
    
    return createSuccessResponse(preview);
    
  } catch (err) {
    return handlePrismaError(err);
  }
}
```

### 3. Process Endpoint

```typescript
// app/api/import/[sessionId]/process/route.ts
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
): Promise<NextResponse<APIResponse<ImportResult>>> {
  
  const { user, error } = await requireAuth(req);
  if (error) return error;
  
  try {
    const { sessionId } = await params;
    const { skipDuplicates = true } = await req.json();
    
    // Get import session
    const session = await getImportSession(sessionId, user.id);
    if (!session) {
      return createErrorResponse('Import session not found', 404);
    }
    
    // Process the import
    const pipeline = new ExcelImportPipeline();
    const results = await pipeline.processImport(session, user.id, { skipDuplicates });
    
    // Update session status
    await updateImportSession(sessionId, {
      status: 'completed',
      completedAt: new Date(),
      results
    });
    
    return createSuccessResponse(results);
    
  } catch (err) {
    return handlePrismaError(err);
  }
}
```

---

## Performance Optimizations

### 1. Memory Management
- **Streaming**: Process files in chunks, never load entire file
- **Batch Size**: 50 records per database transaction
- **Cleanup**: Remove temporary files after processing

### 2. Database Optimization
- **Transactions**: Use Prisma transactions for consistency
- **Duplicate Detection**: Efficient batch queries before insertion
- **Indexing**: Ensure proper indexes on email/name fields

### 3. Azure B1 Considerations
- **DTU Management**: Limit concurrent imports to 1 per user
- **Connection Pooling**: Reuse database connections
- **Error Recovery**: Retry mechanism for transient failures

---

## Security Measures

### 1. File Validation
- **Extension Check**: Only .xlsx, .csv files
- **Size Limit**: 10MB maximum
- **Content Scanning**: Check for malicious content
- **Schema Validation**: Ensure proper column structure

### 2. Data Sanitization
- **Input Cleaning**: Remove HTML tags, scripts
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Protection**: Sanitize all user input

### 3. Access Control
- **Authentication**: Require valid user session
- **Authorization**: Users can only import to their own data
- **Rate Limiting**: Prevent abuse with rate limits

---

## Error Handling

### 1. Import Errors
```typescript
interface ImportError {
  row: number;
  field: string;
  value: any;
  error: string;
  suggestion?: string;
}
```

### 2. Common Error Types
- **Validation Errors**: Required fields missing, invalid formats
- **Duplicate Errors**: Organizations/contacts already exist
- **Database Errors**: Connection issues, constraint violations
- **File Errors**: Corrupted files, unsupported formats

### 3. User Feedback
- **Progress Indicators**: Real-time processing status
- **Error Reports**: Downloadable error summary
- **Correction Guidance**: Suggestions for fixing issues

---

## Testing Strategy

### 1. Unit Tests
- File validation logic
- Data transformation functions
- Error handling scenarios

### 2. Integration Tests
- End-to-end import workflow
- Database transaction handling
- File processing pipeline

### 3. Performance Tests
- Large file handling (1000+ records)
- Memory usage monitoring
- DTU consumption tracking

---

## Deployment Considerations

### 1. File Storage
- **Development**: Local filesystem
- **Production**: Azure Blob Storage
- **Temporary**: Auto-cleanup after 24 hours

### 2. Monitoring
- **Import Success Rate**: Track completion rates
- **Performance Metrics**: Processing time, memory usage
- **Error Tracking**: Common failure patterns

### 3. Scaling
- **Queue System**: Handle multiple imports
- **Background Processing**: Non-blocking imports
- **Result Notifications**: Email/in-app notifications

This architecture provides a robust, secure, and performant Excel import system optimized for the Kitchen Pantry CRM's Azure B1 hosting environment and food service industry requirements.