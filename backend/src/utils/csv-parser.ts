// backend/src/utils/csv-parser.ts

export function parseCSV(content: string): any[] {
  // Pre-procesar para limpiar formato problemático
  content = cleanProblematicFormat(content);
  
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Remover BOM si existe
  lines[0] = lines[0].replace(/^\uFEFF/, '');

  // Detectar el delimitador (coma o punto y coma)
  const delimiter = detectDelimiter(lines[0]);
  
  // Obtener headers
  const headers = parseLine(lines[0], delimiter).map(h => h.toLowerCase().trim());
  
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i], delimiter);
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

/**
 * Limpia el formato problemático donde cada línea está entre comillas
 * y tiene una coma extra al final
 */
function cleanProblematicFormat(content: string): string {
  const lines = content.split('\n');
  const cleanedLines = lines.map(line => {
    line = line.trim();
    
    // Detectar formato problemático: "campo1,campo2,campo3",
    if (line.startsWith('"') && line.endsWith('",')) {
      // Remover comillas externas y coma final
      return line.slice(1, -2);
    }
    
    // Si solo tiene coma al final (sin comillas)
    if (line.endsWith(',') && !line.endsWith('",')) {
      return line.slice(0, -1);
    }
    
    // Remover líneas que son solo comas
    if (/^[,;]+$/.test(line)) {
      return '';
    }
    
    return line;
  }).filter(line => line.length > 0);
  
  return cleanedLines.join('\n');
}

/**
 * Detecta automáticamente si el delimitador es coma o punto y coma
 */
function detectDelimiter(headerLine: string): string {
  // Contar ocurrencias de cada posible delimitador
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  
  // Si hay más punto y comas que comas, usar punto y coma
  if (semicolonCount > commaCount) {
    return ';';
  }
  
  // Por defecto usar coma
  return ',';
}

function parseLine(line: string, delimiter: string = ','): string[] {
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
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}