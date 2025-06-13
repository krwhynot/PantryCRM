import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs/promises';

interface SimpleWorksheetAnalysis {
  name: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  dataTypes: Record<string, Set<string>>;
  sampleData: any[];
}

async function analyzeWithXLSX() {
  try {
    const excelPath = path.join(process.cwd(), 'excel', 'CRM-WORKBOOK.xlsx');
    
    // Check if file exists
    try {
      await fs.access(excelPath);
      console.log(`Found Excel file at: ${excelPath}`);
    } catch {
      console.error(`Excel file not found at: ${excelPath}`);
      return;
    }
    
    // Read the workbook
    console.log('\nReading Excel file...');
    const workbook = XLSX.readFile(excelPath, {
      cellFormula: true,
      cellHTML: false,
      cellText: true,
      cellDates: true
    });
    
    console.log('\n=== WORKBOOK OVERVIEW ===');
    console.log(`Worksheets: ${workbook.SheetNames.length}`);
    console.log(`Sheet names: ${workbook.SheetNames.join(', ')}`);
    
    const analyses: SimpleWorksheetAnalysis[] = [];
    
    // Analyze each worksheet
    for (const sheetName of workbook.SheetNames) {
      console.log(`\n=== Analyzing sheet: ${sheetName} ===`);
      
      const worksheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      const rowCount = range.e.r - range.s.r + 1;
      const columnCount = range.e.c - range.s.c + 1;
      
      console.log(`- Dimensions: ${rowCount} rows × ${columnCount} columns`);
      
      // Get headers (first row)
      const headers: string[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
        const cell = worksheet[cellAddress];
        headers.push(cell ? String(cell.v) : `Column${col + 1}`);
      }
      
      console.log(`- Headers: ${headers.slice(0, 10).join(', ')}${headers.length > 10 ? '...' : ''}`);
      
      // Analyze data types and collect sample data
      const dataTypes: Record<string, Set<string>> = {};
      headers.forEach(h => dataTypes[h] = new Set());
      
      const sampleData: any[] = [];
      const maxSampleRows = Math.min(10, rowCount - 1);
      
      for (let row = range.s.r + 1; row <= range.s.r + maxSampleRows; row++) {
        const rowData: Record<string, any> = {};
        
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          const header = headers[col - range.s.c];
          
          if (cell) {
            rowData[header] = cell.v;
            
            // Determine data type
            let cellType = 'empty';
            if (cell.t === 'n') cellType = 'number';
            else if (cell.t === 's') cellType = 'string';
            else if (cell.t === 'b') cellType = 'boolean';
            else if (cell.t === 'd') cellType = 'date';
            else if (cell.f) cellType = 'formula';
            
            dataTypes[header].add(cellType);
          }
        }
        
        sampleData.push(rowData);
      }
      
      // Display data type summary
      console.log('\n- Data Types:');
      Object.entries(dataTypes).slice(0, 5).forEach(([col, types]) => {
        if (types.size > 0) {
          console.log(`  * ${col}: ${Array.from(types).join(', ')}`);
        }
      });
      
      // Display sample data
      if (sampleData.length > 0) {
        console.log('\n- Sample Data (first row):');
        const firstRow = sampleData[0];
        Object.entries(firstRow).slice(0, 5).forEach(([key, value]) => {
          console.log(`  * ${key}: ${value}`);
        });
      }
      
      analyses.push({
        name: sheetName,
        rowCount: rowCount - 1, // Exclude header
        columnCount,
        headers,
        dataTypes,
        sampleData
      });
    }
    
    // Save analysis results
    const analysisPath = path.join(process.cwd(), 'excel', 'simple-analysis.json');
    await fs.writeFile(
      analysisPath,
      JSON.stringify(analyses, (key, value) => {
        if (value instanceof Set) {
          return Array.from(value);
        }
        return value;
      }, 2)
    );
    console.log(`\n✅ Analysis saved to: ${analysisPath}`);
    
    // Generate migration hints
    console.log('\n=== MIGRATION HINTS ===');
    for (const analysis of analyses) {
      console.log(`\nSheet: ${analysis.name}`);
      
      // Look for ID columns
      const idColumns = analysis.headers.filter(h => 
        h.toLowerCase().includes('id') || 
        h.toLowerCase().includes('key') ||
        h.toLowerCase().includes('code')
      );
      if (idColumns.length > 0) {
        console.log(`- Potential primary/foreign keys: ${idColumns.join(', ')}`);
      }
      
      // Look for date columns
      const dateColumns = analysis.headers.filter(h => 
        h.toLowerCase().includes('date') || 
        h.toLowerCase().includes('time') ||
        h.toLowerCase().includes('created') ||
        h.toLowerCase().includes('updated')
      );
      if (dateColumns.length > 0) {
        console.log(`- Date columns: ${dateColumns.join(', ')}`);
      }
      
      // Look for email columns
      const emailColumns = analysis.headers.filter(h => 
        h.toLowerCase().includes('email') || 
        h.toLowerCase().includes('mail')
      );
      if (emailColumns.length > 0) {
        console.log(`- Email columns: ${emailColumns.join(', ')}`);
      }
      
      // Look for phone columns
      const phoneColumns = analysis.headers.filter(h => 
        h.toLowerCase().includes('phone') || 
        h.toLowerCase().includes('mobile') ||
        h.toLowerCase().includes('tel')
      );
      if (phoneColumns.length > 0) {
        console.log(`- Phone columns: ${phoneColumns.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('Error during analysis:', error);
  }
}

// Run the analysis
analyzeWithXLSX();