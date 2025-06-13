import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs/promises';

export interface WorksheetAnalysis {
  name: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  dataTypes: Record<string, Set<string>>;
  sampleData: any[];
  formulas: Array<{ cell: string; formula: string }>;
  mergedCells: string[];
  dataValidations: Array<{ address: string; type: string; formula?: string }>;
  relationships: Array<{ column: string; possibleForeignKey: string }>;
}

export interface WorkbookAnalysis {
  fileName: string;
  fileSize: number;
  worksheets: WorksheetAnalysis[];
  totalRows: number;
  analysisTimestamp: Date;
  potentialIssues: string[];
  businessRules: Array<{ rule: string; location: string }>;
}

export class ExcelAnalyzer {
  private workbook: ExcelJS.Workbook;
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.workbook = new ExcelJS.Workbook();
  }

  async analyzeWorkbook(): Promise<WorkbookAnalysis> {
    console.log('Starting deep analysis of Excel workbook...');
    
    try {
      // Load workbook with options to handle tables
      await this.workbook.xlsx.readFile(this.filePath, {
        cellFormulas: true,
        cellStyles: false,
        sharedStrings: true,
        hyperlinks: true,
        worksheets: 'emit',
        entries: 'emit'
      });
    } catch (error) {
      console.log('Warning: Some Excel features could not be parsed:', error);
      // Try loading without advanced features
      await this.workbook.xlsx.readFile(this.filePath);
    }
    
    const stats = await fs.stat(this.filePath);
    const worksheetAnalyses: WorksheetAnalysis[] = [];
    const potentialIssues: string[] = [];
    const businessRules: Array<{ rule: string; location: string }> = [];
    
    // Analyze each worksheet
    for (const worksheet of this.workbook.worksheets) {
      const analysis = await this.analyzeWorksheet(worksheet);
      worksheetAnalyses.push(analysis);
      
      // Identify potential issues
      if (analysis.mergedCells.length > 0) {
        potentialIssues.push(`Worksheet "${worksheet.name}" contains ${analysis.mergedCells.length} merged cells`);
      }
      
      if (analysis.formulas.length > 0) {
        businessRules.push(...analysis.formulas.map(f => ({
          rule: `Formula: ${f.formula}`,
          location: `${worksheet.name}!${f.cell}`
        })));
      }
    }
    
    const totalRows = worksheetAnalyses.reduce((sum, ws) => sum + ws.rowCount, 0);
    
    return {
      fileName: path.basename(this.filePath),
      fileSize: stats.size,
      worksheets: worksheetAnalyses,
      totalRows,
      analysisTimestamp: new Date(),
      potentialIssues,
      businessRules
    };
  }

  private async analyzeWorksheet(worksheet: ExcelJS.Worksheet): Promise<WorksheetAnalysis> {
    const headers: string[] = [];
    const dataTypes: Record<string, Set<string>> = {};
    const sampleData: any[] = [];
    const formulas: Array<{ cell: string; formula: string }> = [];
    const mergedCells: string[] = [];
    const dataValidations: Array<{ address: string; type: string; formula?: string }> = [];
    const relationships: Array<{ column: string; possibleForeignKey: string }> = [];
    
    let rowCount = 0;
    let columnCount = 0;
    
    // Get headers from first row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      const value = cell.value?.toString() || `Column${colNumber}`;
      headers.push(value);
      dataTypes[value] = new Set();
      columnCount = Math.max(columnCount, colNumber);
    });
    
    // Analyze data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      
      rowCount++;
      const rowData: Record<string, any> = {};
      
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (!header) return;
        
        // Collect data types
        const cellType = this.getCellDataType(cell);
        dataTypes[header].add(cellType);
        
        // Store value
        rowData[header] = cell.value;
        
        // Check for formulas
        if (cell.formula) {
          formulas.push({
            cell: cell.address,
            formula: cell.formula.toString()
          });
        }
        
        // Check for possible foreign keys (columns ending with ID, _id, etc.)
        if (header.match(/(ID|Id|_id|_ID)$/)) {
          relationships.push({
            column: header,
            possibleForeignKey: header.replace(/(ID|Id|_id|_ID)$/, '')
          });
        }
      });
      
      // Collect sample data (first 10 rows)
      if (rowCount <= 10) {
        sampleData.push(rowData);
      }
    });
    
    // Analyze merged cells
    if (worksheet.model.merges) {
      worksheet.model.merges.forEach(merge => {
        mergedCells.push(merge);
      });
    }
    
    // Analyze data validations
    if (worksheet.dataValidations && worksheet.dataValidations.model) {
      worksheet.dataValidations.model.forEach((validation: any, address: string) => {
        dataValidations.push({
          address,
          type: validation.type,
          formula: validation.formulae?.[0]
        });
      });
    }
    
    // Remove duplicate relationships
    const uniqueRelationships = relationships.filter((rel, index, self) =>
      index === self.findIndex(r => r.column === rel.column)
    );
    
    return {
      name: worksheet.name,
      rowCount: rowCount - 1, // Exclude header row
      columnCount,
      headers,
      dataTypes: Object.fromEntries(
        Object.entries(dataTypes).map(([key, value]) => [key, value])
      ),
      sampleData,
      formulas,
      mergedCells,
      dataValidations,
      relationships: uniqueRelationships
    };
  }

  private getCellDataType(cell: ExcelJS.Cell): string {
    if (cell.type === ExcelJS.ValueType.Number) return 'number';
    if (cell.type === ExcelJS.ValueType.Date) return 'date';
    if (cell.type === ExcelJS.ValueType.Boolean) return 'boolean';
    if (cell.type === ExcelJS.ValueType.Formula) return 'formula';
    if (cell.type === ExcelJS.ValueType.Hyperlink) return 'hyperlink';
    if (cell.type === ExcelJS.ValueType.Error) return 'error';
    if (cell.type === ExcelJS.ValueType.RichText) return 'richtext';
    
    // Additional type detection for strings
    const stringValue = cell.value?.toString() || '';
    if (stringValue.match(/^\d{4}-\d{2}-\d{2}/)) return 'date-string';
    if (stringValue.match(/^\d+$/)) return 'numeric-string';
    if (stringValue.match(/^[\w._%+-]+@[\w.-]+\.[A-Z]{2,}$/i)) return 'email';
    if (stringValue.match(/^https?:\/\//)) return 'url';
    if (stringValue.match(/^\+?\d[\d\s()-]+$/)) return 'phone';
    
    return 'string';
  }

  async generateAnalysisReport(analysis: WorkbookAnalysis): Promise<string> {
    const report = `
# Excel Workbook Analysis Report
Generated: ${analysis.analysisTimestamp.toISOString()}

## File Information
- **File Name**: ${analysis.fileName}
- **File Size**: ${(analysis.fileSize / 1024 / 1024).toFixed(2)} MB
- **Total Rows**: ${analysis.totalRows.toLocaleString()}
- **Worksheets**: ${analysis.worksheets.length}

## Worksheet Details

${analysis.worksheets.map(ws => `
### ${ws.name}
- **Rows**: ${ws.rowCount.toLocaleString()}
- **Columns**: ${ws.columnCount}
- **Headers**: ${ws.headers.join(', ')}

#### Data Types by Column
${Object.entries(ws.dataTypes).map(([col, types]) => 
  `- **${col}**: ${Array.from(types).join(', ')}`
).join('\n')}

${ws.relationships.length > 0 ? `
#### Potential Relationships
${ws.relationships.map(rel => 
  `- ${rel.column} -> ${rel.possibleForeignKey}`
).join('\n')}
` : ''}

${ws.formulas.length > 0 ? `
#### Business Logic (Formulas)
${ws.formulas.slice(0, 5).map(f => 
  `- Cell ${f.cell}: ${f.formula}`
).join('\n')}
${ws.formulas.length > 5 ? `\n... and ${ws.formulas.length - 5} more formulas` : ''}
` : ''}

${ws.mergedCells.length > 0 ? `
#### Merged Cells
- Count: ${ws.mergedCells.length}
- Ranges: ${ws.mergedCells.slice(0, 5).join(', ')}${ws.mergedCells.length > 5 ? '...' : ''}
` : ''}
`).join('\n')}

## Potential Issues
${analysis.potentialIssues.length > 0 
  ? analysis.potentialIssues.map(issue => `- ${issue}`).join('\n')
  : 'No major issues detected'}

## Business Rules Identified
${analysis.businessRules.length > 0
  ? analysis.businessRules.slice(0, 10).map(rule => 
      `- ${rule.location}: ${rule.rule}`
    ).join('\n')
  : 'No business rules detected'}
${analysis.businessRules.length > 10 ? `\n... and ${analysis.businessRules.length - 10} more rules` : ''}

## Recommendations
1. ${analysis.potentialIssues.includes('merged cells') ? 'Handle merged cells during migration' : 'No merged cell handling required'}
2. ${analysis.businessRules.length > 0 ? 'Implement formula logic in application layer' : 'No formula migration required'}
3. ${analysis.totalRows > 10000 ? 'Use streaming approach for large dataset' : 'Standard batch processing suitable'}
`;

    return report;
  }
}