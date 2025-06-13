import * as XLSX from 'xlsx';
import * as path from 'path';

const mainSheets = ['Organizations', 'Contacts', 'ContactsData', 'Opportunities', 'Interactions'];

export function analyzeMainSheets() {
  const excelPath = path.join(__dirname, '../../../excel/CRM-WORKBOOK.xlsx');
  const workbook = XLSX.readFile(excelPath);
  
  const analysis: any = {};
  
  for (const sheetName of mainSheets) {
    if (!workbook.SheetNames.includes(sheetName)) continue;
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (jsonData.length === 0) continue;
    
    const headers = jsonData[0] || [];
    const firstDataRow = jsonData[1] || [];
    
    analysis[sheetName] = {
      headers: headers.filter(h => h != null),
      rowCount: jsonData.length - 1,
      sampleRow: firstDataRow,
      columnTypes: headers.map((header, index) => {
        const values = [];
        for (let i = 1; i < Math.min(10, jsonData.length); i++) {
          if (jsonData[i] && jsonData[i][index] != null) {
            values.push(jsonData[i][index]);
          }
        }
        return {
          header,
          sampleValues: values.slice(0, 3),
          hasData: values.length > 0
        };
      }).filter(col => col.header != null)
    };
  }
  
  return analysis;
}

if (require.main === module) {
  console.log(JSON.stringify(analyzeMainSheets(), null, 2));
}