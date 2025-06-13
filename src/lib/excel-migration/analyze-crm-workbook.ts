import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs/promises';

interface SheetAnalysis {
  name: string;
  actualHeaders: string[];
  dataStartRow: number;
  totalRows: number;
  dataRows: number;
  columnMapping: Array<{
    index: number;
    header: string;
    sampleValues: any[];
    dataType: string;
    nonEmptyCount: number;
  }>;
}

async function analyzeCRMWorkbook() {
  console.log('🔍 Analyzing CRM Workbook with intelligent header detection...\n');
  
  const excelPath = path.join(process.cwd(), 'excel', 'CRM-WORKBOOK.xlsx');
  const workbook = XLSX.readFile(excelPath);
  
  const analysis: SheetAnalysis[] = [];
  const mappingSuggestions: any = {};
  
  // Analyze each sheet
  for (const sheetName of workbook.SheetNames) {
    console.log(`\n📊 Analyzing sheet: ${sheetName}`);
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];
    
    if (jsonData.length === 0) {
      console.log('   ⚠️  Empty sheet, skipping...');
      continue;
    }
    
    // Find the actual header row (look for rows with multiple non-empty cells)
    let headerRowIndex = -1;
    let actualHeaders: string[] = [];
    
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i] || [];
      const nonEmptyCells = row.filter(cell => cell !== null && cell !== undefined && cell !== '');
      
      // Heuristic: headers usually have multiple non-empty cells and contain text
      if (nonEmptyCells.length >= 3) {
        const hasText = nonEmptyCells.some(cell => 
          typeof cell === 'string' && 
          cell.length > 2 && 
          !cell.match(/^\d+$/) // not just numbers
        );
        
        if (hasText) {
          // Check if this looks like headers (contains keywords)
          const rowText = nonEmptyCells.join(' ').toLowerCase();
          const headerKeywords = ['name', 'organization', 'contact', 'email', 'phone', 'date', 
                                'priority', 'status', 'stage', 'type', 'manager', 'opportunity',
                                'interaction', 'notes', 'address', 'city', 'state'];
          
          const keywordMatches = headerKeywords.filter(kw => rowText.includes(kw)).length;
          
          if (keywordMatches >= 2 || (nonEmptyCells.length >= 5 && hasText)) {
            headerRowIndex = i;
            actualHeaders = row.map((cell, idx) => {
              if (cell === null || cell === undefined || cell === '') {
                return `Column${idx + 1}`;
              }
              return String(cell).trim();
            });
            break;
          }
        }
      }
    }
    
    // If no headers found, check specific patterns for known sheets
    if (headerRowIndex === -1) {
      if (sheetName === 'Organizations' || sheetName === 'Contacts' || 
          sheetName === 'Opportunities' || sheetName === 'Interactions') {
        // These sheets typically have headers in row 2 or 3
        for (let i = 1; i < 4; i++) {
          const row = jsonData[i] || [];
          const cellText = row.join(' ').toLowerCase();
          if (cellText.includes('organization') || cellText.includes('contact') || 
              cellText.includes('priority') || cellText.includes('email')) {
            headerRowIndex = i;
            actualHeaders = row.map((cell, idx) => 
              cell ? String(cell).trim() : `Column${idx + 1}`
            );
            break;
          }
        }
      }
    }
    
    // Default to first row if no headers found
    if (headerRowIndex === -1) {
      headerRowIndex = 0;
      actualHeaders = (jsonData[0] || []).map((cell, idx) => 
        cell ? String(cell).trim() : `Column${idx + 1}`
      );
    }
    
    const dataStartRow = headerRowIndex + 1;
    const dataRows = jsonData.length - dataStartRow;
    
    // Analyze columns
    const columnMapping = actualHeaders.map((header, index) => {
      const values: any[] = [];
      let nonEmptyCount = 0;
      
      for (let i = dataStartRow; i < Math.min(dataStartRow + 100, jsonData.length); i++) {
        const value = jsonData[i]?.[index];
        if (value !== null && value !== undefined && value !== '') {
          values.push(value);
          nonEmptyCount++;
        }
      }
      
      // Determine data type
      let dataType = 'unknown';
      if (values.length > 0) {
        const sample = values[0];
        if (typeof sample === 'number') {
          dataType = 'number';
        } else if (typeof sample === 'string') {
          if (sample.match(/^\d{4}-\d{2}-\d{2}/) || sample.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
            dataType = 'date';
          } else if (sample.match(/^[\w._%+-]+@[\w.-]+\.[A-Z]{2,}$/i)) {
            dataType = 'email';
          } else if (sample.match(/^\+?\d[\d\s()-]+$/)) {
            dataType = 'phone';
          } else {
            dataType = 'string';
          }
        }
      }
      
      return {
        index,
        header,
        sampleValues: values.slice(0, 3),
        dataType,
        nonEmptyCount
      };
    }).filter(col => col.nonEmptyCount > 0); // Only keep columns with data
    
    const sheetAnalysis: SheetAnalysis = {
      name: sheetName,
      actualHeaders,
      dataStartRow,
      totalRows: jsonData.length,
      dataRows,
      columnMapping
    };
    
    analysis.push(sheetAnalysis);
    
    console.log(`   ✓ Header row: ${headerRowIndex + 1}`);
    console.log(`   ✓ Data starts at row: ${dataStartRow + 1}`);
    console.log(`   ✓ Total data rows: ${dataRows}`);
    console.log(`   ✓ Columns with data: ${columnMapping.length}`);
    
    // Generate mapping suggestions for key sheets
    if (['Organizations', 'Contacts', 'Opportunities', 'Interactions'].includes(sheetName)) {
      mappingSuggestions[sheetName] = generateMappingSuggestions(sheetAnalysis);
    }
  }
  
  // Save analysis results
  const outputPath = path.join(process.cwd(), 'excel', 'crm-workbook-analysis.json');
  await fs.writeFile(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    sheets: analysis,
    mappingSuggestions
  }, null, 2));
  
  console.log(`\n✅ Analysis complete! Results saved to: ${outputPath}`);
  
  // Print summary
  console.log('\n=== KEY FINDINGS ===');
  for (const sheet of analysis) {
    if (['Organizations', 'Contacts', 'Opportunities', 'Interactions'].includes(sheet.name)) {
      console.log(`\n${sheet.name}:`);
      console.log(`  - ${sheet.dataRows} data rows`);
      console.log(`  - ${sheet.columnMapping.length} columns with data`);
      
      const suggestions = mappingSuggestions[sheet.name];
      if (suggestions && suggestions.length > 0) {
        console.log('  - Suggested mappings:');
        suggestions.slice(0, 5).forEach((s: any) => {
          console.log(`    • ${s.excelColumn} → ${s.dbField} (${s.confidence})`);
        });
      }
    }
  }
  
  return { analysis, mappingSuggestions };
}

