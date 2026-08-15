export type CsvDelimiter = "," | ";" | "\t" | "|";

export type ParsedCsv = Readonly<{
  headers: readonly string[];
  rows: readonly Readonly<Record<string, string>>[];
  totalRowCount: number;
  issues: readonly string[];
}>;

function parseCells(text: string, delimiter: CsvDelimiter): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (!quoted && character === delimiter) {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += character ?? "";
  }

  if (quoted) {
    throw new Error("CSV_QUOTE_NOT_CLOSED");
  }
  row.push(cell.trim());
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

export function parseCsv(
  rawText: string,
  delimiter: CsvDelimiter,
  previewLimit = 25,
): ParsedCsv {
  const text = rawText.replace(/^\uFEFF/, "");
  const cells = parseCells(text, delimiter);
  const headerRow = cells[0] ?? [];
  const headers = headerRow.map((header, index) => {
    const normalized = header.trim();
    return normalized || `column_${index + 1}`;
  });
  const issues: string[] = [];

  if (headers.length === 0) issues.push("CSV_HEADER_MISSING");
  if (
    new Set(headers.map((header) => header.toLowerCase())).size !==
    headers.length
  ) {
    issues.push("CSV_HEADER_DUPLICATED");
  }

  const dataRows = cells.slice(1);
  const rows = dataRows.slice(0, previewLimit).map((values, rowIndex) => {
    if (values.length !== headers.length) {
      issues.push(`CSV_COLUMN_COUNT_MISMATCH:${rowIndex + 2}`);
    }
    return Object.fromEntries(
      headers.map((header, columnIndex) => [header, values[columnIndex] ?? ""]),
    );
  });

  return {
    headers,
    rows,
    totalRowCount: dataRows.length,
    issues: [...new Set(issues)],
  };
}
