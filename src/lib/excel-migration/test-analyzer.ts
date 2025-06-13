import { ExcelAnalyzer } from './excel-analyzer';
import path from 'path';
import fs from 'fs/promises';

async function testAnalyzer() {
  try {
    // Path to the Excel file
    const excelPath = path.join(process.cwd(), 'excel', 'CRM-WORKBOOK.xlsx');
    
    // Check if file exists
    try {
      await fs.access(excelPath);
      console.log(`Found Excel file at: ${excelPath}`);
    } catch {
      console.error(`Excel file not found at: ${excelPath}`);
      console.log('Please ensure CRM-WORKBOOK.xlsx is in the excel/ directory');
      return;
    }
    
    // Create analyzer instance
    const analyzer = new ExcelAnalyzer(excelPath);
    
    // Perform analysis
    console.log('\nStarting Excel analysis...\n');
    const analysis = await analyzer.analyzeWorkbook();
    
    // Display summary
    console.log('=== WORKBOOK SUMMARY ===');
    console.log(`File: ${analysis.fileName}`);
    console.log(`Size: ${(analysis.fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total Rows: ${analysis.totalRows.toLocaleString()}`);
    console.log(`Worksheets: ${analysis.worksheets.length}`);
    console.log(`Analysis Time: ${analysis.analysisTimestamp.toISOString()}`);
    
    // Display worksheet details
    console.log('\n=== WORKSHEET DETAILS ===');
    for (const worksheet of analysis.worksheets) {
      console.log(`\n[${worksheet.name}]`);
      console.log(`- Rows: ${worksheet.rowCount.toLocaleString()}`);
      console.log(`- Columns: ${worksheet.columnCount}`);
      console.log(`- Headers: ${worksheet.headers.slice(0, 5).join(', ')}${worksheet.headers.length > 5 ? '...' : ''}`);
      
      // Show data types
      console.log(`- Data Types:`);
      const sampleTypes = Object.entries(worksheet.dataTypes).slice(0, 3);
      for (const [column, types] of sampleTypes) {
        console.log(`  * ${column}: ${Array.from(types).join(', ')}`);
      }
      
      // Show relationships
      if (worksheet.relationships.length > 0) {
        console.log(`- Potential Foreign Keys:`);
        worksheet.relationships.slice(0, 3).forEach(rel => {
          console.log(`  * ${rel.column} → ${rel.possibleForeignKey}`);
        });
      }
      
      // Show formulas
      if (worksheet.formulas.length > 0) {
        console.log(`- Formulas: ${worksheet.formulas.length} found`);
      }
      
      // Show sample data
      if (worksheet.sampleData.length > 0) {
        console.log(`- Sample Data (first row):`);
        const firstRow = worksheet.sampleData[0];
        Object.entries(firstRow).slice(0, 3).forEach(([key, value]) => {
          console.log(`  * ${key}: ${value}`);
        });
      }
    }
    
    // Display issues and business rules
    if (analysis.potentialIssues.length > 0) {
      console.log('\n=== POTENTIAL ISSUES ===');
      analysis.potentialIssues.forEach(issue => console.log(`- ${issue}`));
    }
    
    if (analysis.businessRules.length > 0) {
      console.log('\n=== BUSINESS RULES DETECTED ===');
      analysis.businessRules.slice(0, 5).forEach(rule => {
        console.log(`- ${rule.location}: ${rule.rule}`);
      });
      if (analysis.businessRules.length > 5) {
        console.log(`... and ${analysis.businessRules.length - 5} more rules`);
      }
    }
    
    // Generate and save detailed report
    const report = await analyzer.generateAnalysisReport(analysis);
    const reportPath = path.join(process.cwd(), 'excel', 'analysis-report.md');
    await fs.writeFile(reportPath, report);
    console.log(`\n✅ Detailed analysis report saved to: ${reportPath}`);
    
    // Save JSON analysis for programmatic use
    const jsonPath = path.join(process.cwd(), 'excel', 'analysis.json');
    await fs.writeFile(jsonPath, JSON.stringify(analysis, null, 2));
    console.log(`✅ JSON analysis saved to: ${jsonPath}`);
    
  } catch (error) {
    console.error('Error during analysis:', error);
  }
}

// Run the test
testAnalyzer();