function generateMappingSuggestions(sheet: SheetAnalysis) {
  const suggestions: Array<{
    excelColumn: string;
    dbField: string;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
  }> = [];
  
  // Define mapping patterns
  const patterns: Record<string, Array<{field: string, keywords: string[], priority: number}>> = {
    Organizations: [
      { field: 'name', keywords: ['organization', 'company', 'business', 'customer', 'client'], priority: 1 },
      { field: 'priority', keywords: ['priority', 'tier', 'level', 'importance'], priority: 1 },
      { field: 'segment', keywords: ['segment', 'category', 'type', 'industry'], priority: 1 },
      { field: 'distributor', keywords: ['distributor', 'supplier', 'vendor'], priority: 2 },
      { field: 'accountManager', keywords: ['manager', 'account', 'rep', 'owner'], priority: 2 },
      { field: 'phone', keywords: ['phone', 'telephone', 'tel', 'mobile'], priority: 2 },
      { field: 'email', keywords: ['email', 'e-mail', 'mail'], priority: 2 },
      { field: 'address', keywords: ['address', 'street', 'location'], priority: 2 },
      { field: 'city', keywords: ['city', 'town'], priority: 3 },
      { field: 'state', keywords: ['state', 'province'], priority: 3 },
      { field: 'zipCode', keywords: ['zip', 'postal', 'postcode'], priority: 3 },
      { field: 'notes', keywords: ['notes', 'comments', 'remarks'], priority: 3 }
    ],
    Contacts: [
      { field: 'fullName', keywords: ['name', 'full', 'contact'], priority: 1 },
      { field: 'firstName', keywords: ['first', 'fname', 'given'], priority: 1 },
      { field: 'lastName', keywords: ['last', 'lname', 'surname'], priority: 1 },
      { field: 'organizationName', keywords: ['organization', 'company', 'business'], priority: 1 },
      { field: 'position', keywords: ['position', 'title', 'role', 'job'], priority: 2 },
      { field: 'email', keywords: ['email', 'e-mail'], priority: 2 },
      { field: 'phone', keywords: ['phone', 'mobile', 'tel'], priority: 2 },
      { field: 'accountManager', keywords: ['manager', 'account', 'owner'], priority: 3 },
      { field: 'linkedIn', keywords: ['linkedin', 'social'], priority: 3 }
    ],
    Opportunities: [
      { field: 'organizationName', keywords: ['organization', 'company', 'customer'], priority: 1 },
      { field: 'name', keywords: ['opportunity', 'deal', 'name'], priority: 1 },
      { field: 'stage', keywords: ['stage', 'phase', 'step'], priority: 1 },
      { field: 'status', keywords: ['status', 'state'], priority: 1 },
      { field: 'value', keywords: ['value', 'amount', 'revenue', 'volume'], priority: 2 },
      { field: 'probability', keywords: ['probability', 'chance', 'likelihood'], priority: 2 },
      { field: 'startDate', keywords: ['start', 'begin', 'created'], priority: 2 },
      { field: 'expectedCloseDate', keywords: ['close', 'end', 'expected', 'target'], priority: 2 },
      { field: 'principal', keywords: ['principal', 'brand'], priority: 3 },
      { field: 'product', keywords: ['product', 'item', 'sku'], priority: 3 },
      { field: 'owner', keywords: ['owner', 'rep', 'manager'], priority: 3 }
    ],
    Interactions: [
      { field: 'date', keywords: ['date', 'when', 'time'], priority: 1 },
      { field: 'type', keywords: ['interaction', 'type', 'activity', 'action'], priority: 1 },
      { field: 'organizationName', keywords: ['organization', 'company', 'account'], priority: 1 },
      { field: 'contactName', keywords: ['contact', 'person', 'who'], priority: 2 },
      { field: 'accountManager', keywords: ['manager', 'account', 'rep'], priority: 2 },
      { field: 'opportunity', keywords: ['opportunity', 'deal'], priority: 3 },
      { field: 'principal', keywords: ['principal', 'brand'], priority: 3 },
      { field: 'notes', keywords: ['notes', 'description', 'details'], priority: 3 }
    ]
  };
  
  const sheetPatterns = patterns[sheet.name] || [];
  
  for (const column of sheet.columnMapping) {
    const columnLower = column.header.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (const pattern of sheetPatterns) {
      for (const keyword of pattern.keywords) {
        const keywordClean = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        let confidence: 'high' | 'medium' | 'low' = 'low';
        let matched = false;
        let reason = '';
        
        // Exact match
        if (columnLower === keywordClean) {
          confidence = 'high';
          matched = true;
          reason = 'Exact match';
        }
        // Contains keyword
        else if (columnLower.includes(keywordClean) || keywordClean.includes(columnLower)) {
          confidence = pattern.priority === 1 ? 'high' : 'medium';
          matched = true;
          reason = 'Contains keyword';
        }
        // Starts or ends with keyword
        else if (columnLower.startsWith(keywordClean) || columnLower.endsWith(keywordClean)) {
          confidence = 'medium';
          matched = true;
          reason = 'Partial match';
        }
        
        if (matched) {
          // Check if we already have a suggestion for this field
          const existing = suggestions.find(s => s.dbField === pattern.field);
          if (!existing || (confidence === 'high' && existing.confidence !== 'high')) {
            if (existing) {
              suggestions.splice(suggestions.indexOf(existing), 1);
            }
            
            suggestions.push({
              excelColumn: column.header,
              dbField: pattern.field,
              confidence,
              reason
            });
          }
          break;
        }
      }
    }
  }
  
  // Sort by confidence and priority
  suggestions.sort((a, b) => {
    const confOrder = { high: 0, medium: 1, low: 2 };
    return confOrder[a.confidence] - confOrder[b.confidence];
  });
  
  return suggestions;
}

// Run the analysis
if (require.main === module) {
  analyzeCRMWorkbook().catch(console.error);
}

export { analyzeCRMWorkbook, SheetAnalysis };