// backend/src/utils/csv-parser.ts

export function parseCSV(content: string): any[] {
  // Pre-procesar para limpiar formato problemático
  content = cleanProblematicFormat(content);
  
  // Manejar diferentes tipos de saltos de línea
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Remover BOM si existe
  lines[0] = lines[0].replace(/^\uFEFF/, '');

  // Detectar el delimitador (coma o punto y coma)
  const delimiter = detectDelimiter(lines[0]);
  console.log(`Usando delimitador: "${delimiter}"`);
  
  // Obtener headers - limpiar espacios y caracteres especiales
  const headers = parseLine(lines[0], delimiter).map(h => 
    h.toLowerCase()
      .trim()
      .replace(/['"]/g, '') // Remover comillas
      .replace(/\s+/g, '_') // Reemplazar espacios con underscore
  );
  
  console.log('Headers detectados:', headers);
  
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Saltar líneas vacías
    
    const values = parseLine(line, delimiter);
    
    // Permitir cierta flexibilidad si hay columnas de más o de menos
    if (values.length >= headers.length - 1 && values.length <= headers.length + 1) {
      const record: any = {};
      headers.forEach((header, index) => {
        let value = values[index]?.trim() || '';
        // Limpiar comillas adicionales
        value = value.replace(/^["']|["']$/g, '');
        record[header] = value;
      });
      
      // Solo agregar si tiene datos válidos
      if (Object.values(record).some(v => v !== '')) {
        records.push(record);
      }
    } else if (values.length > 0) {
      console.warn(`Línea ${i + 1} ignorada: esperaba ${headers.length} columnas, encontró ${values.length}`);
    }
  }
  
  console.log(`Total de registros parseados: ${records.length}`);
  return records;
}

/**
 * Limpia el formato problemático donde cada línea está entre comillas
 * y tiene una coma o punto y coma extra al final
 */
function cleanProblematicFormat(content: string): string {
  const lines = content.split(/\r?\n/);
  const cleanedLines = lines.map(line => {
    line = line.trim();
    
    // Detectar formato problemático: "campo1,campo2,campo3",
    if (line.startsWith('"') && line.endsWith('",')) {
      // Remover comillas externas y coma final
      return line.slice(1, -2);
    }
    
    // Si solo tiene coma o punto y coma al final (sin comillas)
    if ((line.endsWith(',') || line.endsWith(';')) && !line.endsWith('",') && !line.endsWith('";')) {
      // Pero verificar que no sea parte del contenido real
      const delimiter = line.includes(';') ? ';' : ',';
      const parts = line.split(delimiter);
      // Si la última parte está vacía, probablemente es un delimitador extra
      if (parts[parts.length - 1] === '') {
        return line.slice(0, -1);
      }
    }
    
    // Remover líneas que son solo delimitadores
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
  // Primero intentar detectar por el patrón esperado de headers
  // Si contiene "cliente" y "producto" separados por punto y coma, es punto y coma
  if (headerLine.toLowerCase().includes('cliente;producto') || 
      headerLine.toLowerCase().includes('cliente;') ||
      headerLine.includes(';')) {
    // Verificar que el punto y coma sea más frecuente
    const semicolonCount = (headerLine.match(/;/g) || []).length;
    const commaCount = (headerLine.match(/,/g) || []).length;
    
    if (semicolonCount >= 3) { // Esperamos al menos 3 columnas
      return ';';
    }
  }
  
  // Contar ocurrencias de cada posible delimitador
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  
  // Si hay más punto y comas que comas, usar punto y coma
  if (semicolonCount > commaCount && semicolonCount >= 3) {
    return ';';
  }
  
  // Por defecto usar coma si hay al menos 3
  if (commaCount >= 3) {
    return ',';
  }
  
  // Si no hay suficientes delimitadores, intentar con punto y coma primero
  return semicolonCount > 0 ? ';' : ',';
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
  
  // Agregar el último campo
  if (current || result.length > 0) {
    result.push(current);
  }
  
  return result;
}