import { ExcelAnalyzer } from './excel-analyzer';
import * as fs from 'fs/promises';
import * as path from 'path';

async function main() {
  try {
    console.log('Starting comprehensive Excel workbook analysis...\n');
    
    const workbookPath = path.join(process.cwd(), 'excel', 'CRM-WORKBOOK.xlsx');
    const outputPath = path.join(process.cwd(), 'excel', 'comprehensive-analysis.json');
    const reportPath = path.join(process.cwd(), 'excel', 'analysis-report.md');
    
    console.log(`Analyzing workbook: ${workbookPath}`);
    
    const analyzer = new ExcelAnalyzer(workbookPath);
    const analysis = await analyzer.analyzeWorkbook();
    
    // Save detailed analysis JSON
    await fs.writeFile(outputPath, JSON.stringify(analysis, null, 2));
    console.log(`\nDetailed analysis saved to: ${outputPath}`);
    
    // Generate and save markdown report
    const report = await analyzer.generateAnalysisReport(analysis);
    await fs.writeFile(reportPath, report);
    console.log(`Analysis report saved to: ${reportPath}`);
    
    // Print summary to console
    console.log('\n=== WORKBOOK SUMMARY ===');
    console.log(`Total worksheets: ${analysis.worksheets.length}`);
    console.log(`Total rows across all sheets: ${analysis.totalRows.toLocaleString()}`);
    console.log(`File size: ${(analysis.fileSize / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n=== WORKSHEETS OVERVIEW ===');
    for (const worksheet of analysis.worksheets) {
      console.log(`\n📊 ${worksheet.name}:`);
      console.log(`   - Dimensions: ${worksheet.rowCount} rows × ${worksheet.columnCount} columns`);
      console.log(`   - Headers: ${worksheet.headers.length}`);
      console.log(`   - Formulas: ${worksheet.formulas.length}`);
      console.log(`   - Merged cells: ${worksheet.mergedCells.length}`);
      console.log(`   - Data validations: ${worksheet.dataValidations.length}`);
      console.log(`   - Potential relationships: ${worksheet.relationships.length}`);
      
      // Show first few headers
      if (worksheet.headers.length > 0) {
        const headersToShow = worksheet.headers.slice(0, 5);
        console.log(`   - First headers: ${headersToShow.join(', ')}${worksheet.headers.length > 5 ? '...' : ''}`);
      }
      
      // Show data type summary
      const typesSummary: Record<string, number> = {};
      for (const [column, types] of Object.entries(worksheet.dataTypes)) {
        for (const type of types as any) {
          typesSummary[type] = (typesSummary[type] || 0) + 1;
        }
      }
      if (Object.keys(typesSummary).length > 0) {
        console.log(`   - Data types found: ${Object.entries(typesSummary).map(([type, count]) => `${type}(${count})`).join(', ')}`);
      }
    }
    
    if (analysis.potentialIssues.length > 0) {
      console.log('\n⚠️  POTENTIAL ISSUES:');
      for (const issue of analysis.potentialIssues) {
        console.log(`   - ${issue}`);
      }
    }
    
    if (analysis.businessRules.length > 0) {
      console.log('\n📋 BUSINESS RULES DETECTED:');
      const rulesToShow = analysis.businessRules.slice(0, 5);
      for (const rule of rulesToShow) {
        console.log(`   - ${rule.location}: ${rule.rule}`);
      }
      if (analysis.businessRules.length > 5) {
        console.log(`   ... and ${analysis.businessRules.length - 5} more rules`);
      }
    }
    
    // Analyze main data sheets for CRM migration
    console.log('\n🎯 CRM MIGRATION ANALYSIS:');
    
    const crmSheets = ['Organizations', 'Contacts', 'Opportunities', 'Interactions'];
    const foundSheets = analysis.worksheets.filter(ws => 
      crmSheets.some(name => ws.name.toLowerCase().includes(name.toLowerCase()))
    );
    
    if (foundSheets.length > 0) {
      console.log('Found core CRM worksheets:');
      for (const sheet of foundSheets) {
        console.log(`   ✓ ${sheet.name} (${sheet.rowCount} rows)`);
        
        // Suggest field mappings based on headers
        const mappingSuggestions = suggestFieldMappings(sheet);
        if (mappingSuggestions.length > 0) {
          console.log(`     Suggested mappings:`);
          for (const suggestion of mappingSuggestions.slice(0, 3)) {
            console.log(`     - ${suggestion.excelColumn} → ${suggestion.dbField} (${suggestion.confidence} confidence)`);
          }
          if (mappingSuggestions.length > 3) {
            console.log(`     ... and ${mappingSuggestions.length - 3} more mappings`);
          }
        }
      }
    } else {
      console.log('⚠️  No standard CRM worksheets found. Manual mapping will be required.');
    }
    
    console.log('\n✅ Analysis complete! Check the generated files for detailed information.');
    
  } catch (error) {
    console.error('❌ Error analyzing workbook:', error);
    process.exit(1);
  }
}

interface FieldMapping {
  excelColumn: string;
  dbField: string;
  confidence: 'high' | 'medium' | 'low';
}

function suggestFieldMappings(worksheet: any): FieldMapping[] {
  const mappings: FieldMapping[] = [];
  const sheetNameLower = worksheet.name.toLowerCase();
  
  // Define mapping patterns for each entity type
  const patterns: Record<string, Record<string, string[]>> = {
    organizations: {
      name: ['organization', 'company', 'business', 'customer', 'client', 'account'],
      priority: ['priority', 'importance', 'tier', 'level'],
      segment: ['segment', 'category', 'type', 'industry'],
      phone: ['phone', 'telephone', 'contact'],
      email: ['email', 'e-mail'],
      address: ['address', 'street', 'location'],
      city: ['city', 'town'],
      state: ['state', 'province'],
      zipCode: ['zip', 'postal', 'postcode'],
      notes: ['notes', 'comments', 'remarks', 'description']
    },
    contacts: {
      firstName: ['first', 'fname', 'given'],
      lastName: ['last', 'lname', 'surname', 'family'],
      email: ['email', 'e-mail'],
      phone: ['phone', 'mobile', 'cell', 'telephone'],
      title: ['title', 'position', 'job', 'role'],
      organizationId: ['organization', 'company', 'account', 'customer']
    },
    opportunities: {
      name: ['opportunity', 'deal', 'name', 'title'],
      stage: ['stage', 'phase', 'status'],
      status: ['status', 'state'],
      value: ['value', 'amount', 'revenue', 'worth'],
      probability: ['probability', 'chance', 'likelihood'],
      expectedCloseDate: ['close', 'expected', 'target', 'end'],
      organizationId: ['organization', 'company', 'account', 'customer'],
      ownerId: ['owner', 'manager', 'assigned', 'responsible']
    },
    interactions: {
      type: ['type', 'interaction', 'activity', 'action'],
      date: ['date', 'when', 'time', 'occurred'],
      notes: ['notes', 'description', 'details', 'summary'],
      contactId: ['contact', 'person', 'who'],
      organizationId: ['organization', 'company', 'account'],
      userId: ['user', 'owner', 'by', 'creator']
    }
  };
  
  // Determine entity type from sheet name
  let entityType = '';
  for (const [entity, _] of Object.entries(patterns)) {
    if (sheetNameLower.includes(entity.substring(0, entity.length - 1))) {
      entityType = entity;
      break;
    }
  }
  
  if (!entityType) return mappings;
  
  const entityPatterns = patterns[entityType];
  
  // Try to match headers to database fields
  for (const header of worksheet.headers) {
    const headerLower = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (const [dbField, keywords] of Object.entries(entityPatterns)) {
      for (const keyword of keywords) {
        if (headerLower.includes(keyword.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
          // Determine confidence based on match quality
          let confidence: 'high' | 'medium' | 'low' = 'low';
          if (headerLower === keyword.toLowerCase().replace(/[^a-z0-9]/g, '')) {
            confidence = 'high';
          } else if (headerLower.startsWith(keyword.toLowerCase().replace(/[^a-z0-9]/g, '')) || 
                     headerLower.endsWith(keyword.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
            confidence = 'medium';
          }
          
          // Check if we already have a mapping for this field
          const existingMapping = mappings.find(m => m.dbField === dbField);
          if (!existingMapping || confidence === 'high') {
            // Remove existing mapping if we found a better one
            if (existingMapping) {
              mappings.splice(mappings.indexOf(existingMapping), 1);
            }
            
            mappings.push({
              excelColumn: header,
              dbField,
              confidence
            });
          }
          break;
        }
      }
    }
  }
  
  // Sort by confidence
  mappings.sort((a, b) => {
    const confidenceOrder = { high: 0, medium: 1, low: 2 };
    return confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
  });
  
  return mappings;
}

// Run the analysis
main().catch(console.error);