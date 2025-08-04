// backend/src/utils/csv-parser.ts

export function parseCSV(content: string): any[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Remover BOM si existe
  lines[0] = lines[0].replace(/^\uFEFF/, '');

  // Obtener headers
  const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
  
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === headers.length) {
      const record: any = {};
      headers.forEach((header, index) => {
        record[header] = values[index]?.trim() || '';
      });
      records.push(record);
    }
  }
  
  return records;
}

function parseLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}