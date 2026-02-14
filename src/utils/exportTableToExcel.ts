import * as XLSX from 'xlsx';

/**
 * Check whether a markdown string contains a GFM table.
 */
export function containsMarkdownTable(markdown: string): boolean {
  return /\|.+\|\s*\n\|[\s\-:|]+\|/.test(markdown);
}

/**
 * Parse the first GFM table found in a markdown string.
 * Returns headers and rows, or null if no table is found.
 */
export function parseMarkdownTable(
  markdown: string
): { headers: string[]; rows: (string | number)[][] } | null {
  const lines = markdown.split('\n');

  let headerIdx = -1;

  // Find header + separator pair
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    const next = lines[i + 1].trim();

    if (
      /^\|.+\|$/.test(line) &&
      /^\|[\s\-:|]+\|$/.test(next)
    ) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) return null;

  const PLACEHOLDER = '%%ESCAPED_PIPE%%';
  const parseLine = (line: string): string[] => {
    // Replace escaped pipes with a placeholder before splitting
    const safe = line.replace(/\\\|/g, PLACEHOLDER);
    return safe
      .split('|')
      .map((cell) => cell.replace(new RegExp(PLACEHOLDER, 'g'), '|').trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1); // drop empty leading/trailing
  };

  const headers = parseLine(lines[headerIdx]);

  const dataRows: (string | number)[][] = [];
  for (let i = headerIdx + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) break; // end of table
    const cells = parseLine(line);
    // Convert numeric-looking cells to numbers for proper Excel formatting
    const typed = cells.map((cell) => {
      const trimmed = cell.replace(/,/g, ''); // strip commas from numbers like "1,234.56"
      const num = Number(trimmed);
      return !isNaN(num) && trimmed !== '' ? num : cell;
    });
    dataRows.push(typed);
  }

  return { headers, rows: dataRows };
}

/**
 * Parse a markdown table and download it as an .xlsx file.
 */
export function exportTableToExcel(
  markdown: string,
  filename?: string
): void {
  const parsed = parseMarkdownTable(markdown);
  if (!parsed) return;

  const { headers, rows } = parsed;

  // Build worksheet from array-of-arrays
  const wsData: (string | number)[][] = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-size columns based on content width
  const colWidths = headers.map((h, colIdx) => {
    let max = h.length;
    for (const row of rows) {
      const cellLen = String(row[colIdx] ?? '').length;
      if (cellLen > max) max = cellLen;
    }
    return { wch: Math.min(max + 4, 50) }; // cap at 50 chars wide
  });
  ws['!cols'] = colWidths;

  // Create workbook and trigger download
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  const name = filename || `export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, name);
}
