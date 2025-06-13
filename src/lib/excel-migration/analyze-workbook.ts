import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface WorkbookAnalysis {
  sheets: {
    name: string;
    rowCount: number;
    columnCount: number;
    headers: string[];
    sampleData: any[];
    dataTypes: Record<string, Set<string>>;
  }[];
  summary: {
    totalSheets: number;
    totalRows: number;
    totalColumns: number;
  };
}

export async function analyzeWorkbook(filePath: string): Promise<WorkbookAnalysis> {
  const workbook = XLSX.readFile(filePath);
  const analysis: WorkbookAnalysis = {
    sheets: [],
    summary: {
      totalSheets: 0,
      totalRows: 0,
      totalColumns: 0
    }
  };

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (jsonData.length === 0) continue;

    const headers = jsonData[0] || [];
    const dataTypes: Record<string, Set<string>> = {};
    
    // Analyze data types for each column
    headers.forEach((header, colIndex) => {
      dataTypes[header] = new Set<string>();
      
      for (let rowIndex = 1; rowIndex < Math.min(jsonData.length, 100); rowIndex++) {
        const value = jsonData[rowIndex]?.[colIndex];
        if (value !== undefined && value !== null && value !== '') {
          const type = detectDataType(value);
          dataTypes[header].add(type);
        }
      }
    });

    analysis.sheets.push({
      name: sheetName,
      rowCount: jsonData.length - 1, // Exclude header row
      columnCount: headers.length,
      headers: headers,
      sampleData: jsonData.slice(1, 6), // First 5 data rows
      dataTypes: dataTypes
    });

    analysis.summary.totalSheets++;
    analysis.summary.totalRows += jsonData.length - 1;
    analysis.summary.totalColumns = Math.max(analysis.summary.totalColumns, headers.length);
  }

  return analysis;
}

function detectDataType(value: any): string {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'float';
  }
  
  if (typeof value === 'string') {
    // Check for common patterns
    if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(value)) {
      return 'date';
    }
    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
      return 'email';
    }
    if (/^[\d\s\-\(\)\+]+$/.test(value) && value.replace(/\D/g, '').length >= 10) {
      return 'phone';
    }
    if (/^\d+$/.test(value)) {
      return 'numeric_string';
    }
    return 'string';
  }
  
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  
  if (value instanceof Date) {
    return 'date';
  }
  
  return 'unknown';
}

// Run analysis if executed directly
if (require.main === module) {
  const excelPath = path.join(__dirname, '../../../excel/CRM-WORKBOOK.xlsx');
  analyzeWorkbook(excelPath).then(analysis => {
    console.log(JSON.stringify(analysis, null, 2));
  }).catch(console.error);
